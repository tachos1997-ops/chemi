"""Shared resources between Django and Flask services."""
from .combos import AGES, BASE_ELEMENTS, Combo, combo_lookup, combos
from .gameplay import (
    AGE_TO_INDEX,
    CombinationResult,
    EnergyUpdate,
    attempt_combine,
    base_elements,
    discoverable_elements,
    evaluate_age_progress,
    regenerate_energy,
)

__all__ = [
    'AGES',
    'BASE_ELEMENTS',
    'Combo',
    'combo_lookup',
    'combos',
    'AGE_TO_INDEX',
    'CombinationResult',
    'EnergyUpdate',
    'attempt_combine',
    'base_elements',
    'discoverable_elements',
    'evaluate_age_progress',
    'regenerate_energy',
]
