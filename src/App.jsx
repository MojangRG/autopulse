import { useEffect, useMemo, useState } from "react";
import BottomNav from "./components/BottomNav";
import "./App.css";

const defaultVehicle = null;

const demoVehicle = {
  vin: "",
  brand: "Subaru",
  model: "Forester",
  generation: "SK",
  year: 2020,
  engine: "FB20",
  transmission: "CVT",
  drive: "AWD",
};

const defaultData = {
  mileage: 86000,
  logs: [
    { id: 1, mileage: 82000, title: "ТО двигателя", cost: 0 },
    { id: 2, mileage: 72000, title: "Чистка топливной системы", cost: 0 },
    { id: 3, mileage: 68000, title: "Передние тормоза", cost: 0 },
  ],
};

const serviceRules = [
  { title: "Масло двигателя", base: "ТО двигателя", interval: 10000, warn: 2000 },
  { title: "Масляный фильтр", base: "ТО двигателя", interval: 10000, warn: 2000 },
  { title: "Салонный фильтр", base: "ТО двигателя", interval: 10000, warn: 2000 },
  { title: "Воздушный фильтр", base: "ТО двигателя", interval: 15000, warn: 3000 },
  { title: "Свечи зажигания", base: "Свечи зажигания", interval: 100000, warn: 10000 },
  { title: "Масло CVT", base: "Масло CVT", interval: 60000, warn: 10000 },
  { title: "Масло редукторов", base: "Масло редукторов", interval: 60000, warn: 10000 },
  { title: "Тормозная жидкость", base: "Тормозная жидкость", interval: 40000, warn: 5000 },
];

const commonIssues = [
  {
    title: "TCV / термоклапан системы охлаждения",
    from: 80000,
    to: 130000,
    risk: "Средний",
    note: "Для Forester SK встречается отказ термоклапана. Симптомы: Check Engine, странная температура двигателя, слабая печка.",
  },
  {
    title: "Ступичные подшипники",
    from: 90000,
    to: 140000,
    risk: "Средний",
    note: "После 90 000 км стоит слушать гул на скорости и при перестроениях.",
  },
  {
    title: "Втулки и стойки стабилизатора",
    from: 80000,
    to: 130000,
    risk: "Средний",
    note: "Проверять при стуках на мелких неровностях.",
  },
  {
    title: "Состояние масла CVT",
    from: 100000,
    to: 130000,
    risk: "Высокий",
    note: "Если нет точного подтверждения замены масла вариатора, лучше не затягивать.",
  },
];

const workOptions = [
  "ТО двигателя",
  "Масло двигателя",
  "Масляный фильтр",
  "Салонный фильтр",
  "Воздушный фильтр",
  "Свечи зажигания",
  "Масло CVT",
  "Масло редукторов",
  "Тормозная жидкость",
  "Передние тормоза",
  "Задние тормоза",
  "Чистка топливной системы",
  "Диагностика подвески",
];

function App() {
  const [tab, setTab] = useState("home");
  const [vehicle, setVehicle] = useState(() => {
  const saved = localStorage.getItem("autopulse-vehicle");
  return saved ? JSON.parse(saved) : defaultVehicle;
});

const [vehicleForm, setVehicleForm] = useState({
  vin: "",
  brand: "",
  model: "",
  generation: "",
  year: "",
  engine: "",
  transmission: "",
  drive: "",
  mileage: 86000,
});

  const [data, setData] = useState(() => {
    const saved = localStorage.getItem("autopulse-data");
    return saved ? JSON.parse(saved) : defaultData;
  });

  const [newMileage, setNewMileage] = useState(data.mileage);
  const [workTitle, setWorkTitle] = useState("ТО двигателя");
  const [workMileage, setWorkMileage] = useState(data.mileage);
  const [workCost, setWorkCost] = useState("");
  const [question, setQuestion] = useState("");
const [chat, setChat] = useState([]);

  useEffect(() => {
  localStorage.setItem("autopulse-data", JSON.stringify(data));
}, [data]);

useEffect(() => {
  if (vehicle) {
    localStorage.setItem(
      "autopulse-vehicle",
      JSON.stringify(vehicle)
    );
  }
}, [vehicle]);


  const schedule = useMemo(() => {
    return serviceRules.map((rule) => {
      const matchedLogs = data.logs.filter(
        (log) => log.title === rule.base || log.title === rule.title
      );

      const lastMileage = matchedLogs.length
        ? Math.max(...matchedLogs.map((log) => Number(log.mileage)))
        : 0;

      const nextMileage = lastMileage + rule.interval;
      const left = nextMileage - data.mileage;

      let status = "Норма";
      if (left <= 0) status = "Просрочено";
      else if (left <= rule.warn) status = "Скоро";

      return {
        ...rule,
        lastMileage,
        nextMileage,
        left,
        status,
      };
    });
  }, [data]);

  const urgent = schedule.filter((item) => item.status !== "Норма");
  const overdue = schedule.filter((item) => item.status === "Просрочено");
  const soon = schedule.filter((item) => item.status === "Скоро");

  const activeRisks = commonIssues.filter(
    (issue) => data.mileage >= issue.from && data.mileage <= issue.to
  );

  const aiSummary = useMemo(() => {
    const messages = [];

    if (overdue.length > 0) {
      messages.push(`Есть просроченные работы: ${overdue.length}. Их лучше закрыть первыми.`);
    } else {
      messages.push("Просроченных работ нет.");
    }

    if (soon.length > 0) {
      messages.push(`Скоро потребуется обслуживание: ${soon.length} поз.`);
    }

    if (activeRisks.length > 0) {
      messages.push(`По пробегу активны типовые риски модели: ${activeRisks.length}.`);
    }

    if (data.mileage >= 95000 && data.mileage <= 105000) {
      messages.push("Пробег подходит к рубежу 100 000 км. Стоит планировать свечи, подвеску и расширенную диагностику.");
    }

    if (data.mileage >= 105000) {
      messages.push("После 105 000 км особое внимание к CVT, редукторам и подвеске.");
    }

    return messages;
  }, [overdue, soon, activeRisks, data.mileage]);

  function saveMileage() {
    setData((prev) => ({
      ...prev,
      mileage: Number(newMileage),
    }));
  }

  function addWork() {
    const log = {
      id: Date.now(),
      mileage: Number(workMileage),
      title: workTitle,
      cost: Number(workCost || 0),
    };

    setData((prev) => ({
      ...prev,
      logs: [log, ...prev.logs],
      mileage: Math.max(prev.mileage, Number(workMileage)),
    }));

    setWorkCost("");
    setTab("journal");
  }

  function resetData() {
  if (confirm("Сбросить данные AutoPulse?")) {
    localStorage.removeItem("autopulse-data");
    localStorage.removeItem("autopulse-vehicle");

    setVehicle(null);

    setData(defaultData);
    setNewMileage(defaultData.mileage);
    setWorkMileage(defaultData.mileage);

    setVehicleForm({
      vin: "",
      brand: "",
      model: "",
      generation: "",
      year: "",
      engine: "",
      transmission: "",
      drive: "",
      mileage: 86000,
    });

    setTab("home");
  }
}

function askAi() {
  if (!question.trim()) return;

  const lower = question.toLowerCase();

  let answer = "Пока я могу отвечать только по базовой логике обслуживания. Позже подключим настоящий GPT.";

  if (lower.includes("масло")) {
    answer = `Масло двигателя менялось на ${Math.max(
      ...data.logs
        .filter((log) => log.title === "ТО двигателя" || log.title === "Масло двигателя")
        .map((log) => Number(log.mileage))
    ).toLocaleString("ru-RU")} км. Следующее ТО ориентировочно через каждые 10 000 км.`;
  }

  if (lower.includes("вариатор") || lower.includes("cvt")) {
    answer = "Для CVT лучше планировать замену масла в районе 110–120 тыс. км, особенно если нет точного подтверждения прошлой замены.";
  }

  if (lower.includes("свеч")) {
    answer = "Свечи зажигания стоит планировать примерно к 95–100 тыс. км.";
  }

  if (lower.includes("тормоз")) {
    answer = "Передние диски и колодки менялись на 68 000 км. Сейчас стоит отдельно контролировать задние тормоза.";
  }

  if (lower.includes("ступиц") || lower.includes("гул")) {
    answer = "На этом пробеге стоит проверить ступичные подшипники. Симптомы: гул на скорости, изменение звука при перестроении.";
  }

  setChat((prev) => [
    ...prev,
    { role: "user", text: question },
    { role: "ai", text: answer },
  ]);

  setQuestion("");
}

function updateVehicleField(field, value) {
  setVehicleForm((prev) => ({
    ...prev,
    [field]: value,
  }));
}

function saveVehicle() {
  const newVehicle = {
    vin: vehicleForm.vin,
    brand: vehicleForm.brand,
    model: vehicleForm.model,
    generation: vehicleForm.generation,
    year: Number(vehicleForm.year),
    engine: vehicleForm.engine,
    transmission: vehicleForm.transmission,
    drive: vehicleForm.drive,
  };

  setVehicle(newVehicle);

  setData((prev) => ({
    ...prev,
    mileage: Number(vehicleForm.mileage),
  }));

  setNewMileage(Number(vehicleForm.mileage));
  setWorkMileage(Number(vehicleForm.mileage));
}

function fillDemoVehicle() {
  setVehicleForm({
    vin: "JF1SK7AC2MG117103",
    brand: "Subaru",
    model: "Forester",
    generation: "SK",
    year: "2020",
    engine: "FB20",
    transmission: "CVT",
    drive: "AWD",
    mileage: 86000,
  });
}

async function detectVehicleByVin() {
  const vin = vehicleForm.vin.trim().toUpperCase();

  if (!vin) {
    alert("Введите VIN");
    return;
  }

  try {
    const response = await fetch("/api/create-vehicle-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vin,
        mileage: Number(vehicleForm.mileage || 0),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      alert(result.error || "Не удалось определить автомобиль");
      return;
    }

    setVehicle(result.vehicle);

    localStorage.setItem(
      "autopulse-profile",
      JSON.stringify(result.profile)
    );

    setData((prev) => ({
      ...prev,
      mileage: Number(vehicleForm.mileage || 0),
    }));

    setNewMileage(Number(vehicleForm.mileage || 0));
    setWorkMileage(Number(vehicleForm.mileage || 0));

    setTab("home");
  } catch (error) {
    alert("Ошибка связи с сервером");
    console.error(error);
  }
}

  // Временная заглушка поставщика данных.
  // Позже здесь будет реальный запрос к VIN API.
  if (vin === "JF1SK7AC2MG117103") {
    setVehicleForm((prev) => ({
      ...prev,
      vin,
      brand: "Subaru",
      model: "Forester",
      generation: "SK",
      year: "2020",
      engine: "FB20",
      transmission: "CVT",
      drive: "AWD",
    }));

    return;
  }

  alert("Пока этот VIN не найден в демо-базе. Позже подключим реального поставщика.");
}

if (!vehicle) {
  return (
    <div className="app">
      <div className="card">
        <h1>🚗 AutoPulse</h1>

        <div className="section">
          <h3>Добавить автомобиль</h3>

          <input
            value={vehicleForm.vin}
            onChange={(e) => updateVehicleField("vin", e.target.value)}
            placeholder="VIN"
          />
          <button className="full secondary" onClick={detectVehicleByVin}>
  🔍 Определить автомобиль по VIN
</button>

          <input
            value={vehicleForm.brand}
            onChange={(e) => updateVehicleField("brand", e.target.value)}
            placeholder="Марка"
          />

          <input
            value={vehicleForm.model}
            onChange={(e) => updateVehicleField("model", e.target.value)}
            placeholder="Модель"
          />

          <input
            value={vehicleForm.generation}
            onChange={(e) => updateVehicleField("generation", e.target.value)}
            placeholder="Поколение"
          />

          <input
            type="number"
            value={vehicleForm.year}
            onChange={(e) => updateVehicleField("year", e.target.value)}
            placeholder="Год выпуска"
          />

          <input
            value={vehicleForm.engine}
            onChange={(e) => updateVehicleField("engine", e.target.value)}
            placeholder="Двигатель"
          />

          <input
            value={vehicleForm.transmission}
            onChange={(e) => updateVehicleField("transmission", e.target.value)}
            placeholder="Коробка"
          />

          <input
            value={vehicleForm.drive}
            onChange={(e) => updateVehicleField("drive", e.target.value)}
            placeholder="Привод"
          />

          <input
            type="number"
            value={vehicleForm.mileage}
            onChange={(e) => updateVehicleField("mileage", e.target.value)}
            placeholder="Пробег"
          />

          <button className="full" onClick={saveVehicle}>
            Сохранить автомобиль
          </button>

          <button className="full secondary" onClick={fillDemoVehicle}>
            Заполнить демо Subaru
          </button>

          <p className="muted">
            Следующая версия будет определять автомобиль по VIN и фото СТС.
          </p>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="app">
      <div className="card">
        <h1>🚗 AutoPulse</h1>

        <div className="vehicle">
          <h2>
            {vehicle.brand} {vehicle.model} {vehicle.generation}
          </h2>
          <p>
            {vehicle.year} • {vehicle.engine} • {vehicle.transmission} • {vehicle.drive}
          </p>
        </div>

        <div className={`status ${urgent.length || activeRisks.length ? "warning" : "good"}`}>
          {urgent.length || activeRisks.length
            ? "🟡 Машина требует внимания"
            : "🟢 Машина здорова"}
        </div>

        {tab === "home" && (
          <>
            <div className="section">
              <h3>Пробег</h3>
              <div className="big-number">
                {data.mileage.toLocaleString("ru-RU")} км
              </div>

              <div className="row">
                <input
                  type="number"
                  value={newMileage}
                  onChange={(e) => setNewMileage(e.target.value)}
                  placeholder="Текущий пробег"
                />
                <button onClick={saveMileage}>Обновить</button>
              </div>
            </div>

            <div className="section">
              <h3>Что требует внимания</h3>

              {urgent.length === 0 ? (
                <p className="muted">Критичных работ нет.</p>
              ) : (
                urgent.map((item) => (
                  <div className="task" key={item.title}>
                    <div>
                      <strong>{item.title}</strong>
                      <span>
                        Было: {item.lastMileage.toLocaleString("ru-RU")} км •
                        Следующее: {item.nextMileage.toLocaleString("ru-RU")} км
                      </span>
                    </div>
                    <b className={item.status === "Просрочено" ? "red" : "yellow"}>
                      {item.status}
                    </b>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {tab === "journal" && (
          <div className="section">
            <h3>Журнал работ</h3>

            {[...data.logs]
              .sort((a, b) => b.mileage - a.mileage)
              .map((log) => (
                <div className="log" key={log.id}>
                  <strong>{Number(log.mileage).toLocaleString("ru-RU")} км</strong>
                  <span>{log.title}</span>
                </div>
              ))}
          </div>
        )}

        {tab === "add" && (
          <div className="section">
            <h3>Добавить работу</h3>

            <select value={workTitle} onChange={(e) => setWorkTitle(e.target.value)}>
              {workOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>

            <input
              type="number"
              value={workMileage}
              onChange={(e) => setWorkMileage(e.target.value)}
              placeholder="Пробег"
            />

            <input
              type="number"
              value={workCost}
              onChange={(e) => setWorkCost(e.target.value)}
              placeholder="Стоимость, ₽"
            />

            <button className="full" onClick={addWork}>
              Добавить в журнал
            </button>
          </div>
        )}

        {tab === "ai" && (
          <>
            <div className="section">
              <h3>AI Механик</h3>

              {aiSummary.map((message, index) => (
                <div className="ai-card" key={index}>
                  {message}
                </div>
              ))}
            </div>
<div className="section">
  <h3>Задать вопрос</h3>

  <textarea
    value={question}
    onChange={(e) => setQuestion(e.target.value)}
    placeholder="Например: когда менять масло CVT?"
  />

  <button className="full" onClick={askAi}>
    Спросить
  </button>

  <div className="chat">
    {chat.map((msg, index) => (
      <div className={`message ${msg.role}`} key={index}>
        {msg.text}
      </div>
    ))}
  </div>
</div>
            <div className="section">
              <h3>Ближайшие работы</h3>

              {urgent.length === 0 ? (
                <p className="muted">По регламенту срочных работ нет.</p>
              ) : (
                urgent.map((item) => (
                  <div className="task" key={item.title}>
                    <div>
                      <strong>{item.title}</strong>
                      <span>
                        Осталось: {item.left.toLocaleString("ru-RU")} км
                      </span>
                    </div>
                    <b className={item.status === "Просрочено" ? "red" : "yellow"}>
                      {item.status}
                    </b>
                  </div>
                ))
              )}
            </div>

            <div className="section">
              <h3>Типовые риски по пробегу</h3>

              {activeRisks.length === 0 ? (
                <p className="muted">Сейчас активных модельных рисков нет.</p>
              ) : (
                activeRisks.map((issue) => (
                  <div className="risk" key={issue.title}>
                    <strong>{issue.title}</strong>
                    <span>
                      Риск: {issue.risk} • Диапазон:{" "}
                      {issue.from.toLocaleString("ru-RU")}–{issue.to.toLocaleString("ru-RU")} км
                    </span>
                    <p>{issue.note}</p>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {tab === "settings" && (
          <div className="section">
            <h3>Настройки</h3>
            <button className="danger" onClick={resetData}>
              Сбросить данные
            </button>
          </div>
        )}

        <BottomNav tab={tab} setTab={setTab} />
      </div>
    </div>
  );
}

export default App;