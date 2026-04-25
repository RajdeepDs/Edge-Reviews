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
import {
  mockStats,
  mockTopProducts,
  mockLastImport,
} from "../data/mockData";
import { OfferBanner } from "app/components/offer-banner";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return { shop: session.shop };
};

export default function Index() {
  const { shop } = useLoaderData<typeof loader>();
  const shopify = useAppBridge();

  const [setupDismissed, setSetupDismissed] = useState(false);
  const [embedActivated, setEmbedActivated] = useState(false);
  const [reviewsImported, setReviewsImported] = useState(false);
  const [reviewConfirmedWorking, setReviewConfirmedWorking] = useState(false);

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

        <StatsRow stats={mockStats} />

        <QuickActions
          onImportReviews={handleImportReviews}
          onCustomizeWidget={handleCustomizeWidget}
          onSendReviewRequest={handleSendReviewRequest}
        />

        <s-grid gridTemplateColumns="3fr 2fr" gap="base">
          <TopRatedProducts products={mockTopProducts} />
          <LastImportSummary lastImport={mockLastImport} onImportReviews={handleImportReviews} />
        </s-grid>
      </s-stack>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
