from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..core.dependencies import get_current_active_doctor
from ..database import get_db
from ..models.doctor import Doctor
from ..schemas.doctor import DoctorResponse, DoctorUpdate

router = APIRouter()


@router.get("/", response_model=List[DoctorResponse])
def get_doctors(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_doctor: Doctor = Depends(get_current_active_doctor),
) -> Any:
    """
    Get all doctors.
    Only accessible to authenticated doctors.
    """
    doctors = db.query(Doctor).offset(skip).limit(limit).all()
    return doctors


@router.get("/{doctor_id}", response_model=DoctorResponse)
def get_doctor(
    doctor_id: int,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor),
) -> Any:
    """
    Get a specific doctor by ID.
    Only accessible to authenticated doctors.
    """
    doctor = db.query(Doctor).filter(Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor not found",
        )
    return doctor


@router.get("/me/", response_model=DoctorResponse)
def get_my_info(
    current_doctor: Doctor = Depends(get_current_active_doctor),
) -> Any:
    """
    Get current doctor's information.
    """
    return current_doctor


@router.put("/me/", response_model=DoctorResponse)
def update_my_info(
    doctor_update: DoctorUpdate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor),
) -> Any:
    """
    Update current doctor's information.
    """
    # Check if email is being updated and already exists
    if doctor_update.email and doctor_update.email != current_doctor.email:
        doctor_with_email = db.query(Doctor).filter(Doctor.email == doctor_update.email).first()
        if doctor_with_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

    # Update doctor fields
    for field, value in doctor_update.dict(exclude_unset=True).items():
        setattr(current_doctor, field, value)

    db.add(current_doctor)
    db.commit()
    db.refresh(current_doctor)
    return current_doctor


@router.put("/{doctor_id}", response_model=DoctorResponse)
def update_doctor(
    doctor_id: int,
    doctor_update: DoctorUpdate,
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor),
) -> Any:
    """
    Update a doctor's information.
    Only accessible to the doctor themselves.
    """
    # Only allow doctors to update their own information
    if current_doctor.id != doctor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions to update another doctor's information",
        )

    # Check if email is being updated and already exists
    if doctor_update.email and doctor_update.email != current_doctor.email:
        doctor_with_email = db.query(Doctor).filter(Doctor.email == doctor_update.email).first()
        if doctor_with_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )

    # Update doctor fields
    for field, value in doctor_update.dict(exclude_unset=True).items():
        setattr(current_doctor, field, value)

    db.add(current_doctor)
    db.commit()
    db.refresh(current_doctor)
    return current_doctor


@router.get("/stats/", response_model=dict)
def get_doctor_stats(
    db: Session = Depends(get_db),
    current_doctor: Doctor = Depends(get_current_active_doctor),
) -> Any:
    """
    Get statistics about doctors.
    Only accessible to authenticated doctors.
    """
    total_doctors = db.query(Doctor).count()
    active_doctors = db.query(Doctor).filter(Doctor.is_active == True).count()

    return {
        "total_doctors": total_doctors,
        "active_doctors": active_doctors,
    }
