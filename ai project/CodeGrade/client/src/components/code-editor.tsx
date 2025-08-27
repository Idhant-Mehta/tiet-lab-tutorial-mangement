import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Send, RotateCcw, Code, CheckCircle, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Problem } from "@shared/schema";

interface CodeEditorProps {
  problem: Problem;
  assignmentId: string;
  problemIndex: number;
}

interface TestResult {
  testCase: number;
  passed: boolean;
  output?: string;
  expected?: string;
  error?: string;
}

interface SubmissionResult {
  testResults: TestResult[];
  feedback: string;
  suggestions: string[];
}

export default function CodeEditor({ problem, assignmentId, problemIndex }: CodeEditorProps) {
  const [code, setCode] = useState(`#include <stdio.h>

int main() {
    // Write your code here
    
    return 0;
}`);
  const [results, setResults] = useState<SubmissionResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  
  const { toast } = useToast();

  // Reset code when problem changes
  useEffect(() => {
    setCode(`#include <stdio.h>

int main() {
    // Write your code here
    
    return 0;
}`);
    setResults(null);
    setShowResults(false);
  }, [problem.id]);

  const runMutation = useMutation({
    mutationFn: async (codeToRun: string) => {
      const res = await apiRequest("POST", "/api/code/run", {
        code: codeToRun,
        input: problem.sampleInput
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Code executed successfully",
          description: "Your code ran without errors.",
        });
      } else {
        toast({
          title: "Execution failed",
          description: data.error || "Your code contains errors.",
          variant: "destructive",
        });
      }
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (codeToSubmit: string) => {
      const res = await apiRequest("POST", "/api/submissions", {
        assignmentId,
        problemIndex,
        code: codeToSubmit,
      });
      return await res.json();
    },
    onSuccess: (data: SubmissionResult) => {
      setResults(data);
      setShowResults(true);
      toast({
        title: "Code submitted successfully",
        description: "Your solution has been evaluated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message || "Failed to submit code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRun = () => {
    runMutation.mutate(code);
  };

  const handleSubmit = () => {
    submitMutation.mutate(code);
  };

  const handleReset = () => {
    setCode(`#include <stdio.h>

int main() {
    // Write your code here
    
    return 0;
}`);
    setResults(null);
    setShowResults(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Problem Statement */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">Problem Statement</h3>
              <p className="text-muted-foreground leading-relaxed" data-testid="text-problem-description">
                {problem.description}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Input Format</h4>
              <div className="bg-muted p-3 rounded text-sm font-mono" data-testid="text-input-format">
                {problem.inputFormat}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Output Format</h4>
              <div className="bg-muted p-3 rounded text-sm font-mono" data-testid="text-output-format">
                {problem.outputFormat}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Constraints</h4>
              <div className="bg-muted p-3 rounded text-sm font-mono" data-testid="text-constraints">
                {problem.constraints}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Sample Input/Output</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Input</p>
                  <div className="bg-muted p-3 rounded text-sm font-mono" data-testid="text-sample-input">
                    {problem.sampleInput}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Output</p>
                  <div className="bg-muted p-3 rounded text-sm font-mono" data-testid="text-sample-output">
                    {problem.sampleOutput}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Editor and Results */}
      <div className="space-y-4">
        {/* Code Editor */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Code className="w-4 h-4" />
                <span>Solution.c</span>
              </CardTitle>
              <Select defaultValue="c-gcc">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="c-gcc">C (GCC 9.4.0)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="min-h-[400px] font-mono text-sm resize-none"
              placeholder="Write your C code here..."
              data-testid="textarea-code"
            />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center space-x-3">
          <Button 
            variant="secondary" 
            onClick={handleRun}
            disabled={runMutation.isPending}
            className="flex items-center space-x-2"
            data-testid="button-run-code"
          >
            <Play className="w-4 h-4" />
            <span>{runMutation.isPending ? "Running..." : "Run Code"}</span>
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={submitMutation.isPending}
            className="flex items-center space-x-2"
            data-testid="button-submit-code"
          >
            <Send className="w-4 h-4" />
            <span>{submitMutation.isPending ? "Submitting..." : "Submit"}</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="flex items-center space-x-2"
            data-testid="button-reset-code"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </Button>
        </div>

        {/* Results Panel */}
        {showResults && results && (
          <Card data-testid="card-results">
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.testResults && results.testResults.map((result) => (
                <div
                  key={result.testCase}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    result.passed
                      ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                      : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                  }`}
                  data-testid={`test-result-${result.testCase}`}
                >
                  <div className="flex items-center space-x-2">
                    {result.passed ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-medium ${
                      result.passed ? "text-green-800 dark:text-green-200" : "text-red-800 dark:text-red-200"
                    }`}>
                      Test Case {result.testCase}
                    </span>
                  </div>
                  <Badge variant={result.passed ? "default" : "destructive"}>
                    {result.passed ? "Passed" : "Failed"}
                  </Badge>
                </div>
              ))}
              
              {results.feedback && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">AI Feedback</h4>
                  <p className="text-sm text-muted-foreground" data-testid="text-ai-feedback">
                    {results.feedback}
                  </p>
                </div>
              )}

              {results.suggestions && results.suggestions.length > 0 && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">Suggestions</h4>
                  <ul className="text-sm text-muted-foreground space-y-1" data-testid="list-suggestions">
                    {results.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-primary">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
