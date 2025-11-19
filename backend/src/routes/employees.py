"""
Employee management endpoints (for future HR platform)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from pydantic import BaseModel, EmailStr
from datetime import datetime

from src.database import get_db
from src.models import Employee

router = APIRouter()


# Pydantic schemas
class EmployeeBase(BaseModel):
    employee_id: str
    email: EmailStr
    first_name: str
    last_name: str
    department: str | None = None
    position: str | None = None
    phone: str | None = None
    address: str | None = None


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeResponse(EmployeeBase):
    id: int
    is_active: bool
    hire_date: datetime
    created_at: datetime
    updated_at: datetime | None = None
    
    class Config:
        from_attributes = True


# Endpoints (commented out for now - uncomment when ready to use)

# @router.post("/employees", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
# async def create_employee(
#     employee: EmployeeCreate,
#     db: AsyncSession = Depends(get_db)
# ):
#     """Create a new employee"""
#     db_employee = Employee(**employee.dict())
#     db.add(db_employee)
#     await db.commit()
#     await db.refresh(db_employee)
#     return db_employee


# @router.get("/employees", response_model=List[EmployeeResponse])
# async def list_employees(
#     skip: int = 0,
#     limit: int = 100,
#     db: AsyncSession = Depends(get_db)
# ):
#     """List all employees"""
#     result = await db.execute(
#         select(Employee)
#         .offset(skip)
#         .limit(limit)
#     )
#     employees = result.scalars().all()
#     return employees


# @router.get("/employees/{employee_id}", response_model=EmployeeResponse)
# async def get_employee(
#     employee_id: int,
#     db: AsyncSession = Depends(get_db)
# ):
#     """Get employee by ID"""
#     result = await db.execute(
#         select(Employee).where(Employee.id == employee_id)
#     )
#     employee = result.scalar_one_or_none()
#     
#     if not employee:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Employee not found"
#         )
#     
#     return employee



