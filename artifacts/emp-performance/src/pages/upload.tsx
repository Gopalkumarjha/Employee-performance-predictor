import { useState, useRef } from "react";
import { Upload, FileText, Download, CheckCircle2, AlertTriangle, Loader2, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

interface BatchPredictionRow {
  row: number;
  age: number;
  yearsAtCompany: number;
  satisfactionScore: number;
  performanceScore: number;
  performanceCategory: "High" | "Medium" | "Low";
  confidence: number;
  recommendation: string;
  error?: string;
}

interface BatchResult {
  total: number;
  success: number;
  failed: number;
  results: BatchPredictionRow[];
}

const CATEGORY_COLORS: Record<string, string> = {
  High: "bg-green-100 text-green-800 border-green-200",
  Medium: "bg-amber-100 text-amber-800 border-amber-200",
  Low: "bg-red-100 text-red-800 border-red-200",
};

const SAMPLE_CSV = `age,years_at_company,training_hours,projects_handled,work_hours,overtime_hours,satisfaction_score,salary
28,2,30,4,40,3,7.5,52000
35,8,60,12,45,6,8.2,78000
42,15,20,18,50,12,5.1,92000
26,1,10,2,38,1,6.8,41000
50,22,80,20,44,8,9.1,115000
31,4,45,8,42,4,7.0,63000
38,10,15,10,48,15,4.5,85000
29,3,55,6,41,2,8.8,58000`;

export default function UploadPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith(".csv")) {
      toast({ title: "Invalid file", description: "Please upload a .csv file.", variant: "destructive" });
      return;
    }
    setFile(f);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/upload`, { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error ?? "Upload failed");
      }
      const data: BatchResult = await res.json();
      setResult(data);
      toast({ title: "Upload complete", description: `${data.success} of ${data.total} employees processed.` });
    } catch (err) {
      toast({ title: "Upload failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_employees.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadResults = () => {
    if (!result) return;
    const headers = ["Row", "Age", "Years at Company", "Satisfaction Score", "Performance Score", "Category", "Confidence", "Recommendation"];
    const rows = result.results.map((r) =>
      [r.row, r.age, r.yearsAtCompany, r.satisfactionScore, r.performanceScore, r.performanceCategory, r.confidence, r.recommendation].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "performance_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Batch Upload</h1>
        <p className="mt-2 text-muted-foreground">Upload a CSV file to predict performance for multiple employees at once.</p>
      </div>

      {/* Instructions */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-primary" />
            Required CSV Columns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {["age", "years_at_company", "training_hours", "projects_handled", "work_hours", "overtime_hours", "satisfaction_score", "salary"].map((col) => (
              <code key={col} className="rounded bg-primary/10 px-2 py-0.5 text-xs font-mono text-primary">{col}</code>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={downloadSample} className="gap-2">
            <Download className="h-4 w-4" />
            Download Sample CSV
          </Button>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Employee Data</CardTitle>
          <CardDescription>Drag and drop your CSV file or click to browse</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer
              ${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}
              ${file ? "border-green-400 bg-green-50" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
                <div>
                  <p className="font-semibold text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground gap-1"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                >
                  <X className="h-3 w-3" /> Remove
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-7 w-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Drop your CSV here</p>
                  <p className="text-sm text-muted-foreground">or click to browse files</p>
                </div>
                <p className="text-xs text-muted-foreground">.csv files only</p>
              </div>
            )}
          </div>

          <Button
            className="w-full gap-2"
            size="lg"
            disabled={!file || isUploading}
            onClick={handleUpload}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing employees...
              </>
            ) : (
              <>
                <FileText className="h-5 w-5" />
                Run Batch Prediction
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-foreground">{result.total}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Employees</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-green-600">{result.success}</p>
                <p className="text-sm text-muted-foreground mt-1">Successfully Predicted</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-amber-600">
                  {result.results.filter((r) => r.performanceCategory === "High").length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">High Performers Found</p>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Prediction Results</CardTitle>
                <CardDescription>{result.success} employees evaluated</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={downloadResults} className="gap-2">
                <Download className="h-4 w-4" />
                Export Results
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Tenure</TableHead>
                      <TableHead>Satisfaction</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Recommendation</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.results.map((row) => (
                      <TableRow key={row.row}>
                        <TableCell className="font-mono text-xs text-muted-foreground">{row.row}</TableCell>
                        <TableCell>{row.age}</TableCell>
                        <TableCell>{row.yearsAtCompany}y</TableCell>
                        <TableCell>{row.satisfactionScore}/10</TableCell>
                        <TableCell>
                          {row.error ? (
                            <span className="text-destructive text-xs">{row.error}</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{row.performanceScore}</span>
                              <Progress
                                value={row.performanceScore}
                                className="w-16 h-1.5"
                              />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.performanceCategory && (
                            <Badge className={`text-xs border ${CATEGORY_COLORS[row.performanceCategory]}`}>
                              {row.performanceCategory}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.confidence != null && (
                            <span className="text-sm text-muted-foreground">{(row.confidence * 100).toFixed(0)}%</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{row.recommendation}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
