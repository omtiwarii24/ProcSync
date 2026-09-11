from app.core.errors import InvalidStateTransition


def assert_transition(entity_name: str, current, allowed: dict, new) -> None:
    targets = allowed.get(current, [])
    if new not in targets:
        raise InvalidStateTransition(
            f"{entity_name}: transition {current} -> {new} not allowed "
            f"(allowed from {current}: {targets})",
            context={"entity": entity_name, "from": str(current), "to": str(new)},
        )
