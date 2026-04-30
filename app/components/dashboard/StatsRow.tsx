import { Link } from "react-router";
import { Stars } from "../Stars";

interface DashboardStats {
  totalReviews: number;
  averageRating: number;
  publishedReviews: number;
  pendingReviews: number;
}

interface StatsRowProps {
  stats: DashboardStats;
}

export function StatsRow({ stats }: StatsRowProps) {
  const simpleCards = [
    {
      label: "Total Reviews",
      value: stats.totalReviews > 0 ? stats.totalReviews.toLocaleString() : "—",
      sub: "All time",
    },
    {
      label: "Published Reviews",
      value: stats.publishedReviews > 0 ? stats.publishedReviews.toLocaleString() : "—",
      sub: "Live on storefront",
    },
  ];

  return (
    <s-grid gridTemplateColumns="repeat(4, 1fr)" gap="base">
      {simpleCards.map((card) => (
        <s-section key={card.label}>
          <s-stack gap="small-200">
            <s-text color="subdued">{card.label}</s-text>
            <s-heading>{card.value}</s-heading>
            <s-text color="subdued">{card.sub}</s-text>
          </s-stack>
        </s-section>
      ))}

      <s-section>
        <s-stack gap="small-200">
          <s-text color="subdued">Average Rating</s-text>
          {stats.totalReviews > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <s-heading>{stats.averageRating.toFixed(1)}</s-heading>
              <Stars n={Math.round(stats.averageRating)} size={16} color="#f59e0b" />
            </div>
          ) : (
            <s-heading>—</s-heading>
          )}
          <s-text color="subdued">Out of 5.0</s-text>
        </s-stack>
      </s-section>

      <s-section>
        <Link
          to="/app/reviews?status=pending"
          style={{ textDecoration: "none", color: "inherit", display: "block" }}
        >
          <s-stack gap="small-200">
            <s-text color="subdued">Pending Reviews</s-text>
            <s-heading>
              {stats.pendingReviews > 0 ? stats.pendingReviews.toLocaleString() : "—"}
            </s-heading>
            <s-text color="subdued">Awaiting moderation</s-text>
          </s-stack>
        </Link>
      </s-section>
    </s-grid>
  );
}
