import pytest

from app.core.errors import InvalidStateTransition


def test_assert_transition_ok():
    from app.core.transitions import assert_transition
    assert_transition("Challenge", "DRAFT", {"DRAFT": ["PUBLISHED", "DRAFT_EDIT"]}, "PUBLISHED")


def test_assert_transition_blocked():
    from app.core.transitions import assert_transition
    with pytest.raises(InvalidStateTransition) as e:
        assert_transition("Challenge", "CLOSED", {"DRAFT": ["PUBLISHED"]}, "PUBLISHED")
    assert "CLOSED" in str(e.value) and "PUBLISHED" in str(e.value)
