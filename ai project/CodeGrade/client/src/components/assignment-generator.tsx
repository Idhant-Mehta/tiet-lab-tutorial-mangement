import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface GenerateParams {
  topic: string;
  difficultyDistribution: string;
  timeLimit: string;
}

export default function AssignmentGenerator() {
  const [topic, setTopic] = useState("Arrays and Pointers");
  const [difficultyDistribution, setDifficultyDistribution] = useState("7 Easy, 6 Medium, 2 Hard");
  const [timeLimit, setTimeLimit] = useState("180");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: async (params: GenerateParams) => {
      const res = await apiRequest("POST", "/api/assignments/generate", params);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Assignment Generated!",
        description: `Successfully created ${data.problems?.length || 0} programming problems using AI.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments/teacher"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/teacher"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate assignment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    generateMutation.mutate({
      topic,
      difficultyDistribution,
      timeLimit,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5" />
              <span>AI Assignment Generator</span>
            </CardTitle>
            <p className="text-muted-foreground mt-1">
              Generate C programming assignments automatically using AI
            </p>
          </div>
          <Button 
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
            className="flex items-center space-x-2"
            data-testid="button-generate-assignment"
          >
            {generateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>
              {generateMutation.isPending ? "Generating..." : "Generate Assignment"}
            </span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger id="topic" data-testid="select-topic">
                <SelectValue placeholder="Select topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Arrays and Pointers">Arrays and Pointers</SelectItem>
                <SelectItem value="Functions">Functions</SelectItem>
                <SelectItem value="Loops and Conditionals">Loops and Conditionals</SelectItem>
                <SelectItem value="Data Structures">Data Structures</SelectItem>
                <SelectItem value="File Handling">File Handling</SelectItem>
                <SelectItem value="String Processing">String Processing</SelectItem>
                <SelectItem value="Memory Management">Memory Management</SelectItem>
                <SelectItem value="Recursion">Recursion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Distribution</Label>
            <Select value={difficultyDistribution} onValueChange={setDifficultyDistribution}>
              <SelectTrigger id="difficulty" data-testid="select-difficulty">
                <SelectValue placeholder="Select distribution" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7 Easy, 6 Medium, 2 Hard">7 Easy, 6 Medium, 2 Hard</SelectItem>
                <SelectItem value="5 Easy, 7 Medium, 3 Hard">5 Easy, 7 Medium, 3 Hard</SelectItem>
                <SelectItem value="10 Easy, 4 Medium, 1 Hard">10 Easy, 4 Medium, 1 Hard</SelectItem>
                <SelectItem value="8 Easy, 5 Medium, 2 Hard">8 Easy, 5 Medium, 2 Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time-limit">Time Limit</Label>
            <Select value={timeLimit} onValueChange={setTimeLimit}>
              <SelectTrigger id="time-limit" data-testid="select-time-limit">
                <SelectValue placeholder="Select time limit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="120">2 hours</SelectItem>
                <SelectItem value="180">3 hours</SelectItem>
                <SelectItem value="240">4 hours</SelectItem>
                <SelectItem value="0">No limit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {generateMutation.isPending && (
          <div className="mt-6 text-center py-8">
            <div className="inline-flex items-center space-x-2 text-primary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span data-testid="text-generating">Generating assignment with AI...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
