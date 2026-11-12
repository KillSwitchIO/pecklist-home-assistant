"""Connecting, re-keying and moving an account."""

from __future__ import annotations

from homeassistant.config_entries import SOURCE_USER
from homeassistant.const import CONF_API_KEY, CONF_URL
from homeassistant.core import HomeAssistant
from homeassistant.data_entry_flow import FlowResultType
from pytest_homeassistant_custom_component.common import MockConfigEntry

from custom_components.pecklist.const import CONF_COMPLETED_DAYS, CONF_DATE_FIELD, CONF_HA_USER, DOMAIN

from .conftest import URL, USER_ID, FakePeckList


async def _start(hass: HomeAssistant, url: str = URL + "/", key: str = " pl_secret ") -> dict:
    result = await hass.config_entries.flow.async_init(DOMAIN, context={"source": SOURCE_USER})
    assert result["type"] is FlowResultType.FORM
    return await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: url, CONF_API_KEY: key}
    )


async def test_connects_and_names_the_entry_after_the_account(
    hass: HomeAssistant, server: FakePeckList
) -> None:
    result = await _start(hass)
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "ben (tasks.example.com)"
    assert result["data"] == {CONF_URL: URL, CONF_API_KEY: "pl_secret"}
    assert result["result"].unique_id == f"tasks.example.com/{USER_ID}"


async def test_a_read_only_key_is_accepted(hass: HomeAssistant, server: FakePeckList) -> None:
    server.scopes = ["tasks:read"]
    assert (await _start(hass))["type"] is FlowResultType.CREATE_ENTRY


async def test_refusals_show_on_the_form_and_can_be_retried(
    hass: HomeAssistant, server: FakePeckList
) -> None:
    server.valid = False
    result = await _start(hass)
    assert result["errors"] == {CONF_API_KEY: "invalid_auth"}

    server.valid = True
    server.scopes = ["files:read"]
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: URL, CONF_API_KEY: "pl_secret"}
    )
    assert result["errors"] == {CONF_API_KEY: "missing_scope"}

    server.scopes = ["tasks:read", "tasks:write"]
    server.offline = True
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: URL, CONF_API_KEY: "pl_secret"}
    )
    assert result["errors"] == {"base": "cannot_connect"}

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: "tasks.example.com", CONF_API_KEY: "pl_secret"}
    )
    assert result["errors"] == {CONF_URL: "invalid_url"}

    server.offline = False
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: URL, CONF_API_KEY: "pl_secret"}
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY


async def test_the_same_account_is_not_added_twice(
    hass: HomeAssistant, server: FakePeckList, entry: MockConfigEntry
) -> None:
    result = await _start(hass)
    assert result["type"] is FlowResultType.ABORT
    assert result["reason"] == "already_configured"


async def test_another_account_on_the_same_server_is_its_own_entry(
    hass: HomeAssistant, server: FakePeckList, entry: MockConfigEntry
) -> None:
    server.user_id, server.username = "01USERBBBBBBBBBBBBBBBBBBBB", "sam"
    result = await _start(hass)
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "sam (tasks.example.com)"


async def test_reauth_takes_a_new_key_for_the_same_account(
    hass: HomeAssistant, server: FakePeckList, loaded: MockConfigEntry
) -> None:
    result = await loaded.start_reauth_flow(hass)
    assert result["step_id"] == "reauth_confirm"

    server.user_id = "01USERBBBBBBBBBBBBBBBBBBBB"
    wrong = await hass.config_entries.flow.async_configure(result["flow_id"], {CONF_API_KEY: "pl_other"})
    assert (wrong["type"], wrong["reason"]) == (FlowResultType.ABORT, "wrong_account")
    assert loaded.data[CONF_API_KEY] == "pl_secret"

    server.user_id = USER_ID
    result = await loaded.start_reauth_flow(hass)
    done = await hass.config_entries.flow.async_configure(result["flow_id"], {CONF_API_KEY: "pl_new"})
    await hass.async_block_till_done()
    assert (done["type"], done["reason"]) == (FlowResultType.ABORT, "reauth_successful")
    assert loaded.data[CONF_API_KEY] == "pl_new"


async def test_reconfigure_moves_the_server(
    hass: HomeAssistant, server: FakePeckList, loaded: MockConfigEntry
) -> None:
    result = await loaded.start_reconfigure_flow(hass)
    done = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_URL: "http://pecklist.lan:8080/", CONF_API_KEY: "pl_new"}
    )
    await hass.async_block_till_done()
    assert (done["type"], done["reason"]) == (FlowResultType.ABORT, "reconfigure_successful")
    assert loaded.data == {CONF_URL: "http://pecklist.lan:8080", CONF_API_KEY: "pl_new"}
    assert loaded.unique_id == f"pecklist.lan:8080/{USER_ID}"


async def test_options(hass: HomeAssistant, server: FakePeckList, loaded: MockConfigEntry) -> None:
    result = await hass.config_entries.options.async_init(loaded.entry_id)
    assert result["type"] is FlowResultType.FORM
    done = await hass.config_entries.options.async_configure(
        result["flow_id"], {CONF_DATE_FIELD: "due", CONF_COMPLETED_DAYS: 3, CONF_HA_USER: "none"}
    )
    await hass.async_block_till_done()
    assert done["type"] is FlowResultType.CREATE_ENTRY
    assert loaded.options == {CONF_DATE_FIELD: "due", CONF_COMPLETED_DAYS: 3}
    assert loaded.runtime_data.date_field == "due"
