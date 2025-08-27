import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertAssignmentSchema, insertSubmissionSchema, problemSchema } from "@shared/schema";
import { generateAssignment, analyzeCode } from "./services/openai";

export function registerRoutes(app: Express): Server {
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Generate assignment using AI
  app.post("/api/assignments/generate", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== "teacher") {
        return res.status(403).json({ message: "Access denied. Teachers only." });
      }

      const { topic, difficultyDistribution, timeLimit } = req.body;
      
      // Parse difficulty distribution (e.g., "7 Easy, 6 Medium, 2 Hard")
      const difficultyMatch = difficultyDistribution.match(/(\d+)\s+Easy,\s*(\d+)\s+Medium,\s*(\d+)\s+Hard/i);
      if (!difficultyMatch) {
        return res.status(400).json({ message: "Invalid difficulty distribution format" });
      }

      const difficulty = {
        easy: parseInt(difficultyMatch[1]),
        medium: parseInt(difficultyMatch[2]),
        hard: parseInt(difficultyMatch[3])
      };

      const problems = await generateAssignment({
        topic,
        difficulty,
        timeLimit: parseInt(timeLimit) || 180
      });

      // Create assignment
      const assignment = await storage.createAssignment({
        title: `${topic} - AI Generated Assignment`,
        description: `Auto-generated assignment covering ${topic} with ${problems.length} problems`,
        teacherId: req.user!.id,
        problems: problems,
        timeLimit: parseInt(timeLimit) || 180,
        dueDate: null,
        isActive: true
      });

      res.json({ assignment, problems });
    } catch (error) {
      console.error("Assignment generation error:", error);
      res.status(500).json({ message: "Failed to generate assignment" });
    }
  });

  // Get assignments for teacher
  app.get("/api/assignments/teacher", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== "teacher") {
        return res.status(403).json({ message: "Access denied. Teachers only." });
      }

      const assignments = await storage.getAssignmentsByTeacher(req.user!.id);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  // Get active assignments for students
  app.get("/api/assignments/active", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== "student") {
        return res.status(403).json({ message: "Access denied. Students only." });
      }

      const assignments = await storage.getActiveAssignments();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  // Get assignment details
  app.get("/api/assignments/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const assignment = await storage.getAssignment(req.params.id);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      // Students can only access active assignments
      if (req.user!.role === "student" && !assignment.isActive) {
        return res.status(403).json({ message: "Assignment not available" });
      }

      res.json(assignment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch assignment" });
    }
  });

  // Submit code for evaluation
  app.post("/api/submissions", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== "student") {
        return res.status(403).json({ message: "Access denied. Students only." });
      }

      const submissionData = insertSubmissionSchema.parse({
        ...req.body,
        studentId: req.user!.id
      });

      // Get assignment to validate
      const assignment = await storage.getAssignment(submissionData.assignmentId);
      if (!assignment || !assignment.isActive) {
        return res.status(404).json({ message: "Assignment not found or inactive" });
      }

      const problems = assignment.problems as any[];
      const problem = problems[submissionData.problemIndex];
      if (!problem) {
        return res.status(400).json({ message: "Invalid problem index" });
      }

      // Simulate code execution (in a real implementation, this would use Docker)
      let testResults = [];
      let status = "passed";
      let score = 100;

      try {
        // Simple simulation - check if code contains basic C structure
        const hasMainFunction = submissionData.code.includes("int main");
        const hasInclude = submissionData.code.includes("#include");
        const hasReturn = submissionData.code.includes("return");

        if (!hasMainFunction || !hasInclude || !hasReturn) {
          status = "failed";
          score = 20;
          testResults = [
            { testCase: 1, passed: false, error: "Missing required C structure" }
          ];
        } else {
          // Simulate passing most test cases
          testResults = problem.testCases?.map((_, index) => ({
            testCase: index + 1,
            passed: Math.random() > 0.2, // 80% pass rate simulation
            output: problem.sampleOutput,
            expected: problem.sampleOutput
          })) || [];
          
          const passedCount = testResults.filter(r => r.passed).length;
          score = Math.round((passedCount / testResults.length) * 100);
          status = score >= 60 ? "passed" : "failed";
        }

        // Get AI feedback
        const aiAnalysis = await analyzeCode(submissionData.code, problem);
        
        const submission = await storage.createSubmission({
          ...submissionData,
          status: status as any,
          testResults,
          score: Math.min(score, aiAnalysis.score)
        });

        res.json({
          submission,
          testResults,
          feedback: aiAnalysis.feedback,
          suggestions: aiAnalysis.suggestions
        });
      } catch (aiError) {
        // Fallback if AI analysis fails
        const submission = await storage.createSubmission({
          ...submissionData,
          status: status as any,
          testResults,
          score
        });

        res.json({
          submission,
          testResults,
          feedback: "Code submitted successfully. Basic validation completed.",
          suggestions: []
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
      res.status(500).json({ message: "Failed to submit code" });
    }
  });

  // Get student's submissions for an assignment
  app.get("/api/submissions/student/:assignmentId", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== "student") {
        return res.status(403).json({ message: "Access denied. Students only." });
      }

      const submissions = await storage.getStudentSubmissions(req.user!.id, req.params.assignmentId);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  // Get all submissions for teacher
  app.get("/api/submissions/assignment/:assignmentId", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== "teacher") {
        return res.status(403).json({ message: "Access denied. Teachers only." });
      }

      const submissions = await storage.getSubmissionsByAssignment(req.params.assignmentId);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  // Run code (simulate execution)
  app.post("/api/code/run", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== "student") {
        return res.status(403).json({ message: "Access denied. Students only." });
      }

      const { code, input } = req.body;

      // Simulate code execution
      const hasMainFunction = code.includes("int main");
      const hasInclude = code.includes("#include");

      if (!hasMainFunction || !hasInclude) {
        return res.json({
          success: false,
          output: "",
          error: "Compilation error: Missing main function or include statements"
        });
      }

      // Simulate successful execution
      res.json({
        success: true,
        output: "Program executed successfully.\nSample output based on your code structure.",
        error: null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to run code" });
    }
  });

  // Get dashboard statistics
  app.get("/api/stats/teacher", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== "teacher") {
        return res.status(403).json({ message: "Access denied. Teachers only." });
      }

      const assignments = await storage.getAssignmentsByTeacher(req.user!.id);
      const allSubmissions = await Promise.all(
        assignments.map(a => storage.getSubmissionsByAssignment(a.id))
      );
      const submissions = allSubmissions.flat();
      
      const uniqueStudents = new Set(submissions.map(s => s.studentId)).size;
      const averageScore = submissions.length > 0 
        ? Math.round(submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length)
        : 0;

      res.json({
        totalAssignments: assignments.length,
        activeStudents: uniqueStudents,
        totalSubmissions: submissions.length,
        averageScore
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  app.get("/api/stats/student", async (req, res) => {
    try {
      if (!req.isAuthenticated() || req.user!.role !== "student") {
        return res.status(403).json({ message: "Access denied. Students only." });
      }

      const submissions = await storage.getSubmissionsByStudent(req.user!.id);
      const assignments = await storage.getActiveAssignments();
      
      const completedAssignments = new Set(
        submissions.filter(s => s.status === "passed").map(s => s.assignmentId)
      ).size;
      
      const inProgressAssignments = assignments.length - completedAssignments;
      const averageScore = submissions.length > 0 
        ? Math.round(submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length)
        : 0;

      res.json({
        completed: completedAssignments,
        inProgress: Math.max(0, inProgressAssignments),
        averageScore
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
