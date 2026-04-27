import { useState } from "react";
import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";

// ── Types ──────────────────────────────────────────────────────────────────────

type WidgetType = "fan" | "card" | "masonry";

// ── Loader ─────────────────────────────────────────────────────────────────────

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { shop } = session;
  const config = await prisma.widgetConfig.findUnique({ where: { shop } });
  return { config };
};

// ── Action ─────────────────────────────────────────────────────────────────────

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { shop } = session;
  const fd = await request.formData();
  const get = (k: string) => fd.get(k) as string;
  const bool = (k: string) => fd.get(k) === "true";
  const num = (k: string) => parseInt(fd.get(k) as string, 10);

  await prisma.widgetConfig.upsert({
    where: { shop },
    update: {
      fanTitle: get("fanTitle"), fanShowRating: bool("fanShowRating"),
      fanShowName: bool("fanShowName"), fanShowBadge: bool("fanShowBadge"),
      fanAccentColor: get("fanAccentColor"),

      cardTitle: get("cardTitle"), cardShowRating: bool("cardShowRating"),
      cardShowName: bool("cardShowName"), cardShowBadge: bool("cardShowBadge"),
      cardShowProduct: bool("cardShowProduct"), cardMaxChars: num("cardMaxChars"),
      cardAccentColor: get("cardAccentColor"),

      masonryTitle: get("masonryTitle"), masonryColumns: num("masonryColumns"),
      masonryShowRating: bool("masonryShowRating"), masonryShowName: bool("masonryShowName"),
      masonryShowBadge: bool("masonryShowBadge"), masonryTileColor: get("masonryTileColor"),
      masonryAccentColor: get("masonryAccentColor"),
    },
    create: {
      shop,
      fanTitle: get("fanTitle"), fanShowRating: bool("fanShowRating"),
      fanShowName: bool("fanShowName"), fanShowBadge: bool("fanShowBadge"),
      fanAccentColor: get("fanAccentColor"),

      cardTitle: get("cardTitle"), cardShowRating: bool("cardShowRating"),
      cardShowName: bool("cardShowName"), cardShowBadge: bool("cardShowBadge"),
      cardShowProduct: bool("cardShowProduct"), cardMaxChars: num("cardMaxChars"),
      cardAccentColor: get("cardAccentColor"),

      masonryTitle: get("masonryTitle"), masonryColumns: num("masonryColumns"),
      masonryShowRating: bool("masonryShowRating"), masonryShowName: bool("masonryShowName"),
      masonryShowBadge: bool("masonryShowBadge"), masonryTileColor: get("masonryTileColor"),
      masonryAccentColor: get("masonryAccentColor"),
    },
  });

  return { ok: true };
};

// ── Shared helpers ─────────────────────────────────────────────────────────────

const GRADIENTS = [
  "linear-gradient(160deg,#667eea,#764ba2)",
  "linear-gradient(160deg,#f093fb,#f5576c)",
  "linear-gradient(160deg,#4facfe,#00c6fb)",
  "linear-gradient(160deg,#43e97b,#38f9d7)",
  "linear-gradient(160deg,#fa709a,#fee140)",
  "linear-gradient(160deg,#a18cd1,#fbc2eb)",
  "linear-gradient(160deg,#fccb90,#d57eeb)",
  "linear-gradient(160deg,#a1c4fd,#c2e9fb)",
];

function Stars({ n, size = 12, color = "#fbbf24" }: { n: number; size?: number; color?: string }) {
  return (
    <span style={{ fontSize: size, lineHeight: 1, letterSpacing: 1 }}>
      <span style={{ color }}>{"★".repeat(n)}</span>
      <span style={{ color: "rgba(255,255,255,0.35)" }}>{"★".repeat(5 - n)}</span>
    </span>
  );
}

function AggHeader({ title, badge }: { title: string; badge: boolean }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 20 }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 }}>{title}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <span style={{ color: "#fbbf24", fontSize: 13 }}>★★★★★</span>
        <span style={{ fontSize: 12, color: "#6d7175" }}>4.5 · 796 reviews</span>
        {badge && (
          <span style={{ background: "#e8f5e9", color: "#2d7a3f", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>
            ✓ Verified
          </span>
        )}
      </div>
    </div>
  );
}

const ArrowBtn = ({ dir }: { dir: "left" | "right" }) => (
  <div style={{
    width: 28, height: 28, borderRadius: "50%", background: "#fff",
    border: "1px solid #e1e3e5", display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0, cursor: "pointer",
    boxShadow: "0 1px 4px rgba(0,0,0,0.08)", fontSize: 14, color: "#1a1a1a",
  }}>
    {dir === "left" ? "‹" : "›"}
  </div>
);

// ── Preview: Fan Carousel ──────────────────────────────────────────────────────

function FanPreview({ s }: { s: { fanTitle: string; fanShowRating: boolean; fanShowName: boolean; fanShowBadge: boolean } }) {
  const cards = [
    { g: GRADIENTS[0], name: "Jennifer Long", r: 5 },
    { g: GRADIENTS[1], name: "Sarah Smith",   r: 5 },
    { g: GRADIENTS[2], name: "Emily Johnson", r: 4 },
  ];
  return (
    <div style={{ padding: "24px 16px" }}>
      <AggHeader title={s.fanTitle} badge={s.fanShowBadge} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
        <ArrowBtn dir="left" />
        {/* Left peek */}
        <div style={{
          width: 110, height: 170, borderRadius: 12, background: cards[0].g,
          flexShrink: 0, position: "relative", overflow: "hidden",
          transform: "translateY(18px)", opacity: 0.65,
        }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)", padding: "12px 8px 8px" }}>
            {s.fanShowRating && <Stars n={cards[0].r} size={9} />}
            {s.fanShowName && <div style={{ color: "#fff", fontSize: 9, fontWeight: 600, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cards[0].name}</div>}
          </div>
        </div>
        {/* Center */}
        <div style={{
          width: 150, height: 230, borderRadius: 14, background: cards[1].g,
          flexShrink: 0, position: "relative", overflow: "hidden",
          boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
        }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)", padding: "16px 12px 12px" }}>
            {s.fanShowRating && <Stars n={cards[1].r} size={12} />}
            {s.fanShowName && (
              <div style={{ color: "#fff", fontSize: 12, fontWeight: 700, marginTop: 3 }}>
                {cards[1].name}{s.fanShowBadge && <span style={{ color: "#4ade80", marginLeft: 4, fontSize: 10 }}>✓</span>}
              </div>
            )}
          </div>
        </div>
        {/* Right peek */}
        <div style={{
          width: 110, height: 170, borderRadius: 12, background: cards[2].g,
          flexShrink: 0, position: "relative", overflow: "hidden",
          transform: "translateY(18px)", opacity: 0.65,
        }}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)", padding: "12px 8px 8px" }}>
            {s.fanShowRating && <Stars n={cards[2].r} size={9} />}
            {s.fanShowName && <div style={{ color: "#fff", fontSize: 9, fontWeight: 600, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cards[2].name}</div>}
          </div>
        </div>
        <ArrowBtn dir="right" />
      </div>
    </div>
  );
}

// ── Preview: Card Carousel ─────────────────────────────────────────────────────

function CardPreview({ s }: { s: { cardTitle: string; cardShowRating: boolean; cardShowName: boolean; cardShowBadge: boolean; cardShowProduct: boolean; cardMaxChars: number; cardAccentColor: string } }) {
  const cards = [
    { g: GRADIENTS[3], name: "Ana Smith",     r: 5, text: "Absolutely love this! Quality exceeded my expectations.", product: "Organic Face Serum" },
    { g: GRADIENTS[4], name: "Maria Green",   r: 5, text: "Great product. Fast delivery and perfect packaging.", product: "Minimalist Watch" },
    { g: GRADIENTS[5], name: "Natalie Cross", r: 4, text: "Very satisfied. Would definitely recommend to others.", product: "Scented Candle Set" },
    { g: GRADIENTS[6], name: "Emily Johnson", r: 5, text: "Best purchase this year. Will order again soon!", product: "Yoga Mat Premium" },
  ];
  return (
    <div style={{ padding: "24px 12px" }}>
      <AggHeader title={s.cardTitle} badge={s.cardShowBadge} />
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <ArrowBtn dir="left" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, flex: 1 }}>
          {cards.map((c, i) => (
            <div key={i} style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e1e3e5", background: "#fff" }}>
              <div style={{ height: 90, background: c.g }} />
              <div style={{ padding: "8px 7px 10px" }}>
                {<p style={{ fontSize: 9, color: "#6d7175", lineHeight: 1.4, margin: "0 0 5px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {c.text.slice(0, s.cardMaxChars)}
                </p>}
                {s.cardShowRating && <div style={{ color: "#fbbf24", fontSize: 9, marginBottom: 3 }}>★★★★★</div>}
                {s.cardShowName && (
                  <div style={{ fontSize: 9, fontWeight: 700, color: "#1a1a1a" }}>
                    {c.name}{s.cardShowBadge && <span style={{ color: "#2d7a3f", marginLeft: 3 }}>✓</span>}
                  </div>
                )}
                {s.cardShowProduct && <div style={{ fontSize: 8, color: "#8c9196", marginTop: 2 }}>{c.product}</div>}
              </div>
            </div>
          ))}
        </div>
        <ArrowBtn dir="right" />
      </div>
    </div>
  );
}

// ── Preview: Masonry Grid ──────────────────────────────────────────────────────

function MasonryPreview({ s }: { s: { masonryTitle: string; masonryColumns: number; masonryShowRating: boolean; masonryShowName: boolean; masonryShowBadge: boolean; masonryTileColor: string; masonryAccentColor: string } }) {
  type Tile = { type: "image"; g: string; name: string; r: number; video?: true }
             | { type: "text"; text: string; name: string; r: number };

  const tiles: Tile[] = [
    { type: "image", g: GRADIENTS[0], name: "Jennifer Long", r: 5 },
    { type: "image", g: GRADIENTS[1], name: "Jennifer Clay", r: 5 },
    { type: "text",  text: "Absolutely love this product! Quality is outstanding and delivery was super fast.", name: "Emily Smith", r: 5 },
    { type: "image", g: GRADIENTS[2], name: "Carla Roberts", r: 4, video: true },
    { type: "image", g: GRADIENTS[4], name: "Ana Smith",     r: 5 },
    { type: "image", g: GRADIENTS[5], name: "Maria Green",   r: 5 },
    { type: "text",  text: "Best purchase I have made in years. Totally worth every penny.", name: "Natalie Green", r: 5 },
    { type: "image", g: GRADIENTS[7], name: "Emily Johnson", r: 4 },
  ];
  const cols = s.masonryColumns;
  return (
    <div style={{ padding: "24px 12px" }}>
      <AggHeader title={s.masonryTitle} badge={s.masonryShowBadge} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 }}>
        {tiles.slice(0, cols * 2).map((tile, i) => (
          <div key={i} style={{ borderRadius: 8, overflow: "hidden", aspectRatio: "1", position: "relative", background: tile.type === "text" ? s.masonryTileColor : tile.g }}>
            {tile.type === "text" ? (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 8, textAlign: "center" }}>
                {s.masonryShowRating && <Stars n={tile.r} size={9} color="#fbbf24" />}
                <p style={{ color: "#fff", fontSize: 8, lineHeight: 1.4, margin: "4px 0", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{tile.text}</p>
                {s.masonryShowName && <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 8, fontWeight: 600 }}>{tile.name}</div>}
              </div>
            ) : (
              <>
                {tile.video && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 9, marginLeft: 2 }}>▶</span>
                    </div>
                  </div>
                )}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65), transparent)", padding: "10px 7px 7px" }}>
                  {s.masonryShowRating && <Stars n={tile.r} size={8} />}
                  {s.masonryShowName && <div style={{ color: "#fff", fontSize: 8, fontWeight: 600, marginTop: 2 }}>{tile.name}{s.masonryShowBadge && <span style={{ color: "#4ade80", marginLeft: 3 }}>✓</span>}</div>}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", marginTop: 14 }}>
        <button style={{ padding: "6px 20px", background: "#fff", border: "1px solid #e1e3e5", borderRadius: 6, fontSize: 11, cursor: "pointer", color: "#1a1a1a" }}>
          Show more
        </button>
      </div>
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f1f1f1", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <span style={{ color: "#fbbf24", fontSize: 12 }}>★★★★★</span>
        <span style={{ fontSize: 11, color: "#6d7175" }}>4.5 out of 5 · 796 reviews</span>
        {s.masonryShowBadge && <span style={{ background: "#e8f5e9", color: "#2d7a3f", fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 20 }}>✓ Verified</span>}
      </div>
    </div>
  );
}

// ── Settings helpers ───────────────────────────────────────────────────────────

function SettingRow({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f6f6f7" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a" }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: "#8c9196", marginTop: 2 }}>{desc}</div>}
      </div>
      <s-switch {...({ checked: checked || undefined, onClick: () => onChange(!checked) } as object)} />
    </div>
  );
}

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#6d7175", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 5 }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "7px 10px", border: "1px solid #c9cccf", borderRadius: 6, fontSize: 13, color: "#1a1a1a", outline: "none", boxSizing: "border-box" }}
      />
    </div>
  );
}

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#6d7175", textTransform: "uppercase", letterSpacing: "0.5px", flex: 1 }}>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} style={{ width: 32, height: 28, border: "1px solid #c9cccf", borderRadius: 4, cursor: "pointer", padding: 2 }} />
        <span style={{ fontSize: 12, color: "#6d7175", fontFamily: "monospace" }}>{value}</span>
      </div>
    </div>
  );
}

function NumInput({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#6d7175", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</label>
        <span style={{ fontSize: 12, color: "#1a1a1a", fontWeight: 600 }}>{value}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(parseInt(e.target.value, 10))} style={{ width: "100%", accentColor: "#303030" }} />
    </div>
  );
}

function SelectInput({ label, value, options, onChange }: { label: string; value: string; options: { label: string; value: string }[]; onChange: (v: string) => void }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "#6d7175", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 5 }}>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", padding: "7px 10px", border: "1px solid #c9cccf", borderRadius: 6, fontSize: 13, color: "#1a1a1a", background: "#fff", outline: "none" }}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Widget type selector card ──────────────────────────────────────────────────

const WIDGET_TYPES: { id: WidgetType; label: string; desc: string; icon: React.ReactNode }[] = [
  {
    id: "fan",
    label: "Fan Carousel",
    desc: "Centered portrait cards with peek on sides",
    icon: (
      <svg viewBox="0 0 40 40" width={40} height={40} fill="none">
        <rect x="2"  y="8"  width="11" height="24" rx="3" fill="#e1e3e5" />
        <rect x="27" y="8"  width="11" height="24" rx="3" fill="#e1e3e5" />
        <rect x="14" y="4"  width="12" height="32" rx="3" fill="#303030" />
      </svg>
    ),
  },
  {
    id: "card",
    label: "Card Carousel",
    desc: "4 equal cards with image and review text",
    icon: (
      <svg viewBox="0 0 40 40" width={40} height={40} fill="none">
        {[0,1,2,3].map((i) => (
          <g key={i}>
            <rect x={2 + i*10} y="6"  width="8" height="11" rx="2" fill="#303030" />
            <rect x={2 + i*10} y="19" width="8" height="3"  rx="1" fill="#e1e3e5" />
            <rect x={2 + i*10} y="23" width="8" height="2"  rx="1" fill="#e1e3e5" />
            <rect x={2 + i*10} y="26" width="5" height="2"  rx="1" fill="#e1e3e5" />
          </g>
        ))}
      </svg>
    ),
  },
  {
    id: "masonry",
    label: "Masonry Grid",
    desc: "Mixed image + text tiles in a grid",
    icon: (
      <svg viewBox="0 0 40 40" width={40} height={40} fill="none">
        {[0,1,2,3].map((col) =>
          [0,1].map((row) => (
            <rect key={`${col}-${row}`} x={2+col*10} y={4+row*17} width="8" height="14" rx="2"
              fill={col === 2 && row === 0 ? "#8fad88" : "#303030"} opacity={col === 2 && row === 0 ? 1 : 0.85} />
          ))
        )}
      </svg>
    ),
  },
];

// ── Main component ─────────────────────────────────────────────────────────────

export default function WidgetPage() {
  const { config } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const [activeWidget, setActiveWidget] = useState<WidgetType>("fan");

  // Fan settings
  const [fanTitle, setFanTitle] = useState(config?.fanTitle ?? "From our customers");
  const [fanShowRating, setFanShowRating] = useState(config?.fanShowRating ?? true);
  const [fanShowName, setFanShowName] = useState(config?.fanShowName ?? true);
  const [fanShowBadge, setFanShowBadge] = useState(config?.fanShowBadge ?? true);
  const [fanAccentColor, setFanAccentColor] = useState(config?.fanAccentColor ?? "#ffffff");

  // Card settings
  const [cardTitle, setCardTitle] = useState(config?.cardTitle ?? "What our customers say");
  const [cardShowRating, setCardShowRating] = useState(config?.cardShowRating ?? true);
  const [cardShowName, setCardShowName] = useState(config?.cardShowName ?? true);
  const [cardShowBadge, setCardShowBadge] = useState(config?.cardShowBadge ?? true);
  const [cardShowProduct, setCardShowProduct] = useState(config?.cardShowProduct ?? true);
  const [cardMaxChars, setCardMaxChars] = useState(config?.cardMaxChars ?? 120);
  const [cardAccentColor, setCardAccentColor] = useState(config?.cardAccentColor ?? "#000000");

  // Masonry settings
  const [masonryTitle, setMasonryTitle] = useState(config?.masonryTitle ?? "From our customers");
  const [masonryColumns, setMasonryColumns] = useState(String(config?.masonryColumns ?? 4));
  const [masonryShowRating, setMasonryShowRating] = useState(config?.masonryShowRating ?? true);
  const [masonryShowName, setMasonryShowName] = useState(config?.masonryShowName ?? true);
  const [masonryShowBadge, setMasonryShowBadge] = useState(config?.masonryShowBadge ?? true);
  const [masonryTileColor, setMasonryTileColor] = useState(config?.masonryTileColor ?? "#8fad88");
  const [masonryAccentColor, setMasonryAccentColor] = useState(config?.masonryAccentColor ?? "#000000");

  const handleSave = () => {
    const fd = new FormData();
    fd.set("fanTitle", fanTitle); fd.set("fanShowRating", String(fanShowRating));
    fd.set("fanShowName", String(fanShowName)); fd.set("fanShowBadge", String(fanShowBadge));
    fd.set("fanAccentColor", fanAccentColor);

    fd.set("cardTitle", cardTitle); fd.set("cardShowRating", String(cardShowRating));
    fd.set("cardShowName", String(cardShowName)); fd.set("cardShowBadge", String(cardShowBadge));
    fd.set("cardShowProduct", String(cardShowProduct)); fd.set("cardMaxChars", String(cardMaxChars));
    fd.set("cardAccentColor", cardAccentColor);

    fd.set("masonryTitle", masonryTitle); fd.set("masonryColumns", masonryColumns);
    fd.set("masonryShowRating", String(masonryShowRating)); fd.set("masonryShowName", String(masonryShowName));
    fd.set("masonryShowBadge", String(masonryShowBadge)); fd.set("masonryTileColor", masonryTileColor);
    fd.set("masonryAccentColor", masonryAccentColor);

    fetcher.submit(fd, { method: "post" });
    shopify.toast.show("Widget settings saved!");
  };

  const isSaving = fetcher.state !== "idle";

  return (
    <s-page heading="Widget">
      <s-button
        slot="primary-action"
        variant="primary"
        {...({ onClick: handleSave, loading: isSaving || undefined } as object)}
      >
        {isSaving ? "Saving…" : "Save changes"}
      </s-button>

      <s-stack gap="large">

        {/* Widget type selector */}
        <s-section>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {WIDGET_TYPES.map((wt) => {
              const active = activeWidget === wt.id;
              return (
                <button
                  key={wt.id}
                  onClick={() => setActiveWidget(wt.id)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "flex-start",
                    gap: 10, padding: "16px 18px", borderRadius: 10, cursor: "pointer",
                    textAlign: "left", background: active ? "#f0f7ff" : "#fff",
                    border: `1.5px solid ${active ? "#005bd3" : "#e1e3e5"}`,
                    transition: "all 0.15s ease",
                  }}
                >
                  {wt.icon}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: active ? "#005bd3" : "#1a1a1a", marginBottom: 3 }}>{wt.label}</div>
                    <div style={{ fontSize: 12, color: "#8c9196", lineHeight: 1.4 }}>{wt.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </s-section>

        {/* Settings + Preview */}
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, alignItems: "start" }}>

          {/* Settings panel */}
          <s-stack gap="base">

            {activeWidget === "fan" && (
              <>
                <s-section heading="General">
                  <TextInput label="Section title" value={fanTitle} onChange={setFanTitle} />
                  <ColorInput label="Accent color" value={fanAccentColor} onChange={setFanAccentColor} />
                </s-section>
                <s-section heading="Display">
                  <SettingRow label="Show star rating"    checked={fanShowRating} onChange={setFanShowRating} />
                  <SettingRow label="Show customer name"  checked={fanShowName}   onChange={setFanShowName} />
                  <SettingRow label="Show verified badge" checked={fanShowBadge}  onChange={setFanShowBadge} />
                </s-section>
              </>
            )}

            {activeWidget === "card" && (
              <>
                <s-section heading="General">
                  <TextInput label="Section title" value={cardTitle} onChange={setCardTitle} />
                  <ColorInput label="Accent color" value={cardAccentColor} onChange={setCardAccentColor} />
                </s-section>
                <s-section heading="Layout">
                  <NumInput label="Max review characters" value={cardMaxChars} min={60} max={300} onChange={setCardMaxChars} />
                </s-section>
                <s-section heading="Display">
                  <SettingRow label="Show star rating"    checked={cardShowRating}   onChange={setCardShowRating} />
                  <SettingRow label="Show customer name"  checked={cardShowName}     onChange={setCardShowName} />
                  <SettingRow label="Show verified badge" checked={cardShowBadge}    onChange={setCardShowBadge} />
                  <SettingRow label="Show product name"   checked={cardShowProduct}  onChange={setCardShowProduct} />
                </s-section>
              </>
            )}

            {activeWidget === "masonry" && (
              <>
                <s-section heading="General">
                  <TextInput label="Section title" value={masonryTitle} onChange={setMasonryTitle} />
                  <ColorInput label="Text tile color"   value={masonryTileColor}    onChange={setMasonryTileColor} />
                  <ColorInput label="Accent color"      value={masonryAccentColor}  onChange={setMasonryAccentColor} />
                </s-section>
                <s-section heading="Layout">
                  <SelectInput
                    label="Columns"
                    value={masonryColumns}
                    onChange={setMasonryColumns}
                    options={[{ label: "3 columns", value: "3" }, { label: "4 columns", value: "4" }]}
                  />
                </s-section>
                <s-section heading="Display">
                  <SettingRow label="Show star rating"    checked={masonryShowRating} onChange={setMasonryShowRating} />
                  <SettingRow label="Show customer name"  checked={masonryShowName}   onChange={setMasonryShowName} />
                  <SettingRow label="Show verified badge" checked={masonryShowBadge}  onChange={setMasonryShowBadge} />
                </s-section>
              </>
            )}

          </s-stack>

          {/* Preview panel */}
          <s-section heading="Preview">
            <div style={{ background: "#f9fafb", borderRadius: 10, border: "1px solid #e1e3e5", minHeight: 320, overflow: "hidden" }}>
              {activeWidget === "fan" && (
                <FanPreview s={{ fanTitle, fanShowRating, fanShowName, fanShowBadge }} />
              )}
              {activeWidget === "card" && (
                <CardPreview s={{ cardTitle, cardShowRating, cardShowName, cardShowBadge, cardShowProduct, cardMaxChars, cardAccentColor }} />
              )}
              {activeWidget === "masonry" && (
                <MasonryPreview s={{ masonryTitle, masonryColumns: parseInt(masonryColumns, 10), masonryShowRating, masonryShowName, masonryShowBadge, masonryTileColor, masonryAccentColor }} />
              )}
            </div>
            <div style={{ marginTop: 10, padding: "8px 12px", background: "#fff8e1", borderRadius: 6, border: "1px solid #f0c84a" }}>
              <p style={{ fontSize: 12, color: "#7d5a00", margin: 0 }}>
                This is a placeholder preview using sample data. Your actual widget will show real reviews from your store.
              </p>
            </div>
          </s-section>

        </div>
      </s-stack>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
