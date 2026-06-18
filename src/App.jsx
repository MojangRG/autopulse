import { useEffect, useMemo, useState } from "react";
import BottomNav from "./components/BottomNav";
import HomeScreen from "./components/HomeScreen";
import JournalScreen from "./components/JournalScreen";
import PassportScreen from "./components/PassportScreen";
import AiScreen from "./components/AiScreen";
import MoreScreen from "./components/MoreScreen";
import OnboardingProfile from "./components/OnboardingProfile";
import WelcomeScreen from "./components/WelcomeScreen";
import HouseHubScreen from "./components/HouseHubScreen.jsx";
import DocumentsScreen from "./components/DocumentsScreen.jsx";
import { sanitizeVehicleForm, validateVehicleForm } from "./vehicleCatalog.js";
import { computeOrchestratorState } from "./utils/orchestrator.js";
import { buildEstateCoreState } from "./core/estateCore.js";
import { generateReminders, dismissReminder, doneReminder, getActiveReminders } from "./utils/reminders.js";
import "./App.css";

const WORK_OPTIONS = [
  { id: "engine_service", label: "ТО двигателя" },
  { id: "engine_oil",     label: "Замена масла двигателя" },
  { id: "oil_filter",     label: "Замена масляного фильтра" },
  { id: "cabin_filter",   label: "Замена салонного фильтра" },
  { id: "air_filter",     label: "Замена воздушного фильтра" },
  { id: "spark_plugs",    label: "Замена свечей зажигания" },
  { id: "cvt_fluid",      label: "Замена масла CVT" },
  { id: "diff_fluid",     label: "Замена масла редукторов" },
  { id: "brake_fluid",    label: "Замена тормозной жидкости" },
  { id: "front_pads",     label: "Замена передних колодок" },
  { id: "front_discs",    label: "Замена передних тормозных дисков" },
  { id: "rear_pads",      label: "Замена задних колодок" },
  { id: "rear_discs",     label: "Замена задних тормозных дисков" },
  { id: "fuel_cleaning",  label: "Чистка топливной системы" },
  { id: "suspension_check", label: "Диагностика подвески" },
  { id: "other",          label: "Другое" },
];

const DEFAULT_RULES = [
  { id: "engine_oil",   name: "Масло двигателя",   intervalKm: 10000, warningBeforeKm: 2000,  severity: "high",   notes: "По вашей истории меняется каждые 10 000 км." },
  { id: "oil_filter",   name: "Масляный фильтр",    intervalKm: 10000, warningBeforeKm: 2000,  severity: "high",   notes: "Обычно меняется вместе с маслом двигателя." },
  { id: "cabin_filter", name: "Салонный фильтр",    intervalKm: 10000, warningBeforeKm: 2000,  severity: "medium", notes: "Для комфорта и вентиляции." },
  { id: "air_filter",   name: "Воздушный фильтр",   intervalKm: 15000, warningBeforeKm: 3000,  severity: "medium", notes: "В пыльных условиях менять чаще." },
  { id: "spark_plugs",  name: "Свечи зажигания",    intervalKm: 100000,warningBeforeKm: 10000, severity: "medium", notes: "Контроль к 95-100 тыс. км." },
  { id: "cvt_fluid",    name: "Масло CVT",          intervalKm: 60000, warningBeforeKm: 10000, severity: "high",   notes: "Критичный узел для ресурса вариатора." },
  { id: "diff_fluid",   name: "Масло редукторов",   intervalKm: 60000, warningBeforeKm: 10000, severity: "medium", notes: "Передний и задний редукторы." },
  { id: "brake_fluid",  name: "Тормозная жидкость", intervalKm: 40000, warningBeforeKm: 5000,  severity: "high",   intervalMonths: 24, notes: "Также контролировать по сроку 2 года." },
];

function emptyVehicleData(mileage = 0) {
  return { mileage: Number(mileage || 0), logs: [] };
}

function genericProfileFor(vehicle) {
  return {
    vehicle,
    serviceItems: DEFAULT_RULES,
    commonIssues: [],
    recommendations: [
      "Добавьте историю обслуживания, чтобы Motrix точнее считал регламент.",
      "Проверьте ключевые жидкости и фильтры после создания профиля.",
      "Загрузите чек или заказ-наряд после ближайшего обслуживания.",
    ],
    disclaimer: "Базовый профиль создан по универсальному регламенту. Точные интервалы нужно подтвердить по VIN, мануалу или документам СТО.",
  };
}

const defaultData = emptyVehicleData(0);

const CHAT_KEY = "autopulse-chat";
const RENDER_KEY = "autopulse-vehicle-render";

function emptyRenderState() {
  return { status: "idle", imageUrl: "", prompt: "", generatedAt: "", error: "", vehicleFingerprint: "" };
}

function getVehicleRenderFingerprint(vehicle) {
  return [vehicle?.brand, vehicle?.model, vehicle?.generation, vehicle?.year, vehicle?.color]
    .map((value) => String(value || "").trim().toLowerCase())
    .join("|");
}

function todayIso() { return new Date().toISOString().slice(0, 10); }

function logFingerprint(log) {
  return [
    String(log.normalizedId || "").trim().toLowerCase(),
    String(log.title || "").trim().toLowerCase(),
    String(log.mileage || ""),
    String(log.datePerformed || ""),
  ].join("|");
}

function isDuplicateLog(log, existingLogs = [], ignoreId = null) {
  const fp = logFingerprint(log);
  return existingLogs.some((item) => item.id !== ignoreId && logFingerprint(item) === fp);
}

function compressImage(file, maxWidth = 1400, quality = 0.72) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return resolve(file);
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (!blob) reject(new Error("Не удалось сжать изображение"));
          else resolve(new File([blob], "compressed.jpg", { type: "image/jpeg" }));
        }, "image/jpeg", quality);
      };
      img.onerror = () => reject(new Error("Не удалось прочитать изображение"));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Не удалось открыть файл"));
    reader.readAsDataURL(file);
  });
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [vehicle, setVehicle]       = useState(() => JSON.parse(localStorage.getItem("autopulse-vehicle") || "null") || null);
  const [profile, setProfile]       = useState(() => JSON.parse(localStorage.getItem("autopulse-profile") || "null"));
  const [analysis, setAnalysis]     = useState(() => JSON.parse(localStorage.getItem("autopulse-analysis") || "null"));
  const [ownerProfile, setOwnerProfile] = useState(() => JSON.parse(localStorage.getItem("autopulse-owner-profile") || "null"));
  const [data, setData]             = useState(() => JSON.parse(localStorage.getItem("autopulse-data") || "null") || defaultData);
  const [newMileage, setNewMileage] = useState(data.mileage);
  const [reminders, setReminders]   = useState(() => getActiveReminders());
  const [chat, setChat]             = useState(() => {
    try { return JSON.parse(localStorage.getItem(CHAT_KEY) || "[]"); } catch { return []; }
  });
  const [vehicleRender, setVehicleRender] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RENDER_KEY) || "null");
      return saved || emptyRenderState();
    } catch {
      return emptyRenderState();
    }
  });

  const [vehicleForm, setVehicleForm] = useState({ vin: "", brand: "", model: "", generation: "", year: "", engine: "", transmission: "", drive: "", color: "", mileage: "" });
  const [manualOpen, setManualOpen]   = useState(false);
  const [editingLogId, setEditingLogId] = useState(null);
  const [workDraft, setWorkDraft]     = useState({ normalizedId: "engine_service", title: "ТО двигателя", mileage: data.mileage, cost: "", datePerformed: todayIso(), note: "" });
  const [pendingLogs, setPendingLogs] = useState([]);
  const [pendingDocMileage, setPendingDocMileage] = useState(null);
  const [profileOnboardingOpen, setProfileOnboardingOpen] = useState(false);

  const [question, setQuestion] = useState("");

  const [isDetecting, setIsDetecting]     = useState(false);
  const [isAnalyzing, setIsAnalyzing]     = useState(false);
  const [isAsking, setIsAsking]           = useState(false);
  const [isParsingSts, setIsParsingSts]   = useState(false);
  const [isParsingDoc, setIsParsingDoc]   = useState(false);
  const [isGeneratingRender, setIsGeneratingRender] = useState(false);

  useEffect(() => { localStorage.setItem("autopulse-data", JSON.stringify(data)); }, [data]);
  useEffect(() => { if (vehicle) localStorage.setItem("autopulse-vehicle", JSON.stringify(vehicle)); }, [vehicle]);
  useEffect(() => { localStorage.setItem(RENDER_KEY, JSON.stringify(vehicleRender || emptyRenderState())); }, [vehicleRender]);
  useEffect(() => {
    const limited = chat.slice(-20); // Keep last 20 messages
    localStorage.setItem(CHAT_KEY, JSON.stringify(limited));
  }, [chat]);

  // ── Orchestrator — single source of truth (vehicleBrain) ─────────────────
  const orch = useMemo(() => computeOrchestratorState({
    vehicle, profile, data, ownerProfile, analysis, defaultRules: DEFAULT_RULES,
  }), [vehicle, profile, data, ownerProfile, analysis]);

  // ── Estate core — AI-home layer over garage, documents and future rooms ─────
  const estate = useMemo(() => buildEstateCoreState({
    vehicle, vehicleBrain: orch, reminders, data, ownerProfile, analysis,
  }), [vehicle, orch, reminders, data, ownerProfile, analysis]);

  // ── Reminders — regenerate when schedule changes ──────────────────────────
  useEffect(() => {
    if (!vehicle) return;
    const updated = generateReminders({ schedule: orch.schedule, data, ownerProfile });
    setReminders(updated.filter((r) => r.status === "active"));
  }, [orch.schedule, data, ownerProfile, vehicle]);

  function clearVehicleRender() {
    localStorage.removeItem(RENDER_KEY);
    setVehicleRender(emptyRenderState());
  }

  async function generateVehicleRender(customVehicle = vehicle, options = {}) {
    if (!customVehicle?.brand || !customVehicle?.model) return;

    const fingerprint = getVehicleRenderFingerprint(customVehicle);
    if (!options.force && vehicleRender?.status === "ready" && vehicleRender?.vehicleFingerprint === fingerprint) {
      return;
    }

    try {
      setIsGeneratingRender(true);
      setVehicleRender((prev) => ({
        ...prev,
        status: "loading",
        error: "",
        vehicleFingerprint: fingerprint,
      }));

      const response = await fetch("/api/generate-car-render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicle: customVehicle }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.details || result.error || `Render generation failed: HTTP ${response.status}`);
      }
      if (!result.imageUrl) {
        throw new Error("Render API completed, but imageUrl is empty");
      }

      setVehicleRender({
        status: "ready",
        imageUrl: result.imageUrl,
        prompt: result.prompt || "",
        model: result.model || "",
        generatedAt: result.generatedAt || new Date().toISOString(),
        error: "",
        vehicleFingerprint: fingerprint,
      });
    } catch (error) {
      console.error("Vehicle render generation failed", error);
      setVehicleRender((prev) => ({
        ...prev,
        status: "error",
        error: error.message,
        vehicleFingerprint: fingerprint,
      }));
    } finally {
      setIsGeneratingRender(false);
    }
  }

  // ── API: analyze vehicle ──────────────────────────────────────────────────
  async function analyzeVehicle(customData = data, customProfile = profile, customVehicle = vehicle, customOwnerProfile = ownerProfile) {
    if (!customVehicle || !customProfile || !customData) return;
    try {
      setIsAnalyzing(true);
      const orchSummary = {
        healthScore: orch.healthScore,
        overdueItems: orch.urgentActions.filter((i) => i.status === "Просрочено").map((i) => i.name),
        soonItems: orch.urgentActions.filter((i) => i.status === "Скоро").map((i) => i.name),
        unknownCritical: orch.unknownAreas.filter((u) => u.severity === "high").map((u) => u.name),
      };
      const response = await fetch("/api/analyze-vehicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicle: customVehicle, profile: customProfile, data: customData, ownerProfile: customOwnerProfile, orchestratorSummary: orchSummary }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.details || result.error || "Analysis failed");
      setAnalysis(result.analysis);
      localStorage.setItem("autopulse-analysis", JSON.stringify(result.analysis));
    } catch (error) { alert("Ошибка анализа: " + error.message); }
    finally { setIsAnalyzing(false); }
  }

  // ── API: create vehicle profile ───────────────────────────────────────────
  async function detectVehicleByVin() {
    const cleaned = sanitizeVehicleForm(vehicleForm);
    const vin = cleaned.vin;
    if (!vin) return alert("Введите VIN");
    if (vin.length !== 17) return alert("VIN должен содержать 17 символов");
    try {
      setIsDetecting(true);
      const response = await fetch("/api/create-vehicle-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vin, mileage: Number(cleaned.mileage || 0), color: cleaned.color }),
      });
      const result = await response.json();
      if (!response.ok) return alert(result.details || result.error || "Не удалось определить автомобиль");
      const mergedVehicle = {
        ...result.vehicle,
        color: String(cleaned.color || result.vehicle?.color || "").trim(),
      };
      const nextData = emptyVehicleData(cleaned.mileage);
      setVehicle(mergedVehicle);
      setProfile(result.profile || genericProfileFor(mergedVehicle));
      setAnalysis(null);
      setOwnerProfile(null);
      setData(nextData);
      setNewMileage(nextData.mileage);
      setWorkDraft((p) => ({ ...p, mileage: nextData.mileage }));
      localStorage.setItem("autopulse-profile", JSON.stringify(result.profile || genericProfileFor(mergedVehicle)));
      localStorage.removeItem("autopulse-analysis");
      localStorage.removeItem("autopulse-owner-profile");
      localStorage.removeItem("autopulse-reminders");
      setReminders([]);
      generateVehicleRender(mergedVehicle);
      setProfileOnboardingOpen(true);
    } catch (error) { alert("Ошибка связи с сервером: " + error.message); }
    finally { setIsDetecting(false); }
  }

  // ── API: parse STS photo ──────────────────────────────────────────────────
  async function parseStsPhoto(event) {
    const originalFile = event.target.files?.[0];
    if (!originalFile) return;
    try {
      setIsParsingSts(true);
      const file = await compressImage(originalFile);
      const formData = new FormData();
      formData.append("file", file); formData.append("mileage", String(vehicleForm.mileage || 0));
      const response = await fetch("/api/parse-sts", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.details || result.error || "STS parse failed");
      setVehicleForm((prev) => ({
        ...prev,
        vin: result.extracted?.vin || result.vehicle?.vin || prev.vin,
        brand: result.vehicle?.brand || result.extracted?.brand || prev.brand,
        model: result.vehicle?.model || result.extracted?.model || prev.model,
        generation: result.vehicle?.generation || prev.generation,
        year: result.vehicle?.year || result.extracted?.year || prev.year,
        engine: result.vehicle?.engine || prev.engine,
        transmission: result.vehicle?.transmission || prev.transmission,
        drive: result.vehicle?.drive || prev.drive,
        color: result.vehicle?.color || result.extracted?.color || prev.color,
      }));
      // STS data is now placed into the onboarding form. The user can continue by VIN or manual confirmation.
    } catch (error) { alert("Ошибка распознавания СТС: " + error.message); }
    finally { setIsParsingSts(false); event.target.value = ""; }
  }

  // ── API: parse service document ───────────────────────────────────────────
  async function parseServiceDocument(event) {
    const originalFile = event.target.files?.[0];
    if (!originalFile) return;
    if (!vehicle) return alert("Сначала добавьте автомобиль");
    // PDF is not supported — only images
    if (originalFile.type === "application/pdf" || originalFile.name.toLowerCase().endsWith(".pdf")) {
      return alert("PDF-файлы пока не поддерживаются. Пожалуйста, сделайте фото документа.");
    }
    try {
      setIsParsingDoc(true);
      const file = await compressImage(originalFile);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("vehicle", JSON.stringify(vehicle));
      formData.append("profile", JSON.stringify(profile));
      formData.append("mileage", String(data.mileage));
      const response = await fetch("/api/parse-service-doc", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.details || result.error || "Document parse failed");
      const parsedLogs = Array.isArray(result.logs) ? result.logs : [];
      if (!parsedLogs.length) return alert("Не удалось найти работы в документе");
      if (result.documentMileage && Number(result.documentMileage) > Number(data.mileage)) {
        setPendingDocMileage(Number(result.documentMileage));
      }
      setPendingLogs(parsedLogs.map((log, index) => ({
        tempId: Date.now() + index,
        normalizedId: log.normalizedId || "other",
        title: log.title || "Работа из документа",
        mileage: Number(log.mileage || data.mileage),
        cost: Number(log.cost || 0),
        datePerformed: log.datePerformed || todayIso(),
        note: log.note || "",
        confidence: log.confidence || "medium",
        sourceText: log.sourceText || "",
        source: "scanned",
      })));
    } catch (error) { alert("Ошибка обработки документа: " + error.message); }
    finally { setIsParsingDoc(false); event.target.value = ""; }
  }

  // ── API: AI mechanic chat (with history) ──────────────────────────────────
  async function askAi(forcedQuestion) {
    const q = forcedQuestion ?? question;
    if (!q?.trim()) return;
    setQuestion("");
    setIsAsking(true);
    const userMsg = { role: "user", text: q };
    const thinkingMsg = { role: "ai", text: "Думаю..." };
    setChat((prev) => [...prev, userMsg, thinkingMsg]);

    // Build history for API (last 6 messages, excluding current thinking placeholder)
    const historyForApi = chat.slice(-6).map((m) => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.text,
    }));

    try {
      const response = await fetch("/api/ai-mechanic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle, profile, data, analysis, question: q,
          ownerProfile,
          localBriefing: orch.localBriefing,
          history: historyForApi,
          orchestratorSummary: {
            healthScore: orch.healthScore,
            urgentActions: orch.urgentActions.slice(0, 3).map((i) => ({ name: i.name, status: i.status, left: i.left })),
            unknownAreas: orch.unknownAreas.filter((u) => u.severity === "high").map((u) => u.name),
            costForecast: orch.costForecast,
          },
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.details || result.error || "AI mechanic failed");
      setChat((prev) => { const u = [...prev]; u[u.length - 1] = { role: "ai", text: result.answer }; return u; });
    } catch (error) {
      setChat((prev) => { const u = [...prev]; u[u.length - 1] = { role: "ai", text: "Ошибка: " + error.message }; return u; });
    } finally { setIsAsking(false); }
  }

  // ── Reminder handlers ─────────────────────────────────────────────────────
  function handleReminderDismiss(id) {
    const updated = dismissReminder(id);
    setReminders(updated.filter((r) => r.status === "active"));
  }

  function handleReminderDone(id) {
    const updated = doneReminder(id);
    setReminders(updated.filter((r) => r.status === "active"));
  }

  // ── Local mutations ───────────────────────────────────────────────────────
  function updateVehicleField(field, value) { setVehicleForm((prev) => sanitizeVehicleForm({ ...prev, [field]: value })); }

  function saveOwnerProfile(profileData) {
    setOwnerProfile(profileData);
    localStorage.setItem("autopulse-owner-profile", JSON.stringify(profileData));
    setProfileOnboardingOpen(false);
    setTab("home");
    setTimeout(() => analyzeVehicle(data, profile, vehicle, profileData), 300);
  }

  function saveVehicleManually(formOverride = null) {
    const validation = validateVehicleForm(formOverride || vehicleForm);
    if (!validation.ok) return alert(validation.errors.join("\n"));
    const clean = validation.vehicleForm;
    const v = {
      vin: clean.vin,
      brand: clean.brand,
      model: clean.model,
      generation: clean.generation,
      year: Number(clean.year),
      engine: clean.engine,
      transmission: clean.transmission,
      drive: clean.drive,
      color: clean.color,
      market: "manual",
    };
    const nextProfile = genericProfileFor(v);
    const nextData = emptyVehicleData(clean.mileage);
    setVehicle(v);
    setProfile(nextProfile);
    setAnalysis(null);
    setOwnerProfile(null);
    setData(nextData);
    setNewMileage(nextData.mileage);
    setWorkDraft((p) => ({ ...p, mileage: nextData.mileage }));
    localStorage.setItem("autopulse-profile", JSON.stringify(nextProfile));
    localStorage.removeItem("autopulse-analysis");
    localStorage.removeItem("autopulse-owner-profile");
    localStorage.removeItem("autopulse-reminders");
    setReminders([]);
    generateVehicleRender(v);
    setProfileOnboardingOpen(true);
  }

  function fillDemoVehicle() { setVehicleForm(sanitizeVehicleForm({ vin: "JF1SK7AC2MG117103", brand: "Subaru", model: "Forester", generation: "SK", year: "2020", engine: "FB20", transmission: "CVT", drive: "AWD", color: "темно-синий металлик", mileage: 86000 })); }

  function saveMileage() {
    const nextData = { ...data, mileage: Number(newMileage) };
    setData(nextData);
    setTimeout(() => analyzeVehicle(nextData, profile, vehicle), 300);
  }

  function openManualForm(log = null) {
    if (log) {
      setEditingLogId(log.id);
      setWorkDraft({ normalizedId: log.normalizedId || "other", title: log.title || "", mileage: log.mileage || data.mileage, cost: log.cost || "", datePerformed: log.datePerformed || todayIso(), note: log.note || "" });
    } else {
      setEditingLogId(null);
      const option = WORK_OPTIONS[0];
      setWorkDraft({ normalizedId: option.id, title: option.label, mileage: data.mileage, cost: "", datePerformed: todayIso(), note: "" });
    }
    setManualOpen(true);
  }

  function saveWorkDraft() {
    const option = WORK_OPTIONS.find((i) => i.id === workDraft.normalizedId);
    const log = {
      id: editingLogId || Date.now(),
      normalizedId: workDraft.normalizedId,
      title: workDraft.title || option?.label || "Работа",
      mileage: Number(workDraft.mileage || data.mileage),
      cost: Number(workDraft.cost || 0),
      datePerformed: workDraft.datePerformed || "",
      dateAdded: editingLogId ? data.logs.find((i) => i.id === editingLogId)?.dateAdded || todayIso() : todayIso(),
      note: workDraft.note || "",
      source: "manual",
    };
    if (isDuplicateLog(log, data.logs, editingLogId)) {
      return alert("Такая запись уже есть в журнале");
    }
    const nextLogs = editingLogId ? data.logs.map((i) => i.id === editingLogId ? log : i) : [log, ...data.logs];
    const maxMileage = Math.max(data.mileage, ...nextLogs.map((i) => Number(i.mileage || 0)));
    const nextData = { ...data, mileage: maxMileage, logs: nextLogs };
    setData(nextData); setNewMileage(maxMileage); setManualOpen(false); setEditingLogId(null);
    setTimeout(() => analyzeVehicle(nextData, profile, vehicle), 300);
  }

  function applyPendingLogs() {
    const normalized = pendingLogs.map((log) => ({
      id: Date.now() + Math.random(),
      normalizedId: log.normalizedId || "other",
      title: log.title,
      mileage: Number(log.mileage || data.mileage),
      cost: Number(log.cost || 0),
      datePerformed: log.datePerformed || "",
      dateAdded: todayIso(),
      note: log.note || "",
      source: "scanned",
    }));
    const maxMileage = Math.max(data.mileage, pendingDocMileage || 0, ...normalized.map((l) => Number(l.mileage || 0)));
    const uniqueLogs = normalized.filter((log, index, list) => {
      const duplicateInJournal = isDuplicateLog(log, data.logs);
      const duplicateInBatch = list.findIndex((item) => logFingerprint(item) === logFingerprint(log)) !== index;
      return !duplicateInJournal && !duplicateInBatch;
    });
    if (!uniqueLogs.length) {
      alert("Все распознанные записи уже есть в журнале");
      return;
    }
    const nextData = { ...data, mileage: maxMileage, logs: [...uniqueLogs, ...data.logs] };
    setData(nextData); setNewMileage(maxMileage); setWorkDraft((p) => ({ ...p, mileage: maxMileage }));
    setPendingLogs([]); setPendingDocMileage(null); setTab("journal");
    setTimeout(() => analyzeVehicle(nextData, profile, vehicle), 300);
  }

  function updatePendingLog(tempId, field, value) { setPendingLogs((prev) => prev.map((l) => l.tempId === tempId ? { ...l, [field]: value } : l)); }
  function removePendingLog(tempId) { setPendingLogs((prev) => prev.filter((l) => l.tempId !== tempId)); }

  function deleteLog(id) {
    if (!confirm("Удалить запись из журнала?")) return;
    const nextData = { ...data, logs: data.logs.filter((l) => l.id !== id) };
    setData(nextData);
    setTimeout(() => analyzeVehicle(nextData, profile, vehicle), 300);
  }

  function resetData() {
    if (!confirm("Сбросить данные Motrix?")) return;
    ["autopulse-data","autopulse-vehicle","autopulse-profile","autopulse-analysis","autopulse-owner-profile","autopulse-reminders", CHAT_KEY, RENDER_KEY].forEach((k) => localStorage.removeItem(k));
    setVehicle(null); setProfile(null); setAnalysis(null); setOwnerProfile(null);
    setData(defaultData); setNewMileage(defaultData.mileage); setChat([]); setReminders([]);
    clearVehicleRender();
    setVehicleForm({ vin: "", brand: "", model: "", generation: "", year: "", engine: "", transmission: "", drive: "", color: "", mileage: "" });
    setTab("home");
  }

  function changeVehicle() {
    if (!confirm("Сменить автомобиль? История текущего авто будет очищена в этом прототипе.")) return;
    ["autopulse-data","autopulse-vehicle","autopulse-profile","autopulse-analysis","autopulse-owner-profile","autopulse-reminders", RENDER_KEY].forEach((k) => localStorage.removeItem(k));
    setVehicle(null); setProfile(null); setAnalysis(null); setOwnerProfile(null);
    setData(defaultData); setNewMileage(defaultData.mileage); setReminders([]);
    clearVehicleRender();
    setVehicleForm({ vin: "", brand: "", model: "", generation: "", year: "", engine: "", transmission: "", drive: "", color: "", mileage: "" });
    setTab("home");
  }

  function clearChatHistory() {
    setChat([]);
    localStorage.removeItem(CHAT_KEY);
  }

  // ── Onboarding (no vehicle yet) ───────────────────────────────────────────
  if (!vehicle) {
    return (
      <div className="app mx-app-shell">
        <WelcomeScreen
          vehicleForm={vehicleForm}
          updateVehicleField={updateVehicleField}
          parseStsPhoto={parseStsPhoto}
          detectVehicleByVin={detectVehicleByVin}
          saveVehicleManually={saveVehicleManually}
          fillDemoVehicle={fillDemoVehicle}
          isParsingSts={isParsingSts}
          isDetecting={isDetecting}
        />
      </div>
    );
  }

  // ── Main app ──────────────────────────────────────────────────────────────
  return (
    <div className="app">
      <div className="topbar">
        <span className="topbar-brand">Motrix</span>
        {isAnalyzing && <span className="topbar-analyzing">Анализирую...</span>}
      </div>

      {/* Owner profile onboarding */}
      {profileOnboardingOpen && (
        <OnboardingProfile
          onSave={saveOwnerProfile}
          onSkip={() => { setProfileOnboardingOpen(false); setTab("home"); setTimeout(() => analyzeVehicle(data, profile, vehicle), 300); }}
        />
      )}

      {/* Pending docs confirmation */}
      {pendingLogs.length > 0 && (
        <div className="overlay">
          <div className="overlay-scroll">
            <div className="bottom-sheet">
              <div className="sheet-handle" />
              <div className="sheet-title">Распознанные работы</div>
              {pendingDocMileage && pendingDocMileage > data.mileage && (
                <div className="info-card" style={{ marginBottom: 12 }}>
                  <div className="info-card-title">Пробег из документа</div>
                  <div className="info-card-body">
                    {pendingDocMileage.toLocaleString("ru-RU")} км — будет применён как текущий пробег.
                  </div>
                </div>
              )}
              {pendingLogs.map((log, index) => (
                <div className="pending-item" key={log.tempId}>
                  <div className="pending-item-header">
                    <span className="pending-item-num">Работа {index + 1}</span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {log.confidence && <span className={`confidence-chip ${log.confidence}`}>{log.confidence}</span>}
                      <button className="pending-remove-btn" onClick={() => removePendingLog(log.tempId)}>✕</button>
                    </div>
                  </div>
                  {log.sourceText && <div className="source-text-hint">«{log.sourceText}»</div>}
                  <select value={log.normalizedId} onChange={(e) => { const opt = WORK_OPTIONS.find((i) => i.id === e.target.value); updatePendingLog(log.tempId, "normalizedId", e.target.value); updatePendingLog(log.tempId, "title", opt?.label || log.title); }}>
                    {WORK_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                  <input value={log.title} onChange={(e) => updatePendingLog(log.tempId, "title", e.target.value)} placeholder="Название" />
                  <input type="number" value={log.mileage} onChange={(e) => updatePendingLog(log.tempId, "mileage", e.target.value)} placeholder="Пробег" />
                  <input type="number" value={log.cost} onChange={(e) => updatePendingLog(log.tempId, "cost", e.target.value)} placeholder="Стоимость, ₽" />
                  <input type="date" value={log.datePerformed} onChange={(e) => updatePendingLog(log.tempId, "datePerformed", e.target.value)} />
                  <input value={log.note} onChange={(e) => updatePendingLog(log.tempId, "note", e.target.value)} placeholder="Комментарий" />
                </div>
              ))}
              <div className="sheet-row">
                <button className="btn btn-blue" onClick={applyPendingLogs}>Добавить в журнал</button>
                <button className="btn btn-gray" onClick={() => { setPendingLogs([]); setPendingDocMileage(null); }}>Закрыть</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual add / edit sheet */}
      {manualOpen && (
        <div className="overlay" onClick={() => setManualOpen(false)}>
          <div className="overlay-scroll">
            <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="sheet-handle" />
              <div className="sheet-title">{editingLogId ? "Редактировать работу" : "Добавить работу"}</div>
              <select value={workDraft.normalizedId} onChange={(e) => { const opt = WORK_OPTIONS.find((i) => i.id === e.target.value); setWorkDraft((p) => ({ ...p, normalizedId: e.target.value, title: opt?.label || p.title })); }}>
                {WORK_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
              <input value={workDraft.title} onChange={(e) => setWorkDraft((p) => ({ ...p, title: e.target.value }))} placeholder="Название работы" />
              <input type="number" value={workDraft.mileage} onChange={(e) => setWorkDraft((p) => ({ ...p, mileage: e.target.value }))} placeholder="Пробег" />
              <input type="number" value={workDraft.cost} onChange={(e) => setWorkDraft((p) => ({ ...p, cost: e.target.value }))} placeholder="Стоимость, ₽" />
              <input type="date" value={workDraft.datePerformed} onChange={(e) => setWorkDraft((p) => ({ ...p, datePerformed: e.target.value }))} />
              <input value={workDraft.note} onChange={(e) => setWorkDraft((p) => ({ ...p, note: e.target.value }))} placeholder="Комментарий" />
              <div className="sheet-row">
                <button className="btn btn-blue" onClick={saveWorkDraft}>Применить</button>
                <button className="btn btn-gray" onClick={() => setManualOpen(false)}>Закрыть</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Screens */}
      {tab === "home" && (
        <HouseHubScreen
          estate={estate}
          vehicle={vehicle}
          vehicleBrain={orch}
          reminders={reminders}
          onOpenGarage={() => setTab("garage")}
          onOpenDocs={() => setTab("docs")}
          onOpenAi={() => setTab("ai")}
          onOpenProfile={() => setProfileOnboardingOpen(true)}
          onManualAdd={() => openManualForm()}
        />
      )}
      {tab === "garage" && (
        <HomeScreen
          vehicle={vehicle}
          mileage={data.mileage}
          newMileage={newMileage}
          setNewMileage={setNewMileage}
          saveMileage={saveMileage}
          healthScore={orch.healthScore}
          urgentActions={orch.urgentActions}
          upcomingItems={orch.upcomingItems}
          costForecast={orch.costForecast}
          lastService={orch.lastService}
          mileagePace={orch.mileagePace}
          mileagePaceData={orch.mileagePaceData}
          statusSentence={orch.statusSentence}
          primaryAction={orch.primaryAction}
          reminders={reminders}
          vehicleRender={vehicleRender}
          isGeneratingRender={isGeneratingRender}
          isParsingDoc={isParsingDoc}
          onScan={parseServiceDocument}
          onManualAdd={() => openManualForm()}
          onOpenProfile={() => setProfileOnboardingOpen(true)}
          onReminderDismiss={handleReminderDismiss}
          onReminderDone={handleReminderDone}
        />
      )}
      {tab === "docs" && (
        <DocumentsScreen
          estate={estate}
          vehicle={vehicle}
          data={data}
          ownerProfile={ownerProfile}
          analysis={analysis}
          onScan={parseServiceDocument}
          isParsingDoc={isParsingDoc}
        />
      )}
      {tab === "journal" && (
        <JournalScreen
          logs={data.logs}
          isParsingDoc={isParsingDoc}
          onScan={parseServiceDocument}
          onManualAdd={() => openManualForm()}
          onEdit={openManualForm}
          onDelete={deleteLog}
        />
      )}
      {tab === "passport" && (
        <PassportScreen
          vehicle={vehicle}
          schedule={orch.schedule}
          analysis={analysis}
          serviceRules={orch.serviceRules}
          predictions={orch.predictions}
          totalSpent={orch.totalSpent}
          profile={profile}
          ownerProfile={ownerProfile}
          logCount={orch.logCount}
          healthScore={orch.healthScore}
          costForecast={orch.costForecast}
          mileagePace={orch.mileagePace}
          mileagePaceData={orch.mileagePaceData}
          insights={orch.insights}

        />
      )}
      {tab === "ai" && (
        <AiScreen
          chat={chat}
          question={question}
          setQuestion={setQuestion}
          isAsking={isAsking}
          onAsk={askAi}
          vehicle={vehicle}
          ownerProfile={ownerProfile}
          localBriefing={orch.localBriefing}
          quickQuestions={orch.quickQuestions}
          mileage={data.mileage}
        />
      )}
      {tab === "more" && (
        <MoreScreen
          serviceRules={orch.serviceRules}
          schedule={orch.schedule}
          data={data}
          totalSpent={orch.totalSpent}
          profile={profile}
          analysis={analysis}
          ownerProfile={ownerProfile}
          onReset={resetData}
          vehicle={vehicle}
          onChangeVehicle={changeVehicle}
          onRegenerateRender={() => generateVehicleRender(vehicle, { force: true })}
          isGeneratingRender={isGeneratingRender}
          onClearChat={clearChatHistory}
          chatCount={chat.length}
        />
      )}

      <BottomNav tab={tab} setTab={setTab} reminderCount={reminders.length} />
    </div>
  );
}
