import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData, useSubmit } from "react-router";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import {
  PLAN_BASIC,
  PLAN_BASIC_ANNUAL,
  PLAN_BUSINESS,
  PLAN_BUSINESS_ANNUAL,
} from "../plans.constants";
import { boundary } from "@shopify/shopify-app-react-router/server";

const ALL_PAID_PLANS = [PLAN_BASIC, PLAN_BASIC_ANNUAL, PLAN_BUSINESS, PLAN_BUSINESS_ANNUAL] as const;
const IS_TEST = process.env.NODE_ENV !== "production" || process.env.SHOPIFY_BILLING_TEST === "true";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing } = await authenticate.admin(request);
  const { appSubscriptions } = await billing.check({ plans: [...ALL_PAID_PLANS], isTest: IS_TEST });
  const activeSub = appSubscriptions[0] ?? null;
  return {
    activePlanKey: activeSub?.name ?? null,
    subscriptionId: activeSub?.id ?? null,
    chargeConfirmed: new URL(request.url).searchParams.has("charge_id"),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const url = new URL(request.url);
  // Build a guaranteed-valid host: prefer the one Shopify passed, fall back to
  // constructing it from the shop domain (base64url of "<shop>/admin").
  const rawHost = url.searchParams.get('host');
  const host = rawHost ?? Buffer.from(`${session.shop}/admin`).toString('base64url');
  const form = await request.formData();
  const intent = form.get("intent") as string;

  if (intent === "subscribe") {
    const plan = form.get("plan") as typeof ALL_PAID_PLANS[number];
    await billing.request({
      plan,
      isTest: IS_TEST,
      returnUrl: `${process.env.SHOPIFY_APP_URL}/app/plans?shop=${session.shop}&host=${host}`,
      trialDays: 7,
    });
  }

  if (intent === "cancel") {
    const subscriptionId = form.get("subscriptionId") as string;
    await billing.cancel({ subscriptionId, isTest: IS_TEST, prorate: true });
    return redirect("/app/plans");
  }

  return null;
};

type FeatureItem = { text: string; included: boolean };
type FeatureGroup = { category: string; items: FeatureItem[] };

type Plan = {
  id: string;
  name: string;
  monthlyPrice: number;
  popular?: boolean;
  accentColor: string;
  cta: string;
  groups: FeatureGroup[];
};

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    accentColor: "#4a4a4a",
    cta: "Get started free",
    groups: [
      {
        category: "REVIEWS",
        items: [
          { text: "Up to 50 published reviews",  included: true  },
          { text: "Text reviews",                included: true  },
          { text: "Photo reviews",                included: true  },
          { text: "Manual moderation",           included: true  },
          { text: "Star rating display",         included: true  },
        ],
      },
      {
        category: "DISPLAY",
        items: [
          { text: "1 widget layout",              included: true  },
          { text: "Widget customization",        included: false },
        ],
      },
      {
        category: "IMPORT",
        items: [
          { text: "CSV import — 100 rows/mo",    included: true  },
        ],
      },
      {
        category: "ANALYTICS",
        items: [
          { text: "Analytics",                   included: false },
        ],
      },
    ],
  },
  {
    id: "basic",
    name: "Basic",
    monthlyPrice: 5.99,
    popular: true,
    accentColor: "#2563eb",
    cta: "Start free trial",
    groups: [
      {
        category: "REVIEWS",
        items: [
          { text: "Up to 500 published reviews", included: true },
          { text: "Photo reviews",                included: true },
          { text: "Auto-publish rules",          included: true },
          { text: "Verified purchase badge",     included: true },
        ],
      },
      {
        category: "DISPLAY",
        items: [
          { text: "All widget layouts",                        included: true },
          { text: "Widget customization",                      included: true },
        ],
      },
      {
        category: "IMPORT",
        items: [
          { text: "CSV import — 1,000 rows/mo", included: true },
        ],
      },
      {
        category: "ANALYTICS",
        items: [
          { text: "Basic analytics",             included: true  },
          { text: "Advanced analytics + export", included: false },
        ],
      },
    ],
  },
  {
    id: "business",
    name: "Business",
    monthlyPrice: 13.99,
    accentColor: "#4a4a4a",
    cta: "Start free trial",
    groups: [
      {
        category: "REVIEWS",
        items: [
          { text: "Unlimited published reviews",              included: true },
          { text: "Photo reviews",                            included: true },
          { text: "Auto-publish rules + rating threshold",    included: true },
          { text: "Verified purchase badge",                  included: true },
        ],
      },
      {
        category: "DISPLAY",
        items: [
          { text: "All widget layouts",                        included: true },
          { text: "Full widget customization + branding",      included: true },
        ],
      },
      {
        category: "IMPORT",
        items: [
          { text: "CSV import — unlimited rows",              included: true },
        ],
      },
      {
        category: "ANALYTICS",
        items: [
          { text: "Advanced analytics + CSV export",          included: true },
        ],
      },
    ],
  },
];

function getActivePlanId(activePlanKey: string | null): string {
  if (!activePlanKey) return "free";
  if (activePlanKey === PLAN_BASIC || activePlanKey === PLAN_BASIC_ANNUAL) return "basic";
  if (activePlanKey === PLAN_BUSINESS || activePlanKey === PLAN_BUSINESS_ANNUAL) return "business";
  return "free";
}

function getPlanKey(planId: string, annual: boolean): string {
  if (planId === "basic") return annual ? PLAN_BASIC_ANNUAL : PLAN_BASIC;
  if (planId === "business") return annual ? PLAN_BUSINESS_ANNUAL : PLAN_BUSINESS;
  return "";
}

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M3 8l3.5 3.5L13 4.5" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Cross() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function PlansPage() {
  const { activePlanKey, subscriptionId, chargeConfirmed } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const [annual, setAnnual] = useState(false);

  const activePlanId = getActivePlanId(activePlanKey);
  const isOnPaidPlan = activePlanId !== "free";

  const handleSelect = (plan: Plan) => {
    if (plan.id === activePlanId) return;

    if (plan.id === "free") {
      // downgrade: cancel active subscription
      submit(
        { intent: "cancel", subscriptionId: subscriptionId ?? "" },
        { method: "post" },
      );
      return;
    }

    submit(
      { intent: "subscribe", plan: getPlanKey(plan.id, annual) },
      { method: "post" },
    );
  };

  return (
    <s-page heading="Plans & Pricing" inlineSize="large">
      <div style={{ maxWidth: "960px", margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: "28px" }}>

        {chargeConfirmed && (
          <div style={{
            padding: "12px 16px", borderRadius: "8px",
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            color: "#15803d", fontSize: "14px", fontWeight: 500,
          }}>
            Your subscription has been activated. Thank you!
          </div>
        )}

        {/* Billing toggle */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{
            display: "inline-flex", alignItems: "center",
            background: "#f1f5f9", borderRadius: "10px", padding: "4px", gap: "2px",
          }}>
            {[false, true].map((isAnnual) => (
              <button
                key={String(isAnnual)}
                onClick={() => setAnnual(isAnnual)}
                style={{
                  padding: "6px 18px", borderRadius: "7px", border: "none",
                  cursor: "pointer", fontSize: "13px", fontWeight: 600,
                  display: "flex", alignItems: "center", gap: "8px",
                  background: annual === isAnnual ? "#ffffff" : "transparent",
                  color: annual === isAnnual ? "#111827" : "#6b7280",
                  boxShadow: annual === isAnnual ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                {isAnnual ? "Annual billing" : "Monthly billing"}
                {isAnnual && (
                  <span style={{
                    background: "#dcfce7", color: "#16a34a",
                    fontSize: "10px", fontWeight: 700,
                    padding: "1px 7px", borderRadius: "20px",
                  }}>
                    SAVE 20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan feature breakdown heading */}
        <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Plan feature breakdown
        </p>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", alignItems: "stretch" }}>
          {PLANS.map((plan) => {
            const isCurrent = plan.id === activePlanId;
            const monthly = plan.monthlyPrice;
            const price = annual ? +(monthly * 0.8).toFixed(2) : monthly;

            let ctaLabel: string;
            if (isCurrent) {
              ctaLabel = "✓ Current plan";
            } else if (plan.id === "free" && isOnPaidPlan) {
              ctaLabel = "Downgrade to Free";
            } else {
              ctaLabel = plan.cta;
            }

            return (
              <div
                key={plan.id}
                style={{
                  borderRadius: "14px",
                  border: plan.popular ? `2px solid ${plan.accentColor}` : "1.5px solid #e5e7eb",
                  background: "#ffffff",
                  overflow: "hidden",
                  boxShadow: plan.popular ? "0 4px 24px rgba(37,99,235,0.10)" : "0 1px 4px rgba(0,0,0,0.05)",
                  position: "relative",
                }}
              >
                {/* Most popular badge */}
                {plan.popular && (
                  <div style={{
                    textAlign: "center",
                    background: "#eff6ff",
                    padding: "6px 0",
                    fontSize: "11px", fontWeight: 700,
                    color: plan.accentColor, letterSpacing: "0.04em",
                  }}>
                    Most popular
                  </div>
                )}

                {/* Header */}
                <div style={{ padding: "20px 20px 16px" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 700, color: "#111827" }}>
                    {plan.name}
                  </p>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
                    {price === 0 ? (
                      <span style={{ fontSize: "28px", fontWeight: 800, color: "#111827" }}>$0</span>
                    ) : (
                      <>
                        <span style={{ fontSize: "28px", fontWeight: 800, color: "#111827" }}>${price}</span>
                        <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>/mo</span>
                      </>
                    )}
                  </div>
                  {annual && price > 0 && (
                    <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#9ca3af" }}>
                      Billed ${(price * 12).toFixed(2)}/year
                    </p>
                  )}

                  <button
                    onClick={() => handleSelect(plan)}
                    disabled={isCurrent}
                    style={{
                      marginTop: "14px",
                      width: "100%", padding: "9px 0",
                      borderRadius: "8px", border: "none",
                      cursor: isCurrent ? "default" : "pointer",
                      fontSize: "13px", fontWeight: 600,
                      background: isCurrent ? "#f3f4f6" : plan.popular ? plan.accentColor : "#111827",
                      color: isCurrent ? "#9ca3af" : "#ffffff",
                      transition: "opacity 0.15s",
                    }}
                  >
                    {ctaLabel}
                  </button>
                </div>

                <div style={{ height: "1px", background: "#f3f4f6" }} />

                {/* Feature groups */}
                <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                  {plan.groups.map((group) => (
                    <div key={group.category}>
                      <p style={{ margin: "0 0 8px", fontSize: "10px", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em" }}>
                        {group.category}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {group.items.map((item, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                            {item.included ? <Check /> : <Cross />}
                            <span style={{ fontSize: "12.5px", color: item.included ? "#374151" : "#9ca3af", lineHeight: 1.45 }}>
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust row */}
        <div style={{
          display: "flex", alignItems: "center", gap: "28px",
          flexWrap: "wrap", justifyContent: "center",
          padding: "16px 24px",
          background: "#f9fafb", borderRadius: "12px",
          border: "1px solid #e5e7eb",
        }}>
          {[
            { icon: "🔒", text: "No credit card required" },
            { icon: "🔄", text: "Cancel anytime" },
            { icon: "🎁", text: "7-day free trial on paid plans" },
            { icon: "💬", text: "Support on every plan" },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <span style={{ fontSize: "15px" }}>{icon}</span>
              <span style={{ fontSize: "12.5px", color: "#6b7280", fontWeight: 500 }}>{text}</span>
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
