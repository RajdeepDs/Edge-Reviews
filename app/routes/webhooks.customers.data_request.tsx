import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);
  console.log(`Received ${topic} webhook for ${shop}`);

  // The app stores customer names and emails on Review records.
  // Log the request so it can be fulfilled manually (provide data export to customer within 30 days).
  const customerEmail = (payload as Record<string, unknown> & { customer?: { email?: string } })
    ?.customer?.email;
  console.log(`Data request for customer ${customerEmail ?? "unknown"} at shop ${shop}`);

  return new Response();
};
