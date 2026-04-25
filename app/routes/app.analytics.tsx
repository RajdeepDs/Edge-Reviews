import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { mockStats, mockFunnelSteps, mockTopProducts } from "../data/mockData";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

const ratingDistribution = [
  { stars: 5, count: 142, color: "#16a34a" },
  { stars: 4, count: 67, color: "#65a30d" },
  { stars: 3, count: 23, color: "#ca8a04" },
  { stars: 2, count: 10, color: "#ea580c" },
  { stars: 1, count: 5, color: "#dc2626" },
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

export default function AnalyticsPage() {
  return (
    <s-page heading="Analytics" inlineSize="base">
      <s-stack gap="large">

        {/* ── Overview stats ── */}
        <s-section heading="Overview">
          <s-grid gridTemplateColumns="repeat(4, 1fr)" gap="base">
            {[
              { label: "Total Reviews", value: mockStats.totalReviews, suffix: "" },
              { label: "Average Rating", value: mockStats.averageRating.toFixed(1), suffix: "/ 5" },
              { label: "Requests Sent", value: mockStats.requestsSent, suffix: "" },
              { label: "Conversion Rate", value: `${mockStats.conversionRate}%`, suffix: "" },
            ].map(({ label, value, suffix }) => (
              <s-stack key={label} gap="small-100">
                <s-text color="subdued">{label}</s-text>
                <s-stack direction="inline" gap="small-200" alignItems="baseline">
                  <span style={{ fontSize: "28px", fontWeight: 700, lineHeight: 1 }}>
                    {value}
                  </span>
                  {suffix && <s-text color="subdued">{suffix}</s-text>}
                </s-stack>
              </s-stack>
            ))}
          </s-grid>
        </s-section>

        <s-grid gridTemplateColumns="2fr 1fr" gap="base">

          {/* ── Monthly review trend ── */}
          <s-section heading="Reviews Over Time">
            <s-stack gap="base">
              <s-text color="subdued">Monthly review volume for the last 6 months.</s-text>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "12px",
                  height: "140px",
                  paddingTop: "8px",
                }}
              >
                {monthlyReviews.map(({ month, count }) => (
                  <div
                    key={month}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      height: "100%",
                      justifyContent: "flex-end",
                    }}
                  >
                    <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 500 }}>
                      {count}
                    </span>
                    <div
                      style={{
                        width: "100%",
                        background: "#6366f1",
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
                <s-stack key={stars} direction="inline" gap="small-300" alignItems="center">
                  <s-text color="subdued" style={{ width: "48px", flexShrink: 0 }}>
                    {stars}★
                  </s-text>
                  <div
                    style={{
                      flex: 1,
                      height: "8px",
                      background: "#f3f4f6",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
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
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#6b7280",
                      width: "40px",
                      textAlign: "right",
                      flexShrink: 0,
                    }}
                  >
                    {Math.round((count / totalRatings) * 100)}%
                  </span>
                </s-stack>
              ))}
            </s-stack>
          </s-section>

        </s-grid>

        <s-grid gridTemplateColumns="1fr 1fr" gap="base">

          {/* ── Request funnel ── */}
          <s-section heading="Request Funnel">
            <s-stack gap="small-300">
              <s-text color="subdued">Conversion at each stage of the review request flow.</s-text>
              <s-stack gap="small-200">
                {mockFunnelSteps.map((step, index) => {
                  const pct = index === 0 ? 100 : Math.round((step.count / mockFunnelSteps[0].count) * 100);
                  return (
                    <s-stack key={step.label} gap="small-100">
                      <s-grid gridTemplateColumns="1fr auto" alignItems="center">
                        <s-text>{step.label}</s-text>
                        <s-text color="subdued">{step.count} · {pct}%</s-text>
                      </s-grid>
                      <div
                        style={{
                          height: "8px",
                          background: "#f3f4f6",
                          borderRadius: "4px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: step.color,
                            borderRadius: "4px",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    </s-stack>
                  );
                })}
              </s-stack>
            </s-stack>
          </s-section>

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

        </s-grid>

      </s-stack>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
