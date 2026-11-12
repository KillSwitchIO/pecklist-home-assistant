"""The client against a small HTTP server that answers as PeckList does."""

from __future__ import annotations

from collections.abc import AsyncIterator

import aiohttp
from aiohttp import web
from aiohttp.test_utils import TestServer
import pytest

from custom_components.pecklist.api import (
    PeckListApiError,
    PeckListAuthError,
    PeckListClient,
    PeckListConnectionError,
    PeckListScopeError,
    normalize_url,
)

pytestmark = pytest.mark.usefixtures("socket_enabled")


def problem(status: int, code: str, **headers: str) -> web.Response:
    return web.json_response(
        {"type": "about:blank", "status": status, "code": code, "detail": f"{code} detail"},
        status=status,
        content_type="application/problem+json",
        headers=headers,
    )


async def me(request: web.Request) -> web.Response:
    key = request.headers.get("Authorization")
    if key == "Bearer pl_good":
        return web.json_response(
            {"id": "U1", "username": "ben", "role": "user", "key": {"scopes": ["tasks:read"]}}
        )
    if key == "Bearer pl_page":
        return web.Response(text="<html>Sign in</html>", content_type="text/html")
    return problem(401, "unauthorized")


async def tasks(request: web.Request) -> web.Response:
    if request.method == "DELETE":
        return web.Response(status=204)
    if request.match_info.get("id") == "slow":
        return problem(429, "rate_limited", **{"Retry-After": "7"})
    if request.match_info.get("id") == "moved":
        raise web.HTTPFound("/login")
    request.app["bodies"].append(await request.json())
    return problem(403, "scope")


async def events(request: web.Request) -> web.StreamResponse:
    if request.headers.get("Authorization") != "Bearer pl_good":
        return problem(401, "unauthorized")
    response = web.StreamResponse(headers={"Content-Type": "text/event-stream"})
    await response.prepare(request)
    await response.write(b": connected\n\n")
    await response.write(b'event: changed\ndata: {"cursor":"12","source":"web"}\n\n')
    await response.write(b": ping\n\n")
    await response.write(b"event: other\ndata: {}\n\n")
    await response.write(b'event: notification\ndata: {"id":"N1","kind":"reminder","taskId":"T1"}\n\n')
    await response.write(b"event: changed\ndata: not json\n\n")
    return response


@pytest.fixture
async def base() -> AsyncIterator[tuple[str, web.Application]]:
    app = web.Application()
    app["bodies"] = []
    app.router.add_get("/api/v1/me", me)
    app.router.add_route("*", "/api/v1/tasks", tasks)
    app.router.add_route("*", "/api/v1/tasks/{id}", tasks)
    app.router.add_get("/api/events", events)
    server = TestServer(app)
    await server.start_server()
    yield str(server.make_url("")).rstrip("/"), app
    await server.close()


@pytest.fixture
async def session() -> AsyncIterator[aiohttp.ClientSession]:
    async with aiohttp.ClientSession() as client_session:
        yield client_session


def test_normalize_url() -> None:
    assert normalize_url(" https://tasks.example.com/ ") == "https://tasks.example.com"
    assert normalize_url("https://tasks.example.com/api/v1/") == "https://tasks.example.com"
    assert normalize_url("https://example.com/pecklist/api") == "https://example.com/pecklist"


async def test_answers_and_refusals(
    base: tuple[str, web.Application], session: aiohttp.ClientSession
) -> None:
    url, app = base
    good = PeckListClient(session, url + "/", "pl_good")
    assert (await good.me())["username"] == "ben"
    assert await good.delete_task("T1") is None

    with pytest.raises(PeckListAuthError):
        await PeckListClient(session, url, "pl_revoked").me()
    with pytest.raises(PeckListConnectionError):  # a proxy's sign-in page is not PeckList
        await PeckListClient(session, url, "pl_page").me()

    with pytest.raises(PeckListScopeError):
        await good.create_task({"title": "x"})
    assert app["bodies"] == [{"title": "x"}]

    with pytest.raises(PeckListApiError) as limited:
        await good.update_task("slow", {"title": "x"})
    assert (limited.value.code, limited.value.retry_after) == ("rate_limited", 7.0)

    with pytest.raises(PeckListConnectionError):  # never follow a redirect with the key
        await good.update_task("moved", {"title": "x"})


async def test_people_and_a_server_without_them(
    base: tuple[str, web.Application], session: aiohttp.ClientSession
) -> None:
    url, _ = base
    client = PeckListClient(session, url, "pl_good")
    assert await client.people() is None  # the route is not there: an older server

    async def people(request: web.Request) -> web.Response:
        return web.json_response({"items": [{"id": "user:U1", "kind": "user", "name": "Ben"}]})

    other = web.Application()
    other.router.add_get("/api/v1/people", people)
    server = TestServer(other)
    await server.start_server()
    try:
        newer = PeckListClient(session, str(server.make_url("")), "pl_good")
        assert await newer.people() == [{"id": "user:U1", "kind": "user", "name": "Ben"}]
    finally:
        await server.close()


async def test_an_unreachable_server(session: aiohttp.ClientSession) -> None:
    with pytest.raises(PeckListConnectionError):
        await PeckListClient(session, "http://127.0.0.1:9", "pl_good").me()


async def test_the_event_stream(base: tuple[str, web.Application], session: aiohttp.ClientSession) -> None:
    url, _ = base
    seen = [event async for event in PeckListClient(session, url, "pl_good").events(5)]
    # Open, a change with its cursor, a notification, and a change whose data could not be read.
    assert seen == [
        {},
        {"cursor": "12", "source": "web"},
        {"notification": {"id": "N1", "kind": "reminder", "taskId": "T1"}},
        {"changed": True},
    ]

    with pytest.raises(PeckListAuthError):
        async for _ in PeckListClient(session, url, "pl_revoked").events(5):
            pass
