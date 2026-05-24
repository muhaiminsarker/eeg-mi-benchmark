from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_get_options_returns_expected_keys():
    response = client.get("/data/options")
    assert response.status_code == 200
    body = response.json()
    assert "datasets" in body
    assert "subjects" in body
    assert "runs" in body
    assert len(body["runs"]) == 2  # imagined_hand, imagined_feet


def test_get_options_subjects_range():
    response = client.get("/data/options")
    subjects = response.json()["subjects"]
    assert subjects == list(range(1, 10))  # BNCI2014_001 has 9 subjects


def test_load_returns_metadata():
    response = client.get("/data/load", params={
        "dataset": "BNCI2014001",
        "subject": 1,
        "run": "imagined_hand",
    })
    assert response.status_code == 200
    body = response.json()
    assert "n_epochs" in body
    assert "sfreq" in body
    assert "tmin" in body
    assert "tmax" in body
    assert "channels" in body
    assert "C3" in body["channels"]


def test_load_invalid_run_returns_400():
    response = client.get("/data/load", params={
        "dataset": "BNCI2014001",
        "subject": 1,
        "run": "imagined_tongue",
    })
    assert response.status_code == 400
