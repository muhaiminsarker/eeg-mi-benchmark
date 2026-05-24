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
