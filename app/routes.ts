import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
  index("routes/_index/route.tsx"),
  route("app", "routes/layout.tsx", [
    index("routes/layout._index.tsx"),
    route("additional", "routes/app.additional.tsx"),
    route("reviews", "routes/app.reviews.tsx"),
  ]),
  route("auth/login", "routes/auth.login/route.tsx"),
  route("auth/*", "routes/auth.$.tsx"),
  route("webhooks/app/scopes_update", "routes/webhooks.app.scopes_update.tsx"),
  route("webhooks/app/uninstalled", "routes/webhooks.app.uninstalled.tsx"),
] satisfies RouteConfig;
