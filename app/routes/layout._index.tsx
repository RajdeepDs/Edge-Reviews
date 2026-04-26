import { useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { SetupGuideCard } from "../components/SetupGuideCard";
import { StatsRow } from "../components/dashboard/StatsRow";
import { QuickActions } from "../components/dashboard/QuickActions";
import { TopRatedProducts } from "../components/dashboard/TopRatedProducts";
import { LastImportSummary } from "../components/dashboard/LastImportSummary";
import { OfferBanner } from "app/components/offer-banner";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  const [totalReviews, ratingAgg, pendingCount, topProductsRaw, lastImportRaw, shopSettings] =
    await Promise.all([
      prisma.review.count({ where: { shop } }),
      prisma.review.aggregate({ where: { shop }, _avg: { rating: true } }),
      prisma.review.count({ where: { shop, status: "pending" } }),
      prisma.review.groupBy({
        by: ["productTitle"],
        where: { shop },
        _avg: { rating: true },
        _count: { rating: true },
        orderBy: { _avg: { rating: "desc" } },
        take: 5,
      }),
      prisma.importRecord.findFirst({
        where: { shop },
        orderBy: { createdAt: "desc" },
      }),
      prisma.shopSettings.findUnique({ where: { shop } }),
    ]);

  const stats = {
    totalReviews,
    averageRating: ratingAgg._avg.rating ?? 0,
    requestsSent: 0,
    conversionRate: 0,
    pendingReviews: pendingCount,
  };

  const topProducts = topProductsRaw.map((p, i) => ({
    id: i + 1,
    name: p.productTitle,
    emoji: "📦",
    avgRating: p._avg.rating ?? 0,
    reviewCount: p._count.rating,
  }));

  const lastImport = lastImportRaw
    ? {
        date: lastImportRaw.createdAt.toISOString(),
        totalRows: lastImportRaw.totalRows,
        succeeded: lastImportRaw.succeeded,
        failed: lastImportRaw.failed,
        importId: lastImportRaw.id,
      }
    : null;

  return {
    shop,
    stats,
    topProducts,
    lastImport,
    setupState: {
      embedActivated: shopSettings?.embedActivated ?? false,
      reviewsImported: shopSettings?.reviewsImported ?? false,
      confirmedWorking: shopSettings?.confirmedWorking ?? false,
    },
  };
};

export default function Index() {
  const { shop, stats, topProducts, lastImport, setupState } =
    useLoaderData<typeof loader>();
  const shopify = useAppBridge();

  const [setupDismissed, setSetupDismissed] = useState(false);
  const [embedActivated, setEmbedActivated] = useState(setupState.embedActivated);
  const [reviewsImported, setReviewsImported] = useState(setupState.reviewsImported);
  const [reviewConfirmedWorking, setReviewConfirmedWorking] = useState(
    setupState.confirmedWorking,
  );

  const handleOpenThemeSettings = () => {
    window.open(
      `https://${shop}/admin/themes/current/editor?context=apps`,
      "_blank",
    );
  };

  const handleSendReviewRequest = () => {
    shopify.toast.show("Send Review Request — coming soon!");
  };

  const handleImportReviews = () => {
    shopify.toast.show("Import Reviews — coming soon!");
  };

  const handleCustomizeWidget = () => {
    shopify.toast.show("Customize Widget — coming soon!");
  };

  return (
    <s-page heading="Edge Reviews">
      <s-button icon="import" slot="primary-action">
        Import reviews
      </s-button>
      <OfferBanner />
      <s-stack gap="large">
        {!setupDismissed && (
          <SetupGuideCard
            embedActivated={embedActivated}
            reviewsImported={reviewsImported}
            reviewConfirmedWorking={reviewConfirmedWorking}
            onDismiss={() => setSetupDismissed(true)}
            onOpenThemeSettings={handleOpenThemeSettings}
            onMarkEmbedDone={() => setEmbedActivated(true)}
            onImportReviews={() => setReviewsImported(true)}
            onMarkConfirmedWorking={() => setReviewConfirmedWorking(true)}
          />
        )}

        <StatsRow stats={stats} />

        <QuickActions
          onImportReviews={handleImportReviews}
          onCustomizeWidget={handleCustomizeWidget}
          onSendReviewRequest={handleSendReviewRequest}
        />

        <s-grid gridTemplateColumns="3fr 2fr" gap="base">
          <TopRatedProducts products={topProducts} />
          <LastImportSummary
            lastImport={lastImport}
            onImportReviews={handleImportReviews}
          />
        </s-grid>
      </s-stack>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
