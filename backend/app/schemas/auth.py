from typing import Optional
from pydantic import BaseModel, EmailStr, Field

from .doctor import DoctorResponse


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    doctor_info: DoctorResponse


class TokenPayload(BaseModel):
    """Schema for token payload"""
    sub: Optional[int] = None
    exp: Optional[int] = None


class LoginRequest(BaseModel):
    """Schema for login request"""
    email: EmailStr = Field(..., example="john.smith@example.com")
    password: str = Field(..., example="securepassword123")
