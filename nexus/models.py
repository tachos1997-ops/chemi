from __future__ import annotations

from django.db import models
from django.utils import timezone


class GameState(models.Model):
    session_key = models.CharField(max_length=64, unique=True)
    discovered = models.JSONField(default=list)
    energy = models.IntegerField(default=20)
    legacy_multiplier = models.FloatField(default=1.0)
    current_age_index = models.IntegerField(default=0)
    last_energy_tick = models.DateTimeField(default=timezone.now)
    discovery_log = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Game State'
        verbose_name_plural = 'Game States'

    def __str__(self) -> str:  # pragma: no cover - human readable
        return f"State<{self.session_key}>"
