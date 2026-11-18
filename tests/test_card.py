"""The dashboard card that ships with the integration: served, and added to the resources."""

from __future__ import annotations

from homeassistant.components.lovelace.const import LOVELACE_DATA
from homeassistant.core import HomeAssistant
from homeassistant.loader import async_get_integration
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.typing import ClientSessionGenerator

from custom_components.pecklist.card import CARD_PATH, CARD_URL, async_setup_card
from custom_components.pecklist.const import DOMAIN


async def _resources(hass: HomeAssistant) -> list[dict[str, str]]:
    return [
        {"type": item["type"], "url": item["url"]}
        for item in hass.data[LOVELACE_DATA].resources.async_items()
    ]


async def _versioned(hass: HomeAssistant) -> str:
    return f"{CARD_URL}?v={(await async_get_integration(hass, DOMAIN)).version}"


def test_the_built_card_is_in_the_package() -> None:
    assert "pecklist-card" in CARD_PATH.read_text(encoding="utf-8")


async def test_setup_serves_the_card(
    hass: HomeAssistant, loaded: MockConfigEntry, hass_client: ClientSessionGenerator
) -> None:
    client = await hass_client()
    response = await client.get(CARD_URL)
    assert response.status == 200
    assert "pecklist-card" in await response.text()


async def test_setup_adds_the_card_to_the_dashboard_resources(
    hass: HomeAssistant, loaded: MockConfigEntry
) -> None:
    assert await _resources(hass) == [{"type": "module", "url": await _versioned(hass)}]


async def test_setting_up_again_adds_nothing(hass: HomeAssistant, loaded: MockConfigEntry) -> None:
    await async_setup_card_again(hass)
    assert len(await _resources(hass)) == 1


async def test_an_update_moves_the_resource_to_the_new_version(hass: HomeAssistant) -> None:
    assert await async_setup_component(hass, "lovelace", {})
    resources = hass.data[LOVELACE_DATA].resources
    await resources.async_create_item({"res_type": "module", "url": "/local/other-card.js"})
    await resources.async_create_item({"res_type": "module", "url": f"{CARD_URL}?v=0.0.1"})

    assert await async_setup_component(hass, DOMAIN, {})

    assert await _resources(hass) == [
        {"type": "module", "url": "/local/other-card.js"},
        {"type": "module", "url": await _versioned(hass)},
    ]


async def test_yaml_resources_are_left_alone_and_the_frontend_loads_the_card(hass: HomeAssistant) -> None:
    assert await async_setup_component(hass, "lovelace", {"lovelace": {"resource_mode": "yaml"}})
    hass.config.components.add("frontend")
    hass.data["frontend_extra_module_url"] = urls = set()

    assert await async_setup_component(hass, DOMAIN, {})

    assert hass.data[LOVELACE_DATA].resources.async_items() == []
    assert urls == {await _versioned(hass)}


async def async_setup_card_again(hass: HomeAssistant) -> None:
    """A second run, as after a restart with the resource already stored."""
    from unittest.mock import patch

    with patch.object(hass.http, "async_register_static_paths"):
        await async_setup_card(hass)
