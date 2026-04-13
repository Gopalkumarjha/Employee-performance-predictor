import { Router, type IRouter } from "express";
import multer from "multer";
import {
  PredictPerformanceBody,
  PredictPerformanceResponse,
  GetAnalyticsResponse,
  GetPredictionHistoryResponse,
  GetWorkforceInsightsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const ML_BASE = `http://127.0.0.1:${process.env.ML_PORT ?? 5001}`;

async function mlFetch(path: string, options?: RequestInit) {
  const url = `${ML_BASE}${path}`;
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`ML service error ${res.status}: ${body}`);
  }
  return res.json();
}

router.post("/predict", async (req, res): Promise<void> => {
  const parsed = PredictPerformanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { age, yearsAtCompany, monthlyIncome, totalWorkingYears, trainingTimesLastYear, distanceFromHome, jobSatisfaction, percentSalaryHike } = parsed.data;

  const mlPayload = {
    age,
    years_at_company: yearsAtCompany,
    monthly_income: monthlyIncome,
    total_working_years: totalWorkingYears,
    training_times_last_year: trainingTimesLastYear,
    distance_from_home: distanceFromHome,
    job_satisfaction: jobSatisfaction,
    percent_salary_hike: percentSalaryHike,
  };

  const mlResult = await mlFetch("/ml/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mlPayload),
  });

  const result = PredictPerformanceResponse.parse(mlResult);
  res.json(result);
});

router.post("/upload", upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const form = new FormData();
  const blob = new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype || "text/csv" });
  form.append("file", blob, req.file.originalname);

  const mlUrl = `${ML_BASE}/ml/upload`;
  const mlRes = await fetch(mlUrl, { method: "POST", body: form });

  if (!mlRes.ok) {
    const body = await mlRes.json().catch(() => ({ error: "ML service error" }));
    res.status(mlRes.status).json(body);
    return;
  }

  const data = await mlRes.json();
  res.json(data);
});

router.post("/train", upload.single("file"), async (req, res): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const form = new FormData();
  const blob = new Blob([new Uint8Array(req.file.buffer)], { type: req.file.mimetype || "text/csv" });
  form.append("file", blob, req.file.originalname);

  const mlUrl = `${ML_BASE}/ml/train`;
  const mlRes = await fetch(mlUrl, { method: "POST", body: form });

  if (!mlRes.ok) {
    const body = await mlRes.json().catch(() => ({ error: "ML service error" }));
    res.status(mlRes.status).json(body);
    return;
  }

  const data = await mlRes.json();
  res.json(data);
});

router.get("/analytics", async (_req, res): Promise<void> => {
  const mlResult = await mlFetch("/ml/analytics");
  const result = GetAnalyticsResponse.parse(mlResult);
  res.json(result);
});

router.get("/analytics/history", async (_req, res): Promise<void> => {
  const mlResult = await mlFetch("/ml/analytics/history");
  const result = GetPredictionHistoryResponse.parse(mlResult);
  res.json(result);
});

router.get("/analytics/insights", async (_req, res): Promise<void> => {
  const mlResult = await mlFetch("/ml/analytics/insights");
  const result = GetWorkforceInsightsResponse.parse(mlResult);
  res.json(result);
});

export default router;
