from app.core.rules.triage import should_auto_approve


def test_threshold_boundary():
    assert should_auto_approve(0.89, False, "PHOTO", threshold=0.9) is False
    assert should_auto_approve(0.90, False, "PHOTO", threshold=0.9) is True
    assert should_auto_approve(0.91, False, "PHOTO", threshold=0.9) is True


def test_safety_critical_blocks():
    assert should_auto_approve(0.99, True, "PHOTO", threshold=0.9) is False
    assert should_auto_approve(0.99, True, "KPI_MEASUREMENT",
                               threshold=0.9) is False


def test_cost_record_blocks():
    assert should_auto_approve(0.99, False, "COST_RECORD",
                               threshold=0.9) is False


def test_kpi_measurement_and_photo_pass():
    assert should_auto_approve(0.95, False, "KPI_MEASUREMENT",
                               threshold=0.9) is True
    assert should_auto_approve(0.95, False, "PHOTO", threshold=0.9) is True


def test_unparseable_confidence_stays_queued():
    assert should_auto_approve(None, False, "PHOTO", threshold=0.9) is False
    assert should_auto_approve("high", False, "PHOTO", threshold=0.9) is False
