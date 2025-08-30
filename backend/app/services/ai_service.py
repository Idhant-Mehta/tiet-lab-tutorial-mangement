import openai
import json
from typing import List, Dict
from ..core.config import settings
from ..db.schemas import AIGeneratedProblem, DifficultyLevel


class AIService:
    def __init__(self, api_key: str):
        # Deliberately do not crash on import if API key is missing.
        # Store provided key and set it on the openai module when used.
        self.api_key = api_key or ""
        if self.api_key:
            openai.api_key = self.api_key

    async def generate_programming_problems(self, topic: str = "general programming", 
                                          difficulty_distribution: Dict[str, int] = None) -> List[AIGeneratedProblem]:
        """
        Generate programming problems using OpenAI GPT.
        
        Args:
            topic: Topic for problems (e.g., "arrays", "loops", "general programming")
            difficulty_distribution: Dict with difficulty levels and counts
            
        Returns:
            List of generated problems
        """
        if difficulty_distribution is None:
            difficulty_distribution = {"easy": 7, "medium": 6, "hard": 2}
        
        total_problems = sum(difficulty_distribution.values())
        
        prompt = f"""
        Generate {total_problems} C programming problems for educational purposes with the following distribution:
        - Easy: {difficulty_distribution.get('easy', 0)} problems
        - Medium: {difficulty_distribution.get('medium', 0)} problems  
        - Hard: {difficulty_distribution.get('hard', 0)} problems

        Topic focus: {topic}

        For each problem, provide the following in JSON format:
        {{
            "title": "Problem Title",
            "problem_statement": "Clear problem description",
            "input_format": "Description of input format",
            "output_format": "Description of output format", 
            "constraints": "Problem constraints",
            "sample_input": "Sample input data",
            "sample_output": "Expected output for sample input",
            "difficulty": "easy|medium|hard"
        }}

        Requirements:
        1. Problems should be suitable for C programming
        2. Each problem should be self-contained and clear
        3. Include appropriate constraints and edge cases
        4. Sample inputs/outputs should be correct and helpful
        5. Difficulty should match the specified level
        6. Focus on fundamental programming concepts like loops, arrays, strings, functions

        Return ONLY a valid JSON array of problems, no additional text.
        """

        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are an expert programming instructor who creates clear, educational C programming problems."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=4000,
                temperature=0.7
            )
            
            content = response.choices[0].message.content.strip()
            
            # Parse JSON response
            try:
                problems_data = json.loads(content)
                problems = []
                
                for problem_data in problems_data:
                    # Validate and create problem objects
                    try:
                        problem = AIGeneratedProblem(
                            title=problem_data["title"],
                            problem_statement=problem_data["problem_statement"],
                            input_format=problem_data["input_format"],
                            output_format=problem_data["output_format"],
                            constraints=problem_data["constraints"],
                            sample_input=problem_data["sample_input"],
                            sample_output=problem_data["sample_output"],
                            difficulty=DifficultyLevel(problem_data["difficulty"])
                        )
                        problems.append(problem)
                    except Exception as e:
                        print(f"Error creating problem: {e}")
                        continue
                
                return problems
                
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}")
                print(f"Response content: {content}")
                return []
                
        except Exception as e:
            print(f"Error generating problems with AI: {e}")
            return []

    async def analyze_code_submission(self, code: str, problem_statement: str, test_results: List[Dict]) -> str:
        """
        Analyze student code submission and provide feedback.
        
        Args:
            code: Student's C code
            problem_statement: Original problem description
            test_results: Results from test case execution
            
        Returns:
            AI-generated feedback string
        """
        
        # Determine overall performance
        total_tests = len(test_results)
        passed_tests = sum(1 for result in test_results if result.get("passed", False))
        
        prompt = f"""
        Analyze the following C code submission and provide constructive feedback.

        Problem Statement:
        {problem_statement}

        Student's Code:
        {code}

        Test Results:
        - Total test cases: {total_tests}
        - Passed: {passed_tests}
        - Failed: {total_tests - passed_tests}

        Test Case Details:
        {json.dumps(test_results, indent=2)}

        Please provide:
        1. Brief assessment of the solution approach
        2. Specific issues identified (if any)
        3. Suggestions for improvement
        4. Positive aspects of the code (if any)
        5. Code quality feedback (style, efficiency, clarity)

        Keep the feedback concise, educational, and encouraging. Focus on helping the student learn.
        """

        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful programming tutor providing constructive feedback on C programming assignments."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=1000,
                temperature=0.3
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"Error generating AI feedback: {e}")
            return "Unable to generate feedback at this time. Please review your code and test results."

def get_ai_service() -> AIService | None:
    """Return an AIService instance if OPENAI_API_KEY is configured, otherwise None.

    This avoids creating a global instance that may fail during import when
    environment is not configured (for example in CI or local dev without a key).
    """
    api_key = settings.OPENAI_API_KEY
    if not api_key:
        # Return a lightweight mock service when an API key is not configured.
        # This lets the application remain functional for local testing and demos.
        class MockAIService:
            async def generate_programming_problems(self, topic: str = "general programming", difficulty_distribution: dict = None):
                # generate simple stub problems
                if difficulty_distribution is None:
                    difficulty_distribution = {"easy": 2, "medium": 1, "hard": 0}
                problems = []
                idx = 1
                for level, count in difficulty_distribution.items():
                    for i in range(count):
                        problems.append(AIGeneratedProblem(
                            title=f"Mock {level.title()} Problem {idx}",
                            problem_statement=f"Write a C program that demonstrates {topic} (mock).",
                            input_format="None",
                            output_format="Print to stdout",
                            constraints="Time limit: 1s, Memory: 64MB",
                            sample_input="",
                            sample_output="(no output)",
                            difficulty=DifficultyLevel(level)
                        ))
                        idx += 1
                return problems

            async def analyze_code_submission(self, code: str, problem_statement: str, test_results: list) -> str:
                passed = sum(1 for r in test_results if r.get('passed'))
                total = len(test_results)
                return (
                    f"Mock analysis: Passed {passed}/{total} tests.\n"
                    "Suggestions: Ensure edge cases and input parsing are handled."
                )

        return MockAIService()

    return AIService(api_key=api_key)
