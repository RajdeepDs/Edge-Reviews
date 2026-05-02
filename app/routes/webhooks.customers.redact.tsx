import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  const customerEmail = (payload as Record<string, unknown> & { customer?: { email?: string } })
    ?.customer?.email;

  if (customerEmail) {
    await db.review.updateMany({
      where: { shop, customerEmail },
      data: { customerName: "[redacted]", customerEmail: null },
    });
  }

  return new Response();
};
