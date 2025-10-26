from pydantic import BaseModel

class PredictRequest(BaseModel):
    score: float
    completionTime: int
    attemptCount: int
    avgScore: float
    attendanceRate: float
    activityCount: int


class PredictResponse(BaseModel):
    label: str
    suggestions: list[str]
