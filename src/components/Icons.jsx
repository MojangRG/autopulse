const symbols = {
  AlertTriangle: "!", Bot: "AI", Camera: "◉", Car: "◆", Check: "✓",
  ChevronRight: "›", CircleHelp: "?", Clock3: "◷", Download: "↓",
  FileSearch: "▤", Gauge: "◒", History: "↶", Home: "⌂",
  MessageCircle: "○", Plus: "+", ReceiptText: "≡", Settings: "⚙",
  ShieldCheck: "✓", Sparkles: "✦", Trash2: "×", Upload: "↑",
  WalletCards: "₽", X: "×",
};

function makeIcon(name) {
  return function Icon({ size = 20, className = "" }) {
    return <span className={`symbol-icon ${className}`} style={{ width: size, height: size, fontSize: Math.max(11, size * 0.7) }} aria-hidden="true">{symbols[name]}</span>;
  };
}

export const AlertTriangle = makeIcon("AlertTriangle");
export const Bot = makeIcon("Bot");
export const Camera = makeIcon("Camera");
export const Car = makeIcon("Car");
export const Check = makeIcon("Check");
export const ChevronRight = makeIcon("ChevronRight");
export const CircleHelp = makeIcon("CircleHelp");
export const Clock3 = makeIcon("Clock3");
export const Download = makeIcon("Download");
export const FileSearch = makeIcon("FileSearch");
export const Gauge = makeIcon("Gauge");
export const History = makeIcon("History");
export const Home = makeIcon("Home");
export const MessageCircle = makeIcon("MessageCircle");
export const Plus = makeIcon("Plus");
export const ReceiptText = makeIcon("ReceiptText");
export const Settings = makeIcon("Settings");
export const ShieldCheck = makeIcon("ShieldCheck");
export const Sparkles = makeIcon("Sparkles");
export const Trash2 = makeIcon("Trash2");
export const Upload = makeIcon("Upload");
export const WalletCards = makeIcon("WalletCards");
export const X = makeIcon("X");
