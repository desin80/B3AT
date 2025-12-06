import time
import uvicorn
from fastapi import FastAPI, Request
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import battles, comments, stats, auth, submissions
from app.config import ALLOWED_ORIGINS
from fastapi.staticfiles import StaticFiles


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield
    pass


app = FastAPI(lifespan=lifespan)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    process_time = time.perf_counter() - start_time
    print(f"{request.method} {request.url.path} - {process_time:.4f}s")
    return response


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"status": "Server is running"}


app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.include_router(auth.router)
app.include_router(battles.router)
app.include_router(comments.router)
app.include_router(stats.router)
app.include_router(submissions.router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
