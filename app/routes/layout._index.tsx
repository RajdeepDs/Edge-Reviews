import { useState } from "react";
import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { SetupGuideCard } from "../components/SetupGuideCard";
import { StatsRow } from "../components/dashboard/StatsRow";
import { QuickActions } from "../components/dashboard/QuickActions";
import { TopRatedProducts } from "../components/dashboard/TopRatedProducts";
import { LastImportSummary } from "../components/dashboard/LastImportSummary";
import { OfferBanner } from "app/components/offer-banner";
import { ImportReviewsModal } from "app/components/reviews/import-reviews-modal";
import prisma from "../db.server";
import { getShopPlan } from "../utils/plans.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin, billing } = await authenticate.admin(request);
  const { shop } = session;

  const [
    totalReviews, ratingAgg, pendingCount, publishedCount,
    topProductsRaw, lastImportRaw, shopSettings,
    productsRes, plan,
  ] = await Promise.all([
    prisma.review.count({ where: { shop } }),
    prisma.review.aggregate({ where: { shop }, _avg: { rating: true } }),
    prisma.review.count({ where: { shop, status: "pending" } }),
    prisma.review.count({ where: { shop, status: "published" } }),
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
    admin.graphql(`#graphql
      query { products(first: 250) { nodes { id title featuredImage { url } } } }
    `),
    getShopPlan(billing),
  ]);

  const { data } = await productsRes.json();
  const products = (
    data?.products?.nodes as Array<{
      id: string; title: string; featuredImage: { url: string } | null;
    }> ?? []
  ).map((p) => ({ id: p.id, title: p.title, imageUrl: p.featuredImage?.url ?? null }));

  const stats = {
    totalReviews,
    averageRating: ratingAgg._avg.rating ?? 0,
    publishedReviews: publishedCount,
    pendingReviews: pendingCount,
  };

  const topProducts = topProductsRaw.map((p, i) => {
    const match = products.find(
      (prod) => prod.title.toLowerCase() === p.productTitle?.toLowerCase(),
    );
    return {
      id: i + 1,
      name: p.productTitle,
      emoji: "📦",
      imageUrl: match?.imageUrl ?? null,
      avgRating: p._avg.rating ?? 0,
      reviewCount: p._count.rating,
    };
  });

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
    plan,
    stats,
    topProducts,
    lastImport,
    products,
    setupState: {
      embedActivated: shopSettings?.embedActivated ?? false,
      reviewsImported: shopSettings?.reviewsImported ?? false,
      confirmedWorking: shopSettings?.confirmedWorking ?? false,
    },
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "mark-embed-done") {
    await prisma.shopSettings.upsert({
      where: { shop },
      update: { embedActivated: true },
      create: { shop, embedActivated: true },
    });
    return { ok: true };
  }

  if (intent === "mark-reviews-imported") {
    await prisma.shopSettings.upsert({
      where: { shop },
      update: { reviewsImported: true },
      create: { shop, reviewsImported: true },
    });
    return { ok: true };
  }

  if (intent === "mark-confirmed-working") {
    await prisma.shopSettings.upsert({
      where: { shop },
      update: { confirmedWorking: true },
      create: { shop, confirmedWorking: true },
    });
    return { ok: true };
  }

  return { ok: false };
};

export default function Index() {
  const { shop, plan, stats, topProducts, lastImport, products, setupState } =
    useLoaderData<typeof loader>();
  const shopify = useAppBridge();
  const settingsFetcher = useFetcher();

  const [setupDismissed, setSetupDismissed] = useState(false);
  const [embedActivated, setEmbedActivated] = useState(setupState.embedActivated);
  const [reviewsImported, setReviewsImported] = useState(setupState.reviewsImported);
  const [reviewConfirmedWorking, setReviewConfirmedWorking] = useState(
    setupState.confirmedWorking,
  );
  const [importOpen, setImportOpen] = useState(false);

  const handleOpenThemeSettings = () => {
    window.open(
      `https://${shop}/admin/themes/current/editor?context=apps`,
      "_blank",
    );
  };

  const handleMarkEmbedDone = () => {
    setEmbedActivated(true);
    settingsFetcher.submit({ intent: "mark-embed-done" }, { method: "post" });
  };

  const handleMarkImportDone = () => {
    setReviewsImported(true);
    settingsFetcher.submit({ intent: "mark-reviews-imported" }, { method: "post" });
  };

  const handleMarkConfirmedWorking = () => {
    setReviewConfirmedWorking(true);
    settingsFetcher.submit({ intent: "mark-confirmed-working" }, { method: "post" });
  };

  const handleCustomizeWidget = () => {
    shopify.toast.show("Customize Widget — coming soon!");
  };

  return (
    <s-page heading="Edge Reviews">
      <s-button
        icon="import"
        slot="primary-action"
        onClick={() => setImportOpen(true)}
      >
        Import reviews
      </s-button>
      <OfferBanner plan={plan} />
      <s-stack gap="large">
        {!setupDismissed && (
          <SetupGuideCard
            embedActivated={embedActivated}
            reviewsImported={reviewsImported}
            reviewConfirmedWorking={reviewConfirmedWorking}
            onDismiss={() => setSetupDismissed(true)}
            onOpenThemeSettings={handleOpenThemeSettings}
            onMarkEmbedDone={handleMarkEmbedDone}
            onImportReviews={() => setImportOpen(true)}
            onMarkImportDone={handleMarkImportDone}
            onMarkConfirmedWorking={handleMarkConfirmedWorking}
          />
        )}

        <StatsRow stats={stats} />

        <QuickActions
          onImportReviews={() => setImportOpen(true)}
        />

        <s-grid gridTemplateColumns="3fr 2fr" gap="base">
          <TopRatedProducts products={topProducts} />
          <LastImportSummary
            lastImport={lastImport}
            onImportReviews={() => setImportOpen(true)}
          />
        </s-grid>
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
