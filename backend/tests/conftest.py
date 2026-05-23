import pytest
from pipeline.loader import load_subject_epochs


@pytest.fixture(scope="session")
def moabb_s1_imagined_hand():
    # Downloads BNCI2014_001 on first run (~500MB), cached to ~/.moabb/ after that
    return load_subject_epochs(subject=1, run_label="imagined_hand")
