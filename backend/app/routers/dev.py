from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.doctor import Doctor
from ..models.image import Image
from ..models.comment import Comment
from ..schemas.comment import CommentCreate, CommentResponse
from ..schemas.image import ImageCreate, ImageResponse

router = APIRouter(prefix="/dev", tags=["development"])

# Development endpoints that bypass authentication for easier testing

@router.post("/images/", response_model=ImageResponse, status_code=status.HTTP_201_CREATED)
def create_image_dev(
    image_in: ImageCreate,
    db: Session = Depends(get_db),
) -> Any:
    """
    Create a new image reference (development endpoint - no auth required).
    """
    # Check if image with this ID already exists
    db_image = db.query(Image).filter(Image.image_id == image_in.image_id).first()
    if db_image:
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

    return db_image


@router.get("/images/by-ohif-id/{ohif_image_id}", response_model=ImageResponse)
def get_image_by_ohif_id_dev(
    ohif_image_id: str,
    db: Session = Depends(get_db),
) -> Any:
    """
    Get a specific image reference by OHIF image ID (development endpoint - no auth required).
    """
    image = db.query(Image).filter(Image.image_id == ohif_image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )

    return image


@router.post("/comments/", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment_dev(
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
) -> Any:
    """
    Create a new comment (development endpoint - no auth required).
    """
    # Check if the image exists
    image = db.query(Image).filter(Image.id == comment_in.image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )

    # Create new comment
    db_comment = Comment(
        content=comment_in.content,
        image_id=comment_in.image_id,
        doctor_id=None,  # No doctor ID for development
        is_ai_generated=comment_in.is_ai_generated,
        ai_model=comment_in.ai_model,
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)

    return db_comment


@router.get("/comments/image/{image_id}", response_model=List[CommentResponse])
def get_comments_by_image_dev(
    image_id: int,
    db: Session = Depends(get_db),
) -> Any:
    """
    Get all comments for a specific image (development endpoint - no auth required).
    """
    # Check if the image exists
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )

    # Get comments for the image
    comments = db.query(Comment).filter(Comment.image_id == image_id).order_by(Comment.created_at.desc()).all()

    return comments
