from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..core.dependencies import get_current_active_doctor
from ..database import get_db
from ..models.doctor import Doctor
from ..models.image import Image
from ..models.comment import Comment
from ..schemas.comment import CommentCreate, CommentResponse, CommentUpdate

router = APIRouter()


@router.post("/", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    comment_in: CommentCreate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor),
) -> Any:
    """
    Create a new comment.
    """
    # Resolve image either by image_id or by UIDs
    image = None
    if comment_in.image_id is not None:
        image = db.query(Image).filter(Image.id == comment_in.image_id).first()
    else:
        image = (
            db.query(Image)
            .filter(
                Image.study_instance_uid == comment_in.study_instance_uid,
                Image.series_instance_uid == comment_in.series_instance_uid,
                Image.sop_instance_uid == comment_in.sop_instance_uid,
            )
            .first()
        )
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )

    # Create new comment
    db_comment = Comment(
        content=comment_in.content,
        image_id=image.id,
        doctor_id=None if comment_in.is_ai_generated else current_doctor.id,
        is_ai_generated=comment_in.is_ai_generated,
        ai_model=comment_in.ai_model,
    )
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)

    return db_comment


@router.get("/", response_model=List[CommentResponse])
def get_comments(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    image_id: Optional[int] = None,
    doctor_id: Optional[int] = None,
    is_ai_generated: Optional[bool] = None,
    current_doctor: Doctor = Depends(get_current_active_doctor),
) -> Any:
    """
    Get all comments with optional filtering.
    """
    query = db.query(Comment)

    # Apply filters if provided
    if image_id is not None:
        query = query.filter(Comment.image_id == image_id)
    if doctor_id is not None:
        query = query.filter(Comment.doctor_id == doctor_id)
    if is_ai_generated is not None:
        query = query.filter(Comment.is_ai_generated == is_ai_generated)

    # Get comments with pagination
    comments = query.order_by(Comment.created_at.desc()).offset(skip).limit(limit).all()

    return comments


@router.get("/image/{image_id}", response_model=List[CommentResponse])
def get_comments_by_image(
    image_id: int,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_doctor: Doctor = Depends(get_current_active_doctor),
) -> Any:
    """
    Get all comments for a specific image.
    """
    # Check if the image exists
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )

    # Get comments for the image
    comments = db.query(Comment).filter(Comment.image_id == image_id).order_by(Comment.created_at.desc()).offset(skip).limit(limit).all()

    return comments


@router.get("/by-uids/study/{study_uid}", response_model=List[CommentResponse])
def get_comments_by_study(
    study_uid: str,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_doctor: Doctor = Depends(get_current_active_doctor),
) -> Any:
    """
    Get all comments for a specific StudyInstanceUID across all series/instances.
    """
    image_ids = (
        db.query(Image.id)
        .filter(Image.study_instance_uid == study_uid)
        .subquery()
    )
    comments = (
        db.query(Comment)
        .filter(Comment.image_id.in_(image_ids))
        .order_by(Comment.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return comments


@router.get("/by-uids/study/{study_uid}/series/{series_uid}", response_model=List[CommentResponse])
def get_comments_by_series(
    study_uid: str,
    series_uid: str,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_doctor: Doctor = Depends(get_current_active_doctor),
) -> Any:
    """
    Get all comments for a specific SeriesInstanceUID within a study.
    """
    image_ids = (
        db.query(Image.id)
        .filter(
            Image.study_instance_uid == study_uid,
            Image.series_instance_uid == series_uid,
        )
        .subquery()
    )
    comments = (
        db.query(Comment)
        .filter(Comment.image_id.in_(image_ids))
        .order_by(Comment.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return comments


@router.get(
    "/by-uids/study/{study_uid}/series/{series_uid}/instances/{sop_instance_uid}",
    response_model=List[CommentResponse],
)
def get_comments_by_instance(
    study_uid: str,
    series_uid: str,
    sop_instance_uid: str,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_doctor: Doctor = Depends(get_current_active_doctor),
) -> Any:
    """
    Get all comments for a specific SOPInstanceUID within a series/study.
    """
    image = (
        db.query(Image)
        .filter(
            Image.study_instance_uid == study_uid,
            Image.series_instance_uid == series_uid,
            Image.sop_instance_uid == sop_instance_uid,
        )
        .first()
    )
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Image not found",
        )
    comments = (
        db.query(Comment)
        .filter(Comment.image_id == image.id)
        .order_by(Comment.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return comments

@router.get("/doctor/{doctor_id}", response_model=List[CommentResponse])
def get_comments_by_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_doctor: Doctor = Depends(get_current_active_doctor),
) -> Any:
    """
    Get all comments by a specific doctor.
    """
    # Check if the doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )

    # Get comments by the doctor
    comments = db.query(Comment).filter(Comment.doctor_id == doctor_id).order_by(Comment.created_at.desc()).offset(skip).limit(limit).all()

    return comments


@router.get("/me/", response_model=List[CommentResponse])
def get_my_comments(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_doctor: Doctor = Depends(get_current_active_doctor),
) -> Any:
    """
    Get all comments by the current doctor.
    """
    comments = db.query(Comment).filter(Comment.doctor_id == current_doctor.id).order_by(Comment.created_at.desc()).offset(skip).limit(limit).all()

    return comments


@router.get("/{comment_id}", response_model=CommentResponse)
def get_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor),
) -> Any:
    """
    Get a specific comment by ID.
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    return comment


@router.put("/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: int,
    comment_update: CommentUpdate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor),
) -> Any:
    """
    Update a specific comment.
    Only the comment author can update it.
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    # Check if the current doctor is the author of the comment
    if comment.doctor_id != current_doctor.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update this comment",
        )

    # Check if the comment is AI-generated
    if comment.is_ai_generated:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="AI-generated comments cannot be updated",
        )

    # Update comment
    comment.content = comment_update.content
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return comment


@router.delete("/{comment_id}", response_model=dict)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor),
) -> Any:
    """
    Delete a specific comment.
    Only the comment author can delete it.
    """
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    # Check if the current doctor is the author of the comment
    if comment.doctor_id != current_doctor.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to delete this comment",
        )

    # Delete comment
    db.delete(comment)
    db.commit()

    return {"message": "Comment deleted successfully"}
