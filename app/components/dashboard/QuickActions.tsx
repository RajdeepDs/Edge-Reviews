import { useState } from "react";

interface QuickActionsProps {
  onImportReviews: () => void;
  onCustomizeWidget: () => void;
  onSendReviewRequest: () => void;
}

const actions = [
  {
    key: "import",
    label: "Import Reviews",
    description: "Bring in reviews from other platforms",
    accent: "#e8f0fe",
    iconColor: "#3c6fcd",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="22" height="22">
        <path d="M12 2a1 1 0 0 1 1 1v10.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L11 13.586V3a1 1 0 0 1 1-1ZM4 19a1 1 0 1 0 0 2h16a1 1 0 1 0 0-2H4Z" />
      </svg>
    ),
    handler: "onImportReviews" as const,
  },
  {
    key: "widget",
    label: "Customize Widget",
    description: "Adjust the look and feel of your review widget",
    accent: "#fdf0e0",
    iconColor: "#c17d28",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="22" height="22">
        <path d="M12 3a1 1 0 0 1 .707.293l8 8a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-8-8a1 1 0 0 1 0-1.414l8-8A1 1 0 0 1 12 3Zm0 2.414L5.414 12 12 18.586 18.586 12 12 5.414ZM12 9a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0v-4a1 1 0 0 1 1-1Zm0 7a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z" />
      </svg>
    ),
    handler: "onCustomizeWidget" as const,
  },
  {
    key: "request",
    label: "Send Review Request",
    description: "Email customers and ask for a review",
    accent: "#e6f4ea",
    iconColor: "#2d7a3f",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="22" height="22">
        <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 2-8 5-8-5h16Zm0 12H4V8.92l7.555 4.722a1 1 0 0 0 1.09 0L20 8.92V18Z" />
      </svg>
    ),
    handler: "onSendReviewRequest" as const,
  },
];

const chevron = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
  </svg>
);

function ActionCard({
  action,
  onClick,
}: {
  action: (typeof actions)[number];
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
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
      }}
    >
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
        <span style={{ color: "#8c9196", flexShrink: 0, marginBottom: "2px" }}>{chevron}</span>
      </div>
    </button>
  );
}

export function QuickActions({
  onImportReviews,
  onCustomizeWidget,
  onSendReviewRequest,
}: QuickActionsProps) {
  const handlers = { onImportReviews, onCustomizeWidget, onSendReviewRequest };

  return (
    <s-section heading="Quick Actions">
      <s-grid gridTemplateColumns="repeat(3, 1fr)" gap="base">
        {actions.map((action) => (
          <ActionCard key={action.key} action={action} onClick={handlers[action.handler]} />
        ))}
      </s-grid>
    </s-section>
  );
}
