import { resolveMonthlyKm } from "./predictions.js";

const KEY = "autopulse-reminders";

export function loadReminders() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}

export function saveReminders(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function generateReminders({ schedule, data, ownerProfile }) {
  const existing = loadReminders();
  const now = new Date().toISOString();
  const candidates = [];
  const monthlyKm = resolveMonthlyKm(ownerProfile);

  for (const item of (schedule || [])) {
    if (item.status === "Просрочено") {
      candidates.push({
        id: `overdue_${item.id}`,
        title: `${item.name} — просрочено`,
        message: item.lastMileage > 0
          ? `Последний раз: ${item.lastMileage.toLocaleString("ru-RU")} км. Сейчас: ${Number(data?.mileage || 0).toLocaleString("ru-RU")} км.`
          : "История обслуживания не найдена.",
        type: "mileage",
        targetMileage: item.nextMileage,
        targetDate: null,
        priority: "high",
        createdAt: now,
        status: "active",
        itemId: item.id,
      });
    }

    if (item.lastMileage === 0 && item.severity === "high") {
      candidates.push({
        id: `gap_${item.id}`,
        title: `Нет данных: ${item.name}`,
        message: "Добавьте запись вручную или загрузите документ СТО.",
        type: "unknown-history",
        targetMileage: null,
        targetDate: null,
        priority: "medium",
        createdAt: now,
        status: "active",
        itemId: item.id,
      });
    }
  }

  if (monthlyKm > 0 && data?.logs?.length > 0) {
    const latestDate = data.logs
      .map((l) => l.dateAdded || l.datePerformed || "")
      .filter(Boolean)
      .sort()
      .pop();
    if (latestDate) {
      const days = Math.floor((Date.now() - new Date(latestDate).getTime()) / 86400000);
      const estKm = Math.floor((days / 30) * monthlyKm);
      if (estKm >= 5000) {
        candidates.push({
          id: "mileage_stale",
          title: "Проверьте текущий пробег",
          message: `С последней записи прошло ~${days} дн. Вы могли проехать ещё ~${estKm.toLocaleString("ru-RU")} км.`,
          type: "mileage",
          targetMileage: null,
          targetDate: null,
          priority: "low",
          createdAt: now,
          status: "active",
        });
      }
    }
  }

  // Merge: preserve dismissed/done status from existing
  const merged = candidates.map((c) => {
    const found = existing.find((e) => e.id === c.id);
    if (found && found.status !== "active") return found;
    return c;
  });

  for (const e of existing) {
    if (!merged.find((m) => m.id === e.id)) merged.push(e);
  }

  saveReminders(merged);
  return merged;
}

export function dismissReminder(id) {
  const updated = loadReminders().map((r) => (r.id === id ? { ...r, status: "dismissed" } : r));
  saveReminders(updated);
  return updated;
}

export function doneReminder(id) {
  const updated = loadReminders().map((r) => (r.id === id ? { ...r, status: "done" } : r));
  saveReminders(updated);
  return updated;
}

export function getActiveReminders() {
  return loadReminders().filter((r) => r.status === "active");
}
