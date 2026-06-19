import { useState } from "react";
import "../motrix-ui.css";

export default function AuthScreen({ onAuth }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function submit(e) {
    e.preventDefault();
    onAuth?.({
      id: `local-${Date.now()}`,
      name: name.trim() || "Владелец дома",
      email: email.trim(),
      createdAt: new Date().toISOString(),
      authMode: "local-prototype",
    });
  }

  return (
    <main className="mx-auth-screen">
      <div className="mx-auth-bg-orb one" />
      <div className="mx-auth-bg-orb two" />
      <section className="mx-auth-card mx-enter-rise">
        <div className="mx-auth-mark"><span>⌂</span></div>
        <span className="mx-auth-kicker">MOTRIX HOUSE</span>
        <h1>Ваш AI-дом имущества</h1>
        <p>Машина, дом, документы, питомцы и устройства живут в одном пространстве. Для MVP вход локальный, без паролей и серверной учётки.</p>
        <form onSubmit={submit} className="mx-auth-form">
          <label><span>Как к вам обращаться</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Георгий" /></label>
          <label><span>Email, необязательно</span><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" inputMode="email" /></label>
          <button className="mx-primary-wide" type="submit">Войти в дом</button>
        </form>
        <div className="mx-auth-trust"><b>Приватность MVP</b><span>Профиль хранится локально в браузере. Реальную авторизацию и облако подключим отдельным безопасным слоем.</span></div>
      </section>
    </main>
  );
}
