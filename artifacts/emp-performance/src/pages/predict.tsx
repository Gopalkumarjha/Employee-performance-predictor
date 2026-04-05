import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BrainCircuit, CheckCircle2, ChevronRight, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";

import { usePredictPerformance } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  age: z.coerce.number().min(18).max(70),
  yearsAtCompany: z.coerce.number().min(0).max(50),
  trainingHours: z.coerce.number().min(0),
  projectsHandled: z.coerce.number().min(0),
  workHours: z.coerce.number().min(0),
  overtimeHours: z.coerce.number().min(0),
  satisfactionScore: z.coerce.number().min(1).max(10),
  salary: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof formSchema>;

export default function PredictPage() {
  const { toast } = useToast();
  const predictPerformance = usePredictPerformance();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      age: 30,
      yearsAtCompany: 3,
      trainingHours: 20,
      projectsHandled: 5,
      workHours: 40,
      overtimeHours: 2,
      satisfactionScore: 7,
      salary: 65000,
    },
  });

  function onSubmit(data: FormValues) {
    predictPerformance.mutate(
      { data },
      {
        onError: () => {
          toast({
            title: "Prediction Failed",
            description: "There was an error connecting to the prediction model.",
            variant: "destructive",
          });
        },
      }
    );
  }

  const result = predictPerformance.data;
  const isPending = predictPerformance.isPending;

  return (
    <div className="grid gap-8 lg:grid-cols-12">
      <div className="lg:col-span-5 xl:col-span-4 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Predict Performance</h1>
          <p className="text-muted-foreground mt-2">
            Enter employee metrics to generate an AI-driven performance assessment.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Employee Profile</CardTitle>
            <CardDescription>Input key variables for the model.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="yearsAtCompany"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenure (Years)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="trainingHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Training Hrs (YTD)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="projectsHandled"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Projects</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="workHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Hrs/Week</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="overtimeHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overtime Hrs/Week</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="satisfactionScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Satisfaction (1-10)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Salary (USD)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full mt-2" disabled={isPending}>
                  {isPending ? (
                    <>
                      <BrainCircuit className="mr-2 h-4 w-4 animate-pulse" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Generate Prediction
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-7 xl:col-span-8">
        {!result && !isPending && (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-6">
              <BrainCircuit className="h-10 w-10 text-primary opacity-80" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">Awaiting Inputs</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Fill out the employee profile metrics and click generate to run the predictive model.
            </p>
          </div>
        )}

        {isPending && (
          <div className="space-y-6">
            <Skeleton className="h-[200px] w-full rounded-xl" />
            <div className="grid gap-6 md:grid-cols-2">
              <Skeleton className="h-[250px] w-full rounded-xl" />
              <Skeleton className="h-[250px] w-full rounded-xl" />
            </div>
          </div>
        )}

        {result && !isPending && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
            <Card className="overflow-hidden border-2 border-primary/20 shadow-lg shadow-primary/5">
              <div className="bg-primary/5 px-6 py-8 md:px-8 border-b border-border/50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-medium text-muted-foreground uppercase tracking-wider">
                        Prediction Result
                      </h2>
                      {result.performanceCategory === "High" && (
                        <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-500/20 shadow-none text-sm px-3 py-0.5">High Performer</Badge>
                      )}
                      {result.performanceCategory === "Medium" && (
                        <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-500/20 shadow-none text-sm px-3 py-0.5">Steady Performer</Badge>
                      )}
                      {result.performanceCategory === "Low" && (
                        <Badge className="bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-500/20 shadow-none text-sm px-3 py-0.5">At Risk</Badge>
                      )}
                    </div>
                    <div className="flex items-baseline gap-4 mt-4">
                      <span className="text-6xl font-bold tracking-tighter text-foreground">
                        {Math.round(result.performanceScore)}
                      </span>
                      <span className="text-xl font-medium text-muted-foreground">/ 100</span>
                    </div>
                  </div>

                  <div className="flex-1 md:max-w-xs space-y-3 bg-background/50 rounded-xl p-4 border border-border/50">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">Model Confidence</span>
                      <span className="text-muted-foreground font-mono">{Math.round(result.confidence * 100)}%</span>
                    </div>
                    <Progress value={result.confidence * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Based on {result.confidence > 0.8 ? "strong" : "moderate"} pattern correlation with historical data.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 md:p-8 bg-card">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Primary Recommendation</h3>
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex-shrink-0">
                    {result.performanceCategory === "High" ? (
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    ) : result.performanceCategory === "Low" ? (
                      <AlertTriangle className="h-6 w-6 text-red-500" />
                    ) : (
                      <BrainCircuit className="h-6 w-6 text-amber-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-xl font-medium text-foreground">{result.recommendation}</p>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Key Insights</CardTitle>
                  <CardDescription>Actionable observations from the model</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {result.insights.map((insight, idx) => (
                      <li key={idx} className="flex gap-3 text-sm">
                        <div className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                        <span className="text-foreground leading-relaxed">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Driving Factors</CardTitle>
                  <CardDescription>Variables with highest impact on score</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    {result.topFactors.map((factor, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium capitalize">{factor.feature.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <div className="flex items-center gap-1.5">
                            {factor.direction === "positive" ? (
                              <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                            ) : factor.direction === "negative" ? (
                              <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                            ) : (
                              <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className="font-mono text-muted-foreground">{(factor.importance * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                        <Progress 
                          value={factor.importance * 100} 
                          className="h-1.5" 
                          indicatorClassName={
                            factor.direction === "positive" ? "bg-emerald-500" : 
                            factor.direction === "negative" ? "bg-red-500" : "bg-muted-foreground"
                          } 
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
