import { useEffect, useRef } from "react";
function km(v) { return Number(v || 0).toLocaleString("ru-RU") + " км"; }

export default function AiScreen({ chat, question, setQuestion, isAsking, onAsk, vehicle, ownerProfile, localBriefing, quickQuestions, mileage }) {
  const scrollRef = useRef(null);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [chat]);
  function handleKey(e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onAsk(); } }
  function sendChip(q) { setQuestion(q); setTimeout(() => onAsk(q), 30); }
  const contextParts = [vehicle && `${vehicle.brand} ${vehicle.model}`, vehicle?.engine, mileage && km(mileage), ownerProfile?.usage].filter(Boolean);

  return (
    <div className="mx-page ai-screen mx-ai-page">
      <div className="mx-page-head"><span>MOTRIX AI</span><h2>AI-механик</h2><p>{contextParts.join(" · ") || "Контекст автомобиля"}</p></div>
      {!chat.length && localBriefing && <button className="mx-priority-tile calm"><span className="mx-priority-kicker">Брифинг</span><strong>Короткая оценка</strong><small>{localBriefing}</small><span className="mx-chevron">›</span></button>}
      {!chat.length && quickQuestions?.length > 0 && <div className="mx-bank-list">{quickQuestions.map((q) => <button key={q} className="mx-bank-row" onClick={() => sendChip(q)} disabled={isAsking}><span className="mx-row-dot ai" /><span><b>{q}</b><small>нажмите, чтобы спросить</small></span><strong>›</strong></button>)}</div>}
      <div className="chat-scroll-area mx-chat-area" ref={scrollRef}>{chat.map((msg, i) => <div key={i} className={`chat-msg ${msg.role}`}>{msg.text}</div>)}</div>
      <div className="chat-input-area"><textarea className="chat-textarea" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={handleKey} placeholder="Спросите про автомобиль..." rows={2} /><button className="chat-send-btn" onClick={() => onAsk()} disabled={isAsking || !question.trim()}>{isAsking ? "…" : "↑"}</button></div>
    </div>
  );
}
