from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.orm import relationship
from datetime import datetime

from ..database import Base


class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(String(255), unique=True, nullable=False, index=True)  # OHIF image identifier
    study_instance_uid = Column(String(255), nullable=True)
    series_instance_uid = Column(String(255), nullable=True)
    sop_instance_uid = Column(String(255), nullable=True)
    patient_id = Column(String(100), nullable=True)
    study_date = Column(String(20), nullable=True)
    modality = Column(String(10), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    comments = relationship("Comment", back_populates="image")
