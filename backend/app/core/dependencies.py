from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from .security import get_current_doctor
from ..models.doctor import Doctor

def get_current_active_doctor(
    current_doctor: Doctor = Depends(get_current_doctor),
) -> Doctor:
    """
    Get the current active doctor.
    Raises an HTTPException if the doctor is not active.
    """
    if not current_doctor.is_active:
        raise HTTPException(status_code=400, detail="Inactive doctor")
    return current_doctor
