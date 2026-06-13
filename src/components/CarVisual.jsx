// TODO: Connect real AI image generation here.
// If vehicle.imageUrl is set, show that image instead of the SVG silhouette.
// Suggested integration point: pass imageUrl to an <img> tag and fall back to SVG.

const BRAND_COLORS = {
  subaru:    "#0057B8",
  toyota:    "#EB0A1E",
  bmw:       "#1C69D4",
  mercedes:  "#818181",
  audi:      "#BB0A21",
  honda:     "#CC0000",
  nissan:    "#C3002F",
  kia:       "#05141F",
  hyundai:   "#002C5F",
  mazda:     "#910A2D",
  skoda:     "#4BA82E",
  volkswagen:"#00437A",
  lada:      "#0055A5",
  renault:   "#F9B016",
  ford:      "#003478",
  default:   "#2563EB",
};

const SUV_MODELS = ["forester","outback","rav4","cr-v","cx-5","x5","q7","q5","q3","tiguan","tucson","santa fe","kuga","outlander","pajero","land","explorer","highlander","pilot","xc60","xc90","duster","arkana","captur","kadjar","sportage","seltos","creta","tucson","terracan","santa","ix35","ix55","sorento"];
const HATCH_MODELS = ["golf","polo","ceed","i20","i30","308","207","208","focus","auris","swift","micra","corsa","fiesta","yaris","jazz","fit","note","tiida","vesta","granta","lada"];

function getBodyType(vehicle) {
  const model = String(vehicle?.model || "").toLowerCase();
  if (SUV_MODELS.some((w) => model.includes(w))) return "suv";
  if (HATCH_MODELS.some((w) => model.includes(w))) return "hatch";
  return "sedan";
}

function getBrandColor(vehicle) {
  const brand = String(vehicle?.brand || "").toLowerCase().replace(/[- ]/g, "");
  return BRAND_COLORS[brand] || BRAND_COLORS.default;
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function CarVisual({ vehicle }) {
  // TODO: if (vehicle?.imageUrl) return <img src={vehicle.imageUrl} className="car-real-img" alt={vehicle.model} />;

  const color = getBrandColor(vehicle);
  const type = getBodyType(vehicle);
  const isSuv = type === "suv";
  const isHatch = type === "hatch";

  const fill1 = hexToRgba(color, 0.09);
  const fill2 = hexToRgba(color, 0.07);
  const win = hexToRgba(color, 0.16);
  const stroke = hexToRgba(color, 0.22);
  const wheelInner = hexToRgba(color, 0.18);
  const glow = hexToRgba(color, 0.10);

  // Body and cabin shapes vary by body type
  const bodyPath = isSuv
    ? "M30 65 L60 28 L260 28 L290 65 Z"
    : isHatch
    ? "M30 65 L68 32 Q86 20 120 20 L200 20 Q230 20 252 32 L290 65 Z"
    : "M30 65 L72 34 Q105 18 148 18 L172 18 Q215 18 248 34 L290 65 Z";

  const win1 = isSuv
    ? "M63 63 L80 32 L144 32 L144 63 Z"
    : isHatch
    ? "M72 63 L97 26 L152 24 L152 63 Z"
    : "M76 63 L102 24 L156 22 L156 63 Z";

  const win2 = isSuv
    ? "M148 63 L148 32 L248 32 L256 63 Z"
    : isHatch
    ? "M156 63 L156 24 L215 26 L250 63 Z"
    : "M160 63 L160 22 L218 24 L246 63 Z";

  return (
    <div className="car-visual-wrap">
      <div
        className="car-visual-glow"
        style={{ background: `radial-gradient(ellipse at 50% 80%, ${glow} 0%, transparent 70%)` }}
      />
      <svg
        className="car-visual-svg"
        viewBox="0 0 320 108"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Body top */}
        <path d={bodyPath} fill={fill1} />
        {/* Body bottom */}
        <rect x="30" y="65" width="260" height="22" rx="3" fill={fill2} />
        {/* Windows */}
        <path d={win1} fill={win} />
        <path d={win2} fill={win} />
        {/* Window divider */}
        <line
          x1={isSuv ? "146" : "158"} y1="32"
          x2={isSuv ? "146" : "158"} y2="65"
          stroke={hexToRgba(color, 0.08)} strokeWidth="2"
        />
        {/* Wheels */}
        <circle cx="84" cy="87" r="19" fill="#080a0f" stroke={stroke} strokeWidth="2.5" />
        <circle cx="236" cy="87" r="19" fill="#080a0f" stroke={stroke} strokeWidth="2.5" />
        <circle cx="84" cy="87" r="8" fill={wheelInner} />
        <circle cx="236" cy="87" r="8" fill={wheelInner} />
        {/* Wheel spokes */}
        <line x1="84" y1="69" x2="84" y2="78" stroke={stroke} strokeWidth="1.5" />
        <line x1="84" y1="96" x2="84" y2="105" stroke={stroke} strokeWidth="1.5" />
        <line x1="66" y1="87" x2="75" y2="87" stroke={stroke} strokeWidth="1.5" />
        <line x1="93" y1="87" x2="102" y2="87" stroke={stroke} strokeWidth="1.5" />
        <line x1="218" y1="87" x2="227" y2="87" stroke={stroke} strokeWidth="1.5" />
        <line x1="245" y1="87" x2="254" y2="87" stroke={stroke} strokeWidth="1.5" />
        <line x1="236" y1="69" x2="236" y2="78" stroke={stroke} strokeWidth="1.5" />
        <line x1="236" y1="96" x2="236" y2="105" stroke={stroke} strokeWidth="1.5" />
        {/* Headlight */}
        <rect x="30" y="70" width="16" height="8" rx="2" fill="white" fillOpacity="0.10" />
        {/* Taillight */}
        <rect x="274" y="70" width="16" height="8" rx="2" fill="#ef4444" fillOpacity="0.18" />
        {/* Belt line */}
        <line x1="30" y1="65" x2="290" y2="65" stroke={hexToRgba(color, 0.08)} strokeWidth="1" />
      </svg>
    </div>
  );
}
