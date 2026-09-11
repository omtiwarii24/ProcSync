from typing import Any


class AppError(Exception):
    status_code = 500
    code = "APP_ERROR"

    def __init__(
        self,
        detail: str,
        context: dict[str, Any] | None = None,
        status_code: int | None = None,
        code: str | None = None,
    ):
        self.detail = detail
        self.context = context
        if status_code is not None:
            self.status_code = status_code
        if code is not None:
            self.code = code
        super().__init__(detail)


class BadRequest(AppError):
    status_code = 400
    code = "BAD_REQUEST"


class PermissionDenied(AppError):
    status_code = 403
    code = "PERMISSION_DENIED"


class Unauthorized(AppError):
    status_code = 401
    code = "UNAUTHORIZED"


class NotFound(AppError):
    status_code = 404
    code = "NOT_FOUND"


class InvalidStateTransition(AppError):
    status_code = 409
    code = "INVALID_STATE_TRANSITION"


class AIProviderError(AppError):
    status_code = 503
    code = "AI_PROVIDER_ERROR"
