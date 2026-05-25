import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import data, visualize, classify, benchmark


def _warm_cache() -> None:
    """Background thread: preload subject 1 (both run types) at startup.

    This ensures the first real user request hits the cache instead of waiting
    for the 45 s MOABB load (or ~1 s npz load).
    """
    from routers.data import _get_epochs
    for run in ("imagined_hand", "imagined_feet"):
        try:
            _get_epochs(1, run)
        except Exception:
            pass  # don't crash the server if preloading fails


@asynccontextmanager
async def lifespan(app: FastAPI):
    threading.Thread(target=_warm_cache, daemon=True).start()
    yield


app = FastAPI(title="eeg-mi-benchmark", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(data.router, prefix="/data", tags=["data"])
app.include_router(visualize.router, prefix="/visualize", tags=["visualize"])
app.include_router(classify.router, prefix="/classify", tags=["classify"])
app.include_router(benchmark.router, prefix="/benchmark", tags=["benchmark"])


@app.get("/health")
def health():
    """Return service liveness status. Used by Railway health checks."""
    return {"status": "ok"}
