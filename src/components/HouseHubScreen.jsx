import "../motrix-ui.css";

function pct(value) {
  const n = Number(value || 0);
  return Math.max(0, Math.min(100, Math.round(n)));
}

function km(v) { return Number(v || 0).toLocaleString("ru-RU") + " км"; }

function tone(score) {
  if (score >= 80) return "good";
  if (score >= 55) return "warn";
  return "bad";
}

function BlueprintVisual({ estate, vehicle }) {
  const score = pct(estate?.estateScore || 0);
  return (
    <section className="tg-blueprint-hero" aria-label="AI-дом имущества">
      <div className="tg-blueprint-grid" />
      <div className="tg-blueprint-orbit orbit-a" />
      <div className="tg-blueprint-orbit orbit-b" />
      <div className="tg-blueprint-house">
        <div className="tg-roof" />
        <div className="tg-home-core">
          <span className="tg-window w1" />
          <span className="tg-window w2" />
          <span className="tg-door" />
        </div>
        <div className="tg-garage-core">
          <span className="tg-garage-door" />
          <span className="tg-car-dot" />
        </div>
        <div className="tg-pet-core">●</div>
        <span className="tg-signal s1" />
        <span className="tg-signal s2" />
        <span className="tg-signal s3" />
      </div>
      <div className="tg-blueprint-copy">
        <span>Личный AI-дом</span>
        <h1>{estate?.estateName || "Мой дом"}</h1>
        <p>Дом, гараж и питомец. Всё важное видно сразу, детали живут внутри разделов.</p>
      </div>
      <div className={`tg-score-orb ${tone(score)}`}>
        <b>{score}%</b>
        <small>состояние</small>
      </div>
    </section>
  );
}

function BigAssetCard({ title, label, score, subtitle, metric, onClick, accent }) {
  const safeScore = pct(score);
  return (
    <button className={`tg-asset-card ${accent || ""}`} onClick={onClick}>
      <div className="tg-asset-top">
        <div>
          <span>{label}</span>
          <strong>{title}</strong>
        </div>
        <b>{safeScore}%</b>
      </div>
      <div className="tg-state-track"><i style={{ width: `${safeScore}%` }} /></div>
      <p>{subtitle}</p>
      <em>{metric}</em>
    </button>
  );
}

export default function HouseHubScreen({ estate, vehicle, reminders, onOpenGarage, onOpenHome, onOpenPet }) {
  const garageScore = pct(estate?.garage?.healthScore || 0);
  const homeScore = pct(estate?.home?.score || 72);
  const petScore = pct(estate?.pet?.score || 68);
  const garageTitle = vehicle?.brand && vehicle?.model ? `${vehicle.brand} ${vehicle.model}` : "Гараж";
  const garageMetric = vehicle ? `${km(estate?.garage?.mileage || 0)} · ${reminders?.length || 0} сигналов` : "Добавьте автомобиль";

  return (
    <div className="mx-page tg-page">
      <BlueprintVisual estate={estate} vehicle={vehicle} />

      <section className="tg-main-assets">
        <BigAssetCard
          title="Дом"
          label="Инженерка · техника · счётчики"
          score={homeScore}
          subtitle="Вода, электрика, климат, фильтры, гарантии и умные устройства."
          metric="Открыть дом"
          accent="home"
          onClick={onOpenHome}
        />
        <BigAssetCard
          title={garageTitle}
          label="Гараж · автомобиль"
          score={garageScore}
          subtitle={estate?.garage?.statusSentence || "ТО, пробег, расходы, ошибки, документы и AI-механик."}
          metric={garageMetric}
          accent="garage"
          onClick={onOpenGarage}
        />
        <BigAssetCard
          title="Питомец"
          label="Чип · ветпаспорт · уход"
          score={petScore}
          subtitle="Прививки, корм, вес, ветвизиты, Pet Gate и ежедневная забота."
          metric="Открыть питомца"
          accent="pet"
          onClick={onOpenPet}
        />
      </section>
    </div>
  );
}
