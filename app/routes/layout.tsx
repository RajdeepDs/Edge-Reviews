import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { authenticate } from "../shopify.server";
import prisma from "../db.server";

type AdminLike = {
  graphql: (query: string) => Promise<{ json: () => Promise<{ data?: unknown }> }>;
};

type MerchantQueryData = {
  shop?: {
    name?: string;
    email?: string;
    primaryDomain?: { url?: string };
    billingAddress?: { firstName?: string | null; lastName?: string | null };
  };
};

async function syncMerchantProfile(shop: string, admin: AdminLike) {
  const existing = await prisma.merchantProfile.findUnique({ where: { shop } });
  if (existing?.ownerEmail && existing?.storeName) return;

  const res = await admin.graphql(`#graphql
    query {
      shop {
        name
        email
        primaryDomain { url }
        billingAddress { firstName lastName }
      }
    }
  `);

  const { data } = (await res.json()) as { data?: MerchantQueryData };
  const shopData = data?.shop;

  const ownerName =
    [shopData?.billingAddress?.firstName, shopData?.billingAddress?.lastName]
      .filter(Boolean)
      .join(" ") || null;
  const ownerEmail = shopData?.email || null;

  await prisma.merchantProfile.upsert({
    where: { shop },
    create: {
      shop,
      ownerName,
      ownerEmail,
      storeName: shopData?.name ?? null,
      storeUrl: shopData?.primaryDomain?.url ?? `https://${shop}`,
    },
    update: {
      ...(ownerName && !existing?.ownerName    ? { ownerName }                        : {}),
      ...(ownerEmail && !existing?.ownerEmail  ? { ownerEmail }                       : {}),
      ...(shopData?.name && !existing?.storeName
        ? { storeName: shopData.name }
        : {}),
      ...(shopData?.primaryDomain?.url && !existing?.storeUrl
        ? { storeUrl: shopData.primaryDomain.url }
        : {}),
    },
  });
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);

  syncMerchantProfile(session.shop, admin).catch((err) => {
    console.error("[MerchantProfile] sync failed", { shop: session.shop, err });
  });

  // eslint-disable-next-line no-undef
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();

  return (
    <AppProvider embedded apiKey={apiKey}>
      <s-app-nav>
        <s-link href="/app/analytics">Analytics</s-link>
        <s-link href="/app/reviews">Reviews</s-link>
        <s-link href="/app/products">Products</s-link>
        <s-link href="/app/widget">Widget</s-link>
        <s-link href="/app/settings">Settings</s-link>
        <s-link href="/app/plans">Plans</s-link>
      </s-app-nav>
      <Outlet />
    </AppProvider>
  );
}

// Shopify needs React Router to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
