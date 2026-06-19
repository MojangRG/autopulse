import "../motrix-ui.css";

const HOME_ZONES = [
  { id: "water", icon: "≈", title: "Вода", subtitle: "счётчики · фильтры · протечки", status: "датчик протечки — первый must-have", tone: "blue" },
  { id: "power", icon: "ϟ", title: "Электрика", subtitle: "розетки · нагрузка · техника", status: "энергомонитор покажет лишний расход", tone: "green" },
  { id: "climate", icon: "◒", title: "Климат", subtitle: "кондиционер · влажность · фильтры", status: "сезонные задачи и профилактика", tone: "violet" },
  { id: "warranty", icon: "▤", title: "Гарантии", subtitle: "чеки · договоры · инструкции", status: "всё уходит в Vault", tone: "slate" },
];

export default function HomeAssetScreen({ estate, onOpenSense, onOpenDocs, onOpenAi }) {
  return (
    <div className="mx-page plata-room-page">
      <section className="plata-room-hero violet">
        <span>Motrix Home</span>
        <h1>Дом</h1>
        <p>Комната для счётчиков, техники, фильтров, протечек, гарантий и умного дома. Здесь рождается бытовой контур AI-дома.</p>
        <div className="plata-hero-actions">
          <button onClick={onOpenSense}>Подключить Sense</button>
          <button onClick={onOpenDocs}>Документы</button>
        </div>
      </section>

      <div className="plata-section-head">
        <div>
          <span>Контур дома</span>
          <b>Что будет под контролем</b>
        </div>
      </div>

      <section className="plata-feature-grid">
        {HOME_ZONES.map((item, index) => (
          <button key={item.id} className={`plata-feature-card ${item.tone}`} style={{ "--delay": `${index * 50}ms` }}>
            <span>{item.icon}</span>
            <strong>{item.title}</strong>
            <small>{item.subtitle}</small>
            <em>{item.status}</em>
          </button>
        ))}
      </section>

      <section className="plata-scenario-card">
        <span>Сценарий</span>
        <h3>Дом предупредил раньше аварии</h3>
        <p>Датчик протечки даёт сигнал, Motrix поднимает срочную карточку, показывает где сработало, какие документы открыть и что делать дальше.</p>
        <button onClick={onOpenAi}>Смоделировать через AI</button>
      </section>
    </div>
  );
}
