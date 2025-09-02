from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..core.config import settings
from ..core.security import (
    create_access_token,
    get_password_hash,
    verify_password,
    get_current_doctor
)
from ..database import get_db
from ..models.doctor import Doctor
from ..schemas.auth import Token, LoginRequest
from ..schemas.doctor import DoctorCreate, DoctorResponse

router = APIRouter()


@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
def register(doctor_in: DoctorCreate, db: Session = Depends(get_db)) -> Any:
    """
    Register a new doctor.
    """
    # Check if doctor with this email already exists
    doctor = db.query(Doctor).filter(Doctor.email == doctor_in.email).first()
    if doctor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A doctor with this email already exists",
        )

    # Check if doctor with this ID card number already exists
    doctor = db.query(Doctor).filter(Doctor.id_card_number == doctor_in.id_card_number).first()
    if doctor:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A doctor with this ID card number already exists",
        )

    # Create new doctor
    doctor = Doctor(
        name=doctor_in.name,
        email=doctor_in.email,
        id_card_number=doctor_in.id_card_number,
        hashed_password=get_password_hash(doctor_in.password),
    )
    db.add(doctor)
    db.commit()
    db.refresh(doctor)

    return {
        "message": "Doctor registered successfully",
        "doctor_id": doctor.id
    }


@router.post("/login", response_model=Token)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    # Find doctor by email
    doctor = db.query(Doctor).filter(Doctor.email == login_data.email).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify password
    if not verify_password(login_data.password, doctor.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if doctor is active
    if not doctor.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive doctor",
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=doctor.id, expires_delta=access_token_expires
    )

    # Return token and doctor info
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # in seconds
        "doctor_info": doctor
    }


@router.post("/login/oauth", response_model=Token)
def login_oauth(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """
    OAuth2 compatible token login for third-party clients.
    """
    # Find doctor by email
    doctor = db.query(Doctor).filter(Doctor.email == form_data.username).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Verify password
    if not verify_password(form_data.password, doctor.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if doctor is active
    if not doctor.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive doctor",
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=doctor.id, expires_delta=access_token_expires
    )

    # Return token and doctor info
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # in seconds
        "doctor_info": doctor
    }


@router.get("/me", response_model=DoctorResponse)
def read_current_doctor(
    current_doctor: Doctor = Depends(get_current_doctor),
) -> Any:
    """
    Get current doctor information.
    """
    return current_doctor
