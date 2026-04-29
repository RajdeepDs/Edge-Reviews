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

type WidgetType = "main" | "card";

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
      mainTitle: get("mainTitle"),
      mainShowWriteButton: bool("mainShowWriteButton"),
      mainShowBreakdown: bool("mainShowBreakdown"),
      mainShowWithPhotosFilter: bool("mainShowWithPhotosFilter"),
      mainDefaultSort: get("mainDefaultSort"),
      mainPageSize: num("mainPageSize"),
      mainAccentColor: get("mainAccentColor"),

      cardTitle: get("cardTitle"), cardShowRating: bool("cardShowRating"),
      cardShowName: bool("cardShowName"), cardShowBadge: bool("cardShowBadge"),
      cardShowProduct: bool("cardShowProduct"),
      cardAccentColor: get("cardAccentColor"),

    },
    create: {
      shop,
      mainTitle: get("mainTitle"),
      mainShowWriteButton: bool("mainShowWriteButton"),
      mainShowBreakdown: bool("mainShowBreakdown"),
      mainShowWithPhotosFilter: bool("mainShowWithPhotosFilter"),
      mainDefaultSort: get("mainDefaultSort"),
      mainPageSize: num("mainPageSize"),
      mainAccentColor: get("mainAccentColor"),

      cardTitle: get("cardTitle"), cardShowRating: bool("cardShowRating"),
      cardShowName: bool("cardShowName"), cardShowBadge: bool("cardShowBadge"),
      cardShowProduct: bool("cardShowProduct"),
      cardAccentColor: get("cardAccentColor"),

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

function StarFilled({ size = 14, color = "#f59e0b" }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22,9.81a1,1,0,0,0-.83-.69l-5.7-.78L12.88,3.53a1,1,0,0,0-1.76,0L8.57,8.34l-5.7.78a1,1,0,0,0-.82.69,1,1,0,0,0,.28,1l4.09,3.73-1,5.24A1,1,0,0,0,6.88,20.9L12,18.38l5.12,2.52a1,1,0,0,0,.44.1,1,1,0,0,0,1-1.18l-1-5.24,4.09-3.73A1,1,0,0,0,22,9.81Z"
        fill={color}
      />
    </svg>
  );
}

function StarEmpty({ size = 14, color = "#f59e0b" }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="12 4 9.22 9.27 3 10.11 7.5 14.21 6.44 20 12 17.27 17.56 20 16.5 14.21 21 10.11 14.78 9.27 12 4"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </svg>
  );
}

function Stars({ n, size = 14, color = "#f59e0b", emptyColor = "rgba(200,200,200,0.5)", glow = false }: { n: number; size?: number; color?: string; emptyColor?: string; glow?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 1.5 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          style={{
            display: "inline-flex",
            filter: glow && i < n ? `drop-shadow(0 1px 2px ${color}90)` : "none",
          }}
        >
          {i < n
            ? <StarFilled size={size} color={color} />
            : <StarEmpty size={size} color={emptyColor} />
          }
        </span>
      ))}
    </span>
  );
}

function VerifiedBadgeIcon({ size = 16, color = "#000000" }: { size?: number; color?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.007 8.27C22.194 9.125 23 10.45 23 12c0 1.55-.806 2.876-1.993 3.73.24 1.442-.134 2.958-1.227 4.05-1.095 1.095-2.61 1.459-4.046 1.225C14.883 22.196 13.546 23 12 23c-1.55 0-2.878-.807-3.731-1.996-1.438.235-2.954-.128-4.05-1.224-1.095-1.095-1.459-2.611-1.217-4.05C1.816 14.877 1 13.551 1 12s.816-2.878 2.002-3.73c-.242-1.439.122-2.955 1.218-4.05 1.093-1.094 2.61-1.467 4.057-1.227C9.125 1.804 10.453 1 12 1c1.545 0 2.88.803 3.732 1.993 1.442-.24 2.956.135 4.048 1.227 1.093 1.092 1.468 2.608 1.227 4.05Zm-4.426-.084a1 1 0 0 1 .233 1.395l-5 7a1 1 0 0 1-1.521.126l-3-3a1 1 0 0 1 1.414-1.414l2.165 2.165 4.314-6.04a1 1 0 0 1 1.395-.232Z"
        fill={color}
      />
    </svg>
  );
}

function AggHeader({ title, badge }: { title: string; badge: boolean }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 20 }}>
      <div style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", marginBottom: 6 }}>{title}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Stars n={5} size={16} color="#f59e0b" />
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

// ── Preview: Main Widget ────────────────────────────────────────────────────────

function MainPreview({ s }: { s: { mainTitle: string; mainShowWriteButton: boolean; mainShowBreakdown: boolean; mainShowWithPhotosFilter: boolean; mainDefaultSort: string; mainPageSize: string; mainAccentColor: string } }) {
  const breakdown = [
    { star: 5, pct: 100 },
    { star: 4, pct: 0 },
    { star: 3, pct: 0 },
    { star: 2, pct: 0 },
    { star: 1, pct: 0 },
  ];
  const featureCards = [
    {
      name: "Ayan",
      rating: 4,
      title: "OxyEnergy is now part of my daily routine",
      excerpt:
        "I was hesitant at first, but OxyEnergy exceeded my expectations. Within a couple of weeks, I noticed reduced bloating and a much lighter feeling throughout the day.",
      product: "The Multi-managed Snowboard",
      hair: "#dd7a38",
      sweater: "#c96f31",
      bg: "linear-gradient(135deg, #f5e8dd 0%, #f0dfd1 38%, #c88b56 100%)",
    },
    {
      name: "Mira",
      rating: 5,
      title: "Gentle, effective, and easy to stay consistent with",
      excerpt:
        "The capsules have become the easiest wellness habit in my routine. I feel lighter after meals, my energy feels stable, and I love how simple it is to keep up.",
      product: "Balance Blend Essentials",
      hair: "#5c402f",
      sweater: "#9b8664",
      bg: "linear-gradient(135deg, #ebe5dc 0%, #d9ccb9 42%, #9b8664 100%)",
    },
  ];

  return (
    <div style={{ padding: "22px 16px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 750, color: "#111827" }}>{s.mainTitle}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>5.0</span>
            <Stars n={5} size={16} color="#f59e0b" />
            <span style={{ fontSize: 12, color: "#6d7175" }}>(20)</span>
            <span style={{ background: "#e8f5e9", color: "#2d7a3f", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>
              ✓ Verified
            </span>
          </div>
        </div>
        {s.mainShowWriteButton && (
          <button style={{ background: s.mainAccentColor, color: "#fff", border: "none", borderRadius: 10, padding: "9px 12px", fontSize: 12, fontWeight: 650, cursor: "pointer" }}>
            Write a review
          </button>
        )}
      </div>

      {s.mainShowBreakdown && (
        <div style={{ marginTop: 14, display: "grid", gap: 6, maxWidth: 420 }}>
          {breakdown.map((b) => (
            <div key={b.star} style={{ display: "grid", gridTemplateColumns: "18px 12px 1fr 40px", alignItems: "center", gap: 8, fontSize: 11, color: "#6d7175" }}>
              <span style={{ textAlign: "right", fontWeight: 650, color: "#111827" }}>{b.star}</span>
              <StarFilled size={12} color="#f59e0b" />
              <div style={{ height: 8, borderRadius: 999, background: "rgba(17,24,39,0.08)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${b.pct}%`, background: `linear-gradient(90deg, ${s.mainAccentColor}, ${s.mainAccentColor})` }} />
              </div>
              <span style={{ textAlign: "right" }}>{b.pct}%</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 16, paddingTop: 12, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#6d7175" }}>Showing 20/20 reviews</span>
          {s.mainShowWithPhotosFilter && (
            <button style={{ border: "1px solid rgba(0,0,0,0.12)", background: "#fff", borderRadius: 999, padding: "6px 10px", fontSize: 11, fontWeight: 650, cursor: "pointer" }}>
              with pictures
            </button>
          )}
        </div>
        <select value={s.mainDefaultSort} disabled style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 10, padding: "6px 10px", fontSize: 11, fontWeight: 650, color: "#111827", background: "#fff" }}>
          <option value="latest">Latest</option>
          <option value="highest">Highest</option>
          <option value="lowest">Lowest</option>
        </select>
      </div>

      <div style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
        {featureCards.map((card, i) => (
          <div
            key={i}
            style={{
              border: "1px solid rgba(109, 85, 42, 0.18)",
              borderRadius: 24,
              overflow: "hidden",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,244,238,0.98) 100%)",
              boxShadow: "0 14px 28px rgba(93, 63, 19, 0.08)",
            }}
          >
            <div
              style={{
                height: 220,
                background: card.bg,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 12,
                  borderRadius: 20,
                  border: "1px solid rgba(255,255,255,0.45)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.2), rgba(255,255,255,0.02))",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 22,
                  bottom: 0,
                  width: 118,
                  height: 168,
                  borderRadius: "72px 72px 0 0",
                  background: "linear-gradient(180deg, #f7e5d8, #efc8af)",
                  boxShadow: "0 16px 30px rgba(94, 48, 13, 0.15)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 18,
                  bottom: 120,
                  width: 126,
                  height: 118,
                  borderRadius: "62px 62px 56px 56px",
                  background: card.hair,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 44,
                  bottom: 132,
                  width: 76,
                  height: 92,
                  borderRadius: "40px 40px 48px 48px",
                  background: "linear-gradient(180deg, #f8e4d4, #edc9af)",
                  boxShadow: "inset 0 -8px 14px rgba(186, 122, 75, 0.12)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 18,
                  bottom: 6,
                  width: 138,
                  height: 112,
                  borderRadius: "28px 28px 0 0",
                  background: card.sweater,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: 18,
                  top: 28,
                  width: 84,
                  height: 132,
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.88)",
                  border: "1px solid rgba(91, 67, 33, 0.15)",
                  boxShadow: "0 18px 28px rgba(88, 63, 35, 0.12)",
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 14,
                    borderRadius: "0 0 10px 10px",
                    background: "#f3f0ea",
                    margin: "0 auto",
                    borderLeft: "1px solid rgba(91, 67, 33, 0.1)",
                    borderRight: "1px solid rgba(91, 67, 33, 0.1)",
                    borderBottom: "1px solid rgba(91, 67, 33, 0.1)",
                  }}
                />
                <div style={{ padding: "12px 10px 10px" }}>
                  <div style={{ fontSize: 9, color: "#54422e", writingMode: "vertical-rl", position: "absolute", left: 7, top: 28, letterSpacing: "0.04em" }}>
                    OxyEnergy
                  </div>
                  <div style={{ marginLeft: 10 }}>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#2d241b", color: "#fff", fontSize: 9, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                        OE
                      </div>
                    </div>
                    <div style={{ marginTop: 26, fontSize: 9, lineHeight: 1.15, color: "#54422e", fontWeight: 600 }}>
                      OxyEnergy
                      <br />
                      Health
                    </div>
                    <div style={{ marginTop: 8, fontSize: 7, lineHeight: 1.25, color: "#6d6253" }}>
                      Daily Wellness
                      <br />
                      Supplement
                    </div>
                    <div
                      style={{
                        marginTop: 9,
                        height: 28,
                        borderRadius: 9,
                        background: "linear-gradient(180deg, #dac894, #c8af70)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: "20px 20px 18px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      border: "1.5px solid rgba(0,0,0,0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 18,
                      fontFamily: "Georgia, serif",
                      color: "#1a1a1a",
                      background: "linear-gradient(145deg, #f9f6f1, #eee8df)",
                      flexShrink: 0,
                      fontWeight: 700,
                    }}
                  >
                    {card.name.charAt(0)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#171717" }}>{card.name}</div>
                      <VerifiedBadgeIcon size={15} color="#1d9bf0" />
                    </div>
                  </div>
                </div>
                <Stars n={card.rating} size={14} color="#f59e0b" emptyColor="rgba(200,180,120,0.4)" />
              </div>

              <div style={{ marginTop: 14, fontSize: 16, lineHeight: 1.3, fontWeight: 750, color: "#111", letterSpacing: "-0.01em" }}>
                {card.title}
              </div>

              <p
                style={{
                  margin: "10px 0 0",
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: "#3a3a3a",
                  display: "-webkit-box",
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {card.excerpt}
              </p>

              <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid rgba(0,0,0,0.07)", display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.mainAccentColor, flexShrink: 0 }} />
                <div style={{ fontSize: 11, color: "#6d7175", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {card.product}
                </div>
              </div>
            </div>
          </div>
        ))}
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
                {s.cardShowRating && <div style={{ marginBottom: 3 }}><Stars n={5} size={11} color="#f59e0b" /></div>}
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

// ── Widget types ───────────────────────────────────────────────────────────────

const WIDGET_TYPES: { id: WidgetType; label: string }[] = [
  { id: "main", label: "Main Widget" },
  { id: "card", label: "Card Carousel" },
];

// ── Main component ─────────────────────────────────────────────────────────────

export default function WidgetPage() {
  const { config } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const shopify = useAppBridge();

  const [activeWidget, setActiveWidget] = useState<WidgetType>("main");

  // Main widget settings
  const [mainTitle, setMainTitle] = useState(config?.mainTitle ?? "Reviews");
  const [mainShowWriteButton, setMainShowWriteButton] = useState(config?.mainShowWriteButton ?? true);
  const [mainShowBreakdown, setMainShowBreakdown] = useState(config?.mainShowBreakdown ?? true);
  const [mainShowWithPhotosFilter, setMainShowWithPhotosFilter] = useState(config?.mainShowWithPhotosFilter ?? true);
  const [mainDefaultSort, setMainDefaultSort] = useState(config?.mainDefaultSort ?? "latest");
  const [mainPageSize, setMainPageSize] = useState(String(config?.mainPageSize ?? 20));
  const [mainAccentColor, setMainAccentColor] = useState(config?.mainAccentColor ?? "#111111");

  // Card settings
  const [cardTitle, setCardTitle] = useState(config?.cardTitle ?? "What our customers say");
  const [cardShowRating, setCardShowRating] = useState(config?.cardShowRating ?? true);
  const [cardShowName, setCardShowName] = useState(config?.cardShowName ?? true);
  const [cardShowBadge, setCardShowBadge] = useState(config?.cardShowBadge ?? true);
  const [cardShowProduct, setCardShowProduct] = useState(config?.cardShowProduct ?? true);
  const [cardAccentColor, setCardAccentColor] = useState(config?.cardAccentColor ?? "#000000");

  const handleSave = () => {
    const fd = new FormData();
    fd.set("mainTitle", mainTitle);
    fd.set("mainShowWriteButton", String(mainShowWriteButton));
    fd.set("mainShowBreakdown", String(mainShowBreakdown));
    fd.set("mainShowWithPhotosFilter", String(mainShowWithPhotosFilter));
    fd.set("mainDefaultSort", mainDefaultSort);
    fd.set("mainPageSize", mainPageSize);
    fd.set("mainAccentColor", mainAccentColor);

    fd.set("cardTitle", cardTitle); fd.set("cardShowRating", String(cardShowRating));
    fd.set("cardShowName", String(cardShowName)); fd.set("cardShowBadge", String(cardShowBadge));
    fd.set("cardShowProduct", String(cardShowProduct));
    fd.set("cardAccentColor", cardAccentColor);

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

            {activeWidget === "main" && (
              <>
                <s-section heading="General">
                  <s-text-field label="Section title" {...({ value: mainTitle, onInput: (e: Event) => setMainTitle((e.target as HTMLInputElement).value) } as object)} />
                  <BlockStack gap="100">
                    <Text as="p" variant="bodyMd">Accent color</Text>
                    <ColorField value={mainAccentColor} onChange={setMainAccentColor} />
                  </BlockStack>
                </s-section>
                <s-section heading="Display">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text as="p" variant="bodyMd">Show “Write a review” button</Text>
                    <s-switch checked={mainShowWriteButton} onInput={() => setMainShowWriteButton(!mainShowWriteButton)} accessibilityLabel="Toggle write a review button" />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text as="p" variant="bodyMd">Show rating breakdown</Text>
                    <s-switch checked={mainShowBreakdown} onInput={() => setMainShowBreakdown(!mainShowBreakdown)} accessibilityLabel="Toggle rating breakdown" />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Text as="p" variant="bodyMd">Show “with pictures” filter</Text>
                    <s-switch checked={mainShowWithPhotosFilter} onInput={() => setMainShowWithPhotosFilter(!mainShowWithPhotosFilter)} accessibilityLabel="Toggle with pictures filter" />
                  </div>
                </s-section>
                <s-section heading="Behavior">
                  <BlockStack gap="200">
                    <Text as="span" variant="bodyMd">Default sort</Text>
                    <s-select
                      label="Default sort"
                      labelAccessibilityVisibility="exclusive"
                      value={mainDefaultSort}
                      onInput={(e: Event) => setMainDefaultSort((e.target as HTMLSelectElement).value)}
                    >
                      <s-option value="latest">Latest</s-option>
                      <s-option value="highest">Highest rating</s-option>
                      <s-option value="lowest">Lowest rating</s-option>
                    </s-select>
                  </BlockStack>
                  <BlockStack gap="200">
                    <Text as="span" variant="bodyMd">Reviews per page</Text>
                    <s-select
                      label="Reviews per page"
                      labelAccessibilityVisibility="exclusive"
                      value={mainPageSize}
                      onInput={(e: Event) => setMainPageSize((e.target as HTMLSelectElement).value)}
                    >
                      {["8", "12", "16", "20", "24", "32", "40", "48"].map((n) => (
                        <s-option key={n} value={n}>{n}</s-option>
                      ))}
                    </s-select>
                  </BlockStack>
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
                {activeWidget === "main" && (
                  <MainPreview s={{ mainTitle, mainShowWriteButton, mainShowBreakdown, mainShowWithPhotosFilter, mainDefaultSort, mainPageSize, mainAccentColor }} />
                )}
                {activeWidget === "card" && (
                  <CardPreview s={{ cardTitle, cardShowRating, cardShowName, cardShowBadge, cardShowProduct, cardAccentColor }} />
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
