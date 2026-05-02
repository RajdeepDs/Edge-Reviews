import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  await Promise.all([
    db.session.deleteMany({ where: { shop } }),
    db.review.deleteMany({ where: { shop } }),
    db.importRecord.deleteMany({ where: { shop } }),
    db.widgetConfig.deleteMany({ where: { shop } }),
    db.shopSettings.deleteMany({ where: { shop } }),
    db.merchantProfile.deleteMany({ where: { shop } }),
  ]);

  return new Response();
};
