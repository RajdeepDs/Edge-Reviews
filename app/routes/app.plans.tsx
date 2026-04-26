import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useState } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

const CURRENT_PLAN = "growth";

type Plan = {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: number;
  annualPrice: number;
  annualTotal: number;
  popular?: boolean;
  headerGradient: string;
  accentColor: string;
  lightAccent: string;
  icon: string;
  cta: string;
  features: { text: string; included: boolean; highlight?: boolean }[];
};

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    tagline: "Collect and display reviews with zero upfront cost.",
    monthlyPrice: 9,
    annualPrice: 7,
    annualTotal: 84,
    headerGradient: "linear-gradient(145deg, #1e293b 0%, #0f172a 100%)",
    accentColor: "#64748b",
    lightAccent: "#f1f5f9",
    icon: "🌱",
    cta: "Get Starter",
    features: [
      { text: "Up to 100 published reviews",        included: true  },
      { text: "List widget layout",                  included: true  },
      { text: "Manual moderation",                   included: true  },
      { text: "1 CSV import / month (200 rows)",     included: true  },
      { text: "30-day analytics window",             included: true  },
      { text: "Verified purchase badge",             included: true  },
      { text: "Auto-publish rules",                  included: false },
      { text: "Review request emails",               included: false },
    ],
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "Automate reviews and build trust at scale.",
    monthlyPrice: 19,
    annualPrice: 15,
    annualTotal: 180,
    popular: true,
    headerGradient: "linear-gradient(145deg, #f59e0b 0%, #EF9F27 40%, #ea7c0a 100%)",
    accentColor: "#EF9F27",
    lightAccent: "#fffbeb",
    icon: "⚡",
    cta: "Upgrade to Growth",
    features: [
      { text: "Up to 5,000 published reviews",                 included: true, highlight: true },
      { text: "All widget layouts (list, grid, carousel)",     included: true  },
      { text: "Auto-publish rules + rating threshold",         included: true, highlight: true },
      { text: "Unlimited imports (2,000 rows each)",           included: true  },
      { text: "Full analytics + rating breakdown",             included: true  },
      { text: "Verified purchase badge",                       included: true  },
      { text: "Review request emails (500 / month)",           included: true, highlight: true },
      { text: "Duplicate detection",                           included: true  },
      { text: "Custom accent color",                           included: true  },
      { text: "API access",                                    included: false },
    ],
  },
  {
    id: "scale",
    name: "Scale",
    tagline: "Unlimited everything for high-volume stores.",
    monthlyPrice: 49,
    annualPrice: 39,
    annualTotal: 468,
    headerGradient: "linear-gradient(145deg, #6366f1 0%, #7c3aed 100%)",
    accentColor: "#6366f1",
    lightAccent: "#eef2ff",
    icon: "🚀",
    cta: "Upgrade to Scale",
    features: [
      { text: "Unlimited published reviews",                   included: true, highlight: true },
      { text: "All widget layouts (list, grid, carousel)",     included: true  },
      { text: "Auto-publish rules + rating threshold",         included: true  },
      { text: "Unlimited imports (no row limit)",              included: true, highlight: true },
      { text: "Advanced analytics + CSV export",               included: true  },
      { text: "Review request emails (unlimited)",             included: true, highlight: true },
      { text: "Custom widget branding",                        included: true  },
      { text: "API access",                                    included: true, highlight: true },
    ],
  },
];

function Check({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="9" cy="9" r="9" fill={color} fillOpacity="0.15" />
      <path d="M5.5 9l2.5 2.5 4.5-5" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Cross() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="9" cy="9" r="9" fill="#f1f5f9" />
      <path d="M6.5 6.5l5 5M11.5 6.5l-5 5" stroke="#cbd5e1" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export default function PlansPage() {
  const shopify = useAppBridge();
  const [annual, setAnnual] = useState(false);

  const handleSelect = (plan: Plan) => {
    if (plan.id === CURRENT_PLAN) return;
    shopify.toast.show(`Switching to ${plan.name}…`);
  };

  return (
    <s-page heading="Plans & Pricing" inlineSize="large">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "36px", maxWidth: "1060px", margin: "0 auto", width: "100%" }}>

        {/* Hero text */}
        <p style={{ fontSize: "15px", color: "#64748b", margin: 0, lineHeight: 1.6, textAlign: "center", maxWidth: "480px" }}>
          Start free and upgrade as you grow. All plans include a{" "}
          <strong style={{ color: "#0f172a" }}>7-day free trial</strong> — no credit card required.
        </p>

        {/* Billing toggle */}
        <div style={{
          display: "inline-flex", alignItems: "center",
          background: "#f8fafc", border: "1px solid #e2e8f0",
          borderRadius: "12px", padding: "5px", gap: "2px",
        }}>
          {[false, true].map((isAnnual) => (
            <button
              key={String(isAnnual)}
              onClick={() => setAnnual(isAnnual)}
              style={{
                padding: "7px 20px", borderRadius: "8px", border: "none",
                cursor: "pointer", fontSize: "13px", fontWeight: 600,
                display: "flex", alignItems: "center", gap: "8px",
                background: annual === isAnnual ? "#ffffff" : "transparent",
                color: annual === isAnnual ? "#0f172a" : "#94a3b8",
                boxShadow: annual === isAnnual ? "0 1px 4px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)" : "none",
                transition: "all 0.18s ease",
              }}
            >
              {isAnnual ? "Annual billing" : "Monthly billing"}
              {isAnnual && (
                <span style={{
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  color: "#fff", fontSize: "10px", fontWeight: 800,
                  padding: "2px 8px", borderRadius: "20px", letterSpacing: "0.03em",
                }}>
                  SAVE 20%
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "20px",
          width: "100%",
          alignItems: "center",
        }}>
          {PLANS.map((plan) => {
            const isCurrent = plan.id === CURRENT_PLAN;
            const price = annual ? plan.annualPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                style={{
                  borderRadius: "20px",
                  overflow: "hidden",
                  border: plan.popular ? `2px solid ${plan.accentColor}` : "2px solid #e2e8f0",
                  boxShadow: plan.popular
                    ? `0 8px 40px ${plan.accentColor}30, 0 2px 8px rgba(0,0,0,0.08)`
                    : "0 2px 8px rgba(0,0,0,0.05)",
                  position: "relative",
                  transform: plan.popular ? "translateY(-8px)" : "none",
                }}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div style={{
                    position: "absolute", top: "-1px", left: "50%",
                    transform: "translateX(-50%)",
                    background: plan.accentColor,
                    color: "#fff", fontSize: "10px", fontWeight: 800,
                    padding: "4px 16px", borderRadius: "0 0 10px 10px",
                    letterSpacing: "0.08em", whiteSpace: "nowrap",
                    boxShadow: `0 2px 8px ${plan.accentColor}50`,
                  }}>
                    MOST POPULAR
                  </div>
                )}

                {/* Gradient header */}
                <div style={{
                  background: plan.headerGradient,
                  padding: plan.popular ? "36px 28px 28px" : "22px 24px 20px",
                  display: "flex", flexDirection: "column", gap: "16px",
                }}>
                  {/* Plan name row */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{
                        width: "36px", height: "36px", borderRadius: "10px",
                        background: "rgba(255,255,255,0.18)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "18px",
                      }}>
                        {plan.icon}
                      </span>
                      <span style={{ fontSize: "20px", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
                        {plan.name}
                      </span>
                    </div>
                    {isCurrent && (
                      <span style={{
                        fontSize: "10px", fontWeight: 700, padding: "3px 10px",
                        borderRadius: "20px", letterSpacing: "0.05em",
                        background: "rgba(255,255,255,0.25)",
                        color: "#fff", border: "1px solid rgba(255,255,255,0.4)",
                      }}>
                        YOUR PLAN
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div>
                    {price === 0 ? (
                      <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                        <span style={{ fontSize: "48px", fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-0.03em" }}>
                          Free
                        </span>
                        <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>forever</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
                          <span style={{ fontSize: "22px", fontWeight: 700, color: "rgba(255,255,255,0.8)", alignSelf: "flex-start", marginTop: "8px" }}>$</span>
                          <span style={{ fontSize: "52px", fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-0.04em" }}>
                            {price}
                          </span>
                          <span style={{ fontSize: "15px", color: "rgba(255,255,255,0.65)", fontWeight: 500, marginBottom: "6px" }}>/mo</span>
                        </div>
                        {annual && (
                          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.6)" }}>
                            Billed ${plan.annualTotal}/year — saving ${(plan.monthlyPrice - plan.annualPrice) * 12}/year
                          </p>
                        )}
                      </>
                    )}
                    <p style={{ margin: "10px 0 0", fontSize: "13px", color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                      {plan.tagline}
                    </p>
                  </div>

                  {/* CTA */}
                  <button
                    onClick={() => handleSelect(plan)}
                    disabled={isCurrent}
                    style={{
                      width: "100%", padding: "11px 0",
                      borderRadius: "10px", border: "none",
                      cursor: isCurrent ? "default" : "pointer",
                      fontSize: "14px", fontWeight: 700,
                      background: isCurrent ? "rgba(255,255,255,0.15)" : "#ffffff",
                      color: isCurrent ? "rgba(255,255,255,0.5)" : plan.accentColor,
                      letterSpacing: "0.01em",
                      transition: "all 0.15s ease",
                      boxShadow: isCurrent ? "none" : "0 2px 8px rgba(0,0,0,0.15)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) {
                        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) {
                        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
                      }
                    }}
                  >
                    {isCurrent ? "✓ Current plan" : plan.cta}
                  </button>
                </div>

                {/* Features list */}
                <div style={{ background: "#ffffff", padding: plan.popular ? "24px 28px" : "20px 24px", display: "flex", flexDirection: "column", gap: plan.popular ? "12px" : "10px" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    What&apos;s included
                  </p>
                  {plan.features.map((f, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      {f.included ? <Check color={plan.accentColor} /> : <Cross />}
                      <span style={{
                        fontSize: "13px", lineHeight: 1.5,
                        color: f.included ? (f.highlight ? "#0f172a" : "#374151") : "#94a3b8",
                        fontWeight: f.highlight && f.included ? 600 : 400,
                      }}>
                        {f.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust row */}
        <div style={{
          display: "flex", alignItems: "center", gap: "32px",
          flexWrap: "wrap", justifyContent: "center",
          padding: "20px 32px",
          background: "#f8fafc", borderRadius: "14px",
          border: "1px solid #e2e8f0", width: "100%",
        }}>
          {[
            { icon: "🔒", text: "No credit card required" },
            { icon: "🔄", text: "Cancel or change plan anytime" },
            { icon: "🎁", text: "7-day free trial on all paid plans" },
            { icon: "💬", text: "Support on every plan" },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>{icon}</span>
              <span style={{ fontSize: "13px", color: "#475569", fontWeight: 500 }}>{text}</span>
            </div>
          ))}
        </div>

      </div>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
