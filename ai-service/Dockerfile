FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y gcc g++ \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Cài torch CPU gọn
RUN pip install --no-cache-dir torch==2.2.0+cpu \
    --index-url https://download.pytorch.org/whl/cpu

# Cài tất cả package còn lại (bảo đảm numpy<2)
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 9000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9000"]
