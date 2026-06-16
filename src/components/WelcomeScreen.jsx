import { useMemo, useState } from "react";
import { KNOWN_BRANDS, getModelHints, sanitizeVehicleForm, validateVehicleForm } from "../vehicleCatalog.js";
import "../motrix-ui.css";

function Stat({ value, label }) {
  return <div className="mx-welcome-stat"><b>{value}</b><span>{label}</span></div>;
}

function Field({ label, children, hint }) {
  return <label className="mx-welcome-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

export default function WelcomeScreen({
  vehicleForm,
  updateVehicleField,
  parseStsPhoto,
  detectVehicleByVin,
  saveVehicleManually,
  fillDemoVehicle,
  isParsingSts,
  isDetecting,
}) {
  const [mode, setMode] = useState("smart");
  const [errors, setErrors] = useState([]);
  const clean = sanitizeVehicleForm(vehicleForm);
  const modelHints = useMemo(() => getModelHints(clean.brand), [clean.brand]);

  function update(field, value) {
    setErrors([]);
    const next = sanitizeVehicleForm({ ...vehicleForm, [field]: value });
    updateVehicleField(field, next[field]);
  }

  function submitManual() {
    const result = validateVehicleForm(vehicleForm);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    saveVehicleManually(result.vehicleForm);
  }

  return (
    <div className="mx-welcome-shell">
      <div className="mx-welcome-bg" />
      <div className="mx-welcome-hero">
        <div className="mx-welcome-mark">MOTRIX</div>
        <h1>AI-паспорт автомобиля</h1>
        <p>Добавьте машину. Motrix соберёт профиль, регламент, риски и первые действия.</p>
        <div className="mx-welcome-stats">
          <Stat value="3" label="способа ввода" />
          <Stat value="AI" label="анализ ТО" />
          <Stat value="0" label="лишнего текста" />
        </div>
      </div>

      <div className="mx-welcome-card">
        <div className="mx-mode-switch">
          <button className={mode === "smart" ? "active" : ""} onClick={() => setMode("smart")}>Быстро</button>
          <button className={mode === "manual" ? "active" : ""} onClick={() => setMode("manual")}>Вручную</button>
        </div>

        {mode === "smart" && (
          <div className="mx-welcome-stack">
            <label className={`mx-welcome-upload${isParsingSts ? " loading" : ""}`}>
              <input type="file" accept="image/*" onChange={parseStsPhoto} hidden disabled={isParsingSts} />
              <span>Скан СТС</span>
              <b>{isParsingSts ? "Распознаю документ" : "Сфотографировать или загрузить"}</b>
              <small>VIN, марка, модель, год и цвет подтянутся в форму.</small>
            </label>

            <Field label="VIN">
              <input value={clean.vin} onChange={(e) => update("vin", e.target.value)} placeholder="17 символов" inputMode="latin" />
            </Field>
            <Field label="Пробег">
              <input type="number" value={clean.mileage} onChange={(e) => update("mileage", e.target.value)} placeholder="Например 86000" />
            </Field>
            <Field label="Цвет для AI-рендера">
              <input value={clean.color} onChange={(e) => update("color", e.target.value)} placeholder="Например тёмно-синий" />
            </Field>

            <button className="mx-welcome-primary" onClick={detectVehicleByVin} disabled={isDetecting || !clean.vin}>
              {isDetecting ? "Создаю профиль" : "Создать по VIN"}
            </button>
            <button className="mx-welcome-link" onClick={() => setMode("manual")}>VIN нет под рукой</button>
          </div>
        )}

        {mode === "manual" && (
          <div className="mx-welcome-stack">
            <div className="mx-welcome-note">Ручной ввод ограничен справочником. Свободный текст больше не превращается в мусорный профиль.</div>
            <Field label="Марка">
              <input list="motrix-brands" value={clean.brand} onChange={(e) => update("brand", e.target.value)} placeholder="Выберите марку" />
              <datalist id="motrix-brands">{KNOWN_BRANDS.map((b) => <option value={b} key={b} />)}</datalist>
            </Field>
            <Field label="Модель">
              <input list="motrix-models" value={clean.model} onChange={(e) => update("model", e.target.value)} placeholder="Например Forester" />
              <datalist id="motrix-models">{modelHints.map((m) => <option value={m} key={m} />)}</datalist>
            </Field>
            <div className="mx-welcome-grid2">
              <Field label="Год"><input type="number" value={clean.year} onChange={(e) => update("year", e.target.value)} placeholder="2020" /></Field>
              <Field label="Пробег"><input type="number" value={clean.mileage} onChange={(e) => update("mileage", e.target.value)} placeholder="86000" /></Field>
            </div>
            <div className="mx-welcome-grid2">
              <Field label="Двигатель"><input value={clean.engine} onChange={(e) => update("engine", e.target.value)} placeholder="FB20 / 2.0" /></Field>
              <Field label="Коробка"><input value={clean.transmission} onChange={(e) => update("transmission", e.target.value)} placeholder="AT / CVT" /></Field>
            </div>
            <div className="mx-welcome-grid2">
              <Field label="Привод"><input value={clean.drive} onChange={(e) => update("drive", e.target.value)} placeholder="AWD" /></Field>
              <Field label="Цвет"><input value={clean.color} onChange={(e) => update("color", e.target.value)} placeholder="серый" /></Field>
            </div>
            {errors.length > 0 && <div className="mx-welcome-errors">{errors.map((e) => <div key={e}>{e}</div>)}</div>}
            <button className="mx-welcome-primary" onClick={submitManual}>Создать профиль</button>
            <button className="mx-welcome-link" onClick={fillDemoVehicle}>Заполнить демо Subaru</button>
          </div>
        )}
      </div>
    </div>
  );
}
