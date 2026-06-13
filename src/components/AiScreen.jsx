export default function AiScreen({ chat, question, setQuestion, isAsking, onAsk, vehicle, ownerProfile }) {
  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onAsk();
    }
  }

  const contextParts = [
    vehicle && `${vehicle.brand} ${vehicle.model} ${vehicle.year || ""}`,
    vehicle?.engine,
    ownerProfile?.monthlyKm && `${ownerProfile.monthlyKm}/мес`,
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

      <div className="chat-list">
        {chat.length === 0 && (
          <div className="chat-empty">
            Задайте любой вопрос про ваш автомобиль.<br />
            <span style={{ color: "#4b5563" }}>«Еду на 3000 км, что проверить?»</span><br />
            <span style={{ color: "#4b5563" }}>«Слышу гул при торможении — что это?»</span>
          </div>
        )}
        {chat.map((msg, i) => (
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
          onClick={onAsk}
          disabled={isAsking || !question.trim()}
        >
          {isAsking ? "…" : "↑"}
        </button>
      </div>
    </div>
  );
}
