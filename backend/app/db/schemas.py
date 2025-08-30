
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    TEACHER = "teacher"
    STUDENT = "student"

class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class SubmissionStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    COMPILE_ERROR = "compile_error"
    RUNTIME_ERROR = "runtime_error"

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Test Case Schemas
class TestCaseBase(BaseModel):
    input_data: str
    expected_output: str
    is_sample: bool = False

class TestCaseCreate(TestCaseBase):
    pass

class TestCase(TestCaseBase):
    id: int
    problem_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Problem Schemas
class ProblemBase(BaseModel):
    title: str
    problem_statement: str
    input_format: str
    output_format: str
    constraints: Optional[str] = None
    sample_input: str
    sample_output: str
    difficulty: DifficultyLevel
    time_limit: int = 5
    memory_limit: int = 256

class ProblemCreate(ProblemBase):
    order_index: int
    test_cases: Optional[List[TestCaseCreate]] = []

class Problem(ProblemBase):
    id: int
    assignment_id: int
    order_index: int
    created_at: datetime
    test_cases: List[TestCase] = []

    class Config:
        from_attributes = True

# Assignment Schemas
class AssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None

class AssignmentCreate(AssignmentBase):
    problems: List[ProblemCreate] = []

class Assignment(AssignmentBase):
    id: int
    teacher_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    problems: List[Problem] = []
    teacher: Optional[User] = None

    class Config:
        from_attributes = True

# Test Result Schemas
class TestResultBase(BaseModel):
    passed: bool
    actual_output: Optional[str] = None
    execution_time: Optional[int] = None
    memory_used: Optional[int] = None
    error_message: Optional[str] = None

class TestResult(TestResultBase):
    id: int
    submission_id: int
    test_case_id: int
    test_case: Optional[TestCase] = None

    class Config:
        from_attributes = True

# Submission Schemas
class SubmissionBase(BaseModel):
    code: str
    language: str = "c"

class SubmissionCreate(SubmissionBase):
    problem_id: int

class Submission(SubmissionBase):
    id: int
    student_id: int
    problem_id: int
    status: SubmissionStatus
    score: int
    execution_time: Optional[int] = None
    memory_used: Optional[int] = None
    compile_error: Optional[str] = None
    runtime_error: Optional[str] = None
    ai_feedback: Optional[str] = None
    submitted_at: datetime
    test_results: List[TestResult] = []
    problem: Optional[Problem] = None

    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# AI Generated Problem Schema
class AIGeneratedProblem(BaseModel):
    title: str
    problem_statement: str
    input_format: str
    output_format: str
    constraints: str
    sample_input: str
    sample_output: str
    difficulty: DifficultyLevel

class AIGenerateRequest(BaseModel):
    topic: Optional[str] = "general programming"
    difficulty_distribution: Optional[dict] = {"easy": 7, "medium": 6, "hard": 2}

# Response Schemas
class AssignmentListResponse(BaseModel):
    assignments: List[Assignment]
    total: int

class SubmissionListResponse(BaseModel):
    submissions: List[Submission]
    total: int

class DashboardStats(BaseModel):
    total_assignments: int
    total_submissions: int
    total_students: int
    recent_activity: List[dict]
