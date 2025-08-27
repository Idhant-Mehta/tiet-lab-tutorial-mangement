import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import CodeEditor from "@/components/code-editor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Trophy, Clock, HelpCircle, CheckCircle, Calendar, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Assignment, Problem } from "@shared/schema";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<"assignments" | "editor">("assignments");
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [problemIndex, setProblemIndex] = useState(0);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats/student"],
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments/active"],
  });

  if (!user || user.role !== "student") {
    return <div>Access denied</div>;
  }

  const navigationItems = [
    { icon: FileText, label: "Assignments", href: "#", active: currentView === "assignments" },
    { icon: Trophy, label: "My Progress", href: "#" },
    { icon: Clock, label: "Submissions", href: "#" },
    { icon: HelpCircle, label: "Help", href: "#" },
  ];

  const handleStartAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    const problems = assignment.problems as Problem[];
    if (problems && problems.length > 0) {
      setSelectedProblem(problems[0]);
      setProblemIndex(0);
    }
    setCurrentView("editor");
  };

  const handleBackToAssignments = () => {
    setCurrentView("assignments");
    setSelectedAssignment(null);
    setSelectedProblem(null);
    setProblemIndex(0);
  };

  const handleNextProblem = () => {
    if (selectedAssignment && selectedAssignment.problems) {
      const problems = selectedAssignment.problems as Problem[];
      const nextIndex = Math.min(problemIndex + 1, problems.length - 1);
      setProblemIndex(nextIndex);
      setSelectedProblem(problems[nextIndex]);
    }
  };

  const handlePreviousProblem = () => {
    if (selectedAssignment && selectedAssignment.problems) {
      const problems = selectedAssignment.problems as Problem[];
      const prevIndex = Math.max(problemIndex - 1, 0);
      setProblemIndex(prevIndex);
      setSelectedProblem(problems[prevIndex]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} userType="Student" />
      
      <div className="flex">
        <Sidebar items={navigationItems} />
        
        <main className="flex-1 p-6">
          {currentView === "assignments" ? (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground" data-testid="text-title">My Assignments</h1>
                <p className="text-muted-foreground mt-2">Complete your C programming assignments</p>
              </div>

              {/* Progress Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Completed</p>
                        {statsLoading ? (
                          <Skeleton className="h-8 w-16 mt-1" />
                        ) : (
                          <p className="text-2xl font-bold text-green-600" data-testid="text-completed">
                            {stats?.completed || 0}
                          </p>
                        )}
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                        {statsLoading ? (
                          <Skeleton className="h-8 w-16 mt-1" />
                        ) : (
                          <p className="text-2xl font-bold text-amber-600" data-testid="text-in-progress">
                            {stats?.inProgress || 0}
                          </p>
                        )}
                      </div>
                      <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                        <Clock className="w-6 h-6 text-amber-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Average Score</p>
                        {statsLoading ? (
                          <Skeleton className="h-8 w-16 mt-1" />
                        ) : (
                          <p className="text-2xl font-bold text-primary" data-testid="text-average-score">
                            {stats?.averageScore || 0}%
                          </p>
                        )}
                      </div>
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Assignment List */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Assignments</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {assignmentsLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-32 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ) : assignments && assignments.length > 0 ? (
                    <div className="space-y-4">
                      {assignments.map((assignment) => {
                        const problems = assignment.problems as Problem[];
                        const problemCount = problems ? problems.length : 0;
                        
                        return (
                          <div
                            key={assignment.id}
                            className="border border-border rounded-lg p-6 hover:border-primary/50 transition-colors"
                            data-testid={`card-assignment-${assignment.id}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h3 className="text-lg font-semibold text-foreground" data-testid={`text-assignment-title-${assignment.id}`}>
                                    {assignment.title}
                                  </h3>
                                  <Badge variant="secondary">Active</Badge>
                                </div>
                                <p className="text-muted-foreground mb-4" data-testid={`text-assignment-description-${assignment.id}`}>
                                  {assignment.description}
                                </p>
                                <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                                  <span className="flex items-center space-x-1">
                                    <FileText className="w-4 h-4" />
                                    <span data-testid={`text-problem-count-${assignment.id}`}>
                                      {problemCount} problems
                                    </span>
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span data-testid={`text-time-limit-${assignment.id}`}>
                                      {assignment.timeLimit ? `${assignment.timeLimit} minutes` : "No limit"}
                                    </span>
                                  </span>
                                  {assignment.dueDate && (
                                    <span className="flex items-center space-x-1">
                                      <Calendar className="w-4 h-4" />
                                      <span data-testid={`text-due-date-${assignment.id}`}>
                                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                      </span>
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-3">
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">Progress</p>
                                  <p className="text-lg font-semibold text-foreground" data-testid={`text-progress-${assignment.id}`}>
                                    0/{problemCount}
                                  </p>
                                </div>
                                <Button
                                  onClick={() => handleStartAssignment(assignment)}
                                  data-testid={`button-start-assignment-${assignment.id}`}
                                >
                                  Start
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground" data-testid="text-no-assignments">
                      No assignments available at the moment.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button variant="outline" size="icon" onClick={handleBackToAssignments} data-testid="button-back">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground" data-testid="text-problem-title">
                      {selectedProblem ? selectedProblem.title : "Problem"}
                    </h1>
                    <div className="flex items-center space-x-4 mt-1">
                      <Badge variant={
                        selectedProblem?.difficulty === "easy" ? "secondary" :
                        selectedProblem?.difficulty === "medium" ? "default" : "destructive"
                      }>
                        {selectedProblem?.difficulty || "Unknown"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Time Limit: {selectedProblem?.timeLimit || 1} second(s)
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Memory Limit: {selectedProblem?.memoryLimit || 64} MB
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-muted-foreground">
                    Problem {problemIndex + 1} of {selectedAssignment?.problems ? (selectedAssignment.problems as Problem[]).length : 0}
                  </span>
                  <Button 
                    variant="outline" 
                    onClick={handlePreviousProblem}
                    disabled={problemIndex === 0}
                    data-testid="button-previous-problem"
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleNextProblem}
                    disabled={!selectedAssignment || problemIndex >= (selectedAssignment.problems as Problem[]).length - 1}
                    data-testid="button-next-problem"
                  >
                    Next
                  </Button>
                </div>
              </div>

              {selectedProblem && selectedAssignment && (
                <CodeEditor
                  problem={selectedProblem}
                  assignmentId={selectedAssignment.id}
                  problemIndex={problemIndex}
                />
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
