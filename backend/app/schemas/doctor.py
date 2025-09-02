from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class DoctorBase(BaseModel):
    """Base Doctor schema with common attributes"""
    name: str = Field(..., example="Dr. John Smith")
    email: EmailStr = Field(..., example="john.smith@example.com")


class DoctorCreate(DoctorBase):
    """Schema for creating a new doctor"""
    id_card_number: str = Field(..., example="12345678")
    password: str = Field(..., min_length=8, example="securepassword123")


class DoctorUpdate(BaseModel):
    """Schema for updating a doctor"""
    name: Optional[str] = Field(None, example="Dr. John Smith")
    email: Optional[EmailStr] = Field(None, example="john.smith@example.com")


class DoctorInDB(DoctorBase):
    """Schema for doctor in database"""
    id: int
    id_card_number: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class DoctorResponse(BaseModel):
    """Schema for doctor response"""
    id: int
    name: str
    email: EmailStr
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True
