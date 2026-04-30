import { useState } from "react";
import type { FormEvent } from "react";
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
      <s-switch checked={checked || undefined} onInput={onToggle} />
    </s-grid>
  );
}

export default function SettingsPage() {
  const shopify = useAppBridge();

  const [settings, setSettings] = useState({
    importAutoPublish: true,
    importDuplicateDetection: true,
    importSourceLabel: "CSV Import",
    importMinRating: "1",

    autoPublish: false,
    minAutoPublishRating: "4",
    flagProfanity: true,
    requireVerifiedPurchase: true,
    minReviewLength: "10",
    autoRejectOneStar: false,

    showStarRating: true,
    showReviewCount: true,
    showVerifiedBadge: true,
    showReviewerAvatar: true,
  });

  const save = () => shopify.toast.show("Settings saved!");

  const update = (key: keyof typeof settings, value: string | boolean) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const updateAndSave = (key: keyof typeof settings, value: string | boolean) => {
    update(key, value);
    save();
  };

  return (
    <s-page heading="Settings" inlineSize="base">
      <s-stack gap="large">

        {/* ── Import Settings ── */}
        <s-section heading="Import Settings">
          <s-stack gap="base">
            <s-text color="subdued">
              Control how reviews imported via CSV are processed and published.
            </s-text>
            <s-divider />

            <SettingToggleRow
              title="Auto-publish imported reviews"
              description="Imported CSV reviews will be published immediately without manual approval."
              checked={settings.importAutoPublish}
              onToggle={() => updateAndSave("importAutoPublish", !settings.importAutoPublish)}
            />

            {settings.importAutoPublish && (
              <>
                <s-divider />
                <s-stack gap="small-200">
                  <s-text>Minimum star rating to auto-publish</s-text>
                  <s-text color="subdued">
                    Reviews below this rating are held for manual review instead of being published automatically.
                  </s-text>
                  <div onChange={(e: FormEvent<HTMLDivElement>) => updateAndSave("importMinRating", (e.target as HTMLSelectElement).value)}>
                    <s-select value={settings.importMinRating}>
                      <s-option value="5">5 stars only</s-option>
                      <s-option value="4">4 stars and above</s-option>
                      <s-option value="3">3 stars and above</s-option>
                      <s-option value="2">2 stars and above</s-option>
                      <s-option value="1">All ratings</s-option>
                    </s-select>
                  </div>
                </s-stack>
              </>
            )}

            <s-divider />

            <SettingToggleRow
              title="Duplicate detection"
              description="Skip reviews that already exist based on customer email and product combination."
              checked={settings.importDuplicateDetection}
              onToggle={() => updateAndSave("importDuplicateDetection", !settings.importDuplicateDetection)}
            />

            <s-divider />

            <s-stack gap="small-200">
              <s-text>Default import source label</s-text>
              <s-text color="subdued">
                Label shown in the Source column for reviews imported via CSV.
              </s-text>
              <div
                onInput={(e: FormEvent<HTMLDivElement>) => update("importSourceLabel", (e.target as HTMLInputElement).value)}
                onBlur={save}
              >
                <s-text-field
                  value={settings.importSourceLabel}
                  placeholder="CSV Import"
                />
              </div>
            </s-stack>
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
              description="Publish new reviews automatically without manual approval. Reviews that don't meet criteria will be held in Pending for manual approval."
              checked={settings.autoPublish}
              onToggle={() => updateAndSave("autoPublish", !settings.autoPublish)}
            />

            {settings.autoPublish && (
              <>
                <s-divider />
                <s-stack gap="small-200">
                  <s-text>Minimum rating to auto-publish</s-text>
                  <s-text color="subdued">
                    Reviews below this threshold are held for manual review.
                  </s-text>
                  <div onChange={(e: FormEvent<HTMLDivElement>) => updateAndSave("minAutoPublishRating", (e.target as HTMLSelectElement).value)}>
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
              onToggle={() => updateAndSave("flagProfanity", !settings.flagProfanity)}
            />

            <s-divider />

            <SettingToggleRow
              title="Require verified purchase"
              description="Only allow reviews from customers who have purchased the product."
              checked={settings.requireVerifiedPurchase}
              onToggle={() =>
                updateAndSave("requireVerifiedPurchase", !settings.requireVerifiedPurchase)
              }
            />

            <s-divider />

            <s-stack gap="small-200">
              <s-text>Minimum review length</s-text>
              <s-text color="subdued">
                Reviews shorter than this will be rejected. Use this to filter out low-effort submissions like &quot;ok&quot; or &quot;good&quot;.
              </s-text>
              <div
                onInput={(e: FormEvent<HTMLDivElement>) => update("minReviewLength", (e.target as HTMLInputElement).value)}
                onBlur={save}
              >
                <s-text-field
                  value={settings.minReviewLength}
                  placeholder="10"
                />
              </div>
            </s-stack>

            <s-divider />

            <SettingToggleRow
              title="Auto-reject 1★ reviews"
              description="Automatically reject all one-star reviews without manual review. Useful for merchants who want to curate their storefront aggressively."
              checked={settings.autoRejectOneStar}
              onToggle={() => updateAndSave("autoRejectOneStar", !settings.autoRejectOneStar)}
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
                onToggle={() => updateAndSave("showStarRating", !settings.showStarRating)}
              />

              <s-divider />

              <SettingToggleRow
                title="Show review count"
                description="Display the total number of reviews next to the star rating."
                checked={settings.showReviewCount}
                onToggle={() => updateAndSave("showReviewCount", !settings.showReviewCount)}
              />

              <s-divider />

              <SettingToggleRow
                title="Show verified purchase badge"
                description="Display a badge on reviews from customers who purchased the product."
                checked={settings.showVerifiedBadge}
                onToggle={() => updateAndSave("showVerifiedBadge", !settings.showVerifiedBadge)}
              />

              <s-divider />

              <SettingToggleRow
                title="Show reviewer avatar"
                description="Display an avatar with the reviewer's initials next to their name."
                checked={settings.showReviewerAvatar}
                onToggle={() => updateAndSave("showReviewerAvatar", !settings.showReviewerAvatar)}
              />

          </s-stack>
        </s-section>

      </s-stack>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
