import "@shopify/shopify-app-react-router/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  BillingInterval,
  shopifyApp,
} from "@shopify/shopify-app-react-router/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import {
  PLAN_BASIC,
  PLAN_BASIC_ANNUAL,
  PLAN_BUSINESS,
  PLAN_BUSINESS_ANNUAL,
} from "./plans.constants";

export { PLAN_BASIC, PLAN_BASIC_ANNUAL, PLAN_BUSINESS, PLAN_BUSINESS_ANNUAL };

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.October25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    expiringOfflineAccessTokens: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
  billing: {
    [PLAN_BASIC]: {
      lineItems: [{ amount: 5.99, currencyCode: "USD", interval: BillingInterval.Every30Days }],
    },
    [PLAN_BASIC_ANNUAL]: {
      lineItems: [{ amount: 57.48, currencyCode: "USD", interval: BillingInterval.Annual }],
    },
    [PLAN_BUSINESS]: {
      lineItems: [{ amount: 13.99, currencyCode: "USD", interval: BillingInterval.Every30Days }],
    },
    [PLAN_BUSINESS_ANNUAL]: {
      lineItems: [{ amount: 134.28, currencyCode: "USD", interval: BillingInterval.Annual }],
    },
  },
});

export default shopify;
export const apiVersion = ApiVersion.October25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
