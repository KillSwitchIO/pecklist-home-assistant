"""What every PeckList entity shares: one device per connected account."""

from __future__ import annotations

from homeassistant.const import CONF_URL
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN
from .coordinator import PeckListCoordinator


class PeckListEntity(CoordinatorEntity[PeckListCoordinator]):
    """An entity of one PeckList account."""

    _attr_has_entity_name = True

    def __init__(self, coordinator: PeckListCoordinator, key: str) -> None:
        super().__init__(coordinator)
        entry = coordinator.config_entry
        self._attr_unique_id = f"{entry.entry_id}_{key}"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, entry.entry_id)},
            name=f"PeckList {coordinator.username}".strip(),
            manufacturer="PeckList",
            entry_type=DeviceEntryType.SERVICE,
            configuration_url=entry.data[CONF_URL],
        )
