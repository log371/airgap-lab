"""Transport regressions: run entirely against mocked responses."""
import io
import json
import urllib.error
from unittest.mock import Mock, patch

import pytest
from airgap_lab import inspectors


def response(payload, status=200):
    value = Mock()
    value.status = status
    value.read.return_value = payload
    value.__enter__ = Mock(return_value=value)
    value.__exit__ = Mock(return_value=False)
    return value


def test_model_list_is_normalized_and_bounded():
    payload = {'models': [{'name': 'x'*200, 'size': 42}] * 101 + ['bad']}
    with patch.object(inspectors._OLLAMA_OPENER, 'open', return_value=response(json.dumps(payload).encode())) as call:
        result = inspectors.inspect_ollama()
    assert result['reachable'] is True
    assert len(result['models']) == 100
    assert len(result['models'][0]['name']) == 160
    assert call.call_args.kwargs['timeout'] == 1.5
    assert call.call_args.args[0].full_url == inspectors.OLLAMA_URL


@pytest.mark.parametrize('raw', [b'not json', b'[]', b'{"models": {}}', b'x'*(512*1024+1)])
def test_invalid_and_oversized_responses_are_explicit_errors(raw):
    with patch.object(inspectors._OLLAMA_OPENER, 'open', return_value=response(raw)):
        result = inspectors.inspect_ollama()
    assert result['reachable'] is False
    assert result['models'] == []
    assert result['error']


def test_timeout_is_reported_without_network_access():
    with patch.object(inspectors._OLLAMA_OPENER, 'open', side_effect=TimeoutError):
        assert inspectors.inspect_ollama()['reachable'] is False


def test_redirect_handler_never_constructs_an_outbound_redirect():
    request = inspectors.urllib.request.Request(inspectors.OLLAMA_URL)
    handler = inspectors._NoRedirect()
    with pytest.raises(urllib.error.HTTPError):
        handler.redirect_request(request, io.BytesIO(), 302, 'Found', {}, 'https://example.invalid/api/tags')


def test_environment_proxies_are_disabled():
    with patch.dict('os.environ', {'http_proxy': 'http://example.invalid:8888', 'HTTP_PROXY': 'http://example.invalid:8888'}):
        opener = inspectors.urllib.request.build_opener(inspectors.urllib.request.ProxyHandler({}), inspectors._NoRedirect())
    assert not any(isinstance(h, inspectors.urllib.request.ProxyHandler) for h in opener.handlers)
