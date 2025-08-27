import { Bell, Code2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import type { User as UserType } from "@shared/schema";

interface HeaderProps {
  user: UserType;
  userType: "Teacher" | "Student";
}

export default function Header({ user, userType }: HeaderProps) {
  const { logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Code2 className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground" data-testid="text-app-name">CodeEval</span>
          </div>
          <Badge 
            variant={userType === "Teacher" ? "default" : "secondary"}
            data-testid="badge-user-type"
          >
            {userType}
          </Badge>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" data-testid="button-notifications">
            <Bell className="w-5 h-5 text-muted-foreground" />
          </Button>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground" data-testid="text-user-name">
              {user.name}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </header>
  );
}
