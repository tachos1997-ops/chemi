from __future__ import annotations

import json

from django.test import Client, TestCase


class APITestCase(TestCase):
    def setUp(self) -> None:
        self.client = Client()

    def test_index_renders(self) -> None:
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('Elemental Nexus', response.content.decode())

    def test_combine_endpoint_discovers_element(self) -> None:
        payload = json.dumps({'first': 'Fire', 'second': 'Water'})
        response = self.client.post('/api/combine/', payload, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertEqual(data['element'], 'Steam')

    def test_invalid_combination_consumes_energy(self) -> None:
        payload = json.dumps({'first': 'Fire', 'second': 'Unknown'})
        response = self.client.post('/api/combine/', payload, content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('message', data)
        self.assertFalse(data['success'])
        # Repeat until energy drains to zero
        for _ in range(25):
            self.client.post('/api/combine/', payload, content_type='application/json')
        response = self.client.post('/api/combine/', payload, content_type='application/json')
        data = response.json()
        self.assertFalse(data['success'])
        self.assertIn('out of energy', data['message'].lower())
