
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
import enum

class UserRole(str, enum.Enum):
    TEACHER = "teacher"
    STUDENT = "student"

class DifficultyLevel(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class SubmissionStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    COMPILE_ERROR = "compile_error"
    RUNTIME_ERROR = "runtime_error"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    assignments = relationship("Assignment", back_populates="teacher", foreign_keys="Assignment.teacher_id")
    submissions = relationship("Submission", back_populates="student")

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    teacher = relationship("User", back_populates="assignments", foreign_keys=[teacher_id])
    problems = relationship("Problem", back_populates="assignment", cascade="all, delete-orphan")

class Problem(Base):
    __tablename__ = "problems"

    id = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    title = Column(String, nullable=False, index=True)
    problem_statement = Column(Text, nullable=False)
    input_format = Column(Text, nullable=False)
    output_format = Column(Text, nullable=False)
    constraints = Column(Text)
    sample_input = Column(Text, nullable=False)
    sample_output = Column(Text, nullable=False)
    difficulty = Column(Enum(DifficultyLevel), nullable=False)
    order_index = Column(Integer, nullable=False)
    expected_output = Column(Text)  # For validation
    time_limit = Column(Integer, default=5)  # seconds
    memory_limit = Column(Integer, default=256)  # MB
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    assignment = relationship("Assignment", back_populates="problems")
    submissions = relationship("Submission", back_populates="problem", cascade="all, delete-orphan")
    test_cases = relationship("TestCase", back_populates="problem", cascade="all, delete-orphan")

class TestCase(Base):
    __tablename__ = "test_cases"
    
    id = Column(Integer, primary_key=True, index=True)
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=False)
    input_data = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=False)
    is_sample = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    problem = relationship("Problem", back_populates="test_cases")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    problem_id = Column(Integer, ForeignKey("problems.id"), nullable=False)
    code = Column(Text, nullable=False)
    language = Column(String, default="c")
    status = Column(Enum(SubmissionStatus), default=SubmissionStatus.PENDING)
    score = Column(Integer, default=0)
    execution_time = Column(Integer)  # milliseconds
    memory_used = Column(Integer)  # KB
    compile_error = Column(Text)
    runtime_error = Column(Text)
    ai_feedback = Column(Text)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="submissions")
    problem = relationship("Problem", back_populates="submissions")
    test_results = relationship("TestResult", back_populates="submission", cascade="all, delete-orphan")

class TestResult(Base):
    __tablename__ = "test_results"
    
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id"), nullable=False)
    test_case_id = Column(Integer, ForeignKey("test_cases.id"), nullable=False)
    passed = Column(Boolean, default=False)
    actual_output = Column(Text)
    execution_time = Column(Integer)  # milliseconds
    memory_used = Column(Integer)  # KB
    error_message = Column(Text)
    
    submission = relationship("Submission", back_populates="test_results")
    test_case = relationship("TestCase")
