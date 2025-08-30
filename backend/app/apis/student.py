from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from ..db import models, schemas
from ..db.database import get_db
from ..core.security import require_student
from ..services.code_execution import get_code_executor
from ..services.ai_service import get_ai_service

router = APIRouter()

@router.get("/dashboard", response_model=schemas.DashboardStats)
def get_student_dashboard(
    current_user: models.User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """Get student dashboard statistics."""
    # Get available assignments count
    total_assignments = db.query(models.Assignment).filter(
        models.Assignment.is_active == True
    ).count()
    
    # Get student's submissions count
    total_submissions = db.query(models.Submission).filter(
        models.Submission.student_id == current_user.id
    ).count()
    
    # Get accepted submissions count
    accepted_submissions = db.query(models.Submission).filter(
        models.Submission.student_id == current_user.id,
        models.Submission.status == models.SubmissionStatus.ACCEPTED
    ).count()
    
    # Get recent submissions
    recent_submissions = db.query(
        models.Submission, models.Problem, models.Assignment
    ).join(models.Problem).join(models.Assignment).filter(
        models.Submission.student_id == current_user.id
    ).order_by(desc(models.Submission.submitted_at)).limit(10).all()
    
    recent_activity = [
        {
            "type": "submission",
            "problem_title": submission.Problem.title,
            "assignment_title": submission.Assignment.title,
            "status": submission.Submission.status.value,
            "score": submission.Submission.score,
            "submitted_at": submission.Submission.submitted_at.isoformat()
        }
        for submission in recent_submissions
    ]
    
    return schemas.DashboardStats(
        total_assignments=total_assignments,
        total_submissions=total_submissions,
        total_students=accepted_submissions,  # Using as accepted count
        recent_activity=recent_activity
    )

@router.get("/assignments", response_model=schemas.AssignmentListResponse)
def get_available_assignments(
    skip: int = 0,
    limit: int = 10,
    current_user: models.User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """Get available assignments for students."""
    assignments = db.query(models.Assignment).filter(
        models.Assignment.is_active == True
    ).offset(skip).limit(limit).all()
    
    total = db.query(models.Assignment).filter(
        models.Assignment.is_active == True
    ).count()
    
    return schemas.AssignmentListResponse(assignments=assignments, total=total)

@router.get("/assignments/{assignment_id}", response_model=schemas.Assignment)
def get_assignment(
    assignment_id: int,
    current_user: models.User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """Get specific assignment with problems."""
    assignment = db.query(models.Assignment).filter(
        models.Assignment.id == assignment_id,
        models.Assignment.is_active == True
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    return assignment

@router.get("/problems/{problem_id}", response_model=schemas.Problem)
def get_problem(
    problem_id: int,
    current_user: models.User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """Get specific problem details."""
    problem = db.query(models.Problem).join(models.Assignment).filter(
        models.Problem.id == problem_id,
        models.Assignment.is_active == True
    ).first()
    
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    return problem

@router.post("/submissions", response_model=schemas.Submission)
async def submit_code(
    submission: schemas.SubmissionCreate,
    current_user: models.User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """Submit code for a problem."""
    try:
        # Verify problem exists and is active
        problem = db.query(models.Problem).join(models.Assignment).filter(
            models.Problem.id == submission.problem_id,
            models.Assignment.is_active == True
        ).first()
        
        if not problem:
            raise HTTPException(status_code=404, detail="Problem not found")
        
        # Create submission record
        db_submission = models.Submission(
            student_id=current_user.id,
            problem_id=submission.problem_id,
            code=submission.code,
            language=submission.language,
            status=models.SubmissionStatus.PENDING
        )
        db.add(db_submission)
        db.flush()  # Get submission ID
        
        # Get test cases
        test_cases = db.query(models.TestCase).filter(
            models.TestCase.problem_id == submission.problem_id
        ).all()
        
        if not test_cases:
            # Create a basic test case from sample I/O if none exist
            test_cases = [{
                "id": 0,
                "input_data": problem.sample_input,
                "expected_output": problem.sample_output
            }]
        else:
            test_cases = [{
                "id": tc.id,
                "input_data": tc.input_data,
                "expected_output": tc.expected_output
            } for tc in test_cases]
        
        # Execute code against test cases
        execution_results = get_code_executor().run_test_cases(
            code=submission.code,
            test_cases=test_cases,
            time_limit=problem.time_limit,
            memory_limit=problem.memory_limit
        )
        
        # Update submission based on results
        passed_tests = sum(1 for result in execution_results if result["passed"])
        total_tests = len(execution_results)
        score = int((passed_tests / total_tests) * 100) if total_tests > 0 else 0
        
        # Determine status
        if passed_tests == total_tests:
            status = models.SubmissionStatus.ACCEPTED
        elif any(result["status"] == "compile_error" for result in execution_results):
            status = models.SubmissionStatus.COMPILE_ERROR
            db_submission.compile_error = execution_results[0]["error"]
        elif any(result["status"] == "runtime_error" for result in execution_results):
            status = models.SubmissionStatus.RUNTIME_ERROR
            db_submission.runtime_error = execution_results[0]["error"]
        else:
            status = models.SubmissionStatus.REJECTED
        
        db_submission.status = status
        db_submission.score = score
        
        # Store test results
        for result in execution_results:
            if result["test_case_id"] != 0:  # Only for real test cases
                test_result = models.TestResult(
                    submission_id=db_submission.id,
                    test_case_id=result["test_case_id"],
                    passed=result["passed"],
                    actual_output=result["actual_output"],
                    execution_time=result["execution_time"],
                    memory_used=result["memory_used"],
                    error_message=result.get("error")
                )
                db.add(test_result)
        
        # Generate AI feedback if enabled
        try:
            ai_service = get_ai_service()
            if ai_service is None:
                db_submission.ai_feedback = "AI feedback not available (OPENAI_API_KEY not configured)."
            else:
                ai_feedback = await ai_service.analyze_code_submission(
                    code=submission.code,
                    problem_statement=problem.problem_statement,
                    test_results=execution_results
                )
                db_submission.ai_feedback = ai_feedback
        except Exception as e:
            print(f"Error generating AI feedback: {e}")
        
        db.commit()
        db.refresh(db_submission)
        
        return db_submission
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error processing submission: {str(e)}"
        )

@router.get("/submissions", response_model=schemas.SubmissionListResponse)
def get_my_submissions(
    skip: int = 0,
    limit: int = 20,
    current_user: models.User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """Get student's submissions."""
    submissions = db.query(models.Submission).filter(
        models.Submission.student_id == current_user.id
    ).order_by(desc(models.Submission.submitted_at)).offset(skip).limit(limit).all()
    
    total = db.query(models.Submission).filter(
        models.Submission.student_id == current_user.id
    ).count()
    
    return schemas.SubmissionListResponse(submissions=submissions, total=total)

@router.get("/submissions/{submission_id}", response_model=schemas.Submission)
def get_submission(
    submission_id: int,
    current_user: models.User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """Get specific submission details."""
    submission = db.query(models.Submission).filter(
        models.Submission.id == submission_id,
        models.Submission.student_id == current_user.id
    ).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    return submission

@router.get("/problems/{problem_id}/submissions", response_model=List[schemas.Submission])
def get_problem_submissions(
    problem_id: int,
    current_user: models.User = Depends(require_student),
    db: Session = Depends(get_db)
):
    """Get student's submissions for a specific problem."""
    submissions = db.query(models.Submission).filter(
        models.Submission.problem_id == problem_id,
        models.Submission.student_id == current_user.id
    ).order_by(desc(models.Submission.submitted_at)).all()
    
    return submissions
