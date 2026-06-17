from fastapi import FastAPI

app = FastAPI(title="Budget Tracker API")

@app.get("/health")
def health():
    return {"status": "ok"}