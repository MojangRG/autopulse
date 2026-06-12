import { useEffect, useMemo, useState } from "react";
import BottomNav from "./components/BottomNav";
import "./App.css";

const defaultVehicle = null;

const defaultData = {
  mileage: 86000,
  logs: [
    { id: 1, mileage: 82000, title: "ТО двигателя", cost: 0 },
    { id: 2, mileage: 72000, title: "Чистка топливной системы", cost: 0 },
    { id: 3, mileage: 68000, title: "Передние тормоза", cost: 0 },
  ],
};

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
  "Другое",
];

function compressImage(file, maxWidth = 1400, quality = 0.72) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");

        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Не удалось сжать изображение"));
              return;
            }

            const compressedFile = new File([blob], "compressed.jpg", {
              type: "image/jpeg",
            });

            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => reject(new Error("Не удалось прочитать изображение"));
      img.src = reader.result;
    };

    reader.onerror = () => reject(new Error("Не удалось открыть файл"));
    reader.readAsDataURL(file);
  });
}

function App() {
  const [tab, setTab] = useState("home");

  const [vehicle, setVehicle] = useState(() => {
    const saved = localStorage.getItem("autopulse-vehicle");
    return saved ? JSON.parse(saved) : defaultVehicle;
  });

  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem("autopulse-profile");
    return saved ? JSON.parse(saved) : null;
  });

  const [analysis, setAnalysis] = useState(() => {
    const saved = localStorage.getItem("autopulse-analysis");
    return saved ? JSON.parse(saved) : null;
  });

  const [data, setData] = useState(() => {
    const saved = localStorage.getItem("autopulse-data");
    return saved ? JSON.parse(saved) : defaultData;
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

  const [newMileage, setNewMileage] = useState(data.mileage);
  const [workTitle, setWorkTitle] = useState("ТО двигателя");
  const [workMileage, setWorkMileage] = useState(data.mileage);
  const [workCost, setWorkCost] = useState("");
  const [workNote, setWorkNote] = useState("");

  const [question, setQuestion] = useState("");
  const [chat, setChat] = useState([]);

  const [isDetecting, setIsDetecting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [isParsingSts, setIsParsingSts] = useState(false);
  const [isParsingDoc, setIsParsingDoc] = useState(false);

  useEffect(() => {
    localStorage.setItem("autopulse-data", JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    if (vehicle) {
      localStorage.setItem("autopulse-vehicle", JSON.stringify(vehicle));
    }
  }, [vehicle]);

  function updateVehicleField(field, value) {
    setVehicleForm((prev) => ({ ...prev, [field]: value }));
  }

  function saveProfile(profileData) {
    setProfile(profileData);
    localStorage.setItem("autopulse-profile", JSON.stringify(profileData));
  }

  function saveAnalysis(analysisData) {
    setAnalysis(analysisData);
    localStorage.setItem("autopulse-analysis", JSON.stringify(analysisData));
  }

  async function analyzeVehicle(customData = data, customProfile = profile, customVehicle = vehicle) {
    if (!customVehicle || !customProfile || !customData) return;

    try {
      setIsAnalyzing(true);

      const response = await fetch("/api/analyze-vehicle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle: customVehicle,
          profile: customProfile,
          data: customData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || "Analysis failed");
      }

      saveAnalysis(result.analysis);
    } catch (error) {
      alert("Ошибка анализа: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function detectVehicleByVin() {
    const vin = vehicleForm.vin.trim().toUpperCase();

    if (!vin) {
      alert("Введите VIN");
      return;
    }

    try {
      setIsDetecting(true);

      const response = await fetch("/api/create-vehicle-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vin,
          mileage: Number(vehicleForm.mileage || 0),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.details || result.error || "Не удалось определить автомобиль");
        return;
      }

      const nextData = {
        ...data,
        mileage: Number(vehicleForm.mileage || 0),
      };

      setVehicle(result.vehicle);
      saveProfile(result.profile);
      setData(nextData);
      setNewMileage(nextData.mileage);
      setWorkMileage(nextData.mileage);
      setTab("home");

      setTimeout(() => {
        analyzeVehicle(nextData, result.profile, result.vehicle);
      }, 300);
    } catch (error) {
      alert("Ошибка связи с сервером: " + error.message);
    } finally {
      setIsDetecting(false);
    }
  }

  async function parseStsPhoto(event) {
    const originalFile = event.target.files?.[0];
if (!originalFile) return;

const file = await compressImage(originalFile);

    try {
      setIsParsingSts(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("mileage", String(vehicleForm.mileage || 0));

      const response = await fetch("/api/parse-sts", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || "STS parse failed");
      }

      setVehicleForm((prev) => ({
        ...prev,
        vin: result.vehicle?.vin || prev.vin,
        brand: result.vehicle?.brand || prev.brand,
        model: result.vehicle?.model || prev.model,
        generation: result.vehicle?.generation || prev.generation,
        year: result.vehicle?.year || prev.year,
        engine: result.vehicle?.engine || prev.engine,
        transmission: result.vehicle?.transmission || prev.transmission,
        drive: result.vehicle?.drive || prev.drive,
      }));

      if (result.vehicle && result.profile) {
        const nextData = {
          ...data,
          mileage: Number(vehicleForm.mileage || 0),
        };

        setVehicle(result.vehicle);
        saveProfile(result.profile);
        setData(nextData);
        setNewMileage(nextData.mileage);
        setWorkMileage(nextData.mileage);
        setTab("home");

        setTimeout(() => {
          analyzeVehicle(nextData, result.profile, result.vehicle);
        }, 300);
      }
    } catch (error) {
      alert("Ошибка распознавания СТС: " + error.message);
    } finally {
      setIsParsingSts(false);
      event.target.value = "";
    }
  }

  async function parseServiceDocument(event) {
    const originalFile = event.target.files?.[0];
if (!originalFile) return;

const file = await compressImage(originalFile);

    if (!vehicle) {
      alert("Сначала добавьте автомобиль");
      return;
    }

    try {
      setIsParsingDoc(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("vehicle", JSON.stringify(vehicle));
      formData.append("profile", JSON.stringify(profile));
      formData.append("mileage", String(data.mileage));

      const response = await fetch("/api/parse-service-doc", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || "Document parse failed");
      }

      const parsedLogs = Array.isArray(result.logs) ? result.logs : [];

      if (parsedLogs.length === 0) {
        alert("Не удалось найти работы в документе");
        return;
      }

      const normalizedLogs = parsedLogs.map((log) => ({
        id: Date.now() + Math.random(),
        mileage: Number(log.mileage || data.mileage),
        title: log.title || "Работа из документа",
        cost: Number(log.cost || 0),
        note: log.note || "Добавлено из документа",
      }));

      const maxMileage = Math.max(
        data.mileage,
        ...normalizedLogs.map((log) => Number(log.mileage || 0))
      );

      const nextData = {
        ...data,
        mileage: maxMileage,
        logs: [...normalizedLogs, ...data.logs],
      };

      setData(nextData);
      setNewMileage(maxMileage);
      setWorkMileage(maxMileage);
      setTab("journal");

      setTimeout(() => {
        analyzeVehicle(nextData, profile, vehicle);
      }, 300);
    } catch (error) {
      alert("Ошибка обработки документа: " + error.message);
    } finally {
      setIsParsingDoc(false);
      event.target.value = "";
    }
  }

  function saveVehicleManually() {
    const newVehicle = {
      vin: vehicleForm.vin,
      brand: vehicleForm.brand,
      model: vehicleForm.model,
      generation: vehicleForm.generation,
      year: Number(vehicleForm.year),
      engine: vehicleForm.engine,
      transmission: vehicleForm.transmission,
      drive: vehicleForm.drive,
      market: "manual",
    };

    const nextData = {
      ...data,
      mileage: Number(vehicleForm.mileage),
    };

    setVehicle(newVehicle);
    setData(nextData);
    setNewMileage(nextData.mileage);
    setWorkMileage(nextData.mileage);
    setTab("home");
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

  function saveMileage() {
    const nextData = {
      ...data,
      mileage: Number(newMileage),
    };

    setData(nextData);
    setTimeout(() => analyzeVehicle(nextData, profile, vehicle), 300);
  }

  function addWork() {
    const log = {
      id: Date.now(),
      mileage: Number(workMileage),
      title: workTitle,
      cost: Number(workCost || 0),
      note: workNote,
    };

    const nextData = {
      ...data,
      logs: [log, ...data.logs],
      mileage: Math.max(data.mileage, Number(workMileage)),
    };

    setData(nextData);
    setWorkCost("");
    setWorkNote("");
    setTab("journal");

    setTimeout(() => analyzeVehicle(nextData, profile, vehicle), 300);
  }

  function resetData() {
    if (confirm("Сбросить данные AutoPulse?")) {
      localStorage.removeItem("autopulse-data");
      localStorage.removeItem("autopulse-vehicle");
      localStorage.removeItem("autopulse-profile");
      localStorage.removeItem("autopulse-analysis");

      setVehicle(null);
      setProfile(null);
      setAnalysis(null);
      setData(defaultData);
      setNewMileage(defaultData.mileage);
      setWorkMileage(defaultData.mileage);
      setChat([]);

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

  async function askAi() {
    if (!question.trim()) return;

    const userQuestion = question;
    setQuestion("");
    setIsAsking(true);

    setChat((prev) => [
      ...prev,
      { role: "user", text: userQuestion },
      { role: "ai", text: "Думаю..." },
    ]);

    try {
      const response = await fetch("/api/ai-mechanic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle,
          profile,
          data,
          analysis,
          question: userQuestion,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.details || result.error || "AI mechanic failed");
      }

      setChat((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "ai",
          text: result.answer,
        };
        return updated;
      });
    } catch (error) {
      setChat((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "ai",
          text: "Ошибка AI-механика: " + error.message,
        };
        return updated;
      });
    } finally {
      setIsAsking(false);
    }
  }

  const schedule = useMemo(() => {
    const rules = profile?.serviceItems?.length
      ? profile.serviceItems.map((item) => ({
          title: item.name,
          base: item.name,
          interval: item.intervalKm,
          warn: item.warningBeforeKm || 2000,
          notes: item.notes,
        }))
      : [];

    return rules
      .filter((rule) => rule.interval)
      .map((rule) => {
        const matchedLogs = data.logs.filter((log) =>
          String(log.title).toLowerCase().includes(String(rule.title).toLowerCase())
        );

        const lastMileage = matchedLogs.length
          ? Math.max(...matchedLogs.map((log) => Number(log.mileage)))
          : 0;

        const nextMileage = lastMileage + Number(rule.interval);
        const left = nextMileage - data.mileage;

        let status = "Норма";
        if (left <= 0) status = "Просрочено";
        else if (left <= rule.warn) status = "Скоро";

        return { ...rule, lastMileage, nextMileage, left, status };
      });
  }, [data, profile]);

  const urgent = schedule.filter((item) => item.status !== "Норма");

  if (!vehicle) {
    return (
      <div className="app">
        <div className="card">
          <h1>🚗 AutoPulse</h1>

          <div className="section">
            <h3>Добавить автомобиль</h3>

            <label className="upload-button">
              📷 Добавить по фото СТС
              <input type="file" accept="image/*" onChange={parseStsPhoto} hidden />
            </label>

            {isParsingSts && <p className="muted">Распознаю СТС...</p>}

            <input
              value={vehicleForm.vin}
              onChange={(e) => updateVehicleField("vin", e.target.value)}
              placeholder="VIN"
            />

            <input
              type="number"
              value={vehicleForm.mileage}
              onChange={(e) => updateVehicleField("mileage", e.target.value)}
              placeholder="Пробег"
            />

            <button
              className="full secondary"
              onClick={detectVehicleByVin}
              disabled={isDetecting}
            >
              {isDetecting ? "🧠 Создаю профиль..." : "🔍 Добавить по VIN"}
            </button>

            <div className="mini-title">Ручное заполнение</div>

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

            <button className="full" onClick={saveVehicleManually}>
              Сохранить вручную
            </button>

            <button className="full secondary" onClick={fillDemoVehicle}>
              Заполнить демо Subaru
            </button>
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

        <div className={`status ${analysis ? "warning" : "good"}`}>
          {analysis ? "🟡 Есть AI-приоритеты" : "🟢 Машина добавлена"}
        </div>

        {tab === "home" && (
          <>
            <div className="section">
              <h3>Пробег</h3>
              <div className="big-number">
                {Number(data.mileage).toLocaleString("ru-RU")} км
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
              <h3>🎯 Что важно сейчас</h3>

              <button className="full secondary" onClick={() => analyzeVehicle()} disabled={isAnalyzing}>
                {isAnalyzing ? "Анализирую..." : "Обновить AI-анализ"}
              </button>

              {!analysis ? (
                <p className="muted">AI-анализ появится после добавления авто или обновления.</p>
              ) : (
                analysis.topPriorities?.map((item, index) => (
                  <div className="risk" key={index}>
                    <strong>
                      {index + 1}. {item.title}
                    </strong>
                    <span>
                      {item.severity} • {item.category}
                    </span>
                    <p>{item.reason}</p>
                    <p>
                      <b>Что сделать:</b> {item.action}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="section">
              <h3>По регламенту</h3>

              {urgent.length === 0 ? (
                <p className="muted">Срочных работ по регламенту нет.</p>
              ) : (
                urgent.map((item) => (
                  <div className="task" key={item.title}>
                    <div>
                      <strong>{item.title}</strong>
                      <span>
                        Было: {item.lastMileage.toLocaleString("ru-RU")} км • Следующее:{" "}
                        {item.nextMileage.toLocaleString("ru-RU")} км
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

            <label className="upload-button">
              📄 Загрузить заказ-наряд / чек
              <input type="file" accept="image/*,.pdf" onChange={parseServiceDocument} hidden />
            </label>

            {isParsingDoc && <p className="muted">Читаю документ...</p>}

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

            <input
              value={workNote}
              onChange={(e) => setWorkNote(e.target.value)}
              placeholder="Комментарий"
            />

            <button className="full" onClick={addWork}>
              Добавить в журнал
            </button>
          </div>
        )}

        {tab === "ai" && (
          <>
            <div className="section">
              <h3>AI-механик</h3>

              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Например: еду на 3000 км, что проверить?"
              />

              <button className="full" onClick={askAi} disabled={isAsking}>
                {isAsking ? "Думаю..." : "Спросить"}
              </button>

              <div className="chat">
                {chat.map((msg, index) => (
                  <div className={`message ${msg.role}`} key={index}>
                    {msg.text}
                  </div>
                ))}
              </div>
            </div>

            {profile?.serviceItems?.length > 0 && (
              <div className="section">
                <h3>Регламент обслуживания</h3>

                {profile.serviceItems.map((item) => (
                  <div className="task" key={item.id}>
                    <div>
                      <strong>{item.name}</strong>
                      <span>
                        {item.intervalKm
                          ? `Каждые ${Number(item.intervalKm).toLocaleString("ru-RU")} км`
                          : "По состоянию"}
                        {item.intervalMonths ? ` • ${item.intervalMonths} мес.` : ""}
                      </span>
                      <span>{item.notes}</span>
                    </div>
                    <b className={item.severity === "high" ? "red" : "yellow"}>
                      {item.confidence}
                    </b>
                  </div>
                ))}
              </div>
            )}

            {profile?.commonIssues?.length > 0 && (
              <div className="section">
                <h3>Типовые риски</h3>

                {profile.commonIssues.map((issue) => (
                  <div className="risk" key={issue.id}>
                    <strong>{issue.name}</strong>
                    <span>
                      Риск: {issue.risk}
                      {issue.riskMileageFrom && issue.riskMileageTo
                        ? ` • ${Number(issue.riskMileageFrom).toLocaleString(
                            "ru-RU"
                          )}–${Number(issue.riskMileageTo).toLocaleString("ru-RU")} км`
                        : ""}
                    </span>

                    {issue.symptoms?.length > 0 && (
                      <p>Симптомы: {issue.symptoms.join(", ")}</p>
                    )}

                    <p>{issue.recommendation}</p>
                  </div>
                ))}
              </div>
            )}
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