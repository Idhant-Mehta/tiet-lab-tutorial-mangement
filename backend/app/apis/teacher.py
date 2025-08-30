
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List
from ..db import models, schemas
from ..db.database import get_db
from ..core.security import require_teacher
from ..services.ai_service import get_ai_service

router = APIRouter()

@router.get("/dashboard", response_model=schemas.DashboardStats)
def get_teacher_dashboard(
    current_user: models.User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """Get teacher dashboard statistics."""
    # Get teacher's assignments count
    total_assignments = db.query(models.Assignment).filter(
        models.Assignment.teacher_id == current_user.id
    ).count()
    
    # Get total submissions for teacher's assignments
    total_submissions = db.query(models.Submission).join(
        models.Problem
    ).join(models.Assignment).filter(
        models.Assignment.teacher_id == current_user.id
    ).count()
    
    # Get unique students who submitted
    total_students = db.query(func.count(func.distinct(models.Submission.student_id))).join(
        models.Problem
    ).join(models.Assignment).filter(
        models.Assignment.teacher_id == current_user.id
    ).scalar()
    
    # Get recent activity (last 10 submissions)
    recent_submissions = db.query(
        models.Submission, models.Problem, models.Assignment, models.User
    ).join(models.Problem).join(models.Assignment).join(
        models.User, models.Submission.student_id == models.User.id
    ).filter(
        models.Assignment.teacher_id == current_user.id
    ).order_by(desc(models.Submission.submitted_at)).limit(10).all()
    
    recent_activity = [
        {
            "type": "submission",
            "student_name": submission.User.username,
            "problem_title": submission.Problem.title,
            "assignment_title": submission.Assignment.title,
            "status": submission.Submission.status.value,
            "submitted_at": submission.Submission.submitted_at.isoformat()
        }
        for submission in recent_submissions
    ]
    
    return schemas.DashboardStats(
        total_assignments=total_assignments,
        total_submissions=total_submissions,
        total_students=total_students or 0,
        recent_activity=recent_activity
    )

@router.post("/assignments/generate", response_model=schemas.Assignment)
async def generate_assignment(
    request: schemas.AIGenerateRequest,
    current_user: models.User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """Generate an assignment using AI."""
    # Acquire AI service lazily
    ai_service = get_ai_service()
    if ai_service is None:
        raise HTTPException(status_code=503, detail="AI service not configured. Set OPENAI_API_KEY in environment to enable this feature.")

    try:
        # Generate problems using AI
        ai_problems = await ai_service.generate_programming_problems(
            topic=request.topic,
            difficulty_distribution=request.difficulty_distribution
        )
        
        if not ai_problems:
            raise HTTPException(
                status_code=500,
                detail="Failed to generate problems with AI"
            )
        
        # Create assignment
        assignment = models.Assignment(
            title=f"AI Generated Assignment - {request.topic}",
            description=f"Auto-generated assignment covering {request.topic} concepts",
            teacher_id=current_user.id
        )
        db.add(assignment)
        db.flush()  # Get assignment ID
        
        # Create problems and test cases
        for i, ai_problem in enumerate(ai_problems):
            problem = models.Problem(
                assignment_id=assignment.id,
                title=ai_problem.title,
                problem_statement=ai_problem.problem_statement,
                input_format=ai_problem.input_format,
                output_format=ai_problem.output_format,
                constraints=ai_problem.constraints,
                sample_input=ai_problem.sample_input,
                sample_output=ai_problem.sample_output,
                difficulty=ai_problem.difficulty,
                order_index=i + 1
            )
            db.add(problem)
            db.flush()  # Get problem ID
            
            # Create sample test case
            test_case = models.TestCase(
                problem_id=problem.id,
                input_data=ai_problem.sample_input,
                expected_output=ai_problem.sample_output,
                is_sample=True
            )
            db.add(test_case)
        
        db.commit()
        db.refresh(assignment)
        
        return assignment
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error generating assignment: {str(e)}"
        )

@router.post("/assignments", response_model=schemas.Assignment)
def create_assignment(
    assignment: schemas.AssignmentCreate,
    current_user: models.User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """Create a new assignment manually."""
    try:
        # Create assignment
        db_assignment = models.Assignment(
            title=assignment.title,
            description=assignment.description,
            teacher_id=current_user.id
        )
        db.add(db_assignment)
        db.flush()
        
        # Create problems
        for problem_data in assignment.problems:
            problem = models.Problem(
                assignment_id=db_assignment.id,
                title=problem_data.title,
                problem_statement=problem_data.problem_statement,
                input_format=problem_data.input_format,
                output_format=problem_data.output_format,
                constraints=problem_data.constraints,
                sample_input=problem_data.sample_input,
                sample_output=problem_data.sample_output,
                difficulty=problem_data.difficulty,
                order_index=problem_data.order_index,
                time_limit=problem_data.time_limit,
                memory_limit=problem_data.memory_limit
            )
            db.add(problem)
            db.flush()
            
            # Create test cases
            for test_case_data in problem_data.test_cases:
                test_case = models.TestCase(
                    problem_id=problem.id,
                    input_data=test_case_data.input_data,
                    expected_output=test_case_data.expected_output,
                    is_sample=test_case_data.is_sample
                )
                db.add(test_case)
        
        db.commit()
        db.refresh(db_assignment)
        
        return db_assignment
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error creating assignment: {str(e)}"
        )

@router.get("/assignments", response_model=schemas.AssignmentListResponse)
def get_assignments(
    skip: int = 0,
    limit: int = 10,
    current_user: models.User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """Get teacher's assignments."""
    assignments = db.query(models.Assignment).filter(
        models.Assignment.teacher_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    total = db.query(models.Assignment).filter(
        models.Assignment.teacher_id == current_user.id
    ).count()
    
    return schemas.AssignmentListResponse(assignments=assignments, total=total)

@router.get("/assignments/{assignment_id}", response_model=schemas.Assignment)
def get_assignment(
    assignment_id: int,
    current_user: models.User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """Get specific assignment with problems."""
    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == assignment_id,
        models.Assignment.teacher_id == current_user.id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    return assignment

@router.get("/assignments/{assignment_id}/submissions", response_model=schemas.SubmissionListResponse)
def get_assignment_submissions(
    assignment_id: int,
    skip: int = 0,
    limit: int = 20,
    current_user: models.User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """Get submissions for an assignment."""
    # Verify assignment belongs to teacher
    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == assignment_id,
        models.Assignment.teacher_id == current_user.id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    # Get submissions
    submissions = db.query(models.Submission).join(
        models.Problem
    ).filter(
        models.Problem.assignment_id == assignment_id
    ).order_by(desc(models.Submission.submitted_at)).offset(skip).limit(limit).all()
    
    total = db.query(models.Submission).join(
        models.Problem
    ).filter(
        models.Problem.assignment_id == assignment_id
    ).count()
    
    return schemas.SubmissionListResponse(submissions=submissions, total=total)

@router.delete("/assignments/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    current_user: models.User = Depends(require_teacher),
    db: Session = Depends(get_db)
):
    """Delete an assignment."""
    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == assignment_id,
        models.Assignment.teacher_id == current_user.id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    db.delete(assignment)
    db.commit()
    
    return {"message": "Assignment deleted successfully"}
