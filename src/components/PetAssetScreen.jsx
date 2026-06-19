import "../motrix-ui.css";

function ActionBlock({ title, subtitle, onClick, accent }) {
  return <button className={`tg-action-block ${accent || ""}`} onClick={onClick}><span>{title}</span><small>{subtitle}</small></button>;
}
function StateBlock({ title, value, subtitle, accent }) {
  return <div className={`tg-state-block ${accent || ""}`}><span>{title}</span><strong>{value}</strong><small>{subtitle}</small></div>;
}

export default function PetAssetScreen({ estate, onOpenSense, onOpenDocs, onOpenAi }) {
  return (
    <div className="mx-page tg-page tg-room-page">
      <section className="tg-room-hero pet warn">
        <div className="tg-room-hero-copy">
          <span>Питомец</span>
          <h1>Здоровье и уход</h1>
          <p>Чип, ветпаспорт, прививки, корм, вес и Pet Gate. Всё важное без ручной каши.</p>
        </div>
        <div className="tg-room-score"><b>68%</b><small>забота</small></div>
      </section>

      <section className="tg-room-states">
        <StateBlock title="Чип" value="RFID" subtitle="ключ личности питомца" accent="pet" />
        <StateBlock title="Ветпаспорт" value="Vault" subtitle="прививки и назначения" accent="passport" />
        <StateBlock title="Режим" value="Pet Gate" subtitle="корм, вода, вес" accent="signal" />
      </section>

      <section className="tg-action-grid-simple">
        <ActionBlock title="Добавить событие" subtitle="прививка, визит, лекарство" accent="primary" />
        <ActionBlock title="Добавить устройства" subtitle="Pet Gate, миска, весы" onClick={onOpenSense} accent="soft" />
        <ActionBlock title="AI-дворецкий" subtitle="спросить про уход" onClick={onOpenAi} accent="ai" />
        <ActionBlock title="Паспорт питомца" subtitle="чип, ветпаспорт, история" onClick={onOpenDocs} accent="passport" />
      </section>
    </div>
  );
}
