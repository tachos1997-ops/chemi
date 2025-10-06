from __future__ import annotations

import json
from typing import Any

from django.http import HttpRequest, HttpResponse, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .services import combine_elements, load_state, reset_state, serialize_state


def index(request: HttpRequest) -> HttpResponse:
    state = load_state(request)
    initial_state = serialize_state(state)
    return render(
        request,
        'nexus/index.html',
        {
            'initial_state_json': json.dumps(initial_state),
        },
    )


@require_GET
@csrf_exempt
def api_state(request: HttpRequest) -> JsonResponse:
    state = load_state(request)
    payload = serialize_state(state)
    return JsonResponse(payload)


@require_POST
@csrf_exempt
def api_combine(request: HttpRequest) -> JsonResponse:
    state = load_state(request)
    data: dict[str, Any] = json.loads(request.body or '{}')
    first = data.get('first')
    second = data.get('second')
    if not first or not second:
        return JsonResponse({'success': False, 'message': 'Two elements are required.'}, status=400)
    payload = combine_elements(state, first, second)
    return JsonResponse(payload)


@require_POST
@csrf_exempt
def api_reset(request: HttpRequest) -> JsonResponse:
    state = load_state(request)
    payload = reset_state(state)
    payload['message'] = 'Legacy timeline engaged. Base elements restored.'
    return JsonResponse(payload)
