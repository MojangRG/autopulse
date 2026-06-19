import "../motrix-ui.css";

function km(v) { return Number(v || 0).toLocaleString("ru-RU") + " км"; }

export default function DocumentsScreen({ estate, vehicle, data, ownerProfile, analysis, onScan, isParsingDoc }) {
  const logs = data?.logs || [];
  const docCards = [
    {
      id: "vehicle-passport",
      title: "Автомобиль",
      subtitle: vehicle ? `${vehicle.brand} ${vehicle.model} · ${vehicle.year || "год не указан"}` : "Авто не добавлено",
      status: vehicle?.vin ? "VIN сохранён" : "VIN не указан",
      tone: vehicle?.vin ? "good" : "warn",
    },
    {
      id: "service-docs",
      title: "Сервисные документы",
      subtitle: logs.length ? `${logs.length} записей в журнале` : "Чеки и заказ-наряды пока не загружены",
      status: logs[0] ? `Последнее: ${logs[0].title} · ${km(logs[0].mileage)}` : "Пусто",
      tone: logs.length ? "good" : "neutral",
    },
    {
      id: "owner-profile",
      title: "Анкета владельца",
      subtitle: ownerProfile?.completedAt ? "Используется в прогнозах Motrix" : "Заполните, чтобы AI-дом не гадал",
      status: ownerProfile?.historyMode || "не заполнена",
      tone: ownerProfile?.completedAt ? "good" : "warn",
    },
    {
      id: "ai-dossier",
      title: "AI-досье",
      subtitle: analysis ? "Анализ автомобиля сохранён" : "Досье появится после анализа",
      status: analysis ? "готово" : "ожидает данных",
      tone: analysis ? "good" : "neutral",
    },
  ];

  const futureDocs = [
    "Гарантии техники",
    "Договор ремонта",
    "Страховки",
    "Ветпаспорт",
    "Счётчики",
    "Паспорта устройств",
  ];

  return (
    <div className="mx-page estate-docs-page plata-docs-page">
      <section className="plata-room-hero slate">
        <span>Motrix Vault</span>
        <h1>Документы</h1>
        <p>Единая память AI-дома: СТС, чеки, гарантии, страховки, договоры, ветпаспорт и паспорта устройств.</p>
      </section>

      <label className={`plata-upload-card ${isParsingDoc ? "loading" : ""}`}>
        <span>{isParsingDoc ? "AI читает документ" : "Загрузить документ"}</span>
        <strong>{isParsingDoc ? "Разбираю строки и смысл" : "Фото → событие, паспорт или задача"}</strong>
        <small>Сейчас: сервисные чеки и заказ-наряды. Следом: PDF, гарантии, договоры и ветпаспорт.</small>
        <input type="file" accept="image/*" onChange={onScan} hidden disabled={isParsingDoc} />
      </label>

      <div className="plata-section-head">
        <div>
          <span>Хранилище</span>
          <b>{estate?.docsCount || 0} элементов в базе</b>
        </div>
      </div>

      <section className="plata-doc-grid">
        {docCards.map((card, index) => (
          <button key={card.id} className={`plata-doc-card ${card.tone}`} style={{ "--delay": `${index * 50}ms` }}>
            <span>{card.title}</span>
            <strong>{card.status}</strong>
            <small>{card.subtitle}</small>
          </button>
        ))}
      </section>

      <section className="plata-vault-roadmap">
        <span>Следующий слой Vault</span>
        <div>
          {futureDocs.map((item) => <b key={item}>{item}</b>)}
        </div>
      </section>
    </div>
  );
}
