from fastapi.testclient import TestClient
from airgap_lab.app import app
from airgap_lab.inspectors import inspect_hardware, inspect_ollama


def test_health():
    assert TestClient(app, base_url='http://127.0.0.1').get('/health').json() == {'status': 'ok'}


def test_ui():
    response = TestClient(app, base_url='http://127.0.0.1').get('/')
    assert response.status_code == 200
    assert 'AIRGAP LAB' in response.text


def test_hardware():
    assert inspect_hardware()['memory_total_bytes'] > 0


def test_ollama_blocks_arbitrary_urls():
    import pytest
    with pytest.raises(ValueError):
        inspect_ollama('https://example.com/api/tags')


def test_untrusted_host_is_rejected():
    assert TestClient(app, base_url='http://attacker.example').get('/health').status_code == 400


def test_local_responses_are_not_cached():
    response = TestClient(app, base_url='http://localhost').get('/health')
    assert response.headers['cache-control'] == 'no-store'
    assert response.headers['x-content-type-options'] == 'nosniff'

