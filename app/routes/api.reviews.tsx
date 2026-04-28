import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  return Response.json({ error: "Method not allowed" }, { status: 405, headers: CORS });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405, headers: CORS });
  }

  const shop = new URL(request.url).searchParams.get("shop") || "";
  if (!shop) {
    return Response.json({ error: "Missing shop" }, { status: 400, headers: CORS });
  }

  const fd = await request.formData();
  const rating = parseInt(fd.get("rating") as string, 10);
  const customerName = (fd.get("customerName") as string || "").trim();
  const body = (fd.get("body") as string || "").trim();

  if (!rating || rating < 1 || rating > 5 || !customerName || !body) {
    return Response.json({ error: "Missing required fields" }, { status: 400, headers: CORS });
  }

  const settings = await prisma.shopSettings.findUnique({ where: { shop } });
  const status = settings?.autoPublish ? "published" : "pending";

  await prisma.review.create({
    data: {
      shop,
      shopifyProductId: (fd.get("shopifyProductId") as string) || null,
      productTitle: (fd.get("productTitle") as string) || "",
      customerName,
      customerEmail: (fd.get("customerEmail") as string) || null,
      rating,
      title: (fd.get("title") as string) || null,
      body,
      status,
      source: "storefront",
    },
  });

  return Response.json({ success: true }, { headers: CORS });
};
