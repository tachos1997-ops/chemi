"""Flask microservice exposing Elemental Nexus combination logic."""
from __future__ import annotations

from dataclasses import asdict

from flask import Flask, jsonify, request

from shared import attempt_combine, base_elements, combos

app = Flask(__name__)


@app.get('/health')
def health_check():
    return jsonify({'status': 'ok'})


@app.get('/combos')
def list_combos():
    return jsonify([
        {
            'result': combo.result,
            'ingredients': combo.ingredients,
            'age': combo.age,
        }
        for combo in combos()
    ])


@app.get('/base-elements')
def list_base_elements():
    return jsonify({'base_elements': list(base_elements())})


@app.post('/combine')
def combine():
    payload = request.get_json(force=True, silent=True) or {}
    first = payload.get('first')
    second = payload.get('second')
    discovered = payload.get('discovered', base_elements())
    invalid_cost = payload.get('invalid_cost', 1)

    if not first or not second:
        return jsonify({'success': False, 'message': 'Two elements are required.'}), 400

    result = attempt_combine(first, second, set(discovered), invalid_cost=invalid_cost)
    response = asdict(result)
    return jsonify(response)


if __name__ == '__main__':  # pragma: no cover
    app.run(debug=True)
