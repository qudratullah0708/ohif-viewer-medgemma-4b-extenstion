from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..core.dependencies import get_current_active_doctor
from ..database import get_db
from ..models.doctor import Doctor
from ..models.image import Image
from ..models.comment import Comment
from ..schemas.image import ImageCreate, ImageResponse

router = APIRouter()


@router.post("/", response_model=ImageResponse, status_code=status.HTTP_201_CREATED)
def register_image(
    image_in: ImageCreate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor),
) -> Any:
    """
    Register a new image reference.
    This doesn't upload or store the actual image data, just creates a reference to an existing OHIF image.
    """
    # Check if image with this ID already exists
    db_image = db.query(Image).filter(Image.image_id == image_in.image_id).first()
    if db_image:
        # If image already exists, return it
        comment_count = db.query(func.count(Comment.id)).filter(Comment.image_id == db_image.id).scalar()
        db_image.comment_count = comment_count
        return db_image

    # Create new image reference
    db_image = Image(
        image_id=image_in.image_id,
        study_instance_uid=image_in.study_instance_uid,
        series_instance_uid=image_in.series_instance_uid,
        sop_instance_uid=image_in.sop_instance_uid,
        patient_id=image_in.patient_id,
        study_date=image_in.study_date,
        modality=image_in.modality,
    )
    db.add(db_image)
    db.commit()
    db.refresh(db_image)

    # Set comment count to 0 for new images
    db_image.comment_count = 0
    return db_image


@router.get("/", response_model=List[ImageResponse])
def get_images(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    patient_id: Optional[str] = None,
    modality: Optional[str] = None,
    current_doctor: Doctor = Depends(get_current_active_doctor),
) -> Any:
    """
    Get all image references with optional filtering.
    """
    query = db.query(Image)

    # Apply filters if provided
    if patient_id:
        query = query.filter(Image.patient_id == patient_id)
    if modality:
        query = query.filter(Image.modality == modality)

    # Get images with pagination
    images = query.order_by(Image.created_at.desc()).offset(skip).limit(limit).all()

    # Add comment counts
    for image in images:
        comment_count = db.query(func.count(Comment.id)).filter(Comment.image_id == image.id).scalar()
        image.comment_count = comment_count

    return images


@router.get("/{image_id}", response_model=ImageResponse)
def get_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor),
) -> Any:
    """
    Get a specific image reference by ID.
    """
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )

    # Add comment count
    comment_count = db.query(func.count(Comment.id)).filter(Comment.image_id == image.id).scalar()
    image.comment_count = comment_count

    return image


@router.get("/by-ohif-id/{ohif_image_id}", response_model=ImageResponse)
def get_image_by_ohif_id(
    ohif_image_id: str,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor),
) -> Any:
    """
    Get a specific image reference by OHIF image ID.
    """
    image = db.query(Image).filter(Image.image_id == ohif_image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )

    # Add comment count
    comment_count = db.query(func.count(Comment.id)).filter(Comment.image_id == image.id).scalar()
    image.comment_count = comment_count

    return image
