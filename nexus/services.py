from __future__ import annotations

from typing import Any

from django.conf import settings
from django.utils import timezone

from shared import (
    attempt_combine,
    base_elements,
    discoverable_elements,
    evaluate_age_progress,
    regenerate_energy,
)

from .models import GameState


def _ensure_session(request) -> str:
    if not request.session.session_key:
        request.session.create()
    return request.session.session_key


def load_state(request) -> GameState:
    session_key = _ensure_session(request)
    state, _created = GameState.objects.get_or_create(
        session_key=session_key,
        defaults={
            'discovered': list(base_elements()),
            'energy': settings.GAMEPLAY_RULES['energy_start'],
            'legacy_multiplier': 1.0,
        },
    )
    return state


def _apply_energy_regen(state: GameState) -> None:
    now = timezone.now()
    update = regenerate_energy(
        energy=state.energy,
        last_tick=state.last_energy_tick,
        now=now,
        cap=settings.GAMEPLAY_RULES['energy_cap'],
        regen_amount=settings.GAMEPLAY_RULES['energy_regen_amount'],
        regen_interval_seconds=settings.GAMEPLAY_RULES['energy_regen_interval_seconds'],
    )
    state.energy = update.new_energy
    state.last_energy_tick = update.last_tick


def serialize_state(state: GameState) -> dict[str, Any]:
    _apply_energy_regen(state)
    state.save(update_fields=['energy', 'last_energy_tick', 'updated_at'])

    discovered_sorted = sorted(set(state.discovered))
    thresholds = settings.GAMEPLAY_RULES['age_thresholds']
    progress = evaluate_age_progress(
        discovered_count=len(discovered_sorted),
        current_index=state.current_age_index,
        thresholds=thresholds,
    )
    if progress.current_index != state.current_age_index:
        state.current_age_index = progress.current_index
        state.save(update_fields=['current_age_index', 'updated_at'])

    return {
        'energy': state.energy,
        'discovered': discovered_sorted,
        'age': progress.unlocked_age,
        'age_index': progress.current_index,
        'legacy_multiplier': state.legacy_multiplier,
        'discovery_log': state.discovery_log[-50:],
        'energy_cap': settings.GAMEPLAY_RULES['energy_cap'],
        'energy_regen_interval_seconds': settings.GAMEPLAY_RULES['energy_regen_interval_seconds'],
        'age_thresholds': settings.GAMEPLAY_RULES['age_thresholds'],
        'all_elements': list(discoverable_elements()),
    }


def combine_elements(state: GameState, first: str, second: str) -> dict[str, Any]:
    _apply_energy_regen(state)
    if state.energy <= 0:
        payload = serialize_state(state)
        payload.update(
            {
                'success': False,
                'message': 'You are out of energy. Wait for regeneration or refill.',
                'element': None,
                'was_new_discovery': False,
            }
        )
        return payload

    discovered_set = set(state.discovered)
    result = attempt_combine(
        first,
        second,
        discovered_set,
        invalid_cost=settings.GAMEPLAY_RULES['invalid_combo_energy_cost'],
    )

    state.energy = max(0, min(settings.GAMEPLAY_RULES['energy_cap'], state.energy + result.energy_delta))
    log_entry = {
        'timestamp': timezone.now().isoformat(),
        'message': result.message,
        'success': result.success,
        'element': result.new_element,
    }

    if result.success and result.new_element:
        discovered_set.add(result.new_element)
        state.discovered = sorted(discovered_set)
        thresholds = settings.GAMEPLAY_RULES['age_thresholds']
        progress = evaluate_age_progress(
            discovered_count=len(discovered_set),
            current_index=state.current_age_index,
            thresholds=thresholds,
        )
        if progress.current_index != state.current_age_index:
            state.current_age_index = progress.current_index
            log_entry['age_unlocked'] = progress.unlocked_age
    else:
        state.energy = max(0, state.energy)

    if not result.success:
        state.energy = max(0, state.energy)

    state.discovery_log = (state.discovery_log + [log_entry])[-200:]
    state.save()
    payload = serialize_state(state)
    payload.update({'message': result.message, 'success': result.success, 'element': result.new_element})
    if 'age_unlocked' in log_entry:
        payload['age_unlocked'] = log_entry['age_unlocked']
    payload['was_new_discovery'] = result.was_new_discovery
    return payload


def reset_state(state: GameState) -> dict[str, Any]:
    state.legacy_multiplier += settings.GAMEPLAY_RULES['legacy_multiplier_increment']
    state.discovered = list(base_elements())
    state.energy = settings.GAMEPLAY_RULES['energy_start']
    state.current_age_index = 0
    state.discovery_log = [
        {
            'timestamp': timezone.now().isoformat(),
            'message': 'Universe reset. Legacy multiplier increased.',
            'success': True,
            'element': None,
        }
    ]
    state.last_energy_tick = timezone.now()
    state.save()
    return serialize_state(state)
