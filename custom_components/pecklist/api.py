"""A small client for PeckList's task API (/api/v1) and its live stream (/api/events)."""

from __future__ import annotations

import asyncio
from collections.abc import AsyncIterator
import json
from typing import Any

import aiohttp

REQUEST_TIMEOUT = aiohttp.ClientTimeout(total=30)


class PeckListError(Exception):
    """Anything that went wrong talking to PeckList."""


class PeckListConnectionError(PeckListError):
    """The server could not be reached, or did not answer as a PeckList server does."""


class PeckListApiError(PeckListError):
    """The server refused a request with a problem document."""

    def __init__(self, status: int, code: str, detail: str, retry_after: float | None = None) -> None:
        super().__init__(f"{code}: {detail}" if detail else code)
        self.status = status
        self.code = code
        self.detail = detail
        self.retry_after = retry_after


class PeckListAuthError(PeckListApiError):
    """The key is unknown, revoked or expired (401)."""


class PeckListScopeError(PeckListApiError):
    """The key lacks the permission the route needs (403, code "scope")."""


def normalize_url(url: str) -> str:
    """A server address without a trailing slash or a pasted /api path."""
    url = url.strip().rstrip("/")
    for suffix in ("/api/v1", "/api"):
        if url.endswith(suffix):
            url = url[: -len(suffix)]
    return url.rstrip("/")


def _retry_after(response: aiohttp.ClientResponse) -> float | None:
    try:
        return float(response.headers.get("Retry-After", ""))
    except ValueError:
        return None


async def _raise_for(response: aiohttp.ClientResponse) -> None:
    """Turn an error answer into the matching exception."""
    code = ""
    detail = ""
    try:
        problem = await response.json(content_type=None)
        if isinstance(problem, dict):
            code = str(problem.get("code") or problem.get("error") or "")
            detail = str(problem.get("detail") or problem.get("message") or "")
    except (aiohttp.ClientError, ValueError):
        pass
    code = code or f"http_{response.status}"
    retry_after = _retry_after(response)
    if response.status == 401:
        raise PeckListAuthError(response.status, code, detail)
    if response.status == 403 and code == "scope":
        raise PeckListScopeError(response.status, code, detail)
    raise PeckListApiError(response.status, code, detail, retry_after)


class PeckListClient:
    """Speaks the task API as one account, with one API key."""

    def __init__(self, session: aiohttp.ClientSession, url: str, api_key: str) -> None:
        self._session = session
        self.url = normalize_url(url)
        self._headers = {"Authorization": f"Bearer {api_key}", "Accept": "application/json"}

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, str] | None = None,
        body: dict[str, Any] | None = None,
    ) -> Any:
        try:
            async with self._session.request(
                method,
                f"{self.url}/api/v1{path}",
                headers=self._headers,
                params=params,
                json=body,
                timeout=REQUEST_TIMEOUT,
                allow_redirects=False,
            ) as response:
                if response.status == 204:
                    return None
                if response.status >= 400:
                    await _raise_for(response)
                if response.status >= 300:
                    # A sign-in page or a proxy's redirect: not a PeckList API.
                    raise PeckListConnectionError(f"unexpected answer {response.status}")
                try:
                    return await response.json(content_type=None)
                except ValueError as err:
                    raise PeckListConnectionError("the answer was not JSON") from err
        except (aiohttp.ClientError, TimeoutError) as err:
            raise PeckListConnectionError(str(err) or type(err).__name__) from err

    # Reads

    async def me(self) -> dict[str, Any]:
        """Who the key belongs to, and what it may do."""
        me = await self._request("GET", "/me")
        if not isinstance(me, dict) or "id" not in me:
            raise PeckListConnectionError("not a PeckList server")
        return me

    async def changes(self, cursor: str | None) -> dict[str, Any]:
        """One page of the changes feed; no cursor answers everything."""
        params = {"limit": "500"}
        if cursor:
            params["cursor"] = cursor
        return await self._request("GET", "/changes", params=params)

    async def people(self) -> list[dict[str, Any]] | None:
        """Who assignees are: people and groups with their names. None on a server without the route."""
        try:
            answer = await self._request("GET", "/people")
        except PeckListApiError as err:
            if err.status == 404:
                return None
            raise
        return list(answer.get("items") or [])

    # Writes

    async def create_task(self, fields: dict[str, Any]) -> dict[str, Any]:
        return await self._request("POST", "/tasks", body=fields)

    async def quick_add(
        self, text: str, list_id: str | None = None, time_zone: str | None = None
    ) -> dict[str, Any]:
        """Make a task from a line of text; answers {"task": ..., "tokens": [...]}."""
        body: dict[str, Any] = {"text": text}
        if list_id:
            body["listId"] = list_id
        if time_zone:
            body["timeZone"] = time_zone
        return await self._request("POST", "/tasks/quick", body=body)

    async def update_task(self, task_id: str, changes: dict[str, Any]) -> dict[str, Any]:
        return await self._request("PATCH", f"/tasks/{task_id}", body=changes)

    async def complete_task(self, task_id: str, status: str = "done") -> dict[str, Any]:
        """Close a task; answers {"completed": ..., "next": ...} (next for a repeating one)."""
        return await self._request("POST", f"/tasks/{task_id}/complete", body={"status": status})

    async def reopen_task(self, task_id: str) -> dict[str, Any]:
        return await self._request("POST", f"/tasks/{task_id}/reopen")

    async def delete_task(self, task_id: str) -> None:
        await self._request("DELETE", f"/tasks/{task_id}")

    # Live updates

    async def events(self, silence: float) -> AsyncIterator[dict[str, Any]]:
        """Yield the stream's events until it ends.

        Yields {} once when the stream is open, the data of each "changed" event, and
        {"notification": data} for each "notification" (a reminder came due, a task was assigned).
        Raises PeckListApiError when the server refuses the stream, and PeckListConnectionError
        when it breaks or goes silent.
        """
        timeout = aiohttp.ClientTimeout(total=None, sock_connect=30, sock_read=silence)
        headers = {**self._headers, "Accept": "text/event-stream"}
        try:
            async with self._session.get(
                f"{self.url}/api/events", headers=headers, timeout=timeout, allow_redirects=False
            ) as response:
                if response.status >= 400:
                    await _raise_for(response)
                if response.status != 200 or "text/event-stream" not in response.headers.get(
                    "Content-Type", ""
                ):
                    raise PeckListConnectionError("the server did not open an event stream")
                yield {}
                event = ""
                data: list[str] = []
                async for raw in response.content:
                    line = raw.decode("utf-8", "replace").rstrip("\r\n")
                    if not line:
                        if event in ("changed", "notification"):
                            try:
                                parsed = json.loads("\n".join(data)) if data else {}
                            except ValueError:
                                parsed = {}
                            if event == "notification":
                                if isinstance(parsed, dict) and parsed:
                                    yield {"notification": parsed}
                            else:
                                yield parsed if isinstance(parsed, dict) and parsed else {"changed": True}
                        event, data = "", []
                    elif line.startswith("event:"):
                        event = line[6:].strip()
                    elif line.startswith("data:"):
                        data.append(line[5:].lstrip())
        except (aiohttp.ClientError, TimeoutError, asyncio.IncompleteReadError) as err:
            raise PeckListConnectionError(str(err) or type(err).__name__) from err
