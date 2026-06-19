import "../motrix-ui.css";

const DEVICES = [
  { title: "Гараж", value: "OBD / StarLine", text: "ошибки, пробег, АКБ, поездки" },
  { title: "Дом", value: "датчики", text: "протечки, счётчики, розетки, климат" },
  { title: "Питомец", value: "Pet Gate", text: "чип, корм, вода, вес" },
];

export default function SenseScreen({ onOpenGarage, onOpenHome, onOpenPet }) {
  return (
    <div className="mx-page tg-page tg-room-page">
      <section className="tg-room-hero sense good">
        <div className="tg-room-hero-copy">
          <span>Motrix Sense</span>
          <h1>Устройства</h1>
          <p>Нервная система AI-дома. Подключения добавляются внутри дома, гаража и питомца.</p>
        </div>
        <div className="tg-room-score"><b>3</b><small>контуры</small></div>
      </section>

      <section className="tg-room-states">
        {DEVICES.map((item) => (
          <div key={item.title} className="tg-state-block signal">
            <span>{item.title}</span>
            <strong>{item.value}</strong>
            <small>{item.text}</small>
          </div>
        ))}
      </section>

      <section className="tg-action-grid-simple">
        <button className="tg-action-block soft" onClick={onOpenGarage}><span>В гараж</span><small>добавить OBD или сигнализацию</small></button>
        <button className="tg-action-block soft" onClick={onOpenHome}><span>В дом</span><small>добавить датчики и счётчики</small></button>
        <button className="tg-action-block soft" onClick={onOpenPet}><span>К питомцу</span><small>Pet Gate и чип</small></button>
      </section>
    </div>
  );
}
