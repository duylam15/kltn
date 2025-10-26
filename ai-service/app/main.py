from app.schemas import PredictRequest, PredictResponse
from app.model import predict_label, learning_path
from fastapi import FastAPI, UploadFile
import pandas as pd
from .cluster_model import StudentClusterModel

app = FastAPI(title="AI Learning Path Service")

@app.post("/predict", response_model=PredictResponse)
def predict(data: PredictRequest):
    # chuyển data thành dict
    input_dict = data.dict()
    label = predict_label(input_dict)
    suggestions = learning_path(label)
    return PredictResponse(label=label, suggestions=suggestions)

@app.post("/cluster")
async def cluster_students(file: UploadFile):
    df = pd.read_csv(file.file)
    model = StudentClusterModel(n_clusters=3)
    model.fit(df)
    result = model.predict(df)
    return result.to_dict(orient="records")
