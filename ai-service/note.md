python -m venv venv
pip install -r requirements.txt
source venv/Scripts/activate
uvicorn app.main:app --reload --port 8000
