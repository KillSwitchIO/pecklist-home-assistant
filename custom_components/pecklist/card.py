"""The PeckList dashboard card, which ships with the integration.

The built card lives in ``www/``. Home Assistant serves it at ``/pecklist/pecklist-card.js`` and
the integration adds it to the dashboard resources, so there is nothing to install by hand.
"""

from __future__ import annotations

from pathlib import Path

from homeassistant.components.http import StaticPathConfig
from homeassistant.components.lovelace.const import (
    CONF_RESOURCE_TYPE_WS,
    LOVELACE_DATA,
    MODE_STORAGE,
)
from homeassistant.const import CONF_ID, CONF_URL
from homeassistant.core import HomeAssistant
from homeassistant.loader import async_get_integration

from .const import DOMAIN, LOGGER

CARD_FILE = "pecklist-card.js"
CARD_URL = f"/{DOMAIN}/{CARD_FILE}"
CARD_PATH = Path(__file__).parent / "www" / CARD_FILE


async def async_setup_card(hass: HomeAssistant) -> None:
    """Serve the card and make sure the dashboards load it."""
    await hass.http.async_register_static_paths([StaticPathConfig(CARD_URL, str(CARD_PATH), False)])

    # The version in the address makes browsers fetch the card again after an update.
    integration = await async_get_integration(hass, DOMAIN)
    url = f"{CARD_URL}?v={integration.version}"

    lovelace = hass.data.get(LOVELACE_DATA)
    if lovelace is None or lovelace.resource_mode != MODE_STORAGE:
        # Resources kept in YAML cannot be written from here: load the card with the frontend.
        _add_frontend_module(hass, url)
        return

    resources = lovelace.resources
    await resources.async_get_info()  # Loads the stored resources, if nothing has yet.
    for item in resources.async_items():
        if item[CONF_URL].partition("?")[0] != CARD_URL:
            continue
        if item[CONF_URL] != url:
            await resources.async_update_item(item[CONF_ID], {CONF_URL: url})
        return
    await resources.async_create_item({CONF_RESOURCE_TYPE_WS: "module", CONF_URL: url})


def _add_frontend_module(hass: HomeAssistant, url: str) -> None:
    if "frontend" not in hass.config.components:
        LOGGER.debug("No frontend to load the dashboard card in")
        return
    from homeassistant.components.frontend import add_extra_js_url

    add_extra_js_url(hass, url)
