import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useState } from "react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { ReviewsTable } from "app/components/reviews/reviews-table";
import { mockAllReviews } from "../data/mockData";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

const pendingCount = mockAllReviews.filter((r) => r.status === "pending").length;

export default function ReviewsPage() {
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <s-page heading="Reviews" inlineSize="large">
      {!bannerDismissed && (
        <s-banner
          heading={`247 reviews imported — ${pendingCount} pending approval`}
          tone="warning"
          onDismiss={() => setBannerDismissed(true)}
        >
          These reviews were imported from your previous platform and are
          awaiting moderation. Approve them to make them visible on your
          storefront, or reject any that don&apos;t meet your guidelines.
          <s-button
            slot="secondary-actions"
            variant="secondary"
            onClick={() => console.log("Todo: approve all pending")}
          >
            Approve all
          </s-button>
          <s-button
            slot="secondary-actions"
            variant="secondary"
            onClick={() => setBannerDismissed(true)}
          >
            Dismiss
          </s-button>
        </s-banner>
      )}
      <ReviewsTable />
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
