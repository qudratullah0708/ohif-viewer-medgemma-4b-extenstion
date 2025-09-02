from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging

from .core.config import settings
from .database import engine, Base

# Import all models to ensure they are registered with SQLAlchemy
from .models import doctor, image, comment

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create all tables in the database
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    debug=settings.DEBUG
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to OHIF Collaborative Imaging System API",
        "docs": f"{settings.API_V1_STR}/docs"
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include API routers
from .routers.auth import router as auth_router
from .routers.doctors import router as doctors_router
from .routers.images import router as images_router
from .routers.comments import router as comments_router
from .routers.dev import router as dev_router

app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["authentication"])
app.include_router(doctors_router, prefix=f"{settings.API_V1_STR}/doctors", tags=["doctors"])
app.include_router(images_router, prefix=f"{settings.API_V1_STR}/images", tags=["images"])
app.include_router(comments_router, prefix=f"{settings.API_V1_STR}/comments", tags=["comments"])
app.include_router(dev_router, prefix=f"{settings.API_V1_STR}", tags=["development"])

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
