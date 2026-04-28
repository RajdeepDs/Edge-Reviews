import type { LoaderFunctionArgs } from "react-router";
import prisma from "../db.server";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  const shop = new URL(request.url).searchParams.get("shop");
  if (!shop) {
    return Response.json({ error: "Missing shop" }, { status: 400, headers: CORS });
  }

  const [config, reviews] = await Promise.all([
    prisma.widgetConfig.findUnique({ where: { shop } }),
    prisma.review.findMany({
      where: { shop, status: "published" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        customerName: true,
        rating: true,
        title: true,
        body: true,
        imageUrl: true,
        productTitle: true,
        createdAt: true,
      },
    }),
  ]);

  const total = reviews.length;
  const avg = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  const breakdown = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    return { star, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 };
  });

  return Response.json(
    { config, reviews, stats: { avg: avg.toFixed(1), total, breakdown } },
    { headers: CORS }
  );
};
