import "../motrix-ui.css";

function ActionBlock({ title, subtitle, onClick, accent }) {
  return <button className={`tg-action-block ${accent || ""}`} onClick={onClick}><span>{title}</span><small>{subtitle}</small></button>;
}
function StateBlock({ title, value, subtitle, accent }) {
  return <div className={`tg-state-block ${accent || ""}`}><span>{title}</span><strong>{value}</strong><small>{subtitle}</small></div>;
}

export default function HomeAssetScreen({ estate, onOpenSense, onOpenDocs, onOpenAi }) {
  return (
    <div className="mx-page tg-page tg-room-page">
      <section className="tg-room-hero home good">
        <div className="tg-room-hero-copy">
          <span>Дом</span>
          <h1>Инженерка и быт</h1>
          <p>Здесь живут счётчики, протечки, техника, фильтры, гарантии и всё, что наполняет дом.</p>
        </div>
        <div className="tg-room-score"><b>72%</b><small>контроль</small></div>
      </section>

      <section className="tg-room-states">
        <StateBlock title="Вода" value="датчики" subtitle="протечки, фильтры, счётчики" accent="home" />
        <StateBlock title="Электрика" value="энергия" subtitle="розетки, нагрузка, техника" accent="signal" />
        <StateBlock title="Гарантии" value="Vault" subtitle="чеки, договоры, инструкции" accent="passport" />
      </section>

      <section className="tg-action-grid-simple">
        <ActionBlock title="Добавить событие" subtitle="ремонт, гарантия, обслуживание" accent="primary" />
        <ActionBlock title="Добавить устройства" subtitle="датчики, счётчики, умный дом" onClick={onOpenSense} accent="soft" />
        <ActionBlock title="AI-дворецкий" subtitle="спросить про дом и быт" onClick={onOpenAi} accent="ai" />
        <ActionBlock title="Паспорт дома" subtitle="состав, техника, документы" onClick={onOpenDocs} accent="passport" />
      </section>
    </div>
  );
}
