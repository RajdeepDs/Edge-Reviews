import type { FunnelStep } from "../../data/mockData";

interface RequestFunnelProps {
  steps: FunnelStep[];
}

export function RequestFunnel({ steps }: RequestFunnelProps) {
  const maxCount = steps[0]?.count ?? 1;

  return (
    <s-section heading="Request Funnel">
      <s-stack gap="small-400">
        {steps.map((step) => {
          const pct = Math.round((step.count / maxCount) * 100);
          return (
            <s-stack key={step.label} gap="small-200">
              <s-grid gridTemplateColumns="1fr auto" alignItems="center">
                <s-text color="base">{step.label}</s-text>
                <s-stack direction="inline" gap="small-200" alignItems="center">
                  <s-text color="base">{step.count}</s-text>
                  <s-text color="subdued">({pct}%)</s-text>
                </s-stack>
              </s-grid>
              <div
                style={{
                  height: "8px",
                  borderRadius: "4px",
                  backgroundColor: "#f1f5f9",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    backgroundColor: step.color,
                    borderRadius: "4px",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </s-stack>
          );
        })}
      </s-stack>
    </s-section>
  );
}
