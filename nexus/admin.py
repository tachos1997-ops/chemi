from django.contrib import admin

from .models import GameState


@admin.register(GameState)
class GameStateAdmin(admin.ModelAdmin):
    list_display = ('session_key', 'energy', 'current_age_index', 'legacy_multiplier', 'updated_at')
    search_fields = ('session_key',)
    readonly_fields = ('created_at', 'updated_at', 'discovery_log')
