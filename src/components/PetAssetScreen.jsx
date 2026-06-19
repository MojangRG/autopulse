import "../motrix-ui.css";

const PET_ITEMS = [
  { id: "chip", title: "Чип", icon: "◌", text: "RFID-чип — ключ личности питомца, но не GPS. Его ловит отдельный считыватель." },
  { id: "passport", title: "Ветпаспорт", icon: "▤", text: "Прививки, обработки, назначения и чеки ветеринара живут в Vault." },
  { id: "food", title: "Кормление", icon: "◍", text: "Кормушка или Pet Gate отмечают подход питомца и режим питания." },
  { id: "care", title: "Уход", icon: "✦", text: "Вес, груминг, лекарства, визиты и напоминания без ручной каши." },
];

export default function PetAssetScreen({ estate, onOpenSense, onOpenDocs, onOpenAi }) {
  return (
    <div className="mx-page plata-room-page">
      <section className="plata-room-hero amber">
        <span>Motrix Pet</span>
        <h1>Питомец</h1>
        <p>Личный паспорт заботы: чип, ветпаспорт, прививки, корм, вес и устройства Pet Gate.</p>
        <div className="plata-hero-actions">
          <button onClick={onOpenSense}>Pet Gate</button>
          <button onClick={onOpenDocs}>Ветпаспорт</button>
        </div>
      </section>

      <section className="plata-pet-card">
        <div className="plata-pet-avatar">🐾</div>
        <div>
          <span>Будущий питомец</span>
          <strong>Добавьте имя, чип и ветпаспорт</strong>
          <small>Пока это концепт-комната. Следующий шаг — форма паспорта и календарь прививок.</small>
        </div>
      </section>

      <div className="plata-section-head">
        <div>
          <span>Повседневный коннект</span>
          <b>Что может ловить приложение</b>
        </div>
      </div>

      <section className="plata-feature-grid">
        {PET_ITEMS.map((item, index) => (
          <button key={item.id} className="plata-feature-card amber" style={{ "--delay": `${index * 50}ms` }}>
            <span>{item.icon}</span>
            <strong>{item.title}</strong>
            <small>{item.text}</small>
          </button>
        ))}
      </section>

      <section className="plata-scenario-card amber">
        <span>Идея устройства</span>
        <h3>Pet Gate / умная миска</h3>
        <p>Считыватель чипа понимает, какой питомец подошёл. Motrix получает событие и строит дневник ухода без ручного ввода.</p>
        <button onClick={onOpenAi}>Развить идею</button>
      </section>
    </div>
  );
}
