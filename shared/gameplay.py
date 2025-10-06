"""Gameplay utilities shared between Django and Flask services."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Iterable

from .combos import AGES, BASE_ELEMENTS, Combo, combo_lookup, combos


@dataclass
class CombinationResult:
    success: bool
    new_element: str | None
    energy_delta: int
    message: str
    age_unlocked: str | None = None
    was_new_discovery: bool = False


AGE_TO_INDEX = {age: index for index, age in enumerate(AGES)}


def base_elements() -> tuple[str, ...]:
    return BASE_ELEMENTS


def all_elements() -> set[str]:
    results: set[str] = set(BASE_ELEMENTS)
    for combo in combos():
        results.add(combo.result)
        results.update(combo.ingredients)
    return results


def discoverable_elements() -> Iterable[str]:
    return sorted(all_elements())


def attempt_combine(
    first: str,
    second: str,
    discovered: set[str],
    *,
    invalid_cost: int,
) -> CombinationResult:
    key = tuple(sorted((first, second)))
    combo = combo_lookup().get(key)
    if combo is None:
        return CombinationResult(
            success=False,
            new_element=None,
            energy_delta=-invalid_cost,
            message=f"{first} + {second} fizzles. Energy drained.",
        )

    was_new = combo.result not in discovered
    msg = (
        f"Discovered {combo.result}!" if was_new else f"Recreated {combo.result}."
    )

    return CombinationResult(
        success=True,
        new_element=combo.result,
        energy_delta=0,
        message=msg,
        age_unlocked=combo.age,
        was_new_discovery=was_new,
    )


@dataclass
class EnergyUpdate:
    new_energy: int
    last_tick: datetime
    ticks_awarded: int


def regenerate_energy(
    *,
    energy: int,
    last_tick: datetime,
    now: datetime,
    cap: int,
    regen_amount: int,
    regen_interval_seconds: int,
) -> EnergyUpdate:
    if energy >= cap:
        return EnergyUpdate(new_energy=cap, last_tick=now, ticks_awarded=0)

    elapsed = max(0, int((now - last_tick).total_seconds()))
    intervals = elapsed // regen_interval_seconds if regen_interval_seconds > 0 else 0
    if intervals <= 0:
        return EnergyUpdate(new_energy=energy, last_tick=last_tick, ticks_awarded=0)

    gained = intervals * regen_amount
    new_energy = min(cap, energy + gained)
    new_last_tick = last_tick + timedelta(seconds=intervals * regen_interval_seconds)
    return EnergyUpdate(new_energy=new_energy, last_tick=new_last_tick, ticks_awarded=intervals)


@dataclass
class AgeProgress:
    current_index: int
    unlocked_age: str


def evaluate_age_progress(
    *,
    discovered_count: int,
    current_index: int,
    thresholds: list[int],
) -> AgeProgress:
    target_index = current_index
    while target_index + 1 < len(thresholds) and discovered_count >= thresholds[target_index + 1]:
        target_index += 1
    return AgeProgress(current_index=target_index, unlocked_age=AGES[target_index])
