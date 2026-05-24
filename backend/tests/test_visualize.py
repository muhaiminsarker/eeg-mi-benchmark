from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

PARAMS = {"dataset": "BNCI2014001", "subject": 1, "run": "imagined_hand"}


def test_timeseries_returns_three_channels():
    response = client.get("/visualize/timeseries", params={**PARAMS, "epoch_idx": 0})
    assert response.status_code == 200
    body = response.json()
    assert "times" in body
    assert "channels" in body
    assert "C3" in body["channels"]
    assert "C4" in body["channels"]
    assert "Cz" in body["channels"]
    assert len(body["times"]) == len(body["channels"]["C3"])


def test_timeseries_epoch_idx_out_of_range():
    response = client.get("/visualize/timeseries", params={**PARAMS, "epoch_idx": 9999})
    assert response.status_code == 400


def test_psd_returns_freqs_and_power():
    response = client.get("/visualize/psd", params={**PARAMS, "channel": "C3"})
    assert response.status_code == 200
    body = response.json()
    assert "freqs" in body
    assert "power" in body
    assert len(body["freqs"]) == len(body["power"])
    # Should cover mu and beta bands
    assert min(body["freqs"]) <= 8.0
    assert max(body["freqs"]) >= 30.0


def test_psd_invalid_channel():
    response = client.get("/visualize/psd", params={**PARAMS, "channel": "NOTACHANNEL"})
    assert response.status_code == 400


def test_topoplot_returns_svg_string():
    response = client.get("/visualize/topoplot", params={**PARAMS, "freq_band": "mu"})
    assert response.status_code == 200
    body = response.json()
    assert "svg" in body
    assert body["svg"].startswith("<svg") or "<?xml" in body["svg"]


def test_topoplot_invalid_band():
    response = client.get("/visualize/topoplot", params={**PARAMS, "freq_band": "notaband"})
    assert response.status_code == 400
