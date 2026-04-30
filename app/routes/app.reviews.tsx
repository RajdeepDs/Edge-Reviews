import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useState } from "react";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { ReviewsTable } from "app/components/reviews/reviews-table";
import { ImportReviewsModal } from "app/components/reviews/import-reviews-modal";
import { ExportReviewsModal } from "app/components/reviews/export-reviews-modal";
import prisma from "../db.server";
import { uploadReviewImage } from "../utils/cloudinary.server";

// ── Loader ────────────────────────────────────────────────────────────────────

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const { shop } = session;

  const [reviews, productsRes] = await Promise.all([
    prisma.review.findMany({
      where: { shop },
      orderBy: { createdAt: "desc" },
    }),
    admin.graphql(`#graphql
      query {
        products(first: 250) {
          nodes {
            id
            title
            featuredImage { url }
          }
        }
      }
    `),
  ]);

  const { data } = await productsRes.json();
  const products = (
    data?.products?.nodes as Array<{
      id: string;
      title: string;
      featuredImage: { url: string } | null;
    }> ?? []
  ).map((p) => ({
    id: p.id,
    title: p.title,
    imageUrl: p.featuredImage?.url ?? null,
  }));

  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  return {
    reviews: reviews.map((r) => ({
      id: r.id,
      customer: r.customerName,
      customerEmail: r.customerEmail ?? null,
      initials: r.customerName
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      title: r.title ?? null,
      rating: r.rating,
      text: r.body,
      product: r.productTitle,
      date: new Date(r.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      status: r.status as "published" | "pending" | "rejected",
      importId: r.importId,
      imageUrl: r.imageUrl ?? null,
    })),
    pendingCount,
    products,
  };
};

// ── Action ────────────────────────────────────────────────────────────────────

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const { shop } = session;

  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  // ── Edit review ───────────────────────────────────────────────────────────────
  if (intent === "edit-review") {
    const id = formData.get("id") as string;
    const customerName = (formData.get("customerName") as string).trim();
    const customerEmail = (formData.get("customerEmail") as string)?.trim() || null;
    const rating = parseInt(formData.get("rating") as string, 10);
    const status = formData.get("status") as string;
    const title = (formData.get("title") as string)?.trim() || null;
    const body = (formData.get("body") as string).trim();
    const imageFile = formData.get("image") as File | null;
    const removeImage = formData.get("removeImage") === "true";

    let imageUrlUpdate: { imageUrl: string | null } | undefined;
    if (removeImage) {
      imageUrlUpdate = { imageUrl: null };
    } else if (imageFile && imageFile.size > 0) {
      imageUrlUpdate = { imageUrl: await uploadReviewImage(imageFile) };
    }

    await prisma.review.update({
      where: { id },
      data: {
        customerName,
        customerEmail,
        rating,
        status,
        title,
        body,
        ...imageUrlUpdate,
      },
    });

    return { ok: true, intent };
  }

  // ── Toggle single review status ──────────────────────────────────────────────
  if (intent === "toggle-status") {
    const id = formData.get("id") as string;
    const status = formData.get("status") as string;
    await prisma.review.update({ where: { id }, data: { status } });
    return { ok: true, intent };
  }

  // ── Bulk operations ──────────────────────────────────────────────────────────
  if (intent === "bulk-publish") {
    const ids = JSON.parse(formData.get("ids") as string) as string[];
    await prisma.review.updateMany({ where: { shop, id: { in: ids } }, data: { status: "published" } });
    return { ok: true, intent };
  }

  if (intent === "bulk-reject") {
    const ids = JSON.parse(formData.get("ids") as string) as string[];
    await prisma.review.updateMany({ where: { shop, id: { in: ids } }, data: { status: "rejected" } });
    return { ok: true, intent };
  }

  if (intent === "bulk-delete") {
    const ids = JSON.parse(formData.get("ids") as string) as string[];
    await prisma.review.deleteMany({ where: { shop, id: { in: ids } } });
    return { ok: true, intent };
  }

  // ── CSV import ───────────────────────────────────────────────────────────────
  if (intent === "import") {
    const productId = formData.get("productId") as string;
    const productTitle = formData.get("productTitle") as string;
    const filename = (formData.get("filename") as string) || "import.csv";

    let rawRows: Array<{
      customerName: string;
      rating: number;
      title?: string;
      body: string;
      customerEmail?: string;
      date?: string;
      imageUrl?: string;
    }> = [];

    try {
      rawRows = JSON.parse(formData.get("rows") as string);
    } catch {
      return { ok: false, intent, error: "Could not parse import data." };
    }

    const valid: typeof rawRows = [];
    let failed = 0;

    for (const row of rawRows) {
      const r = Number(row.rating);
      if (!row.customerName?.trim() || !row.body?.trim() || isNaN(r) || r < 1 || r > 5) {
        failed++;
        continue;
      }
      valid.push({ ...row, rating: r });
    }

    const importRecord = await prisma.importRecord.create({
      data: {
        shop,
        filename,
        totalRows: rawRows.length,
        succeeded: valid.length,
        failed,
        status: failed === 0 ? "completed" : valid.length === 0 ? "failed" : "partial",
      },
    });

    if (valid.length > 0) {
      await Promise.all([
        prisma.review.createMany({
          data: valid.map((row) => ({
            shop,
            shopifyProductId: productId || null,
            productTitle,
            customerName: row.customerName.trim(),
            customerEmail: row.customerEmail?.trim() || null,
            rating: Number(row.rating),
            title: row.title?.trim() || null,
            body: row.body.trim(),
            imageUrl: row.imageUrl?.trim() || null,
            status: "pending",
            source: "csv_import",
            importId: importRecord.id,
            ...(row.date && !isNaN(new Date(row.date).getTime())
              ? { createdAt: new Date(row.date) }
              : {}),
          })),
        }),
        prisma.shopSettings.upsert({
          where: { shop },
          update: { reviewsImported: true },
          create: { shop, reviewsImported: true },
        }),
      ]);
    }

    return {
      ok: true,
      intent,
      succeeded: valid.length,
      failed,
      total: rawRows.length,
      importId: importRecord.id,
    };
  }

  return { ok: false, intent: "unknown", error: "Unknown intent" };
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ReviewsPage() {
  const { reviews, pendingCount, products } = useLoaderData<typeof loader>();
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <s-page heading="Reviews" inlineSize="large">
      <s-button
        slot="primary-action"
        variant="primary"
        icon="import"
        onClick={() => setImportOpen(true)}
      >
        Import reviews
      </s-button>
      <s-button
        slot="secondary-actions"
        icon="export"
        onClick={() => setExportOpen(true)}
      >
        Export reviews
      </s-button>

      {pendingCount > 0 && !bannerDismissed && (
        <s-banner
          heading={`${pendingCount} review${pendingCount === 1 ? "" : "s"} pending approval`}
          tone="warning"
          onDismiss={() => setBannerDismissed(true)}
        >
          These reviews are awaiting moderation and won&apos;t appear on your storefront until
          approved.
          <s-button
            slot="secondary-actions"
            variant="secondary"
            onClick={() => setBannerDismissed(true)}
          >
            Dismiss
          </s-button>
        </s-banner>
      )}

      <ReviewsTable reviews={reviews} />

      <ImportReviewsModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        products={products}
      />

      <ExportReviewsModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        reviews={reviews}
        products={products}
      />
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
