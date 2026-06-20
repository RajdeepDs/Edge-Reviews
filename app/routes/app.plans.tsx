import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { redirect, useLoaderData, useNavigation, useSubmit } from "react-router";
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

// Controls whether billing.request attempts a real charge. In production real merchants
// are charged for real; in dev (and on test/demo stores) Shopify forces a test charge.
const IS_TEST = process.env.NODE_ENV !== "production" || process.env.SHOPIFY_BILLING_TEST === "true";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { billing } = await authenticate.admin(request);
  // Always check with isTest:true so the lookup returns BOTH live and test subscriptions.
  // Development/demo stores (including the ones Shopify's reviewers use) can't be charged,
  // so their subscriptions are always test charges — checking with isTest:false would hide
  // them and this page would keep showing "Free" as the current plan after an upgrade.
  const { appSubscriptions } = await billing.check({ plans: [...ALL_PAID_PLANS], isTest: true });
  const activeSub = appSubscriptions[0] ?? null;
  return {
    activePlanKey: activeSub?.name ?? null,
    chargeConfirmed: new URL(request.url).searchParams.has("charge_id"),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { billing, session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = form.get("intent") as string;

  // Read the merchant's current subscription from Shopify (the source of truth) instead of
  // trusting values posted by the client, which can be stale or tampered with.
  const { appSubscriptions } = await billing.check({ plans: [...ALL_PAID_PLANS], isTest: true });
  const activeSub = appSubscriptions[0] ?? null;

  if (intent === "subscribe") {
    const plan = form.get("plan");
    // Ignore anything that isn't one of our configured paid plans, or a request to
    // "subscribe" to the plan/interval the merchant is already on.
    if (typeof plan !== "string" || !(ALL_PAID_PLANS as readonly string[]).includes(plan)) {
      return redirect("/app/plans");
    }
    if (activeSub?.name === plan) {
      return redirect("/app/plans");
    }
    const storeName = session.shop.replace(".myshopify.com", "");
    await billing.request({
      plan: plan as typeof ALL_PAID_PLANS[number],
      isTest: IS_TEST,
      returnUrl: `https://admin.shopify.com/store/${storeName}/apps/edge-reviews/app/plans`,
      // Only first-time subscribers (coming from Free) get the 7-day trial. Switching
      // intervals or tiers while already on a paid plan must not reset the trial each time.
      trialDays: activeSub ? 0 : 7,
    });
  }

  if (intent === "cancel") {
    // Cancel the merchant's actual active subscription; no-op if there isn't one so a
    // stray/duplicate request can't error out.
    if (activeSub) {
      await billing.cancel({ subscriptionId: activeSub.id, isTest: IS_TEST, prorate: true });
    }
    return redirect("/app/plans");
  }

  return redirect("/app/plans");
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

// Tier ordering, used to label a paid→paid move as an upgrade vs a downgrade.
const PLAN_RANK: Record<string, number> = { free: 0, basic: 1, business: 2 };

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
  const { activePlanKey, chargeConfirmed } = useLoaderData<typeof loader>();
  const submit = useSubmit();
  const navigation = useNavigation();

  const activePlanId = getActivePlanId(activePlanKey);
  const activeIsAnnual =
    activePlanKey === PLAN_BASIC_ANNUAL || activePlanKey === PLAN_BUSINESS_ANNUAL;
  const isOnPaidPlan = activePlanId !== "free";

  // Open the billing toggle on the interval the merchant is already on, so an existing
  // subscriber's plan reads as "current" on load instead of as a switch.
  const [annual, setAnnual] = useState(activeIsAnnual);

  // Disable the buttons while a subscribe/cancel is in flight so a double-click can't fire
  // two billing requests, and surface which card is being processed.
  const isSubmitting = navigation.state !== "idle";
  const pendingIntent = navigation.formData?.get("intent");
  const pendingPlan = navigation.formData?.get("plan");

  // A card is the "current plan" only when BOTH the tier and the billing interval match
  // the active subscription. Comparing tier alone marks a monthly subscriber's plan as
  // current under the annual toggle too, which blocks the monthly→annual upgrade on the
  // same tier. (Free has no interval, so the interval check is skipped for it.)
  const isCurrentPlan = (plan: Plan) =>
    plan.id === activePlanId && (plan.id === "free" || annual === activeIsAnnual);

  const handleSelect = (plan: Plan) => {
    if (isCurrentPlan(plan) || isSubmitting) return;

    if (plan.id === "free") {
      // downgrade: cancel the active subscription (resolved server-side)
      submit({ intent: "cancel" }, { method: "post" });
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

        {chargeConfirmed && isOnPaidPlan && (
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
            const isCurrent = isCurrentPlan(plan);
            // Same paid tier as the active plan, but the toggle is on the other interval.
            const isIntervalSwitch =
              plan.id !== "free" && plan.id === activePlanId && !isCurrent;
            const monthly = plan.monthlyPrice;
            const price = annual ? +(monthly * 0.8).toFixed(2) : monthly;

            // Is the form currently submitting *this* card's action?
            const isPending =
              isSubmitting &&
              (plan.id === "free"
                ? pendingIntent === "cancel"
                : pendingIntent === "subscribe" && pendingPlan === getPlanKey(plan.id, annual));

            let ctaLabel: string;
            if (isPending) {
              ctaLabel = "Processing…";
            } else if (isCurrent) {
              ctaLabel = "✓ Current plan";
            } else if (isIntervalSwitch) {
              ctaLabel = annual ? "Switch to annual billing" : "Switch to monthly billing";
            } else if (plan.id === "free") {
              ctaLabel = isOnPaidPlan ? "Downgrade to Free" : plan.cta;
            } else if (isOnPaidPlan) {
              // Moving between paid tiers (e.g. Basic → Business).
              ctaLabel =
                PLAN_RANK[plan.id] > PLAN_RANK[activePlanId]
                  ? `Upgrade to ${plan.name}`
                  : `Downgrade to ${plan.name}`;
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
                  {price === 0 ? (
                    <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#9ca3af", fontWeight: 500 }}>
                      Free forever — no credit card required
                    </p>
                  ) : isOnPaidPlan ? (
                    <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#9ca3af", fontWeight: 500 }}>
                      Cancel or switch anytime
                    </p>
                  ) : (
                    <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>
                      7-day free trial, then ${price}/mo{annual ? " (billed annually)" : ""}
                    </p>
                  )}

                  <button
                    onClick={() => handleSelect(plan)}
                    disabled={isCurrent || isSubmitting}
                    style={{
                      marginTop: "14px",
                      width: "100%", padding: "9px 0",
                      borderRadius: "8px", border: "none",
                      cursor: isCurrent || isSubmitting ? "default" : "pointer",
                      fontSize: "13px", fontWeight: 600,
                      background: isCurrent ? "#f3f4f6" : plan.popular ? plan.accentColor : "#111827",
                      color: isCurrent ? "#9ca3af" : "#ffffff",
                      opacity: isSubmitting && !isCurrent ? 0.6 : 1,
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
