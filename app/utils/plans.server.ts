import prisma from "../db.server";
import {
  PLAN_BASIC,
  PLAN_BASIC_ANNUAL,
  PLAN_BUSINESS,
  PLAN_BUSINESS_ANNUAL,
} from "../plans.constants";

export type PlanId = "free" | "basic" | "business";

export const PLAN_LIMITS = {
  free:     { publishedReviews: 50,       csvRowsPerMonth: 100,      widgetCustomization: false, analytics: false, exportCSV: false },
  basic:    { publishedReviews: 500,      csvRowsPerMonth: 1000,     widgetCustomization: true,  analytics: true,  exportCSV: false },
  business: { publishedReviews: Infinity, csvRowsPerMonth: Infinity, widgetCustomization: true,  analytics: true,  exportCSV: true  },
} as const;

export type PlanLimits = typeof PLAN_LIMITS[PlanId];

interface BillingLike {
  check(opts?: { isTest?: boolean }): Promise<{ appSubscriptions: Array<{ name: string }> }>;
}

function nameToId(name: string | null | undefined): PlanId {
  if (name === PLAN_BUSINESS || name === PLAN_BUSINESS_ANNUAL) return "business";
  if (name === PLAN_BASIC || name === PLAN_BASIC_ANNUAL) return "basic";
  return "free";
}

// Reads the active Shopify subscription directly from Shopify's billing API.
//
// `isTest: true` makes the check return BOTH live and test subscriptions. This is
// required for correctness: development/demo stores (used by Shopify's app reviewers
// and during our own testing) can never be charged real money, so Shopify forces every
// subscription created on them to be a *test* charge — even when billing.request was
// called with isTest:false. Checking with isTest:false would silently filter those out,
// making the app report the merchant as being on the Free plan after they upgrade, which
// then keeps every paid feature locked.
export async function getShopPlan(billing: BillingLike): Promise<PlanId> {
  const { appSubscriptions } = await billing.check({ isTest: true });
  return nameToId(appSubscriptions[0]?.name);
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
