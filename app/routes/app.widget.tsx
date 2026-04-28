import { useState } from "react";
import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Text, BlockStack } from "@shopify/polaris";
import ColorField from "../components/ColorField";
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
      cardShowProduct: bool("cardShowProduct"),
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
      cardShowProduct: bool("cardShowProduct"),
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

function CardPreview({ s }: { s: { cardTitle: string; cardShowRating: boolean; cardShowName: boolean; cardShowBadge: boolean; cardShowProduct: boolean; cardAccentColor: string } }) {
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
                  {c.text}
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

// ── Widget types ───────────────────────────────────────────────────────────────

const WIDGET_TYPES: { id: WidgetType; label: string }[] = [
  { id: "fan",     label: "Fan Carousel" },
  { id: "card",    label: "Card Carousel" },
  { id: "masonry", label: "Masonry Grid" },
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
    fd.set("cardShowProduct", String(cardShowProduct));
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
          <div style={{ display: "flex", background: "#ebebeb", borderRadius: 9, padding: 3, gap: 2 }}>
            {WIDGET_TYPES.map((wt) => {
              const active = activeWidget === wt.id;
              return (
                <button
                  key={wt.id}
                  onClick={() => setActiveWidget(wt.id)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: 7, border: "none", cursor: "pointer",
                    background: active ? "#fff" : "transparent",
                    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.1), 0 0 0 0.5px rgba(0,0,0,0.06)" : "none",
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    color: active ? "#1a1a1a" : "#8c9196",
                    transition: "background 0.15s, box-shadow 0.15s, color 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  {wt.label}
                </button>
              );
            })}
          </div>
        </s-section>

        {/* Settings + Preview */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, alignItems: "start" }}>

          {/* Settings panel */}
          <s-stack gap="base">

            {activeWidget === "fan" && (
              <>
                <s-section heading="General">
                  <s-text-field label="Section title" {...({ value: fanTitle, onInput: (e: Event) => setFanTitle((e.target as HTMLInputElement).value) } as object)} />
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd">Accent color</Text>
                    <ColorField value={fanAccentColor} onChange={setFanAccentColor} />
                  </BlockStack>
                </s-section>
                <s-section heading="Display">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text as="p" variant="bodyMd">Show star rating</Text>
                    <s-switch checked={fanShowRating} onInput={() => setFanShowRating(!fanShowRating)} accessibilityLabel="Toggle show star rating" />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text as="p" variant="bodyMd">Show customer name</Text>
                    <s-switch checked={fanShowName} onInput={() => setFanShowName(!fanShowName)} accessibilityLabel="Toggle show customer name" />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text as="p" variant="bodyMd">Show verified badge</Text>
                    <s-switch checked={fanShowBadge} onInput={() => setFanShowBadge(!fanShowBadge)} accessibilityLabel="Toggle show verified badge" />
                  </div>
                </s-section>
              </>
            )}

            {activeWidget === "card" && (
              <>
                <s-section heading="General">
                  <s-text-field label="Section title" {...({ value: cardTitle, onInput: (e: Event) => setCardTitle((e.target as HTMLInputElement).value) } as object)} />
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd">Accent color</Text>
                    <ColorField value={cardAccentColor} onChange={setCardAccentColor} />
                  </BlockStack>
                </s-section>
                <s-section heading="Display">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text as="p" variant="bodyMd">Show star rating</Text>
                    <s-switch checked={cardShowRating} onInput={() => setCardShowRating(!cardShowRating)} accessibilityLabel="Toggle show star rating" />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text as="p" variant="bodyMd">Show customer name</Text>
                    <s-switch checked={cardShowName} onInput={() => setCardShowName(!cardShowName)} accessibilityLabel="Toggle show customer name" />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text as="p" variant="bodyMd">Show verified badge</Text>
                    <s-switch checked={cardShowBadge} onInput={() => setCardShowBadge(!cardShowBadge)} accessibilityLabel="Toggle show verified badge" />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text as="p" variant="bodyMd">Show product name</Text>
                    <s-switch checked={cardShowProduct} onInput={() => setCardShowProduct(!cardShowProduct)} accessibilityLabel="Toggle show product name" />
                  </div>
                </s-section>
              </>
            )}

            {activeWidget === "masonry" && (
              <>
                <s-section heading="General">
                  <s-text-field label="Section title" {...({ value: masonryTitle, onInput: (e: Event) => setMasonryTitle((e.target as HTMLInputElement).value) } as object)} />
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd">Text tile color</Text>
                    <ColorField value={masonryTileColor} onChange={setMasonryTileColor} />
                  </BlockStack>
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd">Accent color</Text>
                    <ColorField value={masonryAccentColor} onChange={setMasonryAccentColor} />
                  </BlockStack>
                </s-section>
                <s-section heading="Layout">
                  <BlockStack gap="200">
                    <Text as="span" variant="bodyMd">Columns</Text>
                    <s-select
                      label="Columns"
                      labelAccessibilityVisibility="exclusive"
                      value={masonryColumns}
                      onInput={(e: Event) => setMasonryColumns((e.target as HTMLSelectElement).value)}
                    >
                      <s-option value="3">3 columns</s-option>
                      <s-option value="4">4 columns</s-option>
                    </s-select>
                  </BlockStack>
                </s-section>
                <s-section heading="Display">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text as="p" variant="bodyMd">Show star rating</Text>
                    <s-switch checked={masonryShowRating} onInput={() => setMasonryShowRating(!masonryShowRating)} accessibilityLabel="Toggle show star rating" />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text as="p" variant="bodyMd">Show customer name</Text>
                    <s-switch checked={masonryShowName} onInput={() => setMasonryShowName(!masonryShowName)} accessibilityLabel="Toggle show customer name" />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text as="p" variant="bodyMd">Show verified badge</Text>
                    <s-switch checked={masonryShowBadge} onInput={() => setMasonryShowBadge(!masonryShowBadge)} accessibilityLabel="Toggle show verified badge" />
                  </div>
                </s-section>
              </>
            )}

          </s-stack>

          {/* Preview panel */}
            <div style={{ borderRadius: 10, overflow: "hidden", border: "1px solid #e1e3e5", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
              {/* Browser chrome */}
              <div style={{ backgroundColor: "#f1f2f3", borderBottom: "1px solid #e1e3e5", padding: "12px 16px", display: "flex", alignItems: "center", position: "relative" }}>
                <div style={{ display: "flex", gap: 6 }}>
                  {["#d9d9d9", "#d9d9d9", "#d9d9d9"].map((color, i) => (
                    <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: color }} />
                  ))}
                </div>
                <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", fontSize: 12, color: "#6d7175", fontWeight: 400, whiteSpace: "nowrap" }}>
                  {WIDGET_TYPES.find((wt) => wt.id === activeWidget)?.label}
                </div>
              </div>
              {/* Page body */}
              <div style={{ backgroundColor: "#f9fafb", minHeight: 420 }}>
                {activeWidget === "fan" && (
                  <FanPreview s={{ fanTitle, fanShowRating, fanShowName, fanShowBadge }} />
                )}
                {activeWidget === "card" && (
                  <CardPreview s={{ cardTitle, cardShowRating, cardShowName, cardShowBadge, cardShowProduct, cardAccentColor }} />
                )}
                {activeWidget === "masonry" && (
                  <MasonryPreview s={{ masonryTitle, masonryColumns: parseInt(masonryColumns, 10), masonryShowRating, masonryShowName, masonryShowBadge, masonryTileColor, masonryAccentColor }} />
                )}
              </div>
            </div>
        </div>
      </s-stack>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
