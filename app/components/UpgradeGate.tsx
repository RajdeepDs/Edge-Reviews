import { Link } from "react-router";

interface Props {
  feature: string;
  description: string;
  requiredPlan: "basic" | "business";
  currentPlan: string;
}

const PLAN_BADGE_STYLES: Record<"basic" | "business", { bg: string; color: string; border: string }> = {
  basic:    { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  business: { bg: "#1a1a1a", color: "#ffffff", border: "#1a1a1a" },
};

const PLAN_LABELS: Record<"basic" | "business", string> = {
  basic: "Basic",
  business: "Business",
};

function LockIcon() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1.5" />
      <path
        d="M7 11V7a5 5 0 0 1 10 0v4"
        stroke="#9ca3af"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="16" r="1.5" fill="#9ca3af" />
      <line x1="12" y1="17.5" x2="12" y2="19.5" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function UpgradeGate({ feature, description, requiredPlan, currentPlan }: Props) {
  const badge = PLAN_BADGE_STYLES[requiredPlan];
  const planLabel = PLAN_LABELS[requiredPlan];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "64px 24px",
        textAlign: "center",
        minHeight: "400px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "16px",
          padding: "48px 40px",
          maxWidth: "440px",
          width: "100%",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
        }}
      >
        {/* Lock icon */}
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "18px",
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LockIcon />
        </div>

        {/* Plan badge */}
        <span
          style={{
            display: "inline-block",
            fontSize: "11px",
            fontWeight: 700,
            padding: "3px 12px",
            borderRadius: "20px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            background: badge.bg,
            color: badge.color,
            border: `1px solid ${badge.border}`,
          }}
        >
          {planLabel} plan
        </span>

        {/* Feature name */}
        <div>
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#111827",
              marginBottom: "8px",
            }}
          >
            {feature}
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "#6b7280",
              lineHeight: 1.6,
            }}
          >
            {description}
          </div>
        </div>

        {/* Upgrade button */}
        <Link
          to="/app/plans"
          style={{
            display: "inline-block",
            marginTop: "4px",
            padding: "11px 28px",
            background: requiredPlan === "basic" ? "#2563eb" : "#1a1a1a",
            color: "#ffffff",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            textDecoration: "none",
            transition: "opacity 0.15s",
          }}
        >
          Upgrade to {planLabel}
        </Link>

        <div style={{ fontSize: "12px", color: "#9ca3af" }}>
          Currently on{" "}
          <span style={{ fontWeight: 600, color: "#6b7280", textTransform: "capitalize" }}>
            {currentPlan}
          </span>{" "}
          plan
        </div>
      </div>
    </div>
  );
}
