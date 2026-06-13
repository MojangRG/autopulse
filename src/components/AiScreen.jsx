function km(v) { return Number(v || 0).toLocaleString("ru-RU") + " км"; }

export default function AiScreen({
  chat,
  question,
  setQuestion,
  isAsking,
  onAsk,
  vehicle,
  ownerProfile,
  localBriefing,
  quickQuestions,
  mileage,
}) {
  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onAsk(); }
  }

  function sendChip(q) {
    setQuestion(q);
    setTimeout(() => onAsk(q), 30);
  }

  const hasChat = chat.length > 0;

  const contextParts = [
    vehicle && `${vehicle.brand} ${vehicle.model}`,
    vehicle?.engine,
    mileage && km(mileage),
    ownerProfile?.monthlyKm,
    ownerProfile?.usage,
  ].filter(Boolean);

  return (
    <div className="ai-screen">
      <h2 className="screen-title">AI-механик</h2>

      {vehicle && (
        <div className="chat-context-bar">
          <span>{contextParts.join(" · ")}</span>
        </div>
      )}

      <div className="chat-scroll-area">
        {!hasChat && localBriefing && (
          <div className="briefing-card">
            <div className="briefing-label">Оценка механика</div>
            <div className="briefing-text">{localBriefing}</div>
          </div>
        )}

        {!hasChat && quickQuestions?.length > 0 && (
          <div className="quick-chips">
            {quickQuestions.map((q) => (
              <button
                key={q}
                className="quick-chip"
                onClick={() => sendChip(q)}
                disabled={isAsking}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {hasChat && chat.map((msg, i) => (
          <div key={i} className={`chat-msg ${msg.role}`}>
            {msg.text}
          </div>
        ))}
      </div>

      <div className="chat-input-area">
        <textarea
          className="chat-textarea"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Спросите про ваш автомобиль..."
          rows={2}
        />
        <button
          className="chat-send-btn"
          onClick={() => onAsk()}
          disabled={isAsking || !question.trim()}
        >
          {isAsking ? "…" : "↑"}
        </button>
      </div>
    </div>
  );
}
