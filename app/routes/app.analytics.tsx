import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Link } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { mockStats, mockTopProducts, mockImportHistory } from "../data/mockData";
import { AnalyticsFilterBar } from "../components/dashboard/AnalyticsFilterBar";
import { StatsRow } from "../components/dashboard/StatsRow";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

const ratingDistribution = [
  { stars: 5, count: 142, color: "#16a34a" },
  { stars: 4, count: 67,  color: "#4ade80" },
  { stars: 3, count: 23,  color: "#EF9F27" },
  { stars: 2, count: 10,  color: "#ef4444" },
  { stars: 1, count: 5,   color: "#b91c1c" },
];

const monthlyReviews = [
  { month: "Aug", count: 18 },
  { month: "Sep", count: 24 },
  { month: "Oct", count: 31 },
  { month: "Nov", count: 42 },
  { month: "Dec", count: 38 },
  { month: "Jan", count: 47 },
];

const maxRatingCount = Math.max(...ratingDistribution.map((r) => r.count));
const maxMonthlyCount = Math.max(...monthlyReviews.map((m) => m.count));
const totalRatings = ratingDistribution.reduce((s, r) => s + r.count, 0);

// Toggle to false to preview empty states
const hasReviewData = mockStats.totalReviews > 0;
const hasImportHistory = mockImportHistory.length > 0;

export default function AnalyticsPage() {
  return (
    <s-page heading="Analytics" inlineSize="base">
      <s-stack gap="large">

        <AnalyticsFilterBar />

        {/* ── Pending approval callout ── */}
        {mockStats.pendingReviews > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#fef9e7",
              border: "1px solid #f0c84a",
              borderRadius: "10px",
              padding: "14px 18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "#EF9F27",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="#fff" viewBox="0 0 24 24" width="20" height="20">
                  <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm0 5a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0V8a1 1 0 0 1 1-1Zm0 9.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5Z" />
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "#b45309" }}>
                  {mockStats.pendingReviews} reviews pending approval
                </div>
                <div style={{ fontSize: "13px", color: "#7d5a00", marginTop: "2px" }}>
                  These won't appear on your storefront until you approve them.
                </div>
              </div>
            </div>
            <Link
              to="/app/reviews?status=pending"
              style={{
                padding: "8px 16px",
                background: "#b45309",
                color: "#fff",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              Review now
            </Link>
          </div>
        )}

        <StatsRow stats={mockStats} />

        {hasReviewData ? (
          <>
            <s-grid gridTemplateColumns="2fr 1fr" gap="base">

              {/* ── Monthly review trend ── */}
              <s-section heading="Reviews Over Time">
                <s-stack gap="base">
                  <s-text color="subdued">Monthly review volume for the last 6 months.</s-text>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "12px", height: "140px", paddingTop: "8px" }}>
                    {monthlyReviews.map(({ month, count }) => (
                      <div
                        key={month}
                        style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%", justifyContent: "flex-end" }}
                      >
                        <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 500 }}>{count}</span>
                        <div
                          style={{
                            width: "100%",
                            background: "#EF9F27",
                            borderRadius: "4px 4px 0 0",
                            height: `${(count / maxMonthlyCount) * 100}px`,
                            minHeight: "4px",
                            transition: "height 0.3s ease",
                          }}
                        />
                        <span style={{ fontSize: "12px", color: "#6b7280" }}>{month}</span>
                      </div>
                    ))}
                  </div>
                </s-stack>
              </s-section>

              {/* ── Rating distribution ── */}
              <s-section heading="Rating Breakdown">
                <s-stack gap="small-300">
                  {ratingDistribution.map(({ stars, count, color }) => (
                    <Link
                      key={stars}
                      to={`/app/reviews?rating=${stars}`}
                      style={{ textDecoration: "none", display: "block", borderRadius: "6px" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "#f6f6f7")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.background = "transparent")}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "4px 6px" }}>
                        <span style={{ fontSize: "13px", color: "#6d7175", width: "28px", flexShrink: 0 }}>{stars}★</span>
                        <div style={{ flex: 1, height: "8px", background: "#f3f4f6", borderRadius: "4px", overflow: "hidden" }}>
                          <div
                            style={{
                              width: `${(count / maxRatingCount) * 100}%`,
                              height: "100%",
                              background: color,
                              borderRadius: "4px",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "12px", color: "#6d7175", width: "36px", textAlign: "right", flexShrink: 0 }}>
                          {Math.round((count / totalRatings) * 100)}%
                        </span>
                      </div>
                    </Link>
                  ))}
                </s-stack>
              </s-section>

            </s-grid>

            {/* ── Top products ── */}
            <s-section heading="Top Rated Products">
              <s-stack gap="small-300">
                <s-text color="subdued">Products with the most and highest-rated reviews.</s-text>
                <s-stack gap="small-400">
                  {mockTopProducts.map((product, index) => (
                    <s-stack key={product.id} gap="small-300">
                      {index > 0 && <s-divider />}
                      <s-grid gridTemplateColumns="auto 1fr auto" gap="small-300" alignItems="center">
                        <span style={{ fontSize: "20px", lineHeight: 1 }}>{product.emoji}</span>
                        <s-stack gap="small-100">
                          <s-text>{product.name}</s-text>
                          <s-text color="subdued">{product.reviewCount} reviews</s-text>
                        </s-stack>
                        <s-stack gap="small-100" alignItems="end">
                          <s-text>{product.avgRating.toFixed(1)} ★</s-text>
                        </s-stack>
                      </s-grid>
                    </s-stack>
                  ))}
                </s-stack>
              </s-stack>
            </s-section>
          </>
        ) : (
          <s-section>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", gap: "16px", textAlign: "center" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "16px", background: "#f6f6f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="32" height="32" stroke="#8c9196" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
              </div>
              <s-stack gap="small-200" alignItems="center">
                <s-heading>No analytics yet</s-heading>
                <s-text color="subdued">Import your first reviews to see charts, ratings, and product insights here.</s-text>
              </s-stack>
              <Link
                to="/app"
                style={{ padding: "8px 20px", background: "#1a1a1a", color: "#fff", borderRadius: "8px", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}
              >
                Import reviews
              </Link>
            </div>
          </s-section>
        )}

        {/* ── Import History ── */}
        <s-section heading="Import History">
          {hasImportHistory ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e1e3e5" }}>
                  {["Date", "Filename", "Total", "Succeeded", "Failed", "Status"].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "8px 12px",
                        textAlign: h === "Total" || h === "Succeeded" || h === "Failed" ? "right" : "left",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#6d7175",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockImportHistory.map((row, i) => {
                  const statusStyle: Record<typeof row.status, { bg: string; color: string; label: string }> = {
                    completed: { bg: "#e6f4ea", color: "#2d7a3f", label: "Completed" },
                    partial:   { bg: "#fef9e7", color: "#7d5a00", label: "Partial"   },
                    failed:    { bg: "#fce8e6", color: "#b52b27", label: "Failed"    },
                  };
                  const s = statusStyle[row.status];
                  const date = new Date(row.date).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  });
                  return (
                    <tr key={row.id} style={{ borderBottom: i < mockImportHistory.length - 1 ? "1px solid #f1f1f1" : "none" }}>
                      <td style={{ padding: "12px 12px", fontSize: "13px", color: "#6d7175", whiteSpace: "nowrap" }}>{date}</td>
                      <td style={{ padding: "12px 12px", fontSize: "13px", color: "#1a1a1a", maxWidth: "220px" }}>
                        <Link
                          to={`/app/reviews?source=${row.id}`}
                          style={{ color: "#005bd3", textDecoration: "none", fontWeight: 500 }}
                          onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline")}
                          onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = "none")}
                        >
                          {row.filename}
                        </Link>
                      </td>
                      <td style={{ padding: "12px 12px", fontSize: "13px", color: "#1a1a1a", textAlign: "right", fontWeight: 600 }}>{row.totalRows.toLocaleString()}</td>
                      <td style={{ padding: "12px 12px", fontSize: "13px", color: "#2d7a3f", textAlign: "right", fontWeight: 600 }}>{row.succeeded.toLocaleString()}</td>
                      <td style={{ padding: "12px 12px", fontSize: "13px", color: row.failed > 0 ? "#b52b27" : "#6d7175", textAlign: "right", fontWeight: 600 }}>{row.failed.toLocaleString()}</td>
                      <td style={{ padding: "12px 12px" }}>
                        <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 600, padding: "2px 10px", borderRadius: "20px", background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "36px 24px", gap: "12px", textAlign: "center" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "#f6f6f7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="28" height="28" stroke="#8c9196" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <s-stack gap="small-100" alignItems="center">
                <s-heading>No imports yet</s-heading>
                <s-text color="subdued">Your import history will appear here once you upload a CSV.</s-text>
              </s-stack>
            </div>
          )}
        </s-section>

      </s-stack>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
