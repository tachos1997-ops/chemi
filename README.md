# Elemental Nexus (Python Edition)

Elemental Nexus is a cyber-fantasy alchemy puzzle rebuilt with a Python-first toolchain.
The project now features a Django web client that serves the interactive laboratory UI and
persists player progress in SQLite, plus a companion Flask microservice that exposes the
combination logic for integrations and automated testing.

## Project Layout

```
├── elemental_nexus/          # Django project settings & routing
├── nexus/                    # Gameplay app with templates, static UI, and persistence
│   ├── templates/nexus/      # Django templates for the web experience
│   └── static/nexus/         # CSS + JS powering the neon alchemy UI
├── flask_service/app.py      # Flask API exposing combination endpoints
├── shared/                   # Combination tables and gameplay helpers shared by both stacks
├── requirements.txt          # Python dependencies
└── tools/                    # Utility scripts (icon generation, etc.)
```

## Features

- **Django web client** with responsive HUD, energy meter, and discovery log built for
  desktops and touch devices.
- **Server-side persistence** backed by SQLite so discoveries, energy, and legacy bonuses
  survive reloads.
- **Energy + progression rules** consistent across both Django and Flask surfaces thanks
  to shared `shared/` gameplay utilities.
- **Flask microservice** offering `/combine`, `/combos`, and `/base-elements` endpoints for
  automation, bots, or external tooling.
- **Legacy reset system** that rewards completions with a stacking multiplier.

## Getting Started

1. Create and activate a virtual environment.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run Django migrations:
   ```bash
   python manage.py migrate
   ```
4. Start the Django development server:
   ```bash
   python manage.py runserver
   ```
5. (Optional) launch the Flask microservice from another shell:
   ```bash
   python -m flask --app flask_service.app run
   ```

Visit `http://127.0.0.1:8000/` to play in the browser. The UI communicates with Django for
stateful actions and will periodically refresh energy to reflect regeneration.

## Gameplay API

The Flask service mirrors the combination logic and is ideal for automated discovery trees.
Sample request:

```bash
curl -X POST http://127.0.0.1:5000/combine \
  -H "Content-Type: application/json" \
  -d '{"first": "Fire", "second": "Water", "discovered": ["Fire", "Water", "Earth", "Air"]}'
```

Response:

```json
{
  "success": true,
  "new_element": "Steam",
  "energy_delta": 0,
  "message": "Discovered Steam!",
  "age_unlocked": "Primal",
  "was_new_discovery": true
}
```

## Tests & Tooling

- `python manage.py test` – reserved for future unit tests.
- `python manage.py check` – validate Django project settings.
- `flake8` / `ruff` – recommended linting for the Python codebase.

## Deployment Notes

- Static files are served from `nexus/static/`; collect them with `python manage.py collectstatic`
  when preparing production builds.
- Environment variables can override defaults in `elemental_nexus/settings.py` for SECRET_KEY,
  database configuration, and energy tuning.
- Both Django and Flask services are compatible with Gunicorn or any ASGI/WSGI host.

Enjoy forging the ages in pure Python!
