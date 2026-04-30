import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { ProductsList } from "../components/products/products-list";
import prisma from "../db.server";

const PRODUCTS_QUERY = `#graphql
  query GetProducts($first: Int!) {
    products(first: $first) {
      nodes {
        id
        title
        vendor
        productType
        status
        totalInventory
        featuredImage {
          url
          altText
        }
        priceRangeV2 {
          minVariantPrice {
            amount
            currencyCode
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
` as const;

export type ProductWithStats = {
  id: string;
  name: string;
  initials: string;
  imageUrl: string | null;
  status: "active" | "draft" | "archived";
  inventory: number;
  type: string;
  price: string;
  vendor: string;
  reviewCount: number;
  pendingCount: number;
  avgRating: number;
  lastReview: string | null;
};

function getInitials(title: string): string {
  const words = title.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function formatPrice(amount: string, currencyCode: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
    }).format(parseFloat(amount));
  } catch {
    return `${amount} ${currencyCode}`;
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const { shop } = session;

  const response = await admin.graphql(PRODUCTS_QUERY, {
    variables: { first: 250 },
  });

  const { data } = await response.json();
  const shopifyProducts: Array<{
    id: string;
    title: string;
    vendor: string;
    productType: string;
    status: string;
    totalInventory: number | null;
    featuredImage: { url: string; altText: string | null } | null;
    priceRangeV2: {
      minVariantPrice: { amount: string; currencyCode: string };
    } | null;
  }> = data?.products?.nodes ?? [];

  const productIds = shopifyProducts.map((p) => p.id);

  const [reviewStats, pendingStats] = await Promise.all([
    prisma.review.groupBy({
      by: ["shopifyProductId"],
      where: { shop, shopifyProductId: { in: productIds } },
      _count: { id: true },
      _avg: { rating: true },
      _max: { createdAt: true },
    }),
    prisma.review.groupBy({
      by: ["shopifyProductId"],
      where: { shop, shopifyProductId: { in: productIds }, status: "pending" },
      _count: { id: true },
    }),
  ]);

  const statsMap = new Map(reviewStats.map((s) => [s.shopifyProductId, s]));
  const pendingMap = new Map(
    pendingStats.map((s) => [s.shopifyProductId, s._count.id]),
  );

  const products: ProductWithStats[] = shopifyProducts.map((p) => {
    const stats = statsMap.get(p.id);
    const price = p.priceRangeV2?.minVariantPrice;
    return {
      id: p.id,
      name: p.title,
      initials: getInitials(p.title),
      imageUrl: p.featuredImage?.url ?? null,
      status: p.status.toLowerCase() as ProductWithStats["status"],
      inventory: p.totalInventory ?? 0,
      type: p.productType ?? "",
      price: price ? formatPrice(price.amount, price.currencyCode) : "—",
      vendor: p.vendor ?? "",
      reviewCount: stats?._count.id ?? 0,
      pendingCount: pendingMap.get(p.id) ?? 0,
      avgRating: stats?._avg.rating ?? 0,
      lastReview: stats?._max.createdAt
        ? new Date(stats._max.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : null,
    };
  });

  return { products };
};

export default function ProductsPage() {
  const { products } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Products" inlineSize="base">
      <ProductsList products={products} />
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
