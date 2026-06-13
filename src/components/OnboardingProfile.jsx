import { useState } from "react";

const QUESTIONS = [
  {
    id: "monthlyKm",
    question: "Сколько вы проезжаете в месяц?",
    options: ["до 500 км", "500-1500 км", "1500-3000 км", "более 3000 км"],
  },
  {
    id: "usage",
    question: "Как вы используете автомобиль?",
    options: ["Город", "Трасса", "Смешанный режим", "Такси / работа"],
  },
  {
    id: "priority",
    question: "Что для вас важнее?",
    options: ["Экономия", "Баланс", "Максимальная надёжность"],
  },
  {
    id: "service",
    question: "Кто обычно обслуживает авто?",
    options: ["Сам", "Знакомый мастер", "Независимый сервис", "Дилер"],
  },
];

export default function OnboardingProfile({ onSave, onSkip }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const q = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;

  function select(option) {
    const next = { ...answers, [q.id]: option };
    setAnswers(next);
    if (isLast) {
      onSave(next);
    } else {
      setStep((s) => s + 1);
    }
  }

  return (
    <div className="overlay">
      <div className="overlay-scroll">
        <div className="bottom-sheet">
          <div className="sheet-handle" />
          <div className="profile-steps">
            {QUESTIONS.map((_, i) => (
              <div key={i} className={`profile-step-dot${i <= step ? " active" : ""}`} />
            ))}
          </div>
          <div className="profile-question">{q.question}</div>
          <div className="profile-choices">
            {q.options.map((opt) => (
              <button
                key={opt}
                className={`profile-choice-btn${answers[q.id] === opt ? " selected" : ""}`}
                onClick={() => select(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
          <button className="btn-link" onClick={onSkip}>
            Пропустить
          </button>
        </div>
      </div>
    </div>
  );
}
