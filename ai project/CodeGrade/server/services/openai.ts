import OpenAI from "openai";
import { Problem } from "@shared/schema";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
}) : null;

// Built-in AI service for generating programming problems without external APIs
function generateSampleProblems(topic: string, difficulty: { easy: number; medium: number; hard: number }): Problem[] {
  const problems: Problem[] = [];
  
  const problemTemplates = {
    easy: [
      {
        title: "Hello World Program",
        description: "Write a C program that prints 'Hello, World!' to the console.",
        inputFormat: "No input required.",
        outputFormat: "Print 'Hello, World!' followed by a newline.",
        constraints: "None",
        sampleInput: "",
        sampleOutput: "Hello, World!",
        testCases: [
          { input: "", expectedOutput: "Hello, World!" }
        ]
      },
      {
        title: "Sum of Two Numbers",
        description: "Write a C program that reads two integers and prints their sum.",
        inputFormat: "Two integers a and b separated by a space.",
        outputFormat: "Print the sum of a and b.",
        constraints: "1 ≤ a, b ≤ 1000",
        sampleInput: "5 3",
        sampleOutput: "8",
        testCases: [
          { input: "5 3", expectedOutput: "8" },
          { input: "10 20", expectedOutput: "30" },
          { input: "1 1", expectedOutput: "2" }
        ]
      },
      {
        title: "Even or Odd",
        description: "Write a C program that checks if a number is even or odd.",
        inputFormat: "A single integer n.",
        outputFormat: "Print 'Even' if n is even, 'Odd' if n is odd.",
        constraints: "1 ≤ n ≤ 1000",
        sampleInput: "4",
        sampleOutput: "Even",
        testCases: [
          { input: "4", expectedOutput: "Even" },
          { input: "7", expectedOutput: "Odd" },
          { input: "100", expectedOutput: "Even" }
        ]
      }
    ],
    medium: [
      {
        title: "Factorial Calculator",
        description: "Write a C program to calculate the factorial of a given number using iteration.",
        inputFormat: "A single integer n.",
        outputFormat: "Print the factorial of n.",
        constraints: "0 ≤ n ≤ 10",
        sampleInput: "5",
        sampleOutput: "120",
        testCases: [
          { input: "5", expectedOutput: "120" },
          { input: "0", expectedOutput: "1" },
          { input: "3", expectedOutput: "6" }
        ]
      },
      {
        title: "Array Sum",
        description: "Write a C program that calculates the sum of all elements in an array.",
        inputFormat: "First line contains n (size of array). Second line contains n integers.",
        outputFormat: "Print the sum of all elements.",
        constraints: "1 ≤ n ≤ 100, 1 ≤ arr[i] ≤ 1000",
        sampleInput: "5\n1 2 3 4 5",
        sampleOutput: "15",
        testCases: [
          { input: "5\n1 2 3 4 5", expectedOutput: "15" },
          { input: "3\n10 20 30", expectedOutput: "60" },
          { input: "1\n42", expectedOutput: "42" }
        ]
      }
    ],
    hard: [
      {
        title: "Prime Number Check",
        description: "Write a C program to check if a given number is prime. Use efficient algorithm.",
        inputFormat: "A single integer n.",
        outputFormat: "Print 'Prime' if n is prime, 'Not Prime' otherwise.",
        constraints: "2 ≤ n ≤ 10000",
        sampleInput: "17",
        sampleOutput: "Prime",
        testCases: [
          { input: "17", expectedOutput: "Prime" },
          { input: "4", expectedOutput: "Not Prime" },
          { input: "2", expectedOutput: "Prime" }
        ]
      },
      {
        title: "Binary Search Implementation",
        description: "Implement binary search algorithm to find an element in a sorted array.",
        inputFormat: "First line: n (array size), target. Second line: n sorted integers.",
        outputFormat: "Print the index of target (0-based) or -1 if not found.",
        constraints: "1 ≤ n ≤ 1000, elements are sorted in ascending order",
        sampleInput: "5 7\n1 3 5 7 9",
        sampleOutput: "3",
        testCases: [
          { input: "5 7\n1 3 5 7 9", expectedOutput: "3" },
          { input: "5 6\n1 3 5 7 9", expectedOutput: "-1" },
          { input: "3 1\n1 2 3", expectedOutput: "0" }
        ]
      }
    ]
  };

  let problemId = 1;

  // Generate easy problems
  for (let i = 0; i < difficulty.easy; i++) {
    const template = problemTemplates.easy[i % problemTemplates.easy.length];
    problems.push({
      id: `problem_${problemId++}`,
      title: `${topic} - ${template.title}`,
      description: template.description,
      inputFormat: template.inputFormat,
      outputFormat: template.outputFormat,
      constraints: template.constraints,
      sampleInput: template.sampleInput,
      sampleOutput: template.sampleOutput,
      difficulty: "easy" as const,
      timeLimit: 1,
      memoryLimit: 64,
      testCases: template.testCases
    });
  }

  // Generate medium problems
  for (let i = 0; i < difficulty.medium; i++) {
    const template = problemTemplates.medium[i % problemTemplates.medium.length];
    problems.push({
      id: `problem_${problemId++}`,
      title: `${topic} - ${template.title}`,
      description: template.description,
      inputFormat: template.inputFormat,
      outputFormat: template.outputFormat,
      constraints: template.constraints,
      sampleInput: template.sampleInput,
      sampleOutput: template.sampleOutput,
      difficulty: "medium" as const,
      timeLimit: 2,
      memoryLimit: 128,
      testCases: template.testCases
    });
  }

  // Generate hard problems
  for (let i = 0; i < difficulty.hard; i++) {
    const template = problemTemplates.hard[i % problemTemplates.hard.length];
    problems.push({
      id: `problem_${problemId++}`,
      title: `${topic} - ${template.title}`,
      description: template.description,
      inputFormat: template.inputFormat,
      outputFormat: template.outputFormat,
      constraints: template.constraints,
      sampleInput: template.sampleInput,
      sampleOutput: template.sampleOutput,
      difficulty: "hard" as const,
      timeLimit: 5,
      memoryLimit: 256,
      testCases: template.testCases
    });
  }

  return problems;
}

// Built-in code analysis without external APIs
function analyzeCodeBuiltIn(code: string, problem: Problem): {
  feedback: string;
  suggestions: string[];
  score: number;
} {
  const suggestions: string[] = [];
  let score = 60; // Base score
  let feedback = "";

  // Basic code analysis
  const hasMainFunction = code.includes("int main");
  const hasIncludeStdio = code.includes("#include <stdio.h>");
  const hasReturnStatement = code.includes("return");
  const hasComments = code.includes("//") || code.includes("/*");
  const hasPrintf = code.includes("printf");
  const hasScanf = code.includes("scanf");

  // Check for basic C structure
  if (!hasMainFunction) {
    suggestions.push("Your code should include a main function: int main()");
    score -= 20;
  } else {
    score += 10;
  }

  if (!hasIncludeStdio && (hasPrintf || hasScanf)) {
    suggestions.push("Don't forget to include #include <stdio.h> for input/output functions");
    score -= 10;
  } else if (hasIncludeStdio) {
    score += 5;
  }

  if (!hasReturnStatement && hasMainFunction) {
    suggestions.push("Your main function should return a value (usually return 0;)");
    score -= 5;
  } else if (hasReturnStatement) {
    score += 5;
  }

  // Problem-specific analysis
  if (problem.title.toLowerCase().includes("hello world")) {
    if (hasPrintf && code.includes("Hello, World!")) {
      score += 20;
      feedback = "Great! Your Hello World program looks correct. ";
    } else {
      suggestions.push("Make sure to print exactly 'Hello, World!' using printf");
      score -= 15;
    }
  } else if (problem.title.toLowerCase().includes("sum")) {
    if (hasScanf && hasPrintf) {
      score += 15;
      feedback = "Good use of input/output functions for the sum calculation. ";
    } else {
      suggestions.push("Remember to use scanf to read input and printf to display the result");
      score -= 10;
    }
  } else if (problem.title.toLowerCase().includes("factorial")) {
    if (code.includes("for") || code.includes("while")) {
      score += 15;
      feedback = "Good use of loops for factorial calculation. ";
    } else {
      suggestions.push("Consider using a loop (for or while) to calculate factorial");
      score -= 10;
    }
  } else if (problem.title.toLowerCase().includes("array")) {
    if (code.includes("[") && code.includes("]")) {
      score += 10;
      feedback = "Good use of arrays. ";
    } else {
      suggestions.push("This problem requires working with arrays - declare and use array variables");
      score -= 15;
    }
  }

  // Code quality checks
  if (hasComments) {
    suggestions.push("Great job adding comments to explain your code!");
    score += 5;
  } else {
    suggestions.push("Consider adding comments to explain your logic");
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  // Build final feedback
  if (!feedback) {
    feedback = "Your code has been analyzed. ";
  }

  if (score >= 80) {
    feedback += "Excellent work! Your solution looks well-structured.";
  } else if (score >= 60) {
    feedback += "Good effort! There are some areas for improvement.";
  } else {
    feedback += "Your code needs some work. Check the suggestions below.";
  }

  if (suggestions.length === 0) {
    suggestions.push("Your code structure looks good! Keep practicing to improve your C programming skills.");
  }

  return {
    feedback,
    suggestions,
    score
  };
}

interface GenerateAssignmentParams {
  topic: string;
  difficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  timeLimit: number; // in minutes
}

export async function generateAssignment(params: GenerateAssignmentParams): Promise<Problem[]> {
  const { topic, difficulty, timeLimit } = params;

  // Use built-in AI service if OpenAI is not available
  if (!openai) {
    console.log("Using built-in AI service for assignment generation");
    return generateSampleProblems(topic, difficulty);
  }
  
  const prompt = `Generate ${difficulty.easy + difficulty.medium + difficulty.hard} C programming problems for the topic "${topic}".

Problem distribution:
- ${difficulty.easy} Easy problems
- ${difficulty.medium} Medium problems  
- ${difficulty.hard} Hard problems

For each problem, provide:
1. A unique ID (string)
2. Title (descriptive and specific)
3. Detailed problem description
4. Input format specification
5. Output format specification
6. Constraints (ranges, limits)
7. Sample input/output pair
8. Difficulty level (easy/medium/hard)
9. Time limit in seconds (reasonable for the problem complexity)
10. Memory limit in MB (typically 64-256 MB)
11. At least 3 test cases with input and expected output

Problems should be varied in complexity within each difficulty level and focus on different aspects of the topic. Ensure problems are solvable with standard C programming techniques.

Return the response as a JSON object with a "problems" array containing all generated problems.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert C programming instructor creating educational programming assignments. Generate well-structured, educational problems that test understanding of C programming concepts."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const result = JSON.parse(response.choices[0].message.content!);
    return result.problems as Problem[];
  } catch (error) {
    throw new Error(`Failed to generate assignment: ${error.message}`);
  }
}

export async function analyzeCode(code: string, problem: Problem): Promise<{
  feedback: string;
  suggestions: string[];
  score: number;
}> {
  if (!openai) {
    // Provide built-in code analysis when OpenAI is not available
    const feedback = analyzeCodeBuiltIn(code, problem);
    return feedback;
  }

  const prompt = `Analyze this C code submission for the following problem:

Problem: ${problem.title}
Description: ${problem.description}

Student Code:
\`\`\`c
${code}
\`\`\`

Expected Output: ${problem.sampleOutput}

Please analyze the code and provide:
1. Overall feedback on the solution approach
2. Specific suggestions for improvement
3. A score out of 100 based on correctness, efficiency, and code quality

Return the response as JSON with "feedback", "suggestions" (array of strings), and "score" fields.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert C programming instructor providing detailed feedback on student code submissions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content!);
    return {
      feedback: result.feedback,
      suggestions: result.suggestions || [],
      score: Math.max(0, Math.min(100, result.score || 0))
    };
  } catch (error) {
    throw new Error(`Failed to analyze code: ${error.message}`);
  }
}
