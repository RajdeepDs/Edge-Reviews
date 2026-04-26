import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { ProductsList } from "../components/products/products-list";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function ProductsPage() {
  return (
    <s-page heading="Products" inlineSize="large">
      <s-button slot="primary-action" variant="primary" icon="import">
        Import Reviews for Product
      </s-button>
      <ProductsList />
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
