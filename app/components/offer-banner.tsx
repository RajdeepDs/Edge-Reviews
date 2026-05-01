import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

type PlanId = "free" | "basic" | "business";

const BANNERS: Record<string, { headline: string; sub: string; cta: string }> = {
  free: {
    headline: "Unlock 10× more reviews — upgrade to Basic for just $5.99/mo",
    sub: "500 published reviews · Auto-publish rules · All widget layouts · Basic analytics",
    cta: "Upgrade to Basic",
  },
  basic: {
    headline: "Go unlimited — upgrade to Business for just $13.99/mo",
    sub: "Unlimited reviews · Advanced analytics + CSV export · Full widget customization",
    cta: "Upgrade to Business",
  },
};

function storageKey(plan: PlanId) {
  return `offer_banner_dismissed_${plan}`;
}

export function OfferBanner({ plan }: { plan: PlanId }) {
  const navigate = useNavigate();
  const banner = BANNERS[plan];
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

  useEffect(() => {
    setDismissed(localStorage.getItem(storageKey(plan)) === "true");
  }, [plan]);

  if (!banner || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(storageKey(plan), "true");
    setDismissed(true);
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)",
      padding: "14px 20px",
      borderRadius: "10px",
      marginBottom: "16px",
      marginTop: "16px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <span style={{
          width: "38px", height: "38px", flexShrink: 0,
          display: "flex", justifyContent: "center", alignItems: "center",
          background: "rgba(255,255,255,0.12)",
          borderRadius: "10px",
          color: "#fbbf24",
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="20" height="20">
            <path d="M12.973 2.5v7c0 .276.236.5.527.5h5.972c.418 0 .67.44.442.773l-7.919 10.999c-.286.417-.968.225-.968-.273V15.5c0-.276-.236-.5-.527-.5H4.528c-.412 0-.665-.428-.45-.761l7.92-12c.277-.43.975-.243.975.262Z" />
          </svg>
        </span>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", marginBottom: "2px" }}>
            {banner.headline}
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", fontWeight: 400 }}>
            {banner.sub}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <button
          onClick={() => navigate("/app/plans")}
          style={{
            background: "#2563eb",
            color: "#ffffff",
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {banner.cta}
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(255,255,255,0.45)",
            cursor: "pointer",
            fontSize: "18px",
            lineHeight: 1,
            padding: "4px 6px",
            borderRadius: "6px",
          }}
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
