import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Link, useLoaderData } from "react-router";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AnalyticsFilterBar } from "../components/dashboard/AnalyticsFilterBar";
import { StatsRow } from "../components/dashboard/StatsRow";
import { ImportReviewsModal } from "../components/reviews/import-reviews-modal";
import prisma from "../db.server";
import { getShopPlan } from "../utils/plans.server";
import { UpgradeGate } from "../components/UpgradeGate";

const RATING_COLORS: Record<number, string> = {
  5: "#16a34a",
  4: "#4ade80",
  3: "#EF9F27",
  2: "#ef4444",
  1: "#b91c1c",
};

function parseDateRange(url: URL): { fromDate: Date; toDate: Date } {
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const toDate = to ? new Date(to + "T23:59:59.999Z") : new Date();
  const fromDate = from
    ? new Date(from + "T00:00:00.000Z")
    : new Date("2000-01-01T00:00:00.000Z");
  return { fromDate, toDate };
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin, billing } = await authenticate.admin(request);
  const { shop } = session;

  const shopPlan = await getShopPlan(billing);
  if (shopPlan === "free") {
    return { plan: "free" as const, isLocked: true as const };
  }

  const { fromDate, toDate } = parseDateRange(new URL(request.url));
  const dateFilter = { gte: fromDate, lte: toDate };

  const [
    totalReviewsAllTime,
    avgRatingAllTime,
    pendingCount,
    publishedCount,
    ratingDistributionRaw,
    monthlyRaw,
    topProductsRaw,
    importHistory,
    productsRes,
  ] = await Promise.all([
    // All-time counts — used for KPI cards and empty-state gating
    prisma.review.count({ where: { shop } }),
    prisma.review.aggregate({ where: { shop }, _avg: { rating: true } }),

    // Pending is always across all time — it's a moderation queue
    prisma.review.count({ where: { shop, status: "pending" } }),
    prisma.review.count({ where: { shop, status: "published" } }),

    // Date-filtered charts
    prisma.review.groupBy({
      by: ["rating"],
      where: { shop, createdAt: dateFilter },
      _count: { id: true },
      orderBy: { rating: "desc" },
    }),

    prisma.$queryRaw<Array<{ month: string; count: bigint }>>`
      SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon YYYY') AS month,
             COUNT(*) AS count
      FROM "Review"
      WHERE shop = ${shop}
        AND "createdAt" >= ${fromDate}
        AND "createdAt" <= ${toDate}
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt") ASC
    `,

    // Top products is an all-time leaderboard, not time-series
    prisma.review.groupBy({
      by: ["productTitle"],
      where: { shop },
      _avg: { rating: true },
      _count: { id: true },
      orderBy: { _avg: { rating: "desc" } },
      take: 5,
    }),

    prisma.importRecord.findMany({
      where: { shop },
      orderBy: { createdAt: "desc" },
    }),

    admin.graphql(`#graphql
      query { products(first: 250) { nodes { id title featuredImage { url } } } }
    `),
  ]);

  const { data } = await productsRes.json();
  const products = (
    data?.products?.nodes as Array<{
      id: string; title: string; featuredImage: { url: string } | null;
    }> ?? []
  ).map((p) => ({ id: p.id, title: p.title, imageUrl: p.featuredImage?.url ?? null }));

  const stats = {
    totalReviews: totalReviewsAllTime,
    averageRating: avgRatingAllTime._avg.rating ?? 0,
    publishedReviews: publishedCount,
    pendingReviews: pendingCount,
  };

  const ratingMap = new Map(
    ratingDistributionRaw.map((r) => [r.rating, r._count.id]),
  );
  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: ratingMap.get(stars) ?? 0,
    color: RATING_COLORS[stars],
  }));

  const monthlyReviews = monthlyRaw.map((r) => ({
    month: r.month,
    count: Number(r.count),
  }));

  const topProducts = topProductsRaw.map((p, i) => ({
    id: i + 1,
    name: p.productTitle,
    emoji: "📦",
    avgRating: p._avg.rating ?? 0,
    reviewCount: p._count.id,
  }));

  const importHistoryData = importHistory.map((r) => ({
    id: r.id,
    date: r.createdAt.toISOString(),
    filename: r.filename,
    totalRows: r.totalRows,
    succeeded: r.succeeded,
    failed: r.failed,
    status: r.status as "completed" | "partial" | "failed",
  }));

  return {
    plan: shopPlan,
    isLocked: false as const,
    stats,
    totalReviewsAllTime,
    ratingDistribution,
    monthlyReviews,
    topProducts,
    importHistory: importHistoryData,
    products,
  };
};

export default function AnalyticsPage() {
  const loaderData = useLoaderData<typeof loader>();
  const [importOpen, setImportOpen] = useState(false);

  if (loaderData.isLocked) {
    return (
      <s-page heading="Analytics" inlineSize="base">
        <UpgradeGate
          feature="Analytics"
          description="Get insights into your review performance, rating trends, monthly volume, and top-rated products."
          requiredPlan="basic"
          currentPlan={loaderData.plan}
        />
      </s-page>
    );
  }

  const { stats, totalReviewsAllTime, ratingDistribution, monthlyReviews, topProducts, importHistory, products } = loaderData;

  const hasReviewData = totalReviewsAllTime > 0;
  const hasImportHistory = importHistory.length > 0;

  const maxMonthlyCount = Math.max(...monthlyReviews.map((m) => m.count), 1);
  const totalRatings = ratingDistribution.reduce((s, r) => s + r.count, 0);

  return (
    <s-page heading="Analytics" inlineSize="base">
      <s-stack gap="large">

        <AnalyticsFilterBar />

        {stats.pendingReviews > 0 && (
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
                  {stats.pendingReviews} reviews pending approval
                </div>
                <div style={{ fontSize: "13px", color: "#7d5a00", marginTop: "2px" }}>
                  These won&apos;t appear on your storefront until you approve them.
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

        <StatsRow stats={stats} />

        {hasReviewData ? (
          <>
            <s-grid gridTemplateColumns="2fr 1fr" gap="base">

              {/* Monthly review trend */}
              <s-section heading="Reviews Over Time">
                <s-stack gap="base">
                  <s-text color="subdued">Monthly review volume for the selected period.</s-text>
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

              {/* Rating distribution */}
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
                              width: `${totalRatings > 0 ? (count / totalRatings) * 100 : 0}%`,
                              height: "100%",
                              background: color,
                              borderRadius: "4px",
                              transition: "width 0.3s ease",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: "12px", color: "#6d7175", width: "36px", textAlign: "right", flexShrink: 0 }}>
                          {totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0}%
                        </span>
                      </div>
                    </Link>
                  ))}
                </s-stack>
              </s-section>

            </s-grid>

            {/* Top products */}
            <s-section heading="Top Rated Products" padding="base">
              <div style={{ border: "1px solid #eaeaea", borderRadius: "8px", overflow: "clip" }}>
                <s-table>
                  <s-table-header-row>
                    <s-table-header>Product</s-table-header>
                    <s-table-header format="numeric">Reviews</s-table-header>
                    <s-table-header format="numeric">Avg Rating</s-table-header>
                  </s-table-header-row>
                  <s-table-body>
                    {topProducts.map((product) => (
                      <s-table-row key={product.id}>
                        <s-table-cell>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                            <span>{product.emoji}</span>
                            <span>{product.name}</span>
                          </span>
                        </s-table-cell>
                        <s-table-cell>{product.reviewCount}</s-table-cell>
                        <s-table-cell>{product.avgRating.toFixed(1)} ★</s-table-cell>
                      </s-table-row>
                    ))}
                  </s-table-body>
                </s-table>
              </div>
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
              <button
                onClick={() => setImportOpen(true)}
                style={{ padding: "8px 20px", background: "#1a1a1a", color: "#fff", borderRadius: "8px", fontSize: "13px", fontWeight: 600, border: "none", cursor: "pointer" }}
              >
                Import reviews
              </button>
            </div>
          </s-section>
        )}

        {/* Import History */}
        <s-section heading="Import History" padding="base">
          {hasImportHistory ? (
            <div style={{ border: "1px solid #eaeaea", borderRadius: "8px", overflow: "clip" }}>
              <s-table>
                <s-table-header-row>
                  <s-table-header>Date</s-table-header>
                  <s-table-header>Filename</s-table-header>
                  <s-table-header format="numeric">Total</s-table-header>
                  <s-table-header format="numeric">Succeeded</s-table-header>
                  <s-table-header format="numeric">Failed</s-table-header>
                  <s-table-header>Status</s-table-header>
                </s-table-header-row>
                <s-table-body>
                  {importHistory.map((row) => {
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
                      <s-table-row key={row.id}>
                        <s-table-cell>{date}</s-table-cell>
                        <s-table-cell>
                          <Link
                            to={`/app/reviews?source=${row.id}`}
                            style={{ color: "#005bd3", textDecoration: "none", fontWeight: 500 }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline")}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.textDecoration = "none")}
                          >
                            {row.filename}
                          </Link>
                        </s-table-cell>
                        <s-table-cell>{row.totalRows.toLocaleString()}</s-table-cell>
                        <s-table-cell>{row.succeeded.toLocaleString()}</s-table-cell>
                        <s-table-cell>{row.failed.toLocaleString()}</s-table-cell>
                        <s-table-cell>
                          <span style={{ display: "inline-block", fontSize: "11px", fontWeight: 600, padding: "2px 10px", borderRadius: "20px", background: s.bg, color: s.color }}>
                            {s.label}
                          </span>
                        </s-table-cell>
                      </s-table-row>
                    );
                  })}
                </s-table-body>
              </s-table>
            </div>
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

      <ImportReviewsModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        products={products}
      />
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
