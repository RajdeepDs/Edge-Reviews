import { useState } from "react";
import { Link } from "react-router";

interface QuickActionsProps {
  onImportReviews: () => void;
}

type ActionConfig =
  | { key: string; label: string; description: string; accent: string; iconColor: string; icon: React.ReactNode; kind: "button"; handler: "onImportReviews" }
  | { key: string; label: string; description: string; accent: string; iconColor: string; icon: React.ReactNode; kind: "link"; href: string };

const actions: ActionConfig[] = [
  {
    key: "import",
    kind: "button",
    label: "Import Reviews",
    description: "Bring in reviews from other platforms",
    accent: "#e8f0fe",
    iconColor: "#3c6fcd",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="22" height="22">
        <path d="M12 2a1 1 0 0 1 1 1v10.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L11 13.586V3a1 1 0 0 1 1-1ZM4 19a1 1 0 1 0 0 2h16a1 1 0 1 0 0-2H4Z" />
      </svg>
    ),
    handler: "onImportReviews",
  },
  {
    key: "widget",
    kind: "link",
    href: "/app/widget",
    label: "Customize Widget",
    description: "Adjust the look and feel of your review widget",
    accent: "#fdf0e0",
    iconColor: "#c17d28",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="22" height="22">
        <path d="M12 3a1 1 0 0 1 .707.293l8 8a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-8-8a1 1 0 0 1 0-1.414l8-8A1 1 0 0 1 12 3Zm0 2.414L5.414 12 12 18.586 18.586 12 12 5.414ZM12 9a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0v-4a1 1 0 0 1 1-1Zm0 7a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
      </svg>
    ),
  },
  {
    key: "reviews",
    kind: "link",
    href: "/app/reviews",
    label: "Manage Reviews",
    description: "Approve, reject, or delete customer reviews",
    accent: "#e6f4ea",
    iconColor: "#2d7a3f",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="22" height="22">
        <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
      </svg>
    ),
  },
];

const chevron = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
  </svg>
);

function CardInner({ action, hovered }: { action: ActionConfig; hovered: boolean }) {
  return (
    <>
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "10px",
          background: action.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: action.iconColor,
          flexShrink: 0,
        }}
      >
        {action.icon}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "8px" }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: "14px", color: "#1a1a1a", marginBottom: "4px", lineHeight: 1.3 }}>
            {action.label}
          </div>
          <div style={{ fontSize: "13px", color: "#6d7175", lineHeight: 1.4 }}>
            {action.description}
          </div>
        </div>
        <span style={{ color: hovered ? "#1a1a1a" : "#8c9196", flexShrink: 0, marginBottom: "2px", transition: "color 0.18s ease" }}>{chevron}</span>
      </div>
    </>
  );
}

const cardStyle = (hovered: boolean): React.CSSProperties => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: "20px",
  background: "#fff",
  border: `1px solid ${hovered ? "#c9cccf" : "#e1e3e5"}`,
  borderRadius: "12px",
  cursor: "pointer",
  textAlign: "left",
  width: "100%",
  gap: "20px",
  boxShadow: hovered ? "0 4px 12px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.04)",
  transform: hovered ? "translateY(-1px)" : "translateY(0)",
  transition: "box-shadow 0.18s ease, border-color 0.18s ease, transform 0.18s ease",
  textDecoration: "none",
});

function ActionCard({
  action,
  onClick,
}: {
  action: ActionConfig;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  if (action.kind === "link") {
    return (
      <Link
        to={action.href}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={cardStyle(hovered)}
      >
        <CardInner action={action} hovered={hovered} />
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={cardStyle(hovered)}
    >
      <CardInner action={action} hovered={hovered} />
    </button>
  );
}

export function QuickActions({ onImportReviews }: QuickActionsProps) {
  const handlers = { onImportReviews };

  return (
    <s-section heading="Quick Actions">
      <s-grid gridTemplateColumns="repeat(3, 1fr)" gap="base">
        {actions.map((action) => (
          <ActionCard
            key={action.key}
            action={action}
            onClick={action.kind === "button" ? handlers[action.handler] : undefined}
          />
        ))}
      </s-grid>
    </s-section>
  );
}
