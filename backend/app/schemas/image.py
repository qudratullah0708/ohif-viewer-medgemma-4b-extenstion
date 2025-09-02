from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class ImageBase(BaseModel):
    """Base Image schema with common attributes"""
    image_id: str = Field(..., description="OHIF image identifier", example="1.2.840.113619.2.5.1762583153.215519.978957063.122_0")
    study_instance_uid: Optional[str] = Field(None, description="DICOM Study Instance UID", example="1.2.840.113619.2.5.1762583153.215519.978957063.122")
    series_instance_uid: Optional[str] = Field(None, description="DICOM Series Instance UID", example="1.2.840.113619.2.5.1762583153.215519.978957063.121")
    sop_instance_uid: Optional[str] = Field(None, description="DICOM SOP Instance UID", example="1.2.840.113619.2.5.1762583153.215519.978957063.120")
    patient_id: Optional[str] = Field(None, description="Patient ID", example="PATIENT-123")
    study_date: Optional[str] = Field(None, description="Study date in YYYYMMDD format", example="20230101")
    modality: Optional[str] = Field(None, description="DICOM modality", example="CT")


class ImageCreate(ImageBase):
    """Schema for creating a new image reference"""
    pass


class ImageResponse(ImageBase):
    """Schema for image response"""
    id: int
    created_at: datetime
    comment_count: Optional[int] = 0

    class Config:
        orm_mode = True
