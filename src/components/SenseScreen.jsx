import "../motrix-ui.css";
import { SENSE_CATALOG } from "../core/senseCatalog.js";

function tone(item) {
  return `plata-sense-item ${item.tone || "slate"}`;
}

export default function SenseScreen({ estate, onOpenGarage, onOpenDocs, onOpenAi }) {
  return (
    <div className="mx-page plata-sense-page">
      <section className="plata-room-hero green">
        <span>Motrix Sense</span>
        <h1>Устройства</h1>
        <p>Нервная система AI-дома: авто, дом, питомец и инженерка получают живые сигналы от внешних устройств.</p>
        <div className="plata-hero-actions">
          <button onClick={onOpenGarage}>Гараж</button>
          <button onClick={onOpenDocs}>Vault</button>
        </div>
      </section>

      <section className="plata-sense-map">
        <div><span>1</span><b>Устройство</b><small>OBD, датчик, счётчик, Pet Gate</small></div>
        <div><span>2</span><b>Сигнал</b><small>ошибка, расход, чип, авария</small></div>
        <div><span>3</span><b>AI-действие</b><small>объяснение, риск, задача, документ</small></div>
      </section>

      <div className="plata-section-head">
        <div>
          <span>Каталог подключений</span>
          <b>Что можно продавать и интегрировать</b>
        </div>
        <small>{SENSE_CATALOG.length} направлений</small>
      </div>

      <section className="plata-sense-list">
        {SENSE_CATALOG.map((item, index) => (
          <button key={item.id} className={tone(item)} style={{ "--delay": `${index * 45}ms` }}>
            <div className="plata-sense-item-head">
              <span>{item.type}</span>
              <em>{item.status}</em>
            </div>
            <strong>{item.title}</strong>
            <small>{item.signal}</small>
            <p>{item.value}</p>
            <b>{item.cta}</b>
          </button>
        ))}
      </section>

      <section className="plata-scenario-card green">
        <span>Принцип</span>
        <h3>Не гаджет ради гаджета</h3>
        <p>Каждое устройство должно создавать событие в AI-доме: что произошло, насколько это важно, сколько может стоить и что делать дальше.</p>
        <button onClick={onOpenAi}>Спросить AI</button>
      </section>
    </div>
  );
}
