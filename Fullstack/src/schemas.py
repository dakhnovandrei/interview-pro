import enum
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str = Field(..., min_length=6, max_length=72)


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str


class RegResponse(BaseModel):
    user_id: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class AnalysisBase(BaseModel):
    analysis_id: int
    original_image_url: str
    processed_image_url: Optional[str]
    status: str
    created_at: datetime
    processing_time: Optional[float]
    detections_summary: Optional[Dict[str, Any]]


class AnalysisList(BaseModel):
    analyses: List[AnalysisBase]
    total: int


class UserResponse(BaseModel):
    user_id: int
    email: EmailStr
    username: str
    created_at: datetime
    subscription_type: str
    role: Optional[str] = None
    photo_url: Optional[str] = None


class InterviewRequest(BaseModel):
    interview_type: str
    job_position: str
    company: str
    template_id: Optional[int] = None


class InterviewCreate(BaseModel):
    name: Optional[str] = None
    job_position: str
    company: Optional[str] = None
    interview_type: str
    is_template: Optional[bool] = False
    description: Optional[str] = None


class InterviewUpdate(BaseModel):
    name: Optional[str] = None
    job_position: Optional[str] = None
    company: Optional[str] = None
    interview_type: Optional[str] = None
    is_template: Optional[bool] = None
    description: Optional[str] = None


class InterviewSessionResponse(BaseModel):
    session_id: int
    message: str


class UserRoles(enum.Enum):
    GUEST = 'guest'
    CANDIDATE = 'candidate'
    INTERVIEWER = 'interviewer'
    RECRUITER = 'recruiter'
    HR = 'hr'
    MODERATOR = 'moderator'
    ADMIN = 'admin'
    SUPERADMIN = 'superadmin'


class InterviewResponse(BaseModel):
    id: int
    name: Optional[str] = None
    job_position: str
    company: Optional[str] = None
    interview_type: str
    owner_id: Optional[int] = None
    is_template: bool
    description: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class AssignRoleRequest(BaseModel):
    user_id: int
    role: UserRoles


class RoleAssignmentResponse(BaseModel):
    message: str
    user_id: int
    new_role: str
    assigned_by: str


class PaginatedInterviewsResponse(BaseModel):
    items: List[InterviewResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PhotoUploadResponse(BaseModel):
    message: str
    photo_url: str
    user_id: int


class PhotoDeleteResponse(BaseModel):
    message: str
    user_id: int
