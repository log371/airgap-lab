from fastapi.testclient import TestClient
from airgap_lab.app import app
from airgap_lab.inspectors import inspect_hardware, inspect_ollama


def test_health():
    assert TestClient(app).get('/health').json() == {'status': 'ok'}


def test_ui():
    response = TestClient(app).get('/')
    assert response.status_code == 200
    assert 'AIRGAP LAB' in response.text


def test_hardware():
    assert inspect_hardware()['memory_total_bytes'] > 0


def test_ollama_blocks_arbitrary_urls():
    import pytest
    with pytest.raises(ValueError):
        inspect_ollama('https://example.com/api/tags')
