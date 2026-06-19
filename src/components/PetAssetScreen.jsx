import "../motrix-ui.css";

export default function PetAssetScreen({ estate, onOpenDevices, onOpenDocs, onOpenAi }) {
  const cards = estate?.pet?.cards || [];
  const groups = estate?.pet?.senseGroups || [];

  return (
    <div className="mx-page estate-room-page">
      <div className="mx-page-head">
        <span>ROOM / PET</span>
        <h2>Питомец</h2>
        <p>Питомец — не “ещё один объект”, а живой паспорт заботы: чип, ветпаспорт, прививки, корм, вес и ежедневные события.</p>
      </div>

      <section className="estate-room-hero pet">
        <div>
          <span>Pet Tamagotchi</span>
          <h3>Чип как ключ к уходу</h3>
          <p>Ветчип сам ничего не передаёт, но Pet Gate или умная кормушка смогут узнавать питомца и отправлять события в приложение.</p>
        </div>
        <button onClick={onOpenDevices}>Pet Gate</button>
      </section>

      <div className="estate-section-head">
        <span>Паспорт ухода</span>
        <small>Первый слой питомца</small>
      </div>

      <section className="estate-system-grid">
        {cards.map((card) => (
          <button key={card.id} className="estate-system-card warn">
            <span>{card.title}</span>
            <strong>{card.status}</strong>
            <small>{card.detail}</small>
          </button>
        ))}
      </section>

      <div className="estate-section-head">
        <span>Повседневные устройства</span>
        <small>Что может поймать коннект</small>
      </div>

      <section className="estate-device-list">
        {groups.map((group) => (
          <button key={group.id} className="estate-device-card" onClick={onOpenDevices}>
            <span>{group.productName}</span>
            <strong>{group.title}</strong>
            <small>{group.description}</small>
            <em>{group.userValue}</em>
          </button>
        ))}
      </section>

      <section className="estate-quick-actions">
        <button onClick={onOpenDocs}>Ветпаспорт</button>
        <button onClick={onOpenAi}>Какой сценарий MVP?</button>
      </section>
    </div>
  );
}
