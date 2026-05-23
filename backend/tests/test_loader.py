import pytest
from pipeline.loader import load_subject_epochs, get_run_options


def test_get_run_options_returns_expected_structure():
    options = get_run_options()
    assert isinstance(options, list)
    assert len(options) > 0
    first = options[0]
    assert "value" in first
    assert "label" in first


def test_load_subject_epochs_returns_epochs_object(moabb_subject_1_run_4):
    epochs, error = moabb_subject_1_run_4
    assert error is None
    assert epochs is not None
    assert len(epochs) > 0
