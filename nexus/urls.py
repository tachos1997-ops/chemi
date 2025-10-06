from __future__ import annotations

from django.urls import path

from . import views

app_name = 'nexus'

urlpatterns = [
    path('', views.index, name='index'),
    path('api/state/', views.api_state, name='api_state'),
    path('api/combine/', views.api_combine, name='api_combine'),
    path('api/reset/', views.api_reset, name='api_reset'),
]
