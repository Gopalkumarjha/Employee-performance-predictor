import { useGetAnalytics, useGetPredictionHistory, useGetWorkforceInsights, getGetAnalyticsQueryKey, getGetPredictionHistoryQueryKey, getGetWorkforceInsightsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";
import { format } from "date-fns";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Users, Target, BrainCircuit, GraduationCap } from "lucide-react";

export default function AnalyticsPage() {
  const { data: analytics, isLoading: analyticsLoading } = useGetAnalytics({
    query: { queryKey: getGetAnalyticsQueryKey() }
  });

  const { data: history, isLoading: historyLoading } = useGetPredictionHistory({
    query: { queryKey: getGetPredictionHistoryQueryKey() }
  });

  const { data: insights, isLoading: insightsLoading } = useGetWorkforceInsights({
    query: { queryKey: getGetWorkforceInsightsQueryKey() }
  });

  if (analyticsLoading || historyLoading || insightsLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (!analytics || !history || !insights) {
    return <div className="text-center p-12 text-muted-foreground">Failed to load analytics data.</div>;
  }

  const chartData = analytics.distribution.map(d => ({
    name: d.category,
    count: d.count,
    color: d.category === 'High' ? 'hsl(142 71% 45%)' : d.category === 'Medium' ? 'hsl(38 92% 50%)' : 'hsl(0 84% 60%)'
  }));

  const metricIcons: Record<string, React.ElementType> = {
    "Overall Performance": Target,
    "Turnover Risk": AlertTriangle,
    "Promotion Readiness": Users,
    "Training ROI": GraduationCap
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workforce Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Aggregate performance data and predictive workforce insights.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Evaluations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalPredictions}</div>
            <p className="text-xs text-muted-foreground mt-1">Processed by model</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageScore.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground mt-1">Company wide average</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promotion Ready</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{insights.promotionReadyCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Identified candidates</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intervention Needed</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{insights.needsImprovementCount}</div>
            <p className="text-xs text-muted-foreground mt-1">High risk employees</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Chart */}
        <Card className="md:col-span-7">
          <CardHeader>
            <CardTitle>Performance Distribution</CardTitle>
            <CardDescription>Predicted categorical distribution across workforce</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={60}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Card className="md:col-span-5">
          <CardHeader>
            <CardTitle>Strategic Trends</CardTitle>
            <CardDescription>Quarterly metric shifts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {insights.keyMetrics.map((metric, idx) => {
                const Icon = metricIcons[metric.label] || BrainCircuit;
                return (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm">{metric.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-foreground">{metric.value}</span>
                      {metric.trend === 'up' ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-none"><TrendingUp className="h-3 w-3 mr-1"/> Up</Badge>
                      ) : metric.trend === 'down' ? (
                        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 shadow-none"><TrendingDown className="h-3 w-3 mr-1"/> Down</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-500/10 text-slate-600 border-slate-500/20 shadow-none"><Minus className="h-3 w-3 mr-1"/> Flat</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
              <div className="flex gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-amber-800">Risk Alert</h4>
                  <ul className="mt-2 space-y-1">
                    {insights.riskAlerts.map((alert, idx) => (
                      <li key={idx} className="text-sm text-amber-700/90 leading-tight">{alert}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Evaluations</CardTitle>
          <CardDescription>History of model predictions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[100px]">Date</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Recommendation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.predictions.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-xs whitespace-nowrap text-muted-foreground">
                      {format(new Date(item.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">Age {item.age}, {item.yearsAtCompany} Yrs Tenure</div>
                      <div className="text-xs text-muted-foreground">Sat. Score: {item.satisfactionScore}/10</div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-medium">{item.performanceScore.toFixed(1)}</span>
                    </TableCell>
                    <TableCell>
                      {item.performanceCategory === "High" && (
                        <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-500/20 shadow-none font-medium">High</Badge>
                      )}
                      {item.performanceCategory === "Medium" && (
                        <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-500/20 shadow-none font-medium">Medium</Badge>
                      )}
                      {item.performanceCategory === "Low" && (
                        <Badge className="bg-red-500/15 text-red-700 hover:bg-red-500/25 border-red-500/20 shadow-none font-medium">Low</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{item.recommendation}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
