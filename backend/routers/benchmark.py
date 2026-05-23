from fastapi import APIRouter

router = APIRouter()


@router.get("/status")
def benchmark_status():
    return {"status": "coming in Week 3 - after reading Lotte et al. 2018"}
