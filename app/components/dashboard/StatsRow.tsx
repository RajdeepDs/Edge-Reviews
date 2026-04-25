import { Link } from "react-router";
import type { DashboardStats } from "../../data/mockData";

interface StatsRowProps {
  stats: DashboardStats;
}

export function StatsRow({ stats }: StatsRowProps) {
  const cards = [
    {
      label: "Total Reviews",
      value: stats.totalReviews > 0 ? stats.totalReviews.toLocaleString() : "—",
      sub: "All time",
    },
    {
      label: "Average Rating",
      value: stats.totalReviews > 0 ? `${stats.averageRating.toFixed(1)} ★` : "—",
      sub: "Out of 5.0",
    },
    {
      label: "Requests Sent",
      value: stats.requestsSent > 0 ? stats.requestsSent.toLocaleString() : "—",
      sub: "This month",
    },
  ];

  return (
    <s-grid gridTemplateColumns="repeat(4, 1fr)" gap="base">
      {cards.map((card) => (
        <s-section key={card.label}>
          <s-stack gap="small-200">
            <s-text color="subdued">{card.label}</s-text>
            <s-heading>{card.value}</s-heading>
            <s-text color="subdued">{card.sub}</s-text>
          </s-stack>
        </s-section>
      ))}
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
