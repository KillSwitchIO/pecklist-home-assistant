"""Make an API key on a throwaway PeckList server, for the contract tests.

Signs in as the server's first admin (ADMIN_PASSWORD on a fresh container) and prints a new key
with tasks:read and tasks:write. Never point this at a server with real data.

    PECKLIST_URL=http://localhost:18190 PECKLIST_ADMIN_PASSWORD=... python scripts/contract_token.py
"""

from __future__ import annotations

from http.cookiejar import CookieJar
import json
import os
import sys
import time
import urllib.error
import urllib.request

URL = os.environ["PECKLIST_URL"].rstrip("/")
PASSWORD = os.environ["PECKLIST_ADMIN_PASSWORD"]

opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(CookieJar()))


def post(path: str, body: dict) -> dict:
    request = urllib.request.Request(
        URL + path,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with opener.open(request, timeout=30) as response:
        return json.loads(response.read().decode())


def main() -> int:
    # A fresh container takes a few seconds to answer.
    for attempt in range(60):
        try:
            with urllib.request.urlopen(URL + "/api/info", timeout=5):
                break
        except (urllib.error.URLError, OSError):
            if attempt == 59:
                print("The PeckList server did not start", file=sys.stderr)
                return 1
            time.sleep(2)
    post("/auth/login", {"username": "admin", "password": PASSWORD})
    key = post("/api/account/api-keys", {"name": "contract tests", "scopes": ["tasks:read", "tasks:write"]})
    print(key["token"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
