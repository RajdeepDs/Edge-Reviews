import prisma from "../db.server";

export type PlanId = "free" | "basic" | "business";

export const PLAN_LIMITS = {
  free:     { publishedReviews: 50,       csvRowsPerMonth: 100,      widgetCustomization: false, analytics: false, exportCSV: false },
  basic:    { publishedReviews: 500,      csvRowsPerMonth: 1000,     widgetCustomization: true,  analytics: true,  exportCSV: false },
  business: { publishedReviews: Infinity, csvRowsPerMonth: Infinity, widgetCustomization: true,  analytics: true,  exportCSV: true  },
} as const;

export type PlanLimits = typeof PLAN_LIMITS[PlanId];

export async function getShopPlan(shop: string): Promise<PlanId> {
  const settings = await prisma.shopSettings.findUnique({ where: { shop }, select: { plan: true } });
  const plan = (settings?.plan ?? "free") as PlanId;
  return (plan in PLAN_LIMITS ? plan : "free") as PlanId;
}

export async function getMonthlyImportUsage(shop: string): Promise<number> {
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const records = await prisma.importRecord.findMany({
    where: { shop, createdAt: { gte: start } },
    select: { succeeded: true },
  });
  return records.reduce((sum, r) => sum + r.succeeded, 0);
}
