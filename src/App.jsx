import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Bot,
  Camera,
  Car,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  FileSearch,
  Gauge,
  History,
  Home,
  MessageCircle,
  Plus,
  ReceiptText,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  WalletCards,
  X,
} from "./components/Icons.jsx";
import { startCheckout } from "./services/billing.js";
import { clearState, exportState, importState, loadState, saveState } from "./services/storage.js";
import { lookupVin, VinProviderUnavailableError } from "./services/vinProvider.js";
import "./App.css";

const EMPTY_STATE = {
  version: 1,
  vehicle: null,
  events: [],
  reviews: [],
  chat: [],
  plan: "free",
  consentAt: null,
  createdAt: new Date().toISOString(),
};

const NAV = [
  ["home", Home, "Сейчас"],
  ["review", FileSearch, "Разбор"],
  ["history", History, "История"],
  ["ai", Bot, "Механик"],
];

const VERDICT = {
  necessary: { label: "Обосновано", tone: "good" },
  question: { label: "Уточнить", tone: "warn" },
  insufficient: { label: "Не доказано", tone: "bad" },
};

function legacyState() {
  try {
    const vehicle = JSON.parse(localStorage.getItem("autopulse-vehicle") || "null");
    const data = JSON.parse(localStorage.getItem("autopulse-data") || "null");
    if (!vehicle) return null;
    return {
      ...EMPTY_STATE,
      vehicle: { ...vehicle, mileage: Number(data?.mileage || vehicle.mileage || 0) },
      events: (data?.logs || []).map((item) => ({ ...item, status: "completed", source: item.source || "legacy" })),
    };
  } catch {
    return null;
  }
}

function initialState() {
  return loadState() || legacyState() || EMPTY_STATE;
}

function money(value) {
  const number = Number(value || 0);
  return number ? `${number.toLocaleString("ru-RU")} ₽` : "Не указана";
}

function mileage(value) {
  return `${Number(value || 0).toLocaleString("ru-RU")} км`;
}

function shortDate(value) {
  if (!value) return "Дата не указана";
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function vehicleName(vehicle) {
  return [vehicle?.brand, vehicle?.model].filter(Boolean).join(" ") || "Автомобиль";
}

function deriveSnapshot(state) {
  const latest = state.reviews[0];
  const items = latest?.items || [];
  const concerns = items.filter((item) => item.verdict === "insufficient").length;
  const questions = items.filter((item) => item.verdict === "question").length;
  const completed = state.events.filter((event) => event.status === "completed");
  const planned = state.events.filter((event) => event.status === "planned");
  const evidence = completed.length + state.reviews.length;

  if (!evidence) {
    return {
      tone: "neutral",
      eyebrow: "Данных пока мало",
      title: "Начните не с анкеты, а с факта",
      body: "Загрузите последний заказ-наряд или добавьте выполненную работу. Motrix не будет придумывать состояние автомобиля без оснований.",
      action: "Разобрать документ",
      confidence: 0,
      planned,
    };
  }
  if (concerns) {
    return {
      tone: "bad",
      eyebrow: "Нужна проверка",
      title: `${concerns} ${concerns === 1 ? "позиция требует" : "позиции требуют"} обоснования`,
      body: latest.summary || "В последнем документе есть работы, необходимость которых не подтверждена предоставленными данными.",
      action: "Открыть последний разбор",
      confidence: latest.confidence || 55,
      planned,
    };
  }
  if (questions) {
    return {
      tone: "warn",
      eyebrow: "Есть вопросы",
      title: "Перед согласованием задайте вопросы сервису",
      body: latest.summary || "Часть работ выглядит разумно, но требует уточнения причины, диагностики или артикула.",
      action: "Посмотреть вопросы",
      confidence: latest.confidence || 65,
      planned,
    };
  }
  return {
    tone: "good",
    eyebrow: "По известным данным",
    title: "Явных спорных работ не найдено",
    body: latest?.summary || "История сохранена. Motrix продолжит опираться только на добавленные события и документы.",
    action: "Добавить новое событие",
    confidence: latest?.confidence || Math.min(85, 35 + evidence * 10),
    planned,
  };
}

function Modal({ title, children, onClose, wide = false }) {
  return (
    <div className="overlay" role="presentation" onMouseDown={onClose}>
      <section className={`modal${wide ? " wide" : ""}`} role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}>
        <header><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Закрыть"><X size={20} /></button></header>
        {children}
      </section>
    </div>
  );
}

function Setup({ onComplete }) {
  const [form, setForm] = useState({ vin: "", brand: "", model: "", year: "", mileage: "", engine: "", transmission: "" });
  const [vinState, setVinState] = useState({ loading: false, message: "" });
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  async function detectVin() {
    const vin = form.vin.trim().toUpperCase();
    if (vin.length !== 17) return setVinState({ loading: false, message: "VIN должен содержать 17 символов." });
    setVinState({ loading: true, message: "" });
    try {
      const found = await lookupVin(vin);
      setForm((current) => ({ ...current, ...found, vin }));
      setVinState({ loading: false, message: "Данные получены. Проверьте их перед сохранением." });
    } catch (error) {
      setVinState({ loading: false, message: error instanceof VinProviderUnavailableError ? error.message : `Ошибка: ${error.message}` });
    }
  }

  function submit(event) {
    event.preventDefault();
    if (!form.brand.trim() || !form.model.trim() || !form.year || !form.mileage) return;
    onComplete({
      vin: form.vin.trim().toUpperCase(),
      brand: form.brand.trim(),
      model: form.model.trim(),
      year: Number(form.year),
      mileage: Number(form.mileage),
      engine: form.engine.trim(),
      transmission: form.transmission.trim(),
    });
  }

  return (
    <main className="setup-page">
      <div className="brand-lockup"><div className="brand-mark">M</div><b>Motrix</b></div>
      <section className="setup-copy"><span className="kicker">Автомобильный ассистент</span><h1>Сначала факты.<br />Потом рекомендации.</h1><p>Добавьте автомобиль. Motrix соберёт историю, разберёт документы СТО и поможет понять, за что действительно стоит платить.</p></section>
      <form className="setup-form" onSubmit={submit}>
        <div className="vin-box"><label><span>VIN, необязательно</span><input value={form.vin} onChange={update("vin")} maxLength={17} placeholder="17 символов" autoCapitalize="characters" /></label><button type="button" className="secondary-button" onClick={detectVin} disabled={vinState.loading}>{vinState.loading ? "Проверяю" : "Найти"}</button></div>
        {vinState.message && <p className="form-message">{vinState.message}</p>}
        <div className="form-grid"><label><span>Марка</span><input value={form.brand} onChange={update("brand")} placeholder="Subaru" required /></label><label><span>Модель</span><input value={form.model} onChange={update("model")} placeholder="Forester" required /></label><label><span>Год</span><input value={form.year} onChange={update("year")} type="number" min="1980" max="2027" placeholder="2020" required /></label><label><span>Пробег</span><input value={form.mileage} onChange={update("mileage")} type="number" min="1" placeholder="88000" required /></label><label><span>Двигатель</span><input value={form.engine} onChange={update("engine")} placeholder="FB20" /></label><label><span>Коробка</span><input value={form.transmission} onChange={update("transmission")} placeholder="CVT" /></label></div>
        <button className="primary-button" type="submit">Создать гараж <ChevronRight size={18} /></button>
        <small className="legal-note">Рекомендации носят информационный характер и не заменяют диагностику автомобиля.</small>
      </form>
    </main>
  );
}

function Topbar({ vehicle, onSettings, plan }) {
  return <header className="topbar"><div><span>Motrix</span><b>{vehicleName(vehicle)}</b></div><div className="top-actions">{plan === "pro" && <em>PRO</em>}<button className="icon-button" onClick={onSettings} aria-label="Настройки"><Settings size={20} /></button></div></header>;
}

function HomeScreen({ state, snapshot, onReview, onOpenLatest, onAdd, onPricing }) {
  const spent = state.events.filter((item) => item.status === "completed").reduce((sum, item) => sum + Number(item.cost || 0), 0);
  return (
    <div className="screen home-screen">
      <section className={`verdict-card ${snapshot.tone}`}>
        <div className="verdict-top"><span>{snapshot.eyebrow}</span><div className="confidence"><b>{snapshot.confidence ? `${snapshot.confidence}%` : "—"}</b><small>уверенность</small></div></div>
        <h1>{snapshot.title}</h1><p>{snapshot.body}</p>
        <button className="verdict-action" onClick={state.reviews.length ? onOpenLatest : onReview}>{snapshot.action}<ChevronRight size={18} /></button>
      </section>

      <section className="quick-stats" aria-label="Сводка">
        <div><Gauge size={19} /><span>Пробег</span><b>{mileage(state.vehicle.mileage)}</b></div>
        <div><ReceiptText size={19} /><span>История</span><b>{state.events.length} событий</b></div>
        <div><WalletCards size={19} /><span>Учтено</span><b>{spent ? money(spent) : "Нет данных"}</b></div>
      </section>

      <section className="primary-job">
        <div className="section-heading"><div><span>Главная функция</span><h2>Проверьте смету до оплаты</h2></div><ShieldCheck size={24} /></div>
        <p>Сфотографируйте заказ-наряд. Motrix разделит позиции на обоснованные, требующие уточнения и не подтверждённые документом.</p>
        <button className="primary-button" onClick={onReview}><Camera size={18} /> Разобрать документ</button>
      </section>

      {snapshot.planned.length > 0 && <section className="plain-section"><div className="section-heading"><div><span>План</span><h2>Следующие работы</h2></div></div><div className="rows">{snapshot.planned.slice(0, 3).map((event) => <div className="row" key={event.id}><Clock3 size={18} /><div><b>{event.title}</b><small>{event.reason || "Добавлено из разбора"}</small></div><span>{money(event.cost)}</span></div>)}</div></section>}

      <button className="text-action" onClick={onAdd}><Plus size={18} /> Добавить выполненную работу</button>
      {state.plan !== "pro" && <button className="pro-banner" onClick={onPricing}><div><Sparkles size={19} /><span><b>Motrix Pro</b><small>Безлимитные разборы и расширенный AI</small></span></div><ChevronRight size={18} /></button>}
    </div>
  );
}

function ReviewScreen({ state, onSaved, initialReview, onAskAi, onPricing }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [consent, setConsent] = useState(Boolean(state.consentAt));
  const [status, setStatus] = useState({ loading: false, error: "" });
  const [review, setReview] = useState(initialReview || null);

  async function runReview() {
    if (!file || !consent) return;
    setStatus({ loading: true, error: "" });
    const form = new FormData();
    form.append("file", file);
    form.append("vehicle", JSON.stringify(state.vehicle));
    form.append("events", JSON.stringify(state.events.slice(0, 30)));
    try {
      const response = await fetch("/api/review-estimate", { method: "POST", body: form });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Не удалось выполнить разбор");
      const result = { ...body.review, id: crypto.randomUUID(), createdAt: new Date().toISOString(), fileName: file.name };
      setReview(result);
      onSaved(result, consent);
    } catch (error) {
      setStatus({ loading: false, error: error.message });
      return;
    }
    setStatus({ loading: false, error: "" });
  }

  function savePlan() {
    const events = (review?.items || []).filter((item) => item.verdict !== "insufficient").map((item) => ({
      id: crypto.randomUUID(), title: item.title, cost: item.cost || 0, status: "planned", source: "estimate-review", reason: item.reason, datePerformed: "", mileage: state.vehicle.mileage,
    }));
    onSaved(review, consent, events);
  }

  if (review) return (
    <div className="screen review-result">
      <div className="page-title"><div><span>Независимый разбор</span><h1>{review.documentTitle || "Документ СТО"}</h1></div><div className="score-box"><b>{review.confidence || 0}%</b><small>уверенность</small></div></div>
      <div className="review-summary"><p>{review.summary}</p>{review.totalCost > 0 && <b>{money(review.totalCost)}</b>}</div>
      <div className="review-items">{(review.items || []).map((item, index) => { const meta = VERDICT[item.verdict] || VERDICT.question; return <article key={`${item.title}-${index}`} className={`review-item ${meta.tone}`}><header><span className="status-pill">{meta.label}</span><b>{money(item.cost)}</b></header><h3>{item.title}</h3><p>{item.reason}</p>{item.evidence && <small><strong>Основание:</strong> {item.evidence}</small>}{item.questionToService && <div className="service-question"><CircleHelp size={17} /><span>{item.questionToService}</span></div>}</article>; })}</div>
      {(review.questions || []).length > 0 && <section className="questions-card"><h2>Что спросить у сервиса</h2><ol>{review.questions.map((question) => <li key={question}>{question}</li>)}</ol></section>}
      <div className="stack-actions"><button className="primary-button" onClick={savePlan}><Check size={18} /> Сохранить обоснованное в план</button><button className="secondary-button full" onClick={() => onAskAi(review)}>Обсудить с AI-механиком</button><button className="text-action" onClick={() => { setReview(null); setFile(null); }}>Разобрать другой документ</button></div>
      {state.plan !== "pro" && <button className="pro-banner" onClick={onPricing}><div><Sparkles size={19} /><span><b>Нужны регулярные проверки?</b><small>Годовой Pro выгоднее разовых разборов</small></span></div><ChevronRight size={18} /></button>}
    </div>
  );

  return (
    <div className="screen review-screen">
      <div className="page-title"><div><span>Вторая оценка</span><h1>Разбор сметы СТО</h1></div></div>
      <p className="lead">Motrix не диагностирует автомобиль по бумаге. Он проверяет логику назначений, ищет недостающие основания и готовит вопросы сервису.</p>
      <button className={`upload-zone${file ? " ready" : ""}`} onClick={() => inputRef.current?.click()}>
        {file ? <><Check size={28} /><b>{file.name}</b><span>Нажмите, чтобы заменить</span></> : <><Upload size={30} /><b>Фото заказ-наряда или сметы</b><span>JPG, PNG или WEBP до 5 МБ</span></>}
      </button>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => setFile(event.target.files?.[0] || null)} />
      <label className="consent-row"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>Разрешаю передать изображение AI-провайдеру для однократного распознавания. Перед загрузкой закройте ФИО, телефон и адрес.</span></label>
      {status.error && <div className="error-box"><AlertTriangle size={18} />{status.error}</div>}
      <button className="primary-button" disabled={!file || !consent || status.loading} onClick={runReview}>{status.loading ? "Разбираю документ..." : "Получить независимый разбор"}</button>
      <section className="how-it-works"><h2>Что будет в результате</h2><div><span>1</span><p><b>Вердикт по каждой позиции</b>Обосновано, уточнить или не доказано.</p></div><div><span>2</span><p><b>Основания и пробелы</b>Что видно из документа и чего не хватает.</p></div><div><span>3</span><p><b>Готовые вопросы</b>Что спросить до согласования работ.</p></div></section>
    </div>
  );
}

function HistoryScreen({ state, setState, onAdd }) {
  const [filter, setFilter] = useState("all");
  const items = state.events.filter((item) => filter === "all" || item.status === filter).sort((a, b) => String(b.datePerformed || b.createdAt || "").localeCompare(String(a.datePerformed || a.createdAt || "")));
  function remove(id) { if (confirm("Удалить запись?")) setState((current) => ({ ...current, events: current.events.filter((item) => item.id !== id) })); }
  function complete(id) { setState((current) => ({ ...current, events: current.events.map((item) => item.id === id ? { ...item, status: "completed", datePerformed: new Date().toISOString().slice(0, 10) } : item) })); }
  return <div className="screen"><div className="page-title"><div><span>Доказательная база</span><h1>История автомобиля</h1></div><button className="square-action" onClick={onAdd} aria-label="Добавить"><Plus size={21} /></button></div><div className="segments"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Все</button><button className={filter === "completed" ? "active" : ""} onClick={() => setFilter("completed")}>Выполнено</button><button className={filter === "planned" ? "active" : ""} onClick={() => setFilter("planned")}>План</button></div>{items.length ? <div className="timeline">{items.map((item) => <article key={item.id}><div className={`timeline-dot ${item.status}`} /><div><header><span>{item.status === "planned" ? "Запланировано" : shortDate(item.datePerformed)}</span><b>{money(item.cost)}</b></header><h3>{item.title}</h3><p>{mileage(item.mileage || state.vehicle.mileage)}{item.reason ? ` · ${item.reason}` : ""}</p><footer>{item.status === "planned" && <button onClick={() => complete(item.id)}><Check size={15} /> Отметить выполненным</button>}<button onClick={() => remove(item.id)} aria-label="Удалить"><Trash2 size={15} /></button></footer></div></article>)}</div> : <div className="empty-state"><History size={32} /><h2>История пока пустая</h2><p>Добавьте выполненную работу или сохраните план из разбора документа.</p><button className="secondary-button" onClick={onAdd}>Добавить событие</button></div>}</div>;
}

function AiScreen({ state, setState, seededQuestion }) {
  const [question, setQuestion] = useState(seededQuestion || "");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [state.chat, loading]);
  async function ask(text = question) {
    const clean = text.trim(); if (!clean || loading) return;
    const userMessage = { role: "user", text: clean };
    const nextChat = [...state.chat, userMessage]; setState((current) => ({ ...current, chat: nextChat })); setQuestion(""); setLoading(true);
    try {
      const response = await fetch("/api/ai-mechanic", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ vehicle: state.vehicle, data: { mileage: state.vehicle.mileage, logs: state.events }, question: clean, history: state.chat.slice(-6).map((item) => ({ role: item.role === "ai" ? "assistant" : item.role, content: item.text })) }) });
      const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error || "AI-механик не ответил");
      setState((current) => ({ ...current, chat: [...current.chat, { role: "ai", text: body.answer }] }));
    } catch (error) { setState((current) => ({ ...current, chat: [...current.chat, { role: "ai", text: `Не удалось получить ответ: ${error.message}` }] })); }
    setLoading(false);
  }
  const prompts = ["Что в моей истории требует внимания?", "Какие вопросы задать сервису?", "Что подготовить к следующему ТО?"];
  return <div className="screen ai-page"><div className="page-title"><div><span>Контекстный помощник</span><h1>AI-механик</h1></div></div><div className="ai-context"><Car size={20} /><span><b>{vehicleName(state.vehicle)}</b><small>{mileage(state.vehicle.mileage)} · {state.events.length} событий в контексте</small></span></div><div className="chat" ref={scrollRef}>{state.chat.length === 0 && <div className="ai-intro"><MessageCircle size={30} /><h2>Спрашивайте по своей машине</h2><p>Ответ учитывает профиль и сохранённую историю. Motrix отделяет известные факты от предположений.</p><div>{prompts.map((prompt) => <button key={prompt} onClick={() => ask(prompt)}>{prompt}</button>)}</div></div>}{state.chat.map((message, index) => <div key={index} className={`bubble ${message.role}`}>{message.text}</div>)}{loading && <div className="bubble ai typing">Проверяю контекст...</div>}</div><div className="composer"><textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Опишите проблему или задайте вопрос" rows="2" /><button onClick={() => ask()} disabled={!question.trim() || loading} aria-label="Отправить"><ChevronRight size={20} /></button></div></div>;
}

function AddEventModal({ vehicle, onClose, onSave }) {
  const [form, setForm] = useState({ title: "", mileage: vehicle.mileage, cost: "", datePerformed: new Date().toISOString().slice(0, 10), status: "completed", reason: "" });
  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  return <Modal title="Событие автомобиля" onClose={onClose}><form className="modal-form" onSubmit={(event) => { event.preventDefault(); onSave({ ...form, id: crypto.randomUUID(), mileage: Number(form.mileage), cost: Number(form.cost || 0), createdAt: new Date().toISOString(), source: "manual" }); }}><label><span>Что сделали или планируете</span><input value={form.title} onChange={update("title")} placeholder="Замена масла двигателя" required /></label><div className="form-grid"><label><span>Пробег</span><input type="number" value={form.mileage} onChange={update("mileage")} required /></label><label><span>Стоимость</span><input type="number" value={form.cost} onChange={update("cost")} placeholder="0" /></label><label><span>Дата</span><input type="date" value={form.datePerformed} onChange={update("datePerformed")} /></label><label><span>Статус</span><select value={form.status} onChange={update("status")}><option value="completed">Выполнено</option><option value="planned">Запланировано</option></select></label></div><label><span>Комментарий</span><textarea value={form.reason} onChange={update("reason")} placeholder="Основание, детали, артикул" /></label><button className="primary-button" type="submit">Сохранить</button></form></Modal>;
}

function PricingModal({ onClose }) {
  const [error, setError] = useState("");
  async function buy(product) { setError(""); try { await startCheckout(product); } catch (reason) { setError(reason.message); } }
  return <Modal title="Доступ к Motrix" onClose={onClose} wide><p className="modal-lead">Базовая история автомобиля остаётся бесплатной. Платите за конкретный результат, а не за возможность открыть приложение.</p><div className="pricing-grid"><article><span>Разовый</span><h3>Разбор сметы</h3><strong>399 ₽</strong><ul><li><Check size={16} />Один документ</li><li><Check size={16} />Вердикт по позициям</li><li><Check size={16} />Вопросы сервису</li></ul><button className="secondary-button full" onClick={() => buy("single_review")}>Купить разбор</button></article><article className="featured"><span>На год</span><h3>Motrix Pro</h3><strong>1 990 ₽</strong><ul><li><Check size={16} />Безлимитные разборы</li><li><Check size={16} />Расширенный AI</li><li><Check size={16} />Несколько автомобилей</li></ul><button className="primary-button" onClick={() => buy("pro_year")}>Подключить Pro</button></article></div>{error && <div className="info-box"><CircleHelp size={18} />{error}</div>}<small className="legal-note">Оплата активируется после подключения российского платёжного провайдера.</small></Modal>;
}

function SettingsModal({ state, setState, onClose }) {
  const fileRef = useRef(null);
  async function restore(file) { try { const imported = await importState(file); setState(imported); onClose(); } catch (error) { alert(error.message); } }
  return <Modal title="Профиль и данные" onClose={onClose}><div className="vehicle-card"><Car size={23} /><div><b>{vehicleName(state.vehicle)}</b><small>{state.vehicle.year} · {mileage(state.vehicle.mileage)} · {state.vehicle.vin || "VIN не указан"}</small></div></div><div className="settings-list"><button onClick={() => exportState(state)}><Download size={19} /><span><b>Экспорт данных</b><small>Скачать резервную копию JSON</small></span><ChevronRight size={17} /></button><button onClick={() => fileRef.current?.click()}><Upload size={19} /><span><b>Импорт данных</b><small>Восстановить резервную копию</small></span><ChevronRight size={17} /></button><input ref={fileRef} hidden type="file" accept="application/json" onChange={(event) => event.target.files?.[0] && restore(event.target.files[0])} /><button onClick={() => { if (confirm("Удалить все локальные данные Motrix?")) { clearState(); location.reload(); } }} className="danger"><Trash2 size={19} /><span><b>Удалить все данные</b><small>Действие нельзя отменить</small></span><ChevronRight size={17} /></button></div><section className="legal-block"><h3>О рекомендациях</h3><p>Motrix анализирует предоставленные данные и не проводит физическую диагностику. Для решений, влияющих на безопасность, требуется проверка квалифицированным специалистом.</p><h3>Хранение</h3><p>Профиль и история этой версии хранятся в браузере. Изображения документов передаются AI-провайдеру только после отдельного согласия и не сохраняются в профиле.</p></section></Modal>;
}

export default function App() {
  const [state, setState] = useState(initialState);
  const [tab, setTab] = useState("home");
  const [modal, setModal] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [seededQuestion, setSeededQuestion] = useState("");
  const snapshot = useMemo(() => deriveSnapshot(state), [state]);
  useEffect(() => { saveState(state); }, [state]);

  if (!state.vehicle) return <Setup onComplete={(vehicle) => setState({ ...EMPTY_STATE, vehicle, createdAt: new Date().toISOString() })} />;

  function saveReview(review, consent, events = []) {
    setState((current) => ({ ...current, consentAt: consent ? current.consentAt || new Date().toISOString() : current.consentAt, reviews: current.reviews.some((item) => item.id === review.id) ? current.reviews : [review, ...current.reviews], events: events.length ? [...events, ...current.events] : current.events }));
  }
  function askAboutReview(review) { setSeededQuestion(`Разбери выводы по последней смете: ${review.summary}`); setTab("ai"); }

  return <div className="app-shell"><Topbar vehicle={state.vehicle} plan={state.plan} onSettings={() => setModal("settings")} /><main>{tab === "home" && <HomeScreen state={state} snapshot={snapshot} onReview={() => { setSelectedReview(null); setTab("review"); }} onOpenLatest={() => { setSelectedReview(state.reviews[0]); setTab("review"); }} onAdd={() => setModal("event")} onPricing={() => setModal("pricing")} />}{tab === "review" && <ReviewScreen key={selectedReview?.id || "new"} state={state} initialReview={selectedReview} onSaved={saveReview} onAskAi={askAboutReview} onPricing={() => setModal("pricing")} />}{tab === "history" && <HistoryScreen state={state} setState={setState} onAdd={() => setModal("event")} />}{tab === "ai" && <AiScreen state={state} setState={setState} seededQuestion={seededQuestion} />}</main><nav className="bottom-nav">{NAV.map(([id, Icon, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => { setSelectedReview(null); setTab(id); }}><Icon size={21} /><span>{label}</span></button>)}</nav>{modal === "event" && <AddEventModal vehicle={state.vehicle} onClose={() => setModal(null)} onSave={(event) => { setState((current) => ({ ...current, vehicle: { ...current.vehicle, mileage: Math.max(current.vehicle.mileage, event.mileage) }, events: [event, ...current.events] })); setModal(null); }} />}{modal === "pricing" && <PricingModal onClose={() => setModal(null)} />}{modal === "settings" && <SettingsModal state={state} setState={setState} onClose={() => setModal(null)} />}</div>;
}
