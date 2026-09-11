from app.core.rules.eligibility import run_eligibility


def test_turnover_gte_pass_and_fail():
    crits = [{"criterion_id": 1, "criterion_type": "TURNOVER", "operator": "GTE",
              "threshold": 1000000.0, "is_auto_checkable": True}]
    res = run_eligibility({"annual_turnover": 2500000.0, "prior_deployments": 0,
                           "dpiit_number": None}, crits)
    assert res[0]["result"] == "PASS" and res[0]["checked_value"] == 2500000.0
    res = run_eligibility({"annual_turnover": 500000.0, "prior_deployments": 0,
                           "dpiit_number": None}, crits)
    assert res[0]["result"] == "FAIL"


def test_experience_lte():
    crits = [{"criterion_id": 2, "criterion_type": "EXPERIENCE", "operator": "LTE",
              "threshold": 5.0, "is_auto_checkable": True}]
    res = run_eligibility({"annual_turnover": 0, "prior_deployments": 3,
                           "dpiit_number": None}, crits)
    assert res[0]["result"] == "PASS"


def test_dpiit_registered():
    crits = [{"criterion_id": 3, "criterion_type": "DPIIT", "operator": "GTE",
              "threshold": None, "is_auto_checkable": True}]
    res = run_eligibility({"annual_turnover": 0, "prior_deployments": 0,
                           "dpiit_number": "DPIIT123"}, crits)
    assert res[0]["result"] == "PASS"
    res = run_eligibility({"annual_turnover": 0, "prior_deployments": 0,
                           "dpiit_number": None}, crits)
    assert res[0]["result"] == "FAIL"


def test_custom_pending_manual():
    crits = [{"criterion_id": 4, "criterion_type": "CUSTOM", "operator": "EQ",
              "threshold": None, "is_auto_checkable": False}]
    res = run_eligibility({"annual_turnover": 0, "prior_deployments": 0,
                           "dpiit_number": None}, crits)
    assert res[0]["result"] == "PENDING_MANUAL"


def test_engine_returns_fail_not_pending_for_waivable():
    # Engine stays pure: FAIL is FAIL; the SERVICE maps FAIL+waiver_allowed -> PENDING_MANUAL.
    crits = [{"criterion_id": 5, "criterion_type": "TURNOVER", "operator": "GTE",
              "threshold": 100.0, "is_auto_checkable": True}]
    res = run_eligibility({"annual_turnover": 0.0, "prior_deployments": 0,
                           "dpiit_number": None}, crits)
    assert res[0]["result"] == "FAIL"
