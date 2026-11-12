"""PeckList: to-do lists, a calendar, sensors and actions from a PeckList server."""

from __future__ import annotations

from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.event import async_track_time_change
from homeassistant.helpers.typing import ConfigType

from .const import CONF_HA_USER, DOMAIN
from .coordinator import PeckListConfigEntry, PeckListCoordinator
from .services import async_setup_services
from .websocket_api import async_setup_websocket

PLATFORMS = [Platform.CALENDAR, Platform.SENSOR, Platform.TODO]

CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Register the actions and the dashboard card's websocket commands."""
    async_setup_services(hass)
    async_setup_websocket(hass)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: PeckListConfigEntry) -> bool:
    """Connect one PeckList account."""
    coordinator = PeckListCoordinator(hass, entry)
    await coordinator.async_config_entry_first_refresh()
    # The dashboard card names people as Home Assistant does, when the account is matched to a user.
    if user_id := entry.options.get(CONF_HA_USER):
        user = await hass.auth.async_get_user(user_id)
        coordinator.display_name = (user.name if user else None) or coordinator.username
    entry.runtime_data = coordinator

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    entry.async_create_background_task(
        hass, coordinator.async_stream(), f"{DOMAIN} live updates {entry.entry_id}"
    )
    entry.async_on_unload(
        async_track_time_change(hass, coordinator.async_day_changed, hour=0, minute=0, second=5)
    )
    entry.async_on_unload(entry.add_update_listener(_async_options_changed))
    return True


async def _async_options_changed(hass: HomeAssistant, entry: PeckListConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: PeckListConfigEntry) -> bool:
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
