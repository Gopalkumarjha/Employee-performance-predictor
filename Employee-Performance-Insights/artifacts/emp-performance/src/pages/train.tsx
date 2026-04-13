import { useState, useRef } from "react";
import { Upload, Database, CheckCircle2, Loader2, X, Info, TrendingUp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface TrainResult {
  message: string;
  r2_score: number;
  rows_trained: number;
  top_factors: Array<{
    feature: string;
    importance: number;
    direction: string;
  }>;
}

const SAMPLE_CSV = `age,years_at_company,monthly_income,total_working_years,training_times_last_year,distance_from_home,job_satisfaction,percent_salary_hike,performance_score
28,2,52000,6,3,10,3,15,2.1
35,8,78000,10,2,2,4,12,4.2
42,15,92000,20,4,15,2,22,3.1
26,1,41000,3,1,5,1,11,1.8
50,22,115000,25,5,8,4,20,4.9
31,4,63000,8,3,12,3,14,3.3
38,10,85000,12,2,20,2,25,2.5
29,3,58000,5,4,3,4,18,3.9
33,5,68000,7,2,6,4,17,3.6
45,18,105000,25,4,2,4,21,4.8`;

export default function TrainPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<TrainResult | null>(null);

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
      const res = await fetch(`${base}/api/train`, { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Training failed" }));
        throw new Error(err.error ?? "Training failed");
      }
      const data: TrainResult = await res.json();
      setResult(data);
      toast({ title: "Training complete", description: `Model successfully trained on ${data.rows_trained} rows.` });
    } catch (err) {
      toast({ title: "Training failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_training_data.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Train Custom Model</h1>
        <p className="mt-2 text-muted-foreground">Upload a dataset with historical performance scores to dynamically retrain the ML model.</p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4 text-primary" />
            Required CSV Columns
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {["age", "years_at_company", "monthly_income", "total_working_years", "training_times_last_year", "distance_from_home", "job_satisfaction", "percent_salary_hike", "performance_score"].map((col) => (
              <code key={col} className={`rounded px-2 py-0.5 text-xs font-mono \${col === 'performance_score' ? 'bg-emerald-100 text-emerald-800' : 'bg-primary/10 text-primary'}`}>
                {col}
              </code>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={downloadSample} className="gap-2">
            <Database className="h-4 w-4" />
            Download Sample Training CSV
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload Training Data</CardTitle>
          <CardDescription>Drag and drop your historical data CSV (must contain at least 10 valid rows)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer
              \${isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/30"}
              \${file ? "border-green-400 bg-green-50" : ""}`}
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
                  <p className="font-semibold text-foreground">Drop your training CSV here</p>
                  <p className="text-sm text-muted-foreground">or click to browse files</p>
                </div>
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
                Training new model...
              </>
            ) : (
              <>
                <Database className="h-5 w-5" />
                Train ML Model
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-4xl font-bold text-foreground">{result.rows_trained}</p>
                <p className="text-sm text-muted-foreground mt-1">Rows Trained On</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-4xl font-bold text-emerald-600">{(result.r2_score * 100).toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground mt-1">Model Accuracy (R² Score)</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top Feature Importances</CardTitle>
                <CardDescription>The variables most heavily impacting the newly trained model.</CardDescription>
              </div>
              <Search className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6 mt-4">
                {result.top_factors.map((factor, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium capitalize">{factor.feature}</span>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="font-mono text-muted-foreground">{(factor.importance * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    <Progress 
                      value={factor.importance * 100} 
                      className="h-2" 
                      indicatorClassName="bg-emerald-500" 
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
