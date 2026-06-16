import { useMemo, useState } from "react";

const QUESTIONS = [
  {
    id: "firstOwner",
    title: "Вы первый владелец авто?",
    subtitle: "От этого зависит логика Motrix: точная история, частичная история или режим б/у автомобиля без прошлого.",
    options: [
      { value: "yes", label: "Да, с салона", hint: "История должна быть известна" },
      { value: "no", label: "Нет, купил б/у", hint: "Нужно понять, что известно о прошлом" },
    ],
  },
  {
    id: "historyKnowledge",
    title: "История обслуживания известна?",
    subtitle: "Не надо угадывать. Лучше честно указать уровень данных.",
    options: [
      { value: "full", label: "Знаю точно", hint: "Есть чеки, заказ-наряды или понятные записи" },
      { value: "partial", label: "Знаю частично", hint: "Что-то известно, но есть пробелы" },
      { value: "none", label: "Не знаю", hint: "Авто куплено без нормальной истории" },
    ],
  },
  {
    id: "lastEngineService",
    title: "Когда было последнее ТО двигателя?",
    subtitle: "Масло и фильтр. Можно примерно.",
    options: [
      { value: "lt5", label: "До 5 000 км назад", hint: "Свежее обслуживание" },
      { value: "5to10", label: "5–10 тыс. км назад", hint: "Скоро снова контролировать" },
      { value: "gt10", label: "Больше 10 тыс. км", hint: "Вероятно, пора обслужить" },
      { value: "unknown", label: "Не знаю", hint: "Motrix будет считать это зоной неопределенности" },
    ],
  },
  {
    id: "transmissionHistory",
    title: "Коробка / CVT обслуживалась?",
    subtitle: "Для вариатора и АКПП это одна из самых дорогих зон риска.",
    options: [
      { value: "recent", label: "Да, недавно", hint: "До 30 тыс. км назад" },
      { value: "old", label: "Давно", hint: "Более 30–60 тыс. км назад" },
      { value: "no", label: "Нет / не менялась", hint: "Нужна осторожная рекомендация" },
      { value: "unknown", label: "Не знаю", hint: "Режим б/у без подтверждения" },
    ],
  },
  {
    id: "brakeFluidHistory",
    title: "Тормозную жидкость меняли за 2 года?",
    subtitle: "Это не про красоту регламента, а про безопасность и влагу в жидкости.",
    options: [
      { value: "yes", label: "Да", hint: "Пока считаем подтверждённой со слов" },
      { value: "no", label: "Нет", hint: "Нужно запланировать замену" },
      { value: "unknown", label: "Не знаю", hint: "Отметим как неизвестную зону" },
    ],
  },
  {
    id: "monthlyKm",
    title: "Сколько проезжаете в месяц?",
    subtitle: "Так Motrix считает сроки, а не только километры.",
    options: [
      { value: "до 500 км", label: "До 500 км", hint: "Редкая эксплуатация" },
      { value: "500-1500 км", label: "500–1500 км", hint: "Обычный городской режим" },
      { value: "1500-3000 км", label: "1500–3000 км", hint: "Активная эксплуатация" },
      { value: "более 3000 км", label: "Более 3000 км", hint: "Высокий пробег" },
    ],
  },
  {
    id: "usage",
    title: "Как используется авто?",
    subtitle: "Город, трасса и работа изнашивают машину по-разному.",
    options: [
      { value: "Город", label: "Город", hint: "Пробки, короткие поездки" },
      { value: "Трасса", label: "Трасса", hint: "Ровный пробег" },
      { value: "Смешанный режим", label: "Смешанный", hint: "Город + трасса" },
      { value: "Такси / работа", label: "Работа", hint: "Тяжёлый режим" },
    ],
  },
  {
    id: "priority",
    title: "Какой режим рекомендаций выбрать?",
    subtitle: "Motrix будет подбирать тон рекомендаций под вашу цель.",
    options: [
      { value: "Экономия", label: "Экономия", hint: "Не менять лишнее" },
      { value: "Баланс", label: "Баланс", hint: "Разумный режим" },
      { value: "Максимальная надёжность", label: "Надёжность", hint: "Лучше раньше, чем поздно" },
    ],
  },
];

function deriveHistoryMode(answers) {
  if (answers.firstOwner === "yes" && answers.historyKnowledge === "full") return "first-owner-known";
  if (answers.firstOwner === "yes") return "first-owner-partial";
  if (answers.historyKnowledge === "full") return "used-known";
  if (answers.historyKnowledge === "partial") return "used-partial";
  if (answers.historyKnowledge === "none") return "used-unknown";
  return "unknown";
}

export default function OnboardingProfile({ onSave, onSkip }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});

  const visibleQuestions = useMemo(() => {
    return QUESTIONS.filter((q) => {
      if (q.id === "historyKnowledge") return Boolean(answers.firstOwner);
      if (["lastEngineService", "transmissionHistory", "brakeFluidHistory"].includes(q.id)) return Boolean(answers.historyKnowledge);
      return true;
    });
  }, [answers]);

  const q = visibleQuestions[Math.min(step, visibleQuestions.length - 1)];
  const isLast = step >= visibleQuestions.length - 1;

  function select(option) {
    const next = { ...answers, [q.id]: option.value, [`${q.id}Label`]: option.label };
    if (q.id === "firstOwner" && option.value === "yes") {
      next.historyKnowledge = "full";
      next.historyKnowledgeLabel = "Знаю точно";
    }
    setAnswers(next);

    const nextVisible = QUESTIONS.filter((item) => {
      const candidate = { ...next };
      if (item.id === "historyKnowledge") return Boolean(candidate.firstOwner);
      if (["lastEngineService", "transmissionHistory", "brakeFluidHistory"].includes(item.id)) return Boolean(candidate.historyKnowledge);
      return true;
    });

    if (step >= nextVisible.length - 1) {
      onSave({
        ...next,
        historyMode: deriveHistoryMode(next),
        completedAt: new Date().toISOString(),
        source: "onboarding_questionnaire",
      });
    } else {
      setStep((s) => s + 1);
    }
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  if (!q) return null;

  return (
    <div className="overlay mx-profile-overlay">
      <div className="overlay-scroll">
        <div className="bottom-sheet mx-profile-sheet">
          <div className="sheet-handle" />
          <div className="profile-steps">
            {visibleQuestions.map((_, i) => (
              <div key={i} className={`profile-step-dot${i <= step ? " active" : ""}`} />
            ))}
          </div>
          <div className="mx-profile-kicker">Быстрая история авто</div>
          <div className="profile-question">{q.title}</div>
          <div className="mx-profile-subtitle">{q.subtitle}</div>
          <div className="profile-choices mx-profile-choices">
            {q.options.map((opt) => (
              <button
                key={opt.value}
                className={`profile-choice-btn mx-profile-choice${answers[q.id] === opt.value ? " selected" : ""}`}
                onClick={() => select(opt)}
              >
                <b>{opt.label}</b>
                <small>{opt.hint}</small>
              </button>
            ))}
          </div>
          <div className="mx-profile-actions">
            {step > 0 && <button className="btn-link" onClick={back}>Назад</button>}
            <button className="btn-link" onClick={onSkip}>Пропустить</button>
          </div>
        </div>
      </div>
    </div>
  );
}
