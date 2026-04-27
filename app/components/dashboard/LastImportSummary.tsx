import { Link } from "react-router";

interface LastImport {
  date: string;
  totalRows: number;
  succeeded: number;
  failed: number;
  importId: string;
}

interface LastImportSummaryProps {
  lastImport: LastImport | null;
  onImportReviews: () => void;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function insightMessage(failed: number, total: number) {
  const rate = total > 0 ? (1 - failed / total) * 100 : 100;
  if (failed === 0) return { text: "All rows imported without any issues.", tone: "success" as const };
  if (rate >= 95) return { text: `${failed} rows failed — usually caused by missing fields or duplicate review IDs.`, tone: "warning" as const };
  if (rate >= 80) return { text: `${failed} rows failed. Check that your CSV has valid emails and review text in each row.`, tone: "warning" as const };
  return { text: `${failed} rows failed. Your CSV may have structural issues — re-export and try again.`, tone: "critical" as const };
}

const uploadIcon = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="32" height="32" stroke="#8c9196" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
  </svg>
);

const chevronRight = (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
  </svg>
);

const DOT_COLORS: Record<"neutral" | "success" | "critical", string> = {
  neutral: "#8c9196",
  success: "#2d7a3f",
  critical: "#b52b27",
};

function StatRow({
  variant,
  label,
  value,
}: {
  variant: "neutral" | "success" | "critical";
  label: string;
  value: number;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: DOT_COLORS[variant],
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <s-text color="base">{label}</s-text>
      </div>
      <s-heading>{value.toLocaleString()}</s-heading>
    </div>
  );
}

function ProgressBar({ rate }: { rate: number }) {
  const barColor = rate === 100 ? "#2d7a3f" : rate >= 90 ? "#b08000" : "#b52b27";
  const textColor = barColor;
  return (
    <s-stack gap="small-200">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <s-text color="base">Success rate</s-text>
        <s-heading style={{ color: textColor }}>{rate.toFixed(1)}%</s-heading>
      </div>
      <div style={{ height: "6px", borderRadius: "99px", background: "#f1f1f1", overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${rate}%`,
            borderRadius: "99px",
            background: barColor,
          }}
        />
      </div>
    </s-stack>
  );
}

const INSIGHT_STYLE: Record<"success" | "warning" | "critical", { bg: string; color: string }> = {
  success:  { bg: "#e6f4ea", color: "#2d7a3f" },
  warning:  { bg: "#fef9e7", color: "#7d5a00" },
  critical: { bg: "#fce8e6", color: "#b52b27" },
};

export function LastImportSummary({ lastImport, onImportReviews }: LastImportSummaryProps) {
  if (!lastImport) {
    return (
      <s-section heading="Last Import">
        <s-stack gap="base" alignItems="center" padding="base">
          <div
            style={{
              width: "60px",
              height: "60px",
              borderRadius: "14px",
              background: "#f6f6f7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {uploadIcon}
          </div>
          <s-stack gap="small-200" alignItems="center">
            <s-heading>No imports yet</s-heading>
            <s-text color="subdued">Import your first CSV to get started</s-text>
          </s-stack>
          <s-button variant="primary" onClick={onImportReviews}>
            Import reviews
          </s-button>
        </s-stack>
      </s-section>
    );
  }

  const successRate = lastImport.totalRows > 0
    ? (lastImport.succeeded / lastImport.totalRows) * 100
    : 100;
  const insight = insightMessage(lastImport.failed, lastImport.totalRows);
  const ic = INSIGHT_STYLE[insight.tone];

  return (
    <s-section heading="Last Import">
      <s-stack gap="base">

        {/* When */}
        <s-stack direction="inline" gap="small-200" alignItems="center">
          <s-text color="base">{timeAgo(lastImport.date)}</s-text>
          <s-text color="subdued">· {formatDate(lastImport.date)}</s-text>
        </s-stack>

        <s-divider />

        {/* Vertical stat rows */}
        <s-stack gap="small-400">
          <StatRow variant="neutral"  label="Total rows"  value={lastImport.totalRows} />
          <StatRow variant="success"  label="Succeeded"   value={lastImport.succeeded} />
          <StatRow variant="critical" label="Failed"      value={lastImport.failed} />
        </s-stack>

        <s-divider />

        {/* Progress + insight */}
        <s-stack gap="small-300">
          <ProgressBar rate={successRate} />
          <div style={{ background: ic.bg, borderRadius: "8px", padding: "10px 12px" }}>
            <s-text style={{ color: ic.color }}>{insight.text}</s-text>
          </div>
        </s-stack>

        <s-divider />

        {/* Footer */}
        <Link
          to={`/app/reviews?source=${lastImport.importId}`}
          style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#005bd3", textDecoration: "none" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = "none")}
        >
          <s-text style={{ color: "inherit" }}>View imported reviews</s-text>
          {chevronRight}
        </Link>

      </s-stack>
    </s-section>
  );
}
