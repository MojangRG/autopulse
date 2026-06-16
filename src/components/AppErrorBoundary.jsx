import { Component } from "react";

const STORAGE_KEYS = [
  "autopulse-data",
  "autopulse-vehicle",
  "autopulse-profile",
  "autopulse-analysis",
  "autopulse-owner-profile",
  "autopulse-reminders",
  "autopulse-chat",
  "autopulse-vehicle-render",
];

function resetMotrixStorage() {
  STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
  window.location.href = window.location.origin + window.location.pathname;
}

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Motrix runtime error", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{
        minHeight: "100vh",
        padding: "28px 18px",
        background: "#080a0f",
        color: "#f4f6fb",
        fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          width: "100%",
          maxWidth: 460,
          borderRadius: 28,
          padding: 20,
          background: "linear-gradient(145deg, rgba(255,255,255,.08), rgba(255,255,255,.035))",
          border: "1px solid rgba(255,255,255,.10)",
          boxShadow: "0 24px 70px rgba(0,0,0,.45)",
        }}>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: "#93a4bd", textTransform: "uppercase" }}>Motrix recovery</div>
          <h1 style={{ fontSize: 30, lineHeight: 1.05, letterSpacing: -1, margin: "10px 0 8px" }}>Приложение упало</h1>
          <p style={{ color: "#9aa6b8", lineHeight: 1.5, margin: "0 0 16px" }}>
            Скорее всего, после обновления несовместимы старые данные в localStorage или один экран отдал runtime-ошибку. Ниже кнопка безопасно очистит локальные данные прототипа.
          </p>
          <pre style={{
            maxHeight: 160,
            overflow: "auto",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            padding: 12,
            borderRadius: 16,
            background: "rgba(0,0,0,.28)",
            color: "#fca5a5",
            fontSize: 12,
            lineHeight: 1.45,
          }}>{this.state.error?.message || String(this.state.error)}</pre>
          <button onClick={resetMotrixStorage} style={{
            width: "100%",
            marginTop: 14,
            border: 0,
            borderRadius: 18,
            padding: "15px 16px",
            background: "#3b82f6",
            color: "#fff",
            fontWeight: 900,
            fontSize: 15,
          }}>Сбросить локальные данные и открыть заново</button>
        </div>
      </div>
    );
  }
}
