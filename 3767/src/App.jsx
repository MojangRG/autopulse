import { useEffect, useMemo, useState } from "react";
import BottomNav from "./components/BottomNav";
import "./App.css";

const defaultVehicle = null;

const WORK_OPTIONS = [
  { id: "engine_service", label: "ТО двигателя" },
  { id: "engine_oil", label: "Замена масла двигателя" },
  { id: "oil_filter", label: "Замена масляного фильтра" },
  { id: "cabin_filter", label: "Замена салонного фильтра" },
  { id: "air_filter", label: "Замена воздушного фильтра" },
  { id: "spark_plugs", label: "Замена свечей зажигания" },
  { id: "cvt_fluid", label: "Замена масла CVT" },
  { id: "diff_fluid", label: "Замена масла редукторов" },
  { id: "brake_fluid", label: "Замена тормозной жидкости" },
  { id: "front_pads", label: "Замена передних колодок" },
  { id: "front_discs", label: "Замена передних тормозных дисков" },
  { id: "rear_pads", label: "Замена задних колодок" },
  { id: "rear_discs", label: "Замена задних тормозных дисков" },
  { id: "fuel_cleaning", label: "Чистка топливной системы" },
  { id: "suspension_check", label: "Диагностика подвески" },
  { id: "other", label: "Другое" },
];

const DEFAULT_RULES = [
  { id: "engine_oil", name: "Масло двигателя", intervalKm: 10000, warningBeforeKm: 2000, severity: "high", notes: "По вашей истории меняется каждые 10 000 км." },
  { id: "oil_filter", name: "Масляный фильтр", intervalKm: 10000, warningBeforeKm: 2000, severity: "high", notes: "Обычно меняется вместе с маслом двигателя." },
  { id: "cabin_filter", name: "Салонный фильтр", intervalKm: 10000, warningBeforeKm: 2000, severity: "medium", notes: "Для комфорта и вентиляции." },
  { id: "air_filter", name: "Воздушный фильтр", intervalKm: 15000, warningBeforeKm: 3000, severity: "medium", notes: "В пыльных условиях менять чаще." },
  { id: "spark_plugs", name: "Свечи зажигания", intervalKm: 100000, warningBeforeKm: 10000, severity: "medium", notes: "Контроль к 95-100 тыс. км." },
  { id: "cvt_fluid", name: "Масло CVT", intervalKm: 60000, warningBeforeKm: 10000, severity: "high", notes: "Критичный узел для ресурса вариатора." },
  { id: "diff_fluid", name: "Масло редукторов", intervalKm: 60000, warningBeforeKm: 10000, severity: "medium", notes: "Передний и задний редукторы." },
  { id: "brake_fluid", name: "Тормозная жидкость", intervalKm: 40000, warningBeforeKm: 5000, severity: "high", notes: "Также контролировать по сроку 2 года." },
];

const defaultData = {
  mileage: 86000,
  logs: [
    { id: 1, normalizedId: "engine_service", title: "ТО двигателя", mileage: 82000, cost: 0, datePerformed: "", dateAdded: "2026-06-12", note: "Масло, масляный фильтр, салонный фильтр, тормозная жидкость" },
    { id: 2, normalizedId: "fuel_cleaning", title: "Чистка топливной системы", mileage: 72000, cost: 0, datePerformed: "", dateAdded: "2026-06-12", note: "" },
    { id: 3, normalizedId: "front_discs", title: "Передние тормозные диски и колодки", mileage: 68000, cost: 0, datePerformed: "", dateAdded: "2026-06-12", note: "" },
  ],
};

function todayIso() { return new Date().toISOString().slice(0, 10); }
function rub(value) { return Number(value || 0).toLocaleString("ru-RU") + " ₽"; }
function km(value) { return Number(value || 0).toLocaleString("ru-RU") + " км"; }

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [detailsSection, setDetailsSection] = useState("vehicle");
  const [vehicle, setVehicle] = useState(() => JSON.parse(localStorage.getItem("autopulse-vehicle") || "null") || defaultVehicle);
  const [profile, setProfile] = useState(() => JSON.parse(localStorage.getItem("autopulse-profile") || "null"));
  const [analysis, setAnalysis] = useState(() => JSON.parse(localStorage.getItem("autopulse-analysis") || "null"));
  const [data, setData] = useState(() => JSON.parse(localStorage.getItem("autopulse-data") || "null") || defaultData);
  const [vehicleForm, setVehicleForm] = useState({ vin: "", brand: "", model: "", generation: "", year: "", engine: "", transmission: "", drive: "", mileage: 86000 });
  const [newMileage, setNewMileage] = useState(data.mileage);
  const [manualOpen, setManualOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState(null);
  const [workDraft, setWorkDraft] = useState({ normalizedId: "engine_service", title: "ТО двигателя", mileage: data.mileage, cost: "", datePerformed: todayIso(), note: "" });
  const [pendingLogs, setPendingLogs] = useState([]);
  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [isParsingSts, setIsParsingSts] = useState(false);
  const [isParsingDoc, setIsParsingDoc] = useState(false);

  useEffect(() => { localStorage.setItem("autopulse-data", JSON.stringify(data)); }, [data]);
  useEffect(() => { if (vehicle) localStorage.setItem("autopulse-vehicle", JSON.stringify(vehicle)); }, [vehicle]);

  const totalSpent = useMemo(() => data.logs.reduce((sum, log) => sum + Number(log.cost || 0), 0), [data.logs]);
  const serviceRules = useMemo(() => profile?.serviceItems?.length ? profile.serviceItems : DEFAULT_RULES, [profile]);
  const schedule = useMemo(() => serviceRules.filter((r) => r.intervalKm).map((rule) => {
    const title = String(rule.name || "").toLowerCase();
    const id = rule.id;
    const matchedLogs = data.logs.filter((log) => {
      const logTitle = String(log.title || "").toLowerCase();
      const logId = log.normalizedId;
      if (logId && id && logId === id) return true;
      if (id === "engine_oil" && (logId === "engine_service" || logTitle.includes("масл"))) return true;
      if (id === "oil_filter" && (logId === "engine_service" || logTitle.includes("масля"))) return true;
      if (id === "cabin_filter" && (logId === "engine_service" || logTitle.includes("салон"))) return true;
      return logTitle.includes(title);
    });
    const lastMileage = matchedLogs.length ? Math.max(...matchedLogs.map((log) => Number(log.mileage || 0))) : 0;
    const nextMileage = lastMileage + Number(rule.intervalKm);
    const left = nextMileage - Number(data.mileage || 0);
    let status = "Норма";
    if (left <= 0) status = "Просрочено";
    else if (left <= Number(rule.warningBeforeKm || 2000)) status = "Скоро";
    return { ...rule, lastMileage, nextMileage, left, status };
  }), [data, serviceRules]);
  const urgent = schedule.filter((item) => item.status !== "Норма");
  const health = Math.max(45, 100 - urgent.length * 12 - (analysis?.topPriorities?.length || 0) * 4);
  const nextPriority = analysis?.topPriorities?.[0];

  function updateVehicleField(field, value) { setVehicleForm((prev) => ({ ...prev, [field]: value })); }
  function saveProfile(profileData) { setProfile(profileData); localStorage.setItem("autopulse-profile", JSON.stringify(profileData)); }
  function saveAnalysis(analysisData) { setAnalysis(analysisData); localStorage.setItem("autopulse-analysis", JSON.stringify(analysisData)); }

  async function analyzeVehicle(customData = data, customProfile = profile, customVehicle = vehicle) {
    if (!customVehicle || !customProfile || !customData) return;
    try {
      setIsAnalyzing(true);
      const response = await fetch("/api/analyze-vehicle", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vehicle: customVehicle, profile: customProfile, data: customData }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.details || result.error || "Analysis failed");
      saveAnalysis(result.analysis);
    } catch (error) { alert("Ошибка анализа: " + error.message); }
    finally { setIsAnalyzing(false); }
  }

  async function detectVehicleByVin() {
    const vin = vehicleForm.vin.trim().toUpperCase();
    if (!vin) return alert("Введите VIN");
    try {
      setIsDetecting(true);
      const response = await fetch("/api/create-vehicle-profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vin, mileage: Number(vehicleForm.mileage || 0) }) });
      const result = await response.json();
      if (!response.ok) return alert(result.details || result.error || "Не удалось определить автомобиль");
      const nextData = { ...data, mileage: Number(vehicleForm.mileage || 0) };
      setVehicle(result.vehicle); saveProfile(result.profile); setData(nextData); setNewMileage(nextData.mileage); setWorkDraft((p) => ({ ...p, mileage: nextData.mileage })); setTab("home");
      setTimeout(() => analyzeVehicle(nextData, result.profile, result.vehicle), 300);
    } catch (error) { alert("Ошибка связи с сервером: " + error.message); }
    finally { setIsDetecting(false); }
  }

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
      setVehicleForm((prev) => ({ ...prev, vin: result.extracted?.vin || result.vehicle?.vin || prev.vin, brand: result.vehicle?.brand || result.extracted?.brand || prev.brand, model: result.vehicle?.model || result.extracted?.model || prev.model, generation: result.vehicle?.generation || prev.generation, year: result.vehicle?.year || result.extracted?.year || prev.year, engine: result.vehicle?.engine || prev.engine, transmission: result.vehicle?.transmission || prev.transmission, drive: result.vehicle?.drive || prev.drive }));
      alert("СТС распознано. Проверьте VIN и нажмите «Добавить по VIN».");
    } catch (error) { alert("Ошибка распознавания СТС: " + error.message); }
    finally { setIsParsingSts(false); event.target.value = ""; }
  }

  async function parseServiceDocument(event) {
    const originalFile = event.target.files?.[0];
    if (!originalFile) return;
    if (!vehicle) return alert("Сначала добавьте автомобиль");
    try {
      setIsParsingDoc(true);
      const file = await compressImage(originalFile);
      const formData = new FormData();
      formData.append("file", file); formData.append("vehicle", JSON.stringify(vehicle)); formData.append("profile", JSON.stringify(profile)); formData.append("mileage", String(data.mileage));
      const response = await fetch("/api/parse-service-doc", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.details || result.error || "Document parse failed");
      const parsedLogs = Array.isArray(result.logs) ? result.logs : [];
      if (!parsedLogs.length) return alert("Не удалось найти работы в документе");
      setPendingLogs(parsedLogs.map((log, index) => ({ tempId: Date.now() + index, normalizedId: log.normalizedId || "other", title: log.title || "Работа из документа", mileage: Number(log.mileage || data.mileage), cost: Number(log.cost || 0), datePerformed: log.datePerformed || log.date || todayIso(), note: log.note || "Распознано из документа" })));
    } catch (error) { alert("Ошибка обработки документа: " + error.message); }
    finally { setIsParsingDoc(false); event.target.value = ""; }
  }

  function applyPendingLogs() {
    const normalizedLogs = pendingLogs.map((log) => ({ id: Date.now() + Math.random(), normalizedId: log.normalizedId || "other", title: log.title, mileage: Number(log.mileage || data.mileage), cost: Number(log.cost || 0), datePerformed: log.datePerformed || "", dateAdded: todayIso(), note: log.note || "" }));
    const maxMileage = Math.max(data.mileage, ...normalizedLogs.map((log) => Number(log.mileage || 0)));
    const nextData = { ...data, mileage: maxMileage, logs: [...normalizedLogs, ...data.logs] };
    setData(nextData); setNewMileage(maxMileage); setWorkDraft((p) => ({ ...p, mileage: maxMileage })); setPendingLogs([]); setTab("journal");
    setTimeout(() => analyzeVehicle(nextData, profile, vehicle), 300);
  }

  function updatePendingLog(tempId, field, value) { setPendingLogs((prev) => prev.map((log) => log.tempId === tempId ? { ...log, [field]: value } : log)); }
  function removePendingLog(tempId) { setPendingLogs((prev) => prev.filter((log) => log.tempId !== tempId)); }

  function saveVehicleManually() {
    const newVehicle = { vin: vehicleForm.vin, brand: vehicleForm.brand, model: vehicleForm.model, generation: vehicleForm.generation, year: Number(vehicleForm.year), engine: vehicleForm.engine, transmission: vehicleForm.transmission, drive: vehicleForm.drive, market: "manual" };
    const nextData = { ...data, mileage: Number(vehicleForm.mileage) };
    setVehicle(newVehicle); setData(nextData); setNewMileage(nextData.mileage); setWorkDraft((p) => ({ ...p, mileage: nextData.mileage })); setTab("home");
  }
  function fillDemoVehicle() { setVehicleForm({ vin: "JF1SK7AC2MG117103", brand: "Subaru", model: "Forester", generation: "SK", year: "2020", engine: "FB20", transmission: "CVT", drive: "AWD", mileage: 86000 }); }
  function saveMileage() { const nextData = { ...data, mileage: Number(newMileage) }; setData(nextData); setTimeout(() => analyzeVehicle(nextData, profile, vehicle), 300); }
  function openManualForm(log = null) { if (log) { setEditingLogId(log.id); setWorkDraft({ normalizedId: log.normalizedId || "other", title: log.title || "", mileage: log.mileage || data.mileage, cost: log.cost || "", datePerformed: log.datePerformed || todayIso(), note: log.note || "" }); } else { setEditingLogId(null); const option = WORK_OPTIONS.find((i) => i.id === "engine_service"); setWorkDraft({ normalizedId: option.id, title: option.label, mileage: data.mileage, cost: "", datePerformed: todayIso(), note: "" }); } setManualOpen(true); }
  function saveWorkDraft() { const option = WORK_OPTIONS.find((i) => i.id === workDraft.normalizedId); const log = { id: editingLogId || Date.now(), normalizedId: workDraft.normalizedId, title: workDraft.title || option?.label || "Работа", mileage: Number(workDraft.mileage || data.mileage), cost: Number(workDraft.cost || 0), datePerformed: workDraft.datePerformed || "", dateAdded: editingLogId ? data.logs.find((i) => i.id === editingLogId)?.dateAdded || todayIso() : todayIso(), note: workDraft.note || "" }; const nextLogs = editingLogId ? data.logs.map((i) => i.id === editingLogId ? log : i) : [log, ...data.logs]; const maxMileage = Math.max(data.mileage, ...nextLogs.map((i) => Number(i.mileage || 0))); const nextData = { ...data, mileage: maxMileage, logs: nextLogs }; setData(nextData); setNewMileage(maxMileage); setManualOpen(false); setEditingLogId(null); setTimeout(() => analyzeVehicle(nextData, profile, vehicle), 300); }
  function deleteLog(id) { if (!confirm("Удалить запись из журнала?")) return; const nextData = { ...data, logs: data.logs.filter((log) => log.id !== id) }; setData(nextData); setTimeout(() => analyzeVehicle(nextData, profile, vehicle), 300); }
  function resetData() { if (confirm("Сбросить данные AutoPulse?")) { localStorage.removeItem("autopulse-data"); localStorage.removeItem("autopulse-vehicle"); localStorage.removeItem("autopulse-profile"); localStorage.removeItem("autopulse-analysis"); setVehicle(null); setProfile(null); setAnalysis(null); setData(defaultData); setNewMileage(defaultData.mileage); setChat([]); setVehicleForm({ vin: "", brand: "", model: "", generation: "", year: "", engine: "", transmission: "", drive: "", mileage: 86000 }); setTab("home"); } }

  async function askAi() {
    if (!question.trim()) return;
    const userQuestion = question;
    setQuestion(""); setIsAsking(true);
    setChat((prev) => [...prev, { role: "user", text: userQuestion }, { role: "ai", text: "Думаю..." }]);
    try {
      const response = await fetch("/api/ai-mechanic", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vehicle, profile, data, analysis, question: userQuestion }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.details || result.error || "AI mechanic failed");
      setChat((prev) => { const updated = [...prev]; updated[updated.length - 1] = { role: "ai", text: result.answer }; return updated; });
    } catch (error) { setChat((prev) => { const updated = [...prev]; updated[updated.length - 1] = { role: "ai", text: "Ошибка AI-механика: " + error.message }; return updated; }); }
    finally { setIsAsking(false); }
  }

  function goTo(section) {
    if (section === "priorities") { setTab("home"); setTimeout(() => document.getElementById("priorities")?.scrollIntoView({ behavior: "smooth" }), 100); return; }
    setDetailsSection(section); setTab("more"); setMenuOpen(false);
  }

  if (!vehicle) {
    return <div className="app"><div className="card"><h1>🚗 AutoPulse</h1><div className="section"><h3>Добавить автомобиль</h3><label className="upload-button">📷 Добавить по фото СТС<input type="file" accept="image/*" onChange={parseStsPhoto} hidden /></label>{isParsingSts && <p className="muted">Распознаю СТС...</p>}<input value={vehicleForm.vin} onChange={(e) => updateVehicleField("vin", e.target.value)} placeholder="VIN" /><input type="number" value={vehicleForm.mileage} onChange={(e) => updateVehicleField("mileage", e.target.value)} placeholder="Пробег" /><button className="full secondary" onClick={detectVehicleByVin} disabled={isDetecting}>{isDetecting ? "🧠 Создаю профиль..." : "🔍 Добавить по VIN"}</button><details className="compact-details"><summary>Ручное заполнение</summary><input value={vehicleForm.brand} onChange={(e) => updateVehicleField("brand", e.target.value)} placeholder="Марка" /><input value={vehicleForm.model} onChange={(e) => updateVehicleField("model", e.target.value)} placeholder="Модель" /><input value={vehicleForm.generation} onChange={(e) => updateVehicleField("generation", e.target.value)} placeholder="Поколение" /><input type="number" value={vehicleForm.year} onChange={(e) => updateVehicleField("year", e.target.value)} placeholder="Год выпуска" /><input value={vehicleForm.engine} onChange={(e) => updateVehicleField("engine", e.target.value)} placeholder="Двигатель" /><input value={vehicleForm.transmission} onChange={(e) => updateVehicleField("transmission", e.target.value)} placeholder="Коробка" /><input value={vehicleForm.drive} onChange={(e) => updateVehicleField("drive", e.target.value)} placeholder="Привод" /><button className="full" onClick={saveVehicleManually}>Сохранить вручную</button></details><button className="full secondary" onClick={fillDemoVehicle}>Заполнить демо Subaru</button></div></div></div>;
  }

  return <div className="app"><div className="topbar"><button className="icon-button" onClick={() => setMenuOpen(true)}>☰</button><strong>AutoPulse</strong><button className="icon-button" onClick={() => goTo("vehicle")}>⚙️</button></div>{menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)}><div className="drawer" onClick={(e) => e.stopPropagation()}><h3>Разделы</h3><button onClick={() => goTo("vehicle")}>Автомобиль</button><button onClick={() => goTo("rules")}>Регламент</button><button onClick={() => goTo("stats")}>Статистика</button><button onClick={() => goTo("settings")}>Настройки</button></div></div>}{pendingLogs.length > 0 && <div className="overlay"><div className="modal"><h3>Проверьте распознанные работы</h3><p className="muted">Можно исправить каждую строку перед добавлением в журнал.</p>{pendingLogs.map((log) => <div className="pending-row" key={log.tempId}><select value={log.normalizedId} onChange={(e) => { const option = WORK_OPTIONS.find((i) => i.id === e.target.value); updatePendingLog(log.tempId, "normalizedId", e.target.value); updatePendingLog(log.tempId, "title", option?.label || log.title); }}>{WORK_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select><input value={log.title} onChange={(e) => updatePendingLog(log.tempId, "title", e.target.value)} placeholder="Работа" /><input type="number" value={log.mileage} onChange={(e) => updatePendingLog(log.tempId, "mileage", e.target.value)} placeholder="Пробег" /><input type="number" value={log.cost} onChange={(e) => updatePendingLog(log.tempId, "cost", e.target.value)} placeholder="Стоимость" /><input type="date" value={log.datePerformed} onChange={(e) => updatePendingLog(log.tempId, "datePerformed", e.target.value)} /><button className="danger mini" onClick={() => removePendingLog(log.tempId)}>Удалить</button></div>)}<div className="row"><button className="full" onClick={applyPendingLogs}>Добавить в журнал</button><button className="full secondary" onClick={() => setPendingLogs([])}>Закрыть</button></div></div></div>}{manualOpen && <div className="overlay"><div className="modal"><h3>{editingLogId ? "Редактировать работу" : "Добавить работу"}</h3><select value={workDraft.normalizedId} onChange={(e) => { const option = WORK_OPTIONS.find((i) => i.id === e.target.value); setWorkDraft((p) => ({ ...p, normalizedId: e.target.value, title: option?.label || p.title })); }}>{WORK_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select><input value={workDraft.title} onChange={(e) => setWorkDraft((p) => ({ ...p, title: e.target.value }))} placeholder="Название работы" /><input type="number" value={workDraft.mileage} onChange={(e) => setWorkDraft((p) => ({ ...p, mileage: e.target.value }))} placeholder="Пробег" /><input type="number" value={workDraft.cost} onChange={(e) => setWorkDraft((p) => ({ ...p, cost: e.target.value }))} placeholder="Стоимость, ₽" /><input type="date" value={workDraft.datePerformed} onChange={(e) => setWorkDraft((p) => ({ ...p, datePerformed: e.target.value }))} /><input value={workDraft.note} onChange={(e) => setWorkDraft((p) => ({ ...p, note: e.target.value }))} placeholder="Комментарий" /><div className="row"><button className="full" onClick={saveWorkDraft}>Применить</button><button className="full secondary" onClick={() => setManualOpen(false)}>Закрыть</button></div></div></div>}<div className="card with-nav">{tab === "home" && <><div className="hero-card"><div className="car-visual"><div className="car-glow" /><div className="car-name"><h1>{vehicle.brand} {vehicle.model}</h1><p onClick={() => goTo("vehicle")}>{vehicle.year} • {vehicle.engine} • {vehicle.transmission} • {vehicle.drive}</p></div></div><div className="metric-grid"><button className="metric" onClick={() => goTo("priorities")}><span>Здоровье</span><strong>{health}%</strong></button><button className="metric" onClick={() => goTo("rules")}><span>К вниманию</span><strong>{analysis?.topPriorities?.length || urgent.length}</strong></button><button className="metric" onClick={() => setTab("journal")}><span>Потрачено</span><strong>{rub(totalSpent)}</strong></button><button className="metric" onClick={() => setTab("journal")}><span>Работ</span><strong>{data.logs.length}</strong></button></div></div><div className="section" id="priorities"><h3>🎯 Что важно сейчас</h3>{!analysis ? <button className="full secondary" onClick={() => analyzeVehicle()} disabled={isAnalyzing}>{isAnalyzing ? "Анализирую..." : "Получить 3 приоритета"}</button> : <>{analysis.topPriorities?.slice(0, 3).map((item, index) => <button className="priority-card" key={index} onClick={() => goTo("priorities")}><b>{index + 1}. {item.title}</b><span>{item.severity} • {item.category}</span></button>)}<button className="link-button" onClick={() => analyzeVehicle()} disabled={isAnalyzing}>{isAnalyzing ? "Обновляю..." : "Обновить анализ"}</button></>}</div><div className="section compact-action"><label className="upload-button">📄 Добавить работу по фото<input type="file" accept="image/*,.pdf" onChange={parseServiceDocument} hidden /></label>{isParsingDoc && <p className="muted">Читаю документ...</p>}<button className="link-button" onClick={() => openManualForm()}>✏️ Вручную</button></div>{nextPriority && <div className="small-note" onClick={() => goTo("priorities")}>Главный фокус: {nextPriority.title}</div>}</>}{tab === "journal" && <div className="section"><h3>Журнал работ</h3><div className="money-card"><span>Всего потрачено</span><strong>{rub(totalSpent)}</strong></div><label className="upload-button">📄 Загрузить заказ-наряд / чек<input type="file" accept="image/*,.pdf" onChange={parseServiceDocument} hidden /></label><button className="full secondary" onClick={() => openManualForm()}>✏️ Добавить вручную</button><div className="table"><div className="table-head"><span>Дата</span><span>Работа</span><span>₽</span><span></span></div>{[...data.logs].sort((a, b) => Number(b.mileage) - Number(a.mileage)).map((log) => <div className="table-row" key={log.id}><span>{log.datePerformed || "—"}<small>{km(log.mileage)}</small></span><span>{log.title}<small>Внесено: {log.dateAdded || "—"}</small></span><span>{Number(log.cost || 0) ? rub(log.cost) : "—"}</span><span className="row-actions"><button onClick={() => openManualForm(log)}>✏️</button><button onClick={() => deleteLog(log.id)}>🗑️</button></span></div>)}</div></div>}{tab === "ai" && <div className="section"><h3>AI-механик</h3><textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Например: еду на 3000 км, что проверить?" /><button className="full" onClick={askAi} disabled={isAsking}>{isAsking ? "Думаю..." : "Спросить"}</button><div className="chat">{chat.map((msg, index) => <div className={`message ${msg.role}`} key={index}>{msg.text}</div>)}</div></div>}{tab === "more" && <div className="section"><h3>Ещё</h3><div className="segment"><button className={detailsSection === "vehicle" ? "active" : ""} onClick={() => setDetailsSection("vehicle")}>Авто</button><button className={detailsSection === "rules" ? "active" : ""} onClick={() => setDetailsSection("rules")}>Регламент</button><button className={detailsSection === "stats" ? "active" : ""} onClick={() => setDetailsSection("stats")}>Статистика</button><button className={detailsSection === "settings" ? "active" : ""} onClick={() => setDetailsSection("settings")}>Настройки</button></div>{detailsSection === "vehicle" && <div className="details-list">{Object.entries(vehicle).map(([key, value]) => <div className="detail-row" key={key}><span>{key}</span><strong>{String(value || "—")}</strong></div>)}</div>}{detailsSection === "rules" && <div>{serviceRules.slice().sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] ?? 3) - ({ high: 0, medium: 1, low: 2 }[b.severity] ?? 3)).map((item, index) => <details className="rule-details" open={index < 3} key={item.id || item.name}><summary>{item.name}<span>{item.severity || "medium"}</span></summary><p>{item.intervalKm ? `Интервал: ${km(item.intervalKm)}. ` : "Интервал: по состоянию. "}{item.intervalMonths ? `Срок: ${item.intervalMonths} мес. ` : ""}</p><p>{item.notes}</p></details>)}</div>}{detailsSection === "stats" && <div className="details-list"><div className="detail-row"><span>Всего потрачено</span><strong>{rub(totalSpent)}</strong></div><div className="detail-row"><span>Записей в журнале</span><strong>{data.logs.length}</strong></div><div className="detail-row"><span>Текущий пробег</span><strong>{km(data.mileage)}</strong></div><div className="detail-row"><span>Пунктов регламента</span><strong>{serviceRules.length}</strong></div></div>}{detailsSection === "settings" && <button className="danger full" onClick={resetData}>Сбросить данные</button>}</div>}<BottomNav tab={tab} setTab={setTab} /></div></div>;
}
