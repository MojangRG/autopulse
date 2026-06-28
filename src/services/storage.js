const STATE_KEY = "motrix-launch-state-v1";

export function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
    if (parsed && typeof parsed === "object") return parsed;
  } catch {
    // A damaged local snapshot should not prevent the app from opening.
  }
  return null;
}

export function saveState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

export function clearState() {
  localStorage.removeItem(STATE_KEY);
}

export function exportState(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `motrix-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export async function importState(file) {
  const parsed = JSON.parse(await file.text());
  if (!parsed?.vehicle || !Array.isArray(parsed?.events)) {
    throw new Error("Это не файл данных Motrix");
  }
  return parsed;
}
