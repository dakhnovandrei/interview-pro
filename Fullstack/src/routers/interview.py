from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from src.database import get_db
from src.models import Interview, InterviewSessions
from src.routers.users import get_current_user
from src.schemas import (
    InterviewCreate,
    InterviewRequest,
    InterviewResponse,
    InterviewSessionResponse,
    InterviewUpdate,
    PaginatedInterviewsResponse,
    UserRoles,
)

interview_router = APIRouter()


def _user_role_value(user):
    role = getattr(user, 'role', None)
    return role.value if hasattr(role, 'value') else role


def require_roles(user, allowed_roles):
    current_role = _user_role_value(user)
    allowed_values = [role.value if hasattr(role, 'value') else role for role in allowed_roles]
    if current_role not in allowed_values:
        raise HTTPException(status_code=403, detail='Доступ запрещен для текущей роли')


def can_manage_interview(user, interview):
    current_role = _user_role_value(user)
    return (
        interview.owner_id == user.user_id
        or current_role in [UserRoles.ADMIN.value, UserRoles.SUPERADMIN.value]
    )


@interview_router.post('/start-interview', response_model=InterviewSessionResponse)
def start_interview(interview_data: InterviewRequest, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if interview_data.template_id:
        template = db.query(Interview).filter(Interview.id == interview_data.template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail='Шаблон не найден')
        job_position = template.job_position
        company = template.company
        interview_type = template.interview_type
    else:
        job_position = interview_data.job_position
        company = interview_data.company
        interview_type = interview_data.interview_type

    new_interview = InterviewSessions(
        user_id=user.user_id,
        job_position=job_position,
        company=company,
        interview_type=interview_type,
    )
    db.add(new_interview)
    db.commit()
    db.refresh(new_interview)
    return InterviewSessionResponse(
        session_id=new_interview.interview_id,
        message=f"Сессия успешно создана. Требуется редирект на /interview/{new_interview.interview_id}",
    )


@interview_router.post('/interviews')
def create_interview(data: InterviewCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if _user_role_value(user) == UserRoles.GUEST.value:
        raise HTTPException(status_code=403, detail='Доступ запрещен для текущей роли')

    int_data = data.model_dump()
    int_data['owner_id'] = user.user_id
    int_data['is_template'] = False
    new_interview = Interview(**int_data)
    db.add(new_interview)
    db.commit()
    db.refresh(new_interview)
    return new_interview


@interview_router.post('/interviews/templates')
def create_template_interview(data: InterviewCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    require_roles(user, [UserRoles.ADMIN, UserRoles.MODERATOR, UserRoles.SUPERADMIN])
    int_data = data.model_dump()
    int_data['owner_id'] = user.user_id
    int_data['is_template'] = True
    new_interview = Interview(**int_data)
    db.add(new_interview)
    db.commit()
    db.refresh(new_interview)
    return new_interview


@interview_router.post('/interviews/{interview_id}/start', response_model=InterviewSessionResponse)
def start_interview_from_template(interview_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail=f'Интервью с ID {interview_id} не найдено')
    if not interview.is_template and not can_manage_interview(user, interview):
        raise HTTPException(status_code=403, detail='Доступ запрещен к этому интервью')

    new_session = InterviewSessions(
        user_id=user.user_id,
        job_position=interview.job_position,
        company=interview.company,
        interview_type=interview.interview_type,
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return InterviewSessionResponse(
        session_id=new_session.interview_id,
        message=f"Сессия успешно создана. Требуется редирект на /interview/{new_session.interview_id}",
    )


@interview_router.patch('/interviews/{interview_id}', response_model=InterviewResponse)
def update_interview(interview_id: int, data: InterviewUpdate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail=f'Интервью с ID {interview_id} не найдено')
    if not can_manage_interview(user, interview):
        raise HTTPException(status_code=403, detail='Доступ запрещен для текущей роли')

    update_data = data.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail='Нет данных для обновления')

    for key, value in update_data.items():
        setattr(interview, key, value)
    db.commit()
    db.refresh(interview)
    return interview


@interview_router.delete('/interviews/{interview_id}')
def delete_interview(interview_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail=f'Интервью с ID {interview_id} не найдено')
    if not can_manage_interview(user, interview):
        raise HTTPException(status_code=403, detail='Доступ запрещен для текущей роли')
    db.delete(interview)
    db.commit()
    return {'message': f'Интервью с ID {interview_id} успешно удалено'}


@interview_router.get('/interviews', response_model=PaginatedInterviewsResponse)
def get_interviews(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    position: Optional[str] = None,
    company: Optional[str] = None,
    interview_type: Optional[str] = None,
    is_template: Optional[bool] = None,
    owner_id: Optional[int] = None,
    sort_by: str = Query("created_at", regex="^(created_at|updated_at|job_position|company)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Get paginated interviews with advanced filtering.
    
    Query Parameters:
    - page: Page number (default: 1)
    - page_size: Items per page (default: 10, max: 100)
    - position: Filter by job position (case-insensitive substring match)
    - company: Filter by company name (case-insensitive substring match)
    - interview_type: Filter by interview type (exact match)
    - is_template: Filter templates only (True) or non-templates (False)
    - owner_id: Filter by owner ID
    - sort_by: Sort field (created_at, updated_at, job_position, company)
    - sort_order: Sort order (asc or desc)
    - search: Search in position, company, and name fields
    """
    query = db.query(Interview)
    
    # Apply is_template filter
    if is_template is not None:
        query = query.filter(Interview.is_template == is_template)
    else:
        query = query.filter(Interview.is_template == False)  # Default: show non-templates
    
    # Apply filters
    if position:
        query = query.filter(Interview.job_position.ilike(f"%{position}%"))
    
    if company:
        query = query.filter(Interview.company.ilike(f"%{company}%"))
    
    if interview_type:
        query = query.filter(Interview.interview_type.ilike(f"%{interview_type}%"))
    
    if owner_id:
        query = query.filter(Interview.owner_id == owner_id)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Interview.job_position.ilike(search_pattern)) |
            (Interview.company.ilike(search_pattern)) |
            (Interview.name.ilike(search_pattern))
        )
    
    total = query.count()
    
    # Apply sorting
    valid_columns = {'created_at': Interview.created_at, 'updated_at': Interview.updated_at, 
                     'job_position': Interview.job_position, 'company': Interview.company}
    order_column = valid_columns.get(sort_by, Interview.created_at)
    
    if sort_order == "desc":
        query = query.order_by(order_column.desc())
    else:
        query = query.order_by(order_column.asc())
    
    # Apply pagination
    interviews = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return PaginatedInterviewsResponse(
        items=interviews,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@interview_router.get('/my-interviews', response_model=PaginatedInterviewsResponse)
def get_my_interviews(
    user=Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    position: Optional[str] = None,
    company: Optional[str] = None,
    interview_type: Optional[str] = None,
    sort_by: str = Query("created_at", regex="^(created_at|updated_at|job_position|company)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get current user's interviews with filtering and pagination."""
    query = db.query(Interview).filter(Interview.owner_id == user.user_id)
    
    if position:
        query = query.filter(Interview.job_position.ilike(f"%{position}%"))
    
    if company:
        query = query.filter(Interview.company.ilike(f"%{company}%"))
    
    if interview_type:
        query = query.filter(Interview.interview_type.ilike(f"%{interview_type}%"))
    
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Interview.job_position.ilike(search_pattern)) |
            (Interview.company.ilike(search_pattern)) |
            (Interview.name.ilike(search_pattern))
        )
    
    total = query.count()
    
    valid_columns = {'created_at': Interview.created_at, 'updated_at': Interview.updated_at, 
                     'job_position': Interview.job_position, 'company': Interview.company}
    order_column = valid_columns.get(sort_by, Interview.created_at)
    
    if sort_order == "desc":
        query = query.order_by(order_column.desc())
    else:
        query = query.order_by(order_column.asc())
    
    interviews = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return PaginatedInterviewsResponse(
        items=interviews,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size,
    )


@interview_router.get('/recent-interviews')
def get_recent_interviews(user=Depends(get_current_user), db: Session = Depends(get_db), limit: int = Query(3, ge=1, le=10)):
    recent = db.query(InterviewSessions).filter(
        InterviewSessions.user_id == user.user_id,
        InterviewSessions.finished_at.isnot(None),
    ).order_by(InterviewSessions.finished_at.desc()).limit(limit).all()
    return [
        {
            'session_id': item.interview_id,
            'job_position': item.job_position,
            'company': item.company,
            'interview_type': item.interview_type,
            'finished_at': item.finished_at,
            'feedback': item.feedback,
            'status': item.status,
        }
        for item in recent
    ]


@interview_router.get('/ready-templates')
def get_ready_templates(db: Session = Depends(get_db), limit: int = Query(3, ge=1, le=10)):
    templates = db.query(Interview).filter(Interview.is_template == True).order_by(Interview.created_at.desc()).limit(limit).all()
    return [
        {
            'id': item.id,
            'name': item.name,
            'job_position': item.job_position,
            'company': item.company,
            'interview_type': item.interview_type,
            'description': item.description,
            'created_at': item.created_at,
        }
        for item in templates
    ]
