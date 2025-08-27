import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import Sidebar from "@/components/sidebar";
import AssignmentGenerator from "@/components/assignment-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Send, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Assignment } from "@shared/schema";

export default function TeacherDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/stats/teacher"],
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments/teacher"],
  });

  if (!user || user.role !== "teacher") {
    return <div>Access denied</div>;
  }

  const navigationItems = [
    { icon: FileText, label: "Dashboard", href: "#", active: true },
    { icon: FileText, label: "Assignments", href: "#" },
    { icon: Users, label: "Students", href: "#" },
    { icon: Trophy, label: "Analytics", href: "#" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} userType="Teacher" />
      
      <div className="flex">
        <Sidebar items={navigationItems} />
        
        <main className="flex-1 p-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground" data-testid="text-title">Teacher Dashboard</h1>
              <p className="text-muted-foreground mt-2">Manage assignments and track student progress</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Assignments</p>
                      {statsLoading ? (
                        <Skeleton className="h-8 w-16 mt-1" />
                      ) : (
                        <p className="text-2xl font-bold text-foreground" data-testid="text-total-assignments">
                          {stats?.totalAssignments || 0}
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Active Students</p>
                      {statsLoading ? (
                        <Skeleton className="h-8 w-16 mt-1" />
                      ) : (
                        <p className="text-2xl font-bold text-green-600" data-testid="text-active-students">
                          {stats?.activeStudents || 0}
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Submissions</p>
                      {statsLoading ? (
                        <Skeleton className="h-8 w-16 mt-1" />
                      ) : (
                        <p className="text-2xl font-bold text-blue-600" data-testid="text-submissions">
                          {stats?.totalSubmissions || 0}
                        </p>
                      )}
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Send className="w-6 h-6 text-blue-600" />
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
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Assignment Generation */}
            <AssignmentGenerator />

            {/* Recent Assignments */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Assignments</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {assignmentsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : assignments && assignments.length > 0 ? (
                  <div className="space-y-4">
                    {assignments.slice(0, 5).map((assignment) => (
                      <div
                        key={assignment.id}
                        className="flex items-center justify-between p-4 bg-accent/50 rounded-lg"
                        data-testid={`card-assignment-${assignment.id}`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium text-foreground" data-testid={`text-assignment-title-${assignment.id}`}>
                              {assignment.title}
                            </h3>
                            <p className="text-sm text-muted-foreground" data-testid={`text-assignment-description-${assignment.id}`}>
                              {assignment.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-muted-foreground">
                            {Array.isArray(assignment.problems) ? assignment.problems.length : 0} problems
                          </span>
                          <button 
                            className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
                            data-testid={`button-view-assignment-${assignment.id}`}
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground" data-testid="text-no-assignments">
                    No assignments created yet. Use the AI generator above to create your first assignment.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
