import { useState } from "react";
import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

function SettingToggleRow({
  title,
  description,
  checked,
  onToggle,
}: {
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <s-grid gridTemplateColumns="1fr auto" alignItems="start" gap="base">
      <s-stack gap="small-100">
        <s-text>{title}</s-text>
        <s-text color="subdued">{description}</s-text>
      </s-stack>
      <s-switch checked={checked || undefined} onClick={onToggle} />
    </s-grid>
  );
}

export default function SettingsPage() {
  const shopify = useAppBridge();

  const [settings, setSettings] = useState({
    autoSendRequests: true,
    requestDelayDays: "3",
    requestTemplate: "default",

    autoPublish: false,
    minAutoPublishRating: "4",
    flagProfanity: true,
    requireVerifiedPurchase: true,

    showStarRating: true,
    showReviewCount: true,
    widgetTheme: "light",
    widgetLayout: "list",

    emailOnNewReview: true,
    notificationEmail: "",
    digestFrequency: "instant",

    displayName: "",
    replySignature: "",
  });

  const update = (key: keyof typeof settings, value: string | boolean) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => shopify.toast.show("Settings saved!");

  return (
    <s-page heading="Settings" inlineSize="base">
      <s-button slot="primary-action" variant="primary" onClick={handleSave}>
        Save
      </s-button>

      <s-stack gap="large">

        {/* ── Review Requests ── */}
        <s-section heading="Review Requests">
          <s-stack gap="base">
            <s-text color="subdued">
              Configure when and how review requests are sent to customers after a purchase.
            </s-text>
            <s-divider />

            <SettingToggleRow
              title="Auto-send review requests"
              description="Automatically send a review request email after each fulfilled order."
              checked={settings.autoSendRequests}
              onToggle={() => update("autoSendRequests", !settings.autoSendRequests)}
            />

            {settings.autoSendRequests && (
              <>
                <s-divider />
                <s-grid gridTemplateColumns="1fr 1fr" gap="base">
                  <s-stack gap="small-200">
                    <s-text>Days after fulfillment</s-text>
                    <s-text color="subdued">
                      How many days to wait before sending the request.
                    </s-text>
                    <div onInput={(e: any) => update("requestDelayDays", e.target.value)}>
                      <s-text-field
                        type="number"
                        value={settings.requestDelayDays}
                        placeholder="3"
                        min="1"
                        max="30"
                      />
                    </div>
                  </s-stack>
                  <s-stack gap="small-200">
                    <s-text>Email template</s-text>
                    <s-text color="subdued">
                      Template used for review request emails.
                    </s-text>
                    <div onChange={(e: any) => update("requestTemplate", e.target.value)}>
                      <s-select value={settings.requestTemplate}>
                        <s-option value="default">Default</s-option>
                        <s-option value="minimal">Minimal</s-option>
                        <s-option value="branded">Branded</s-option>
                      </s-select>
                    </div>
                  </s-stack>
                </s-grid>
              </>
            )}
          </s-stack>
        </s-section>

        {/* ── Moderation ── */}
        <s-section heading="Moderation">
          <s-stack gap="base">
            <s-text color="subdued">
              Control how reviews are approved and displayed in your store.
            </s-text>
            <s-divider />

            <SettingToggleRow
              title="Auto-publish reviews"
              description="Publish new reviews automatically without manual approval."
              checked={settings.autoPublish}
              onToggle={() => update("autoPublish", !settings.autoPublish)}
            />

            {settings.autoPublish && (
              <>
                <s-divider />
                <s-stack gap="small-200">
                  <s-text>Minimum rating to auto-publish</s-text>
                  <s-text color="subdued">
                    Reviews below this threshold are held for manual review.
                  </s-text>
                  <div onChange={(e: any) => update("minAutoPublishRating", e.target.value)}>
                    <s-select value={settings.minAutoPublishRating}>
                      <s-option value="5">5 stars only</s-option>
                      <s-option value="4">4 stars and above</s-option>
                      <s-option value="3">3 stars and above</s-option>
                      <s-option value="2">2 stars and above</s-option>
                      <s-option value="1">All reviews</s-option>
                    </s-select>
                  </div>
                </s-stack>
              </>
            )}

            <s-divider />

            <SettingToggleRow
              title="Flag profanity"
              description="Hold reviews containing profanity for manual review before publishing."
              checked={settings.flagProfanity}
              onToggle={() => update("flagProfanity", !settings.flagProfanity)}
            />

            <s-divider />

            <SettingToggleRow
              title="Require verified purchase"
              description="Only allow reviews from customers who have purchased the product."
              checked={settings.requireVerifiedPurchase}
              onToggle={() =>
                update("requireVerifiedPurchase", !settings.requireVerifiedPurchase)
              }
            />
          </s-stack>
        </s-section>

        {/* ── Widget Display ── */}
        <s-section heading="Widget Display">
          <s-stack gap="base">
            <s-text color="subdued">
              Customize how the review widget appears on your product pages.
            </s-text>
            <s-divider />

            <SettingToggleRow
              title="Show star rating"
              description="Display the average star rating at the top of the reviews section."
              checked={settings.showStarRating}
              onToggle={() => update("showStarRating", !settings.showStarRating)}
            />

            <s-divider />

            <SettingToggleRow
              title="Show review count"
              description="Display the total number of reviews next to the star rating."
              checked={settings.showReviewCount}
              onToggle={() => update("showReviewCount", !settings.showReviewCount)}
            />

            <s-divider />

            <s-grid gridTemplateColumns="1fr 1fr" gap="base">
              <s-stack gap="small-200">
                <s-text>Widget theme</s-text>
                <s-text color="subdued">Color theme for the reviews widget.</s-text>
                <div onChange={(e: any) => update("widgetTheme", e.target.value)}>
                  <s-select value={settings.widgetTheme}>
                    <s-option value="light">Light</s-option>
                    <s-option value="dark">Dark</s-option>
                    <s-option value="auto">Match store theme</s-option>
                  </s-select>
                </div>
              </s-stack>
              <s-stack gap="small-200">
                <s-text>Widget layout</s-text>
                <s-text color="subdued">How reviews are arranged on the page.</s-text>
                <div onChange={(e: any) => update("widgetLayout", e.target.value)}>
                  <s-select value={settings.widgetLayout}>
                    <s-option value="list">List</s-option>
                    <s-option value="grid">Grid</s-option>
                    <s-option value="masonry">Masonry</s-option>
                  </s-select>
                </div>
              </s-stack>
            </s-grid>
          </s-stack>
        </s-section>

        {/* ── Notifications ── */}
        <s-section heading="Notifications">
          <s-stack gap="base">
            <s-text color="subdued">
              Stay informed when new reviews are submitted to your store.
            </s-text>
            <s-divider />

            <SettingToggleRow
              title="Email notifications"
              description="Receive an email when a new review is submitted."
              checked={settings.emailOnNewReview}
              onToggle={() => update("emailOnNewReview", !settings.emailOnNewReview)}
            />

            {settings.emailOnNewReview && (
              <>
                <s-divider />
                <s-grid gridTemplateColumns="1fr 1fr" gap="base">
                  <s-stack gap="small-200">
                    <s-text>Notification email</s-text>
                    <s-text color="subdued">Address where notifications will be sent.</s-text>
                    <div onInput={(e: any) => update("notificationEmail", e.target.value)}>
                      <s-text-field
                        type="email"
                        value={settings.notificationEmail}
                        placeholder="you@yourstore.com"
                      />
                    </div>
                  </s-stack>
                  <s-stack gap="small-200">
                    <s-text>Frequency</s-text>
                    <s-text color="subdued">How often to receive notification emails.</s-text>
                    <div onChange={(e: any) => update("digestFrequency", e.target.value)}>
                      <s-select value={settings.digestFrequency}>
                        <s-option value="instant">Instant</s-option>
                        <s-option value="daily">Daily digest</s-option>
                        <s-option value="weekly">Weekly digest</s-option>
                      </s-select>
                    </div>
                  </s-stack>
                </s-grid>
              </>
            )}
          </s-stack>
        </s-section>

        {/* ── Branding ── */}
        <s-section heading="Branding">
          <s-stack gap="base">
            <s-text color="subdued">
              Control how your business appears in review emails and customer-facing responses.
            </s-text>
            <s-divider />
            <s-grid gridTemplateColumns="1fr 1fr" gap="base">
              <s-stack gap="small-200">
                <s-text>Display name</s-text>
                <s-text color="subdued">Business name shown in emails and the widget.</s-text>
                <div onInput={(e: any) => update("displayName", e.target.value)}>
                  <s-text-field
                    value={settings.displayName}
                    placeholder="Your Store Name"
                  />
                </div>
              </s-stack>
              <s-stack gap="small-200">
                <s-text>Reply signature</s-text>
                <s-text color="subdued">Appended to the end of your review replies.</s-text>
                <div onInput={(e: any) => update("replySignature", e.target.value)}>
                  <s-text-field
                    value={settings.replySignature}
                    placeholder="— The Team at Your Store"
                  />
                </div>
              </s-stack>
            </s-grid>
          </s-stack>
        </s-section>

      </s-stack>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
