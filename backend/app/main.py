import os

from fastapi import Depends, FastAPI, Request
from fastapi.responses import JSONResponse

from app.core.errors import AppError


def create_app() -> FastAPI:
    app = FastAPI(
        title="GovInnovate API",
        version="0.1.0",
        description="Startup-friendly innovation procurement engine — SIH26136",
    )

    from app.modules.auth.router import auth_router
    app.include_router(auth_router, prefix="/api/auth", tags=["auth"])

    from app.modules.orgs.router import orgs_router
    app.include_router(orgs_router, prefix="/api", tags=["orgs"])

    from app.modules.challenges.router import challenges_router
    app.include_router(challenges_router, prefix="/api", tags=["challenges"])

    from app.modules.proposals.router import proposals_router
    app.include_router(proposals_router, prefix="/api", tags=["proposals"])

    from app.modules.pilots.router import pilots_router
    app.include_router(pilots_router, prefix="/api", tags=["pilots"])

    from app.modules.execution.router import execution_router
    app.include_router(execution_router, prefix="/api", tags=["execution"])

    from app.modules.payments.router import payments_router
    app.include_router(payments_router, prefix="/api", tags=["payments"])

    from app.modules.riskqual.router import riskqual_router
    app.include_router(riskqual_router, prefix="/api", tags=["riskqual"])

    from app.modules.discovery.router import discovery_router
    app.include_router(discovery_router, prefix="/api", tags=["discovery"])

    from app.modules.evidence.router import evidence_router
    app.include_router(evidence_router, prefix="/api", tags=["evidence"])

    from fastapi.middleware.cors import CORSMiddleware

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
        ],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        content = {"detail": exc.detail, "code": exc.code}
        if exc.context:
            content["context"] = exc.context
        return JSONResponse(status_code=exc.status_code, content=content)

    from fastapi.exceptions import RequestValidationError
    from fastapi.encoders import jsonable_encoder
    from fastapi.responses import JSONResponse as JR

    @app.exception_handler(RequestValidationError)
    async def validation_handler(request: Request, exc: RequestValidationError):
        return JR(status_code=422, content={"detail": jsonable_encoder(exc.errors()),
                                            "code": "VALIDATION_ERROR"})

    @app.exception_handler(Exception)
    async def fallback_handler(request: Request, exc: Exception):
        return JR(status_code=500, content={"detail": "Internal server error", "code": "INTERNAL_ERROR"})

    if os.environ.get("ENABLE_RBAC_PROBES") == "1":
        from app.core.rbac import (require_any_authenticated, require_portal,
                                   require_role)
        from app.models.enums import Portal, UserRole

        @app.get("/api/rbac-probe/any", tags=["test"])
        def probe_any(user=Depends(require_any_authenticated())):
            return {"ok": True}

        @app.get("/api/rbac-probe/govt", tags=["test"])
        def probe_govt(user=Depends(require_portal(Portal.B))):
            return {"ok": True}

        @app.get("/api/rbac-probe/evaluator", tags=["test"])
        def probe_eval(user=Depends(require_role(UserRole.EVALUATOR))):
            return {"ok": True}

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app


app = create_app()
