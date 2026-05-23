from fastapi import APIRouter

router = APIRouter()


@router.get("/status")
def classify_status():
    return {"status": "coming in Week 2 - after reading Blankertz et al. 2008"}
