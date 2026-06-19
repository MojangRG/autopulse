import "../motrix-ui.css";
function km(v) { return Number(v || 0).toLocaleString("ru-RU") + " км"; }
export default function DocumentsScreen({ estate, vehicle, data, ownerProfile, analysis, onScan, isParsingDoc }) {
  const logs = data?.logs || [];
  const docCards = [
    { id: "vehicle-passport", title: "Автомобиль", subtitle: vehicle ? `${vehicle.brand} ${vehicle.model} · ${vehicle.year || "год не указан"}` : "Авто не добавлено", status: vehicle?.vin ? "VIN сохранён" : "VIN не указан", tone: vehicle?.vin ? "good" : "warn" },
    { id: "service-docs", title: "Сервисные документы", subtitle: logs.length ? `${logs.length} записей в журнале` : "Чеки и заказ-наряды пока не загружены", status: logs[0] ? `Последнее: ${logs[0].title} · ${km(logs[0].mileage)}` : "Пусто", tone: logs.length ? "good" : "neutral" },
    { id: "owner-profile", title: "Анкета владельца", subtitle: ownerProfile?.completedAt ? "Используется в прогнозах Motrix" : "Заполните, чтобы AI-дом не гадал", status: ownerProfile?.historyMode || "не заполнена", tone: ownerProfile?.completedAt ? "good" : "warn" },
    { id: "ai-dossier", title: "AI-досье", subtitle: analysis ? "Анализ автомобиля сохранён" : "Досье появится после анализа", status: analysis ? "готово" : "ожидает данных", tone: analysis ? "good" : "neutral" },
    { id: "home-docs", title: "Дом", subtitle: "Гарантии, договоры ремонта, счётчики, инструкции", status: "готовим", tone: "neutral" },
    { id: "pet-docs", title: "Питомец", subtitle: "Ветпаспорт, чип, назначения, прививки", status: "готовим", tone: "neutral" },
  ];
  return (
    <div className="mx-page estate-docs-page mx-plata-page">
      <section className="mx-vault-hero mx-plata-hero"><span>MOTRIX VAULT</span><h2>Документы</h2><p>Единая память AI-дома: СТС, чеки, гарантии, страховки, договоры, ветпаспорт и документы устройств.</p></section>
      <label className={`estate-upload-card mx-plata-card ${isParsingDoc ? "loading" : ""}`}><span>{isParsingDoc ? "Читаю документ" : "Загрузить чек / заказ-наряд"}</span><strong>{isParsingDoc ? "AI разбирает строки" : "Фото документа → событие в журнал"}</strong><small>Пока поддерживаем изображения. PDF и договоры добавим в следующий слой Vault.</small><input type="file" accept="image/*" onChange={onScan} hidden disabled={isParsingDoc} /></label>
      <div className="estate-section-head mx-section-soft"><span>Хранилище</span><small>{estate?.docsCount || 0} элементов в базе</small></div>
      <section className="estate-doc-grid mx-stagger-list">{docCards.map((card, index) => (<button key={card.id} className={`estate-doc-card mx-plata-card ${card.tone}`} style={{ "--delay": `${index * 55}ms` }}><span>{card.title}</span><strong>{card.status}</strong><small>{card.subtitle}</small></button>))}</section>
    </div>
  );
}
