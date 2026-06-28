import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, Bot, Camera, Car, Check, ChevronRight, CircleHelp,
  Download, FileSearch, Gauge, History, Home, Plus, ReceiptText,
  Settings, ShieldCheck, Sparkles, Trash2, Upload, X,
} from "./components/Icons.jsx";
import { startCheckout } from "./services/billing.js";
import { clearState, exportState, importState, loadState, saveState } from "./services/storage.js";
import { lookupVin, VinProviderUnavailableError } from "./services/vinProvider.js";
import "./App.css";

const EMPTY_STATE = {
  version: 2,
  vehicle: null,
  baseline: null,
  events: [],
  reviews: [],
  chat: [],
  plan: "free",
  consentAt: null,
  createdAt: new Date().toISOString(),
};

const NAV = [
  ["garage", Home, "Гараж"],
  ["history", History, "История"],
  ["mechanic", Bot, "Механик"],
  ["passport", Car, "Паспорт"],
];

const VERDICT = {
  necessary: { label: "Обосновано", tone: "good" },
  question: { label: "Уточнить", tone: "warn" },
  insufficient: { label: "Не доказано", tone: "bad" },
};

function initialState() {
  const saved = loadState();
  if (saved?.vehicle) return { ...EMPTY_STATE, ...saved, version: 2, baseline: saved.baseline || null };
  try {
    const vehicle = JSON.parse(localStorage.getItem("autopulse-vehicle") || "null");
    const data = JSON.parse(localStorage.getItem("autopulse-data") || "null");
    if (vehicle) return {
      ...EMPTY_STATE,
      vehicle: { ...vehicle, mileage: Number(data?.mileage || vehicle.mileage || 0) },
      events: (data?.logs || []).map((item) => ({ ...item, status: "completed", source: item.source || "legacy" })),
    };
  } catch { /* Ignore a damaged legacy snapshot. */ }
  return EMPTY_STATE;
}

function money(value) { const number = Number(value || 0); return number ? `${number.toLocaleString("ru-RU")} ₽` : "—"; }
function km(value) { return `${Number(value || 0).toLocaleString("ru-RU")} км`; }
function carName(vehicle) { return [vehicle?.brand, vehicle?.model].filter(Boolean).join(" ") || "Автомобиль"; }
function formatDate(value) { return value ? new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "Дата не указана"; }

function readImage(file, maxWidth = 1400, quality = 0.78) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function coverage(state) {
  const checks = [
    state.vehicle?.brand, state.vehicle?.model, state.vehicle?.year, state.vehicle?.mileage,
    state.baseline?.history, state.baseline?.lastOil, state.baseline?.transmission,
    state.baseline?.brakeFluid, state.baseline?.monthlyKm,
  ];
  return Math.round(checks.filter((value) => value && value !== "unknown").length / checks.length * 100);
}

function deriveGarage(state) {
  const planned = state.events.filter((item) => item.status === "planned");
  const completed = state.events.filter((item) => item.status === "completed");
  const latestReview = state.reviews[0];
  const disputed = latestReview?.items?.filter((item) => item.verdict === "insufficient").length || 0;
  const forecast = planned.reduce((sum, item) => sum + Number(item.cost || 0), 0);
  const known = coverage(state);

  if (!state.baseline) return { tone: "unknown", label: "Нужна исходная точка", title: "Расскажите, что известно о машине", body: "Пять коротких ответов помогут Motrix отличать подтверждённую историю от предположений.", action: "Заполнить историю", known, planned, forecast };
  if (state.baseline.lastOil === "gt10") return { tone: "urgent", label: "Требует внимания", title: "Проверьте обслуживание двигателя", body: "По вашим словам после последней замены масла прошло больше 10 000 км. Подтвердите пробег по чеку или запланируйте обслуживание.", action: "Добавить в план", known, planned, forecast };
  if (disputed) return { tone: "warn", label: "Последний документ", title: `${disputed} ${disputed === 1 ? "позиция не подтверждена" : "позиции не подтверждены"}`, body: latestReview.summary, action: "Открыть разбор", known, planned, forecast };
  if (planned.length) return { tone: "watch", label: "Следующий шаг", title: planned[0].title, body: planned[0].reason || "Работа сохранена в вашем плане обслуживания.", action: "Открыть план", known, planned, forecast };
  if (state.baseline.history === "unknown" || state.baseline.lastOil === "unknown") return { tone: "unknown", label: "Пробел в истории", title: "Восстановите последнее обслуживание", body: "Motrix не знает, когда менялись масло и ключевые жидкости. Добавьте документ или событие, чтобы не строить рекомендации вслепую.", action: "Добавить документ", known, planned, forecast };
  if (!completed.length && !state.reviews.length) return { tone: "calm", label: "Профиль создан", title: "Добавьте первый факт об автомобиле", body: "Чек, заказ-наряд или выполненная работа превратят пустой профиль в личную историю машины.", action: "Добавить событие", known, planned, forecast };
  return { tone: "good", label: "По известным данным", title: "Срочных действий не видно", body: "Motrix не нашёл оснований для тревоги в сохранённой истории. Продолжайте добавлять обслуживание и обновлять пробег.", action: "Добавить событие", known, planned, forecast };
}

function Modal({ title, children, onClose, wide = false }) {
  return <div className="overlay" onMouseDown={onClose}><section className={`modal${wide ? " wide" : ""}`} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><header><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Закрыть"><X size={20} /></button></header>{children}</section></div>;
}

function Setup({ onComplete }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ vin: "", brand: "", model: "", year: "", mileage: "", engine: "", transmission: "", photo: "" });
  const [baseline, setBaseline] = useState({ history: "", lastOil: "", transmission: "", brakeFluid: "", monthlyKm: "" });
  const [vinState, setVinState] = useState({ loading: false, message: "" });
  const photoRef = useRef(null);
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function usePhoto(file) { if (!file) return; const photo = await readImage(file); setForm((current) => ({ ...current, photo })); }
  async function detectVin() {
    const vin = form.vin.trim().toUpperCase();
    if (vin.length !== 17) return setVinState({ loading: false, message: "VIN должен содержать 17 символов." });
    setVinState({ loading: true, message: "" });
    try { const vehicle = await lookupVin(vin); setForm((current) => ({ ...current, ...vehicle, vin })); setVinState({ loading: false, message: "Проверьте найденные данные." }); }
    catch (error) { setVinState({ loading: false, message: error instanceof VinProviderUnavailableError ? error.message : error.message }); }
  }
  function finish() {
    if (Object.values(baseline).some((value) => !value)) return;
    onComplete({ ...form, vin: form.vin.trim().toUpperCase(), year: Number(form.year), mileage: Number(form.mileage) }, baseline);
  }

  return <main className="setup-page">
    <div className="brand-lockup"><div className="brand-mark">M</div><b>Motrix</b><span>Личный гараж</span></div>
    {step === 1 ? <>
      <section className="setup-copy"><span className="kicker">Ваша машина в центре</span><h1>Создайте цифрового двойника автомобиля</h1><p>Motrix будет помнить обслуживание, документы и контекст, чтобы каждый следующий совет относился именно к вашей машине.</p></section>
      <section className="setup-card">
        <button className={`photo-picker${form.photo ? " has-photo" : ""}`} onClick={() => photoRef.current?.click()} style={form.photo ? { backgroundImage: `url(${form.photo})` } : undefined}>{!form.photo && <><Camera size={30} /><b>Добавить фото автомобиля</b><span>Можно сделать позже</span></>}</button>
        <input ref={photoRef} type="file" accept="image/*" hidden onChange={(event) => usePhoto(event.target.files?.[0])} />
        <div className="vin-row"><label><span>VIN, необязательно</span><input value={form.vin} onChange={update("vin")} maxLength={17} placeholder="17 символов" /></label><button className="secondary-button" onClick={detectVin} disabled={vinState.loading}>{vinState.loading ? "Ищу" : "Найти"}</button></div>
        {vinState.message && <p className="form-message">{vinState.message}</p>}
        <div className="form-grid"><label><span>Марка</span><input value={form.brand} onChange={update("brand")} placeholder="Subaru" /></label><label><span>Модель</span><input value={form.model} onChange={update("model")} placeholder="Forester" /></label><label><span>Год</span><input type="number" value={form.year} onChange={update("year")} placeholder="2020" /></label><label><span>Пробег</span><input type="number" value={form.mileage} onChange={update("mileage")} placeholder="88000" /></label><label><span>Двигатель</span><input value={form.engine} onChange={update("engine")} placeholder="FB20" /></label><label><span>Коробка</span><input value={form.transmission} onChange={update("transmission")} placeholder="CVT" /></label></div>
        <button className="primary-button" disabled={!form.brand || !form.model || !form.year || !form.mileage} onClick={() => setStep(2)}>Продолжить <ChevronRight size={18} /></button>
      </section>
    </> : <>
      <section className="setup-copy compact"><span className="kicker">Исходная точка</span><h1>Что известно об обслуживании?</h1><p>Не нужно вспоминать точные даты. Честное «не знаю» полезнее выдуманного регламента.</p></section>
      <section className="setup-card questionnaire">
        <Choice title="История автомобиля" value={baseline.history} onChange={(value) => setBaseline((state) => ({ ...state, history: value }))} options={[["full","Знаю полностью"],["partial","Знаю частично"],["unknown","Почти не знаю"]]} />
        <Choice title="Последняя замена масла" value={baseline.lastOil} onChange={(value) => setBaseline((state) => ({ ...state, lastOil: value }))} options={[["lt5","До 5 тыс. км"],["5to10","5–10 тыс. км"],["gt10","Больше 10 тыс."],["unknown","Не знаю"]]} />
        <Choice title="Обслуживание коробки" value={baseline.transmission} onChange={(value) => setBaseline((state) => ({ ...state, transmission: value }))} options={[["recent","Подтверждено"],["old","Давно"],["unknown","Не знаю"]]} />
        <Choice title="Тормозная жидкость за 2 года" value={baseline.brakeFluid} onChange={(value) => setBaseline((state) => ({ ...state, brakeFluid: value }))} options={[["yes","Менялась"],["no","Не менялась"],["unknown","Не знаю"]]} />
        <Choice title="Пробег в месяц" value={baseline.monthlyKm} onChange={(value) => setBaseline((state) => ({ ...state, monthlyKm: value }))} options={[["500","До 500 км"],["1200","500–1500 км"],["2500","1500–3000 км"],["4000","Больше 3000 км"]]} />
        <div className="setup-actions"><button className="secondary-button" onClick={() => setStep(1)}>Назад</button><button className="primary-button" onClick={finish}>Открыть гараж</button></div>
      </section>
    </>}
  </main>;
}

function Choice({ title, value, onChange, options }) {
  return <div className="choice-block"><b>{title}</b><div>{options.map(([id, label]) => <button key={id} className={value === id ? "selected" : ""} onClick={() => onChange(id)}>{label}</button>)}</div></div>;
}

function Topbar({ state, view, onBack, onSettings }) {
  const isNested = !NAV.some(([id]) => id === view);
  return <header className="topbar">{isNested ? <button className="back-button" onClick={onBack}>‹ <span>Назад</span></button> : <div><span>Motrix</span><b>{carName(state.vehicle)}</b></div>}<div className="top-actions">{state.plan === "pro" && <em>PRO</em>}<button className="icon-button" onClick={onSettings}><Settings size={20} /></button></div></header>;
}

function Garage({ state, garage, onPrimary, onAdd, onReview, onHistory }) {
  const latest = state.events[0];
  return <div className="garage-screen">
    <section className={`car-hero${state.vehicle.photo ? " has-photo" : ""}`} style={state.vehicle.photo ? { backgroundImage: `url(${state.vehicle.photo})` } : undefined}>
      <div className="car-hero-shade" /><div className="car-identity"><span>{state.vehicle.year} · {state.vehicle.engine || "Двигатель не указан"}</span><h1>{carName(state.vehicle)}</h1><p>{km(state.vehicle.mileage)}</p></div>
      {!state.vehicle.photo && <div className="car-placeholder"><Car size={48} /><span>Добавьте фото своей машины</span></div>}
      <button className="hero-add" onClick={onAdd}><Plus size={22} /> Добавить событие</button>
    </section>
    <div className="garage-content">
      <section className={`now-card ${garage.tone}`}><header><span>{garage.label}</span><ShieldCheck size={22} /></header><h2>{garage.title}</h2><p>{garage.body}</p><button onClick={onPrimary}>{garage.action}<ChevronRight size={18} /></button></section>
      <section className="garage-metrics"><div><span>История</span><b>{garage.known}%</b><small>данных заполнено</small></div><div><span>Ближайшие траты</span><b>{money(garage.forecast)}</b><small>{garage.planned.length ? `${garage.planned.length} в плане` : "план пуст"}</small></div><div><span>Документы</span><b>{state.reviews.length}</b><small>разобрано Motrix</small></div></section>
      <section className="garage-tools"><button onClick={onReview}><FileSearch size={22} /><span><b>Разобрать документ СТО</b><small>Проверить назначения до оплаты</small></span><ChevronRight size={18} /></button><button onClick={onHistory}><History size={22} /><span><b>Вся история автомобиля</b><small>{latest ? `Последнее: ${latest.title}` : "Пока нет событий"}</small></span><ChevronRight size={18} /></button></section>
    </div>
  </div>;
}

function HistoryScreen({ state, setState, onAdd }) {
  const [filter, setFilter] = useState("all");
  const items = state.events.filter((item) => filter === "all" || item.status === filter).sort((a,b) => String(b.datePerformed || b.createdAt || "").localeCompare(String(a.datePerformed || a.createdAt || "")));
  function remove(id) { if (confirm("Удалить событие?")) setState((current) => ({ ...current, events: current.events.filter((item) => item.id !== id) })); }
  function complete(id) { setState((current) => ({ ...current, events: current.events.map((item) => item.id === id ? { ...item, status: "completed", datePerformed: new Date().toISOString().slice(0,10) } : item) })); }
  return <div className="screen"><div className="page-title"><div><span>Память автомобиля</span><h1>История</h1></div><button className="square-action" onClick={onAdd}><Plus size={21} /></button></div><div className="segments"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Все</button><button className={filter === "completed" ? "active" : ""} onClick={() => setFilter("completed")}>Выполнено</button><button className={filter === "planned" ? "active" : ""} onClick={() => setFilter("planned")}>План</button></div>{items.length ? <div className="timeline">{items.map((item) => <article key={item.id}><div className={`timeline-dot ${item.status}`} /><div><header><span>{item.status === "planned" ? "В плане" : formatDate(item.datePerformed)}</span><b>{money(item.cost)}</b></header><h3>{item.title}</h3><p>{km(item.mileage || state.vehicle.mileage)}{item.reason ? ` · ${item.reason}` : ""}</p><footer>{item.status === "planned" && <button onClick={() => complete(item.id)}><Check size={15} /> Выполнено</button>}<button onClick={() => remove(item.id)}><Trash2 size={15} /></button></footer></div></article>)}</div> : <Empty icon={<History size={34} />} title="Машина пока ничего не помнит" text="Добавьте обслуживание вручную или загрузите первый заказ-наряд." action="Добавить событие" onAction={onAdd} />}</div>;
}

function Mechanic({ state, setState, seed }) {
  const [question, setQuestion] = useState(seed || ""); const [loading, setLoading] = useState(false); const scrollRef = useRef(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [state.chat, loading]);
  async function ask(text = question) { const clean = text.trim(); if (!clean || loading) return; setState((current) => ({ ...current, chat: [...current.chat, { role:"user", text:clean }] })); setQuestion(""); setLoading(true); try { const response = await fetch("/api/ai-mechanic", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ vehicle:state.vehicle, data:{ mileage:state.vehicle.mileage, logs:state.events }, question:clean, history:state.chat.slice(-6).map((item) => ({ role:item.role === "ai" ? "assistant" : item.role, content:item.text })) }) }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error || "Нет ответа"); setState((current) => ({ ...current, chat:[...current.chat,{role:"ai",text:body.answer}] })); } catch(error) { setState((current) => ({ ...current, chat:[...current.chat,{role:"ai",text:`Не удалось ответить: ${error.message}`}] })); } setLoading(false); }
  const prompts = ["Что делать с машиной сейчас?","Какие пробелы есть в истории?","Подготовь список вопросов для СТО"];
  return <div className="screen mechanic-page"><div className="mechanic-head"><div className="mechanic-avatar">AI</div><div><span>Знает вашу машину</span><h1>Motrix-механик</h1><p>{carName(state.vehicle)} · {km(state.vehicle.mileage)} · {state.events.length} событий</p></div></div><div className="chat" ref={scrollRef}>{!state.chat.length && <div className="mechanic-intro"><h2>Спросите как владельцу, а не как инженеру</h2><p>Механик учитывает профиль и историю, отмечает неизвестное и не выдаёт догадки за диагноз.</p><div>{prompts.map((prompt) => <button key={prompt} onClick={() => ask(prompt)}>{prompt}</button>)}</div></div>}{state.chat.map((message,index) => <div className={`bubble ${message.role}`} key={index}>{message.text}</div>)}{loading && <div className="bubble ai typing">Сверяю с историей...</div>}</div><div className="composer"><textarea rows="2" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Например: меняют ли мне лишнее?" /><button disabled={!question.trim() || loading} onClick={() => ask()}><ChevronRight size={20} /></button></div></div>;
}

function Passport({ state, onReview, onPricing, onSettings, onOpenReview }) {
  const known = coverage(state); const completed = state.events.filter((item) => item.status === "completed"); const spent = completed.reduce((sum,item) => sum + Number(item.cost || 0),0);
  return <div className="screen passport-page"><div className="page-title"><div><span>Цифровой двойник</span><h1>Паспорт</h1></div></div><section className="passport-identity"><div className="passport-photo" style={state.vehicle.photo ? { backgroundImage:`url(${state.vehicle.photo})` } : undefined}>{!state.vehicle.photo && <Car size={38} />}</div><div><h2>{carName(state.vehicle)}</h2><p>{state.vehicle.year} · {state.vehicle.engine || "Двигатель не указан"} · {state.vehicle.transmission || "Коробка не указана"}</p><code>{state.vehicle.vin || "VIN не указан"}</code></div></section><section className="passport-numbers"><div><b>{known}%</b><span>полнота профиля</span></div><div><b>{completed.length}</b><span>подтверждённых событий</span></div><div><b>{money(spent)}</b><span>учтённые расходы</span></div></section><section className="passport-section"><header><div><span>Документы СТО</span><h2>Независимые разборы</h2></div><button onClick={onReview}><Plus size={17} /> Добавить</button></header>{state.reviews.length ? <div className="document-list">{state.reviews.map((review) => <button key={review.id} onClick={() => onOpenReview(review)}><ReceiptText size={21} /><span><b>{review.documentTitle}</b><small>{formatDate(review.createdAt)} · уверенность {review.confidence}%</small></span><ChevronRight size={18} /></button>)}</div> : <p className="passport-empty">Загрузите смету или заказ-наряд, чтобы сохранить не только файл, но и понятный разбор.</p>}</section><section className="pro-card"><div><Sparkles size={22} /><span>Motrix Pro</span></div><h2>Машина, которую не приходится вспоминать</h2><p>Безлимитные разборы, расширенный AI, облачная история и досье для продажи.</p><button onClick={onPricing}>Посмотреть Pro</button></section><button className="settings-row" onClick={onSettings}><Settings size={20} /><span><b>Настройки и данные</b><small>Фото, экспорт, удаление и правовая информация</small></span><ChevronRight size={18} /></button></div>;
}

function ReviewScreen({ state, initial, onSaved, onAsk }) {
  const inputRef = useRef(null); const [file,setFile] = useState(null); const [consent,setConsent] = useState(Boolean(state.consentAt)); const [loading,setLoading] = useState(false); const [error,setError] = useState(""); const [review,setReview] = useState(initial || null);
  async function run() { if(!file||!consent)return; setLoading(true);setError("");const form=new FormData();form.append("file",file);form.append("vehicle",JSON.stringify(state.vehicle));form.append("events",JSON.stringify(state.events.slice(0,30)));try{const response=await fetch("/api/review-estimate",{method:"POST",body:form});const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.error||"Не удалось выполнить разбор");const result={...body.review,id:crypto.randomUUID(),createdAt:new Date().toISOString(),fileName:file.name};setReview(result);onSaved(result,consent);}catch(reason){setError(reason.message)}setLoading(false);}
  function plan(){const events=(review.items||[]).filter((item)=>item.verdict!=="insufficient").map((item)=>({id:crypto.randomUUID(),title:item.title,cost:item.cost||0,status:"planned",source:"review",reason:item.reason,mileage:state.vehicle.mileage,createdAt:new Date().toISOString()}));onSaved(review,consent,events);}
  if(review)return <div className="screen review-result"><div className="page-title"><div><span>Разбор документа</span><h1>{review.documentTitle}</h1></div><div className="score-box"><b>{review.confidence}%</b><small>уверенность</small></div></div><div className="review-summary"><p>{review.summary}</p><b>{money(review.totalCost)}</b></div><div className="review-items">{(review.items||[]).map((item,index)=>{const meta=VERDICT[item.verdict]||VERDICT.question;return <article className={`review-item ${meta.tone}`} key={`${item.title}-${index}`}><header><span>{meta.label}</span><b>{money(item.cost)}</b></header><h3>{item.title}</h3><p>{item.reason}</p>{item.evidence&&<small><b>Основание:</b> {item.evidence}</small>}{item.questionToService&&<div className="service-question"><CircleHelp size={17}/><span>{item.questionToService}</span></div>}</article>})}</div>{review.questions?.length>0&&<section className="questions-card"><h2>Что спросить у сервиса</h2><ol>{review.questions.map((question)=><li key={question}>{question}</li>)}</ol></section>}<div className="stack-actions"><button className="primary-button" onClick={plan}><Check size={18}/> Сохранить работы в план</button><button className="secondary-button full" onClick={()=>onAsk(review)}>Обсудить с механиком</button></div></div>;
  return <div className="screen review-upload"><div className="page-title"><div><span>Инструмент Motrix</span><h1>Разобрать документ СТО</h1></div></div><p className="lead">Проверим логику назначений, покажем недостающие основания и подготовим вопросы перед оплатой.</p><button className={`upload-zone${file?" ready":""}`} onClick={()=>inputRef.current?.click()}>{file?<><Check size={28}/><b>{file.name}</b><span>Нажмите, чтобы заменить</span></>:<><Upload size={30}/><b>Фото сметы или заказ-наряда</b><span>JPG, PNG или WEBP до 5 МБ</span></>}</button><input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event)=>setFile(event.target.files?.[0]||null)}/><label className="consent-row"><input type="checkbox" checked={consent} onChange={(event)=>setConsent(event.target.checked)}/><span>Разрешаю однократно передать изображение AI-провайдеру. Перед загрузкой закройте персональные данные.</span></label>{error&&<div className="error-box"><AlertTriangle size={18}/>{error}</div>}<button className="primary-button" disabled={!file||!consent||loading} onClick={run}>{loading?"Изучаю документ...":"Получить разбор"}</button><div className="review-promise"><ShieldCheck size={22}/><p><b>Motrix не ставит диагноз по бумаге</b><span>Если оснований недостаточно, результатом будет вопрос сервису, а не выдуманный вердикт.</span></p></div></div>;
}

function AddMenu({ onClose, onManual, onReview, onMileage }) { return <Modal title="Добавить в Motrix" onClose={onClose}><div className="action-menu"><button onClick={onManual}><Plus size={22}/><span><b>Работу или расход</b><small>Добавить вручную</small></span><ChevronRight size={18}/></button><button onClick={onReview}><Camera size={22}/><span><b>Документ СТО</b><small>Распознать и проверить назначения</small></span><ChevronRight size={18}/></button><button onClick={onMileage}><Gauge size={22}/><span><b>Текущий пробег</b><small>Обновить показание одометра</small></span><ChevronRight size={18}/></button></div></Modal>; }

function EventModal({ vehicle, onClose, onSave }) { const [form,setForm]=useState({title:"",mileage:vehicle.mileage,cost:"",datePerformed:new Date().toISOString().slice(0,10),status:"completed",reason:""});const update=(key)=>(event)=>setForm((state)=>({...state,[key]:event.target.value}));return <Modal title="Событие автомобиля" onClose={onClose}><form className="modal-form" onSubmit={(event)=>{event.preventDefault();onSave({...form,id:crypto.randomUUID(),mileage:Number(form.mileage),cost:Number(form.cost||0),createdAt:new Date().toISOString(),source:"manual"})}}><label><span>Работа или расход</span><input value={form.title} onChange={update("title")} placeholder="Замена масла двигателя" required/></label><div className="form-grid"><label><span>Пробег</span><input type="number" value={form.mileage} onChange={update("mileage")} required/></label><label><span>Стоимость</span><input type="number" value={form.cost} onChange={update("cost")} placeholder="0"/></label><label><span>Дата</span><input type="date" value={form.datePerformed} onChange={update("datePerformed")}/></label><label><span>Статус</span><select value={form.status} onChange={update("status")}><option value="completed">Выполнено</option><option value="planned">В плане</option></select></label></div><label><span>Комментарий</span><textarea value={form.reason} onChange={update("reason")} placeholder="Что важно запомнить"/></label><button className="primary-button">Сохранить</button></form></Modal>; }

function MileageModal({ value, onClose, onSave }) { const [mileage,setMileage]=useState(value);return <Modal title="Обновить пробег" onClose={onClose}><div className="mileage-form"><label><span>Текущий пробег</span><input type="number" value={mileage} onChange={(event)=>setMileage(event.target.value)}/></label><button className="primary-button" onClick={()=>onSave(Number(mileage))}>Сохранить {km(mileage)}</button></div></Modal>; }

function BaselineModal({ baseline, onClose, onSave }) { const [data,setData]=useState(baseline||{history:"",lastOil:"",transmission:"",brakeFluid:"",monthlyKm:""});return <Modal title="Исходная история" onClose={onClose}><div className="questionnaire modal-questions"><Choice title="История автомобиля" value={data.history} onChange={(value)=>setData((state)=>({...state,history:value}))} options={[["full","Полная"],["partial","Частичная"],["unknown","Не знаю"]]}/><Choice title="Последняя замена масла" value={data.lastOil} onChange={(value)=>setData((state)=>({...state,lastOil:value}))} options={[["lt5","До 5 тыс."],["5to10","5–10 тыс."],["gt10","Больше 10 тыс."],["unknown","Не знаю"]]}/><Choice title="Коробка" value={data.transmission} onChange={(value)=>setData((state)=>({...state,transmission:value}))} options={[["recent","Подтверждено"],["old","Давно"],["unknown","Не знаю"]]}/><Choice title="Тормозная жидкость" value={data.brakeFluid} onChange={(value)=>setData((state)=>({...state,brakeFluid:value}))} options={[["yes","Менялась"],["no","Не менялась"],["unknown","Не знаю"]]}/><Choice title="Пробег в месяц" value={data.monthlyKm} onChange={(value)=>setData((state)=>({...state,monthlyKm:value}))} options={[["500","До 500"],["1200","500–1500"],["2500","1500–3000"],["4000","Больше 3000"]]}/><button className="primary-button" onClick={()=>onSave(data)}>Сохранить</button></div></Modal>; }

function Pricing({ onClose }) { const [error,setError]=useState("");async function buy(product){setError("");try{await startCheckout(product)}catch(reason){setError(reason.message)}}return <Modal title="Motrix Pro" onClose={onClose} wide><p className="modal-lead">Базовая память автомобиля бесплатна. Pro оплачивает автоматизацию и регулярную помощь.</p><div className="pricing-grid"><article><span>Разово</span><h3>Разбор документа</h3><strong>399 ₽</strong><ul><li><Check size={16}/>Один документ</li><li><Check size={16}/>Вердикты и вопросы</li></ul><button className="secondary-button full" onClick={()=>buy("single_review")}>Купить разбор</button></article><article className="featured"><span>На год</span><h3>Motrix Pro</h3><strong>1 990 ₽</strong><ul><li><Check size={16}/>Безлимитные разборы</li><li><Check size={16}/>Расширенный AI</li><li><Check size={16}/>Облачное досье</li></ul><button className="primary-button" onClick={()=>buy("pro_year")}>Подключить Pro</button></article></div>{error&&<div className="info-box"><CircleHelp size={18}/>{error}</div>}<small className="legal-note">Оплата включится после подключения эквайринга.</small></Modal>; }

function SettingsModal({ state, setState, onClose }) { const importRef=useRef(null),photoRef=useRef(null);async function restore(file){try{setState(await importState(file));onClose()}catch(error){alert(error.message)}}async function photo(file){if(!file)return;const image=await readImage(file);setState((current)=>({...current,vehicle:{...current.vehicle,photo:image}}))}return <Modal title="Настройки и данные" onClose={onClose}><div className="vehicle-card"><Car size={23}/><div><b>{carName(state.vehicle)}</b><small>{state.vehicle.year} · {km(state.vehicle.mileage)} · {state.vehicle.vin||"VIN не указан"}</small></div></div><div className="settings-list"><button onClick={()=>photoRef.current?.click()}><Camera size={19}/><span><b>Фото автомобиля</b><small>Заменить визуал гаража</small></span><ChevronRight size={17}/></button><input ref={photoRef} hidden type="file" accept="image/*" onChange={(event)=>photo(event.target.files?.[0])}/><button onClick={()=>exportState(state)}><Download size={19}/><span><b>Экспорт данных</b><small>Резервная копия JSON</small></span><ChevronRight size={17}/></button><button onClick={()=>importRef.current?.click()}><Upload size={19}/><span><b>Импорт данных</b><small>Восстановить копию</small></span><ChevronRight size={17}/></button><input ref={importRef} hidden type="file" accept="application/json" onChange={(event)=>event.target.files?.[0]&&restore(event.target.files[0])}/><button className="danger" onClick={()=>{if(confirm("Удалить все данные Motrix?")){clearState();location.reload()}}}><Trash2 size={19}/><span><b>Удалить все данные</b><small>Без возможности восстановления</small></span><ChevronRight size={17}/></button></div><section className="legal-block"><h3>О рекомендациях</h3><p>Motrix анализирует предоставленные сведения и не проводит физическую диагностику. Решения, влияющие на безопасность, нужно подтвердить у квалифицированного специалиста.</p><h3>Хранение</h3><p>Профиль хранится в браузере. Изображения документов передаются AI-провайдеру только после отдельного согласия.</p></section></Modal>; }

function Empty({ icon,title,text,action,onAction }) { return <div className="empty-state">{icon}<h2>{title}</h2><p>{text}</p><button className="secondary-button" onClick={onAction}>{action}</button></div>; }

export default function App() {
  const [state,setState]=useState(initialState); const [view,setView]=useState("garage"); const [modal,setModal]=useState(null); const [review,setReview]=useState(null); const [seed,setSeed]=useState(""); const garage=useMemo(()=>deriveGarage(state),[state]);
  useEffect(()=>saveState(state),[state]);
  if(!state.vehicle)return <Setup onComplete={(vehicle,baseline)=>setState({...EMPTY_STATE,vehicle,baseline,createdAt:new Date().toISOString()})}/>;
  function openAdd(){setModal("add")} function openReview(selected=null){setReview(selected);setView("review");setModal(null)}
  function saveReview(result,consent,events=[]){setState((current)=>({...current,consentAt:consent?current.consentAt||new Date().toISOString():current.consentAt,reviews:current.reviews.some((item)=>item.id===result.id)?current.reviews:[result,...current.reviews],events:events.length?[...events,...current.events]:current.events}))}
  function askReview(result){setSeed(`Объясни выводы по последнему документу: ${result.summary}`);setView("mechanic")}
  function primary(){if(!state.baseline)return setModal("baseline");if(state.reviews[0]&&(garage.tone==="warn"))return openReview(state.reviews[0]);if(garage.planned.length)return setView("history");if(state.baseline.lastOil==="gt10")return setModal("event");openAdd()}
  const navVisible=NAV.some(([id])=>id===view);
  return <div className="app-shell"><Topbar state={state} view={view} onBack={()=>setView("garage")} onSettings={()=>setModal("settings")}/><main>{view==="garage"&&<Garage state={state} garage={garage} onPrimary={primary} onAdd={openAdd} onReview={()=>openReview()} onHistory={()=>setView("history")}/>} {view==="history"&&<HistoryScreen state={state} setState={setState} onAdd={openAdd}/>} {view==="mechanic"&&<Mechanic state={state} setState={setState} seed={seed}/>} {view==="passport"&&<Passport state={state} onReview={()=>openReview()} onPricing={()=>setModal("pricing")} onSettings={()=>setModal("settings")} onOpenReview={openReview}/>} {view==="review"&&<ReviewScreen state={state} initial={review} onSaved={saveReview} onAsk={askReview}/>}</main>{navVisible&&<nav className="bottom-nav">{NAV.map(([id,Icon,label])=><button key={id} className={view===id?"active":""} onClick={()=>setView(id)}><Icon size={21}/><span>{label}</span></button>)}</nav>}{modal==="add"&&<AddMenu onClose={()=>setModal(null)} onManual={()=>setModal("event")} onReview={()=>openReview()} onMileage={()=>setModal("mileage")}/>} {modal==="event"&&<EventModal vehicle={state.vehicle} onClose={()=>setModal(null)} onSave={(event)=>{setState((current)=>({...current,vehicle:{...current.vehicle,mileage:Math.max(current.vehicle.mileage,event.mileage)},events:[event,...current.events]}));setModal(null)}}/>} {modal==="mileage"&&<MileageModal value={state.vehicle.mileage} onClose={()=>setModal(null)} onSave={(value)=>{setState((current)=>({...current,vehicle:{...current.vehicle,mileage:value}}));setModal(null)}}/>} {modal==="baseline"&&<BaselineModal baseline={state.baseline} onClose={()=>setModal(null)} onSave={(baseline)=>{setState((current)=>({...current,baseline}));setModal(null)}}/>} {modal==="pricing"&&<Pricing onClose={()=>setModal(null)}/>} {modal==="settings"&&<SettingsModal state={state} setState={setState} onClose={()=>setModal(null)}/>}</div>;
}
