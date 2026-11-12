"""Connecting a PeckList account: a server address and an API key."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any
from urllib.parse import urlparse

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.const import CONF_API_KEY, CONF_URL
from homeassistant.core import callback
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.selector import (
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    SelectOptionDict,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
    TextSelector,
    TextSelectorConfig,
    TextSelectorType,
)
import voluptuous as vol

from .api import (
    PeckListApiError,
    PeckListAuthError,
    PeckListClient,
    PeckListError,
    normalize_url,
)
from .const import (
    CONF_COMPLETED_DAYS,
    CONF_DATE_FIELD,
    CONF_HA_USER,
    DATE_FIELD_DUE,
    DATE_FIELD_SCHEDULE,
    DEFAULT_COMPLETED_DAYS,
    DEFAULT_DATE_FIELD,
    DOMAIN,
    LOGGER,
    SCOPE_READ,
    SCOPE_WRITE,
)

URL_SELECTOR = TextSelector(TextSelectorConfig(type=TextSelectorType.URL))
KEY_SELECTOR = TextSelector(TextSelectorConfig(type=TextSelectorType.PASSWORD))
NO_USER = "none"


def unique_id_for(url: str, user_id: str) -> str:
    """One entry per account per server."""
    host = urlparse(url).netloc.lower()
    return f"{host}/{user_id}"


class PeckListConfigFlow(ConfigFlow, domain=DOMAIN):
    """Add, re-key or move a PeckList account."""

    VERSION = 1

    async def _check(self, url: str, api_key: str, errors: dict[str, str]) -> dict[str, Any] | None:
        """Ask the server who the key belongs to; fill `errors` when it won't do."""
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https") or not parsed.netloc:
            errors[CONF_URL] = "invalid_url"
            return None
        client = PeckListClient(async_get_clientsession(self.hass), url, api_key)
        try:
            me = await client.me()
        except PeckListAuthError:
            errors[CONF_API_KEY] = "invalid_auth"
        except PeckListApiError as err:
            if err.code == "rate_limited":
                errors["base"] = "rate_limited"
            else:
                errors["base"] = "cannot_connect"
        except PeckListError:
            errors["base"] = "cannot_connect"
        except Exception:
            LOGGER.exception("Unexpected error checking a PeckList key")
            errors["base"] = "unknown"
        else:
            scopes = (me.get("key") or {}).get("scopes") or []
            if SCOPE_READ not in scopes and SCOPE_WRITE not in scopes:
                errors[CONF_API_KEY] = "missing_scope"
                return None
            return me
        return None

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            url = normalize_url(user_input[CONF_URL])
            api_key = user_input[CONF_API_KEY].strip()
            me = await self._check(url, api_key, errors)
            if me is not None:
                await self.async_set_unique_id(unique_id_for(url, me["id"]))
                self._abort_if_unique_id_configured()
                return self.async_create_entry(
                    title=f"{me.get('username') or me['id']} ({urlparse(url).netloc})",
                    data={CONF_URL: url, CONF_API_KEY: api_key},
                )
        return self.async_show_form(
            step_id="user",
            data_schema=self.add_suggested_values_to_schema(
                vol.Schema({vol.Required(CONF_URL): URL_SELECTOR, vol.Required(CONF_API_KEY): KEY_SELECTOR}),
                {CONF_URL: (user_input or {}).get(CONF_URL)},
            ),
            errors=errors,
        )

    async def async_step_reauth(self, entry_data: Mapping[str, Any]) -> ConfigFlowResult:
        return await self.async_step_reauth_confirm()

    async def async_step_reauth_confirm(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """The key expired or was revoked: take a new one for the same account."""
        entry = self._get_reauth_entry()
        errors: dict[str, str] = {}
        if user_input is not None:
            api_key = user_input[CONF_API_KEY].strip()
            me = await self._check(entry.data[CONF_URL], api_key, errors)
            if me is not None:
                await self.async_set_unique_id(unique_id_for(entry.data[CONF_URL], me["id"]))
                self._abort_if_unique_id_mismatch(reason="wrong_account")
                return self.async_update_reload_and_abort(entry, data_updates={CONF_API_KEY: api_key})
        return self.async_show_form(
            step_id="reauth_confirm",
            data_schema=vol.Schema({vol.Required(CONF_API_KEY): KEY_SELECTOR}),
            description_placeholders={"title": entry.title, "url": entry.data[CONF_URL]},
            errors=errors,
        )

    async def async_step_reconfigure(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        """The server moved to another address, or the key is being swapped."""
        entry = self._get_reconfigure_entry()
        errors: dict[str, str] = {}
        if user_input is not None:
            url = normalize_url(user_input[CONF_URL])
            api_key = user_input[CONF_API_KEY].strip()
            me = await self._check(url, api_key, errors)
            if me is not None:
                if me["id"] != entry.unique_id.rsplit("/", 1)[-1]:
                    return self.async_abort(reason="wrong_account")
                new_id = unique_id_for(url, me["id"])
                if new_id != entry.unique_id:
                    await self.async_set_unique_id(new_id)
                    self._abort_if_unique_id_configured()
                return self.async_update_reload_and_abort(
                    entry,
                    unique_id=new_id,
                    title=f"{me.get('username') or me['id']} ({urlparse(url).netloc})",
                    data_updates={CONF_URL: url, CONF_API_KEY: api_key},
                )
        return self.async_show_form(
            step_id="reconfigure",
            data_schema=self.add_suggested_values_to_schema(
                vol.Schema({vol.Required(CONF_URL): URL_SELECTOR, vol.Required(CONF_API_KEY): KEY_SELECTOR}),
                {CONF_URL: (user_input or entry.data).get(CONF_URL)},
            ),
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return PeckListOptionsFlow()


class PeckListOptionsFlow(OptionsFlow):
    """How dates are written, how long closed tasks stay, and whose account this is."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            if user_input.get(CONF_HA_USER) == NO_USER:
                user_input.pop(CONF_HA_USER)
            user_input[CONF_COMPLETED_DAYS] = int(user_input[CONF_COMPLETED_DAYS])
            return self.async_create_entry(data=user_input)

        users = [
            SelectOptionDict(value=user.id, label=user.name or user.id)
            for user in await self.hass.auth.async_get_users()
            if not user.system_generated and user.is_active
        ]
        schema = vol.Schema(
            {
                vol.Required(CONF_DATE_FIELD): SelectSelector(
                    SelectSelectorConfig(
                        options=[DATE_FIELD_SCHEDULE, DATE_FIELD_DUE],
                        translation_key=CONF_DATE_FIELD,
                        mode=SelectSelectorMode.LIST,
                    )
                ),
                vol.Required(CONF_COMPLETED_DAYS): NumberSelector(
                    NumberSelectorConfig(min=0, max=365, step=1, mode=NumberSelectorMode.BOX)
                ),
                vol.Required(CONF_HA_USER): SelectSelector(
                    SelectSelectorConfig(
                        options=[SelectOptionDict(value=NO_USER, label="-"), *users],
                        mode=SelectSelectorMode.DROPDOWN,
                    )
                ),
            }
        )
        options = self.config_entry.options
        return self.async_show_form(
            step_id="init",
            data_schema=self.add_suggested_values_to_schema(
                schema,
                {
                    CONF_DATE_FIELD: options.get(CONF_DATE_FIELD, DEFAULT_DATE_FIELD),
                    CONF_COMPLETED_DAYS: options.get(CONF_COMPLETED_DAYS, DEFAULT_COMPLETED_DAYS),
                    CONF_HA_USER: options.get(CONF_HA_USER, NO_USER),
                },
            ),
        )
