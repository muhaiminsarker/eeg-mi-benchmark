from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import data, visualize, classify, benchmark

app = FastAPI(title="eeg-mi-benchmark", version="0.1.0")

# GET-only — the API is read-only, so restricting methods is free security
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
