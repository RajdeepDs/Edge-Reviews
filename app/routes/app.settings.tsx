import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import prisma from "../db.server";

type ReviewSettingsState = {
  importAutoPublish: boolean;
  importDuplicateDetection: boolean;
  importSourceLabel: string;
  importMinRating: string;
  autoPublish: boolean;
  minAutoPublishRating: string;
  flagProfanity: boolean;
  requireVerifiedPurchase: boolean;
  minReviewLength: string;
  autoRejectOneStar: boolean;
  showStarRating: boolean;
  showReviewCount: boolean;
  showVerifiedBadge: boolean;
  showReviewerAvatar: boolean;
};

const DEFAULT_SETTINGS: ReviewSettingsState = {
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
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  let settings: ReviewSettingsState | null = null;
  try {
    const rows = await prisma.$queryRaw<Array<ReviewSettingsState>>`
      SELECT
        "importAutoPublish",
        "importDuplicateDetection",
        "importSourceLabel",
        "importMinRating",
        "autoPublish",
        "minAutoPublishRating",
        "flagProfanity",
        "requireVerifiedPurchase",
        "minReviewLength",
        "autoRejectOneStar",
        "showStarRating",
        "showReviewCount",
        "showVerifiedBadge",
        "showReviewerAvatar"
      FROM "ReviewSettings"
      WHERE "shop" = ${session.shop}
      LIMIT 1
    `;
    settings = rows[0] ?? null;
  } catch {
    settings = null;
  }
  return {
    settings: { ...DEFAULT_SETTINGS, ...(settings ?? {}) },
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();

  const getString = (k: string, fallback: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v : fallback;
  };
  const getBool = (k: string, fallback: boolean) => {
    const v = form.get(k);
    if (v === null) return fallback;
    return v === "true";
  };

  const data: ReviewSettingsState = {
    importAutoPublish: getBool("importAutoPublish", true),
    importDuplicateDetection: getBool("importDuplicateDetection", true),
    importSourceLabel: getString("importSourceLabel", "CSV Import").trim() || "CSV Import",
    importMinRating: getString("importMinRating", "1"),
    autoPublish: getBool("autoPublish", false),
    minAutoPublishRating: getString("minAutoPublishRating", "4"),
    flagProfanity: getBool("flagProfanity", true),
    requireVerifiedPurchase: getBool("requireVerifiedPurchase", true),
    minReviewLength: getString("minReviewLength", "10"),
    autoRejectOneStar: getBool("autoRejectOneStar", false),
    showStarRating: getBool("showStarRating", true),
    showReviewCount: getBool("showReviewCount", true),
    showVerifiedBadge: getBool("showVerifiedBadge", true),
    showReviewerAvatar: getBool("showReviewerAvatar", true),
  };

  try {
    await prisma.$executeRaw`
      INSERT INTO "ReviewSettings" (
        "shop",
        "importAutoPublish",
        "importDuplicateDetection",
        "importSourceLabel",
        "importMinRating",
        "autoPublish",
        "minAutoPublishRating",
        "flagProfanity",
        "requireVerifiedPurchase",
        "minReviewLength",
        "autoRejectOneStar",
        "showStarRating",
        "showReviewCount",
        "showVerifiedBadge",
        "showReviewerAvatar",
        "updatedAt"
      ) VALUES (
        ${session.shop},
        ${data.importAutoPublish},
        ${data.importDuplicateDetection},
        ${data.importSourceLabel},
        ${data.importMinRating},
        ${data.autoPublish},
        ${data.minAutoPublishRating},
        ${data.flagProfanity},
        ${data.requireVerifiedPurchase},
        ${data.minReviewLength},
        ${data.autoRejectOneStar},
        ${data.showStarRating},
        ${data.showReviewCount},
        ${data.showVerifiedBadge},
        ${data.showReviewerAvatar},
        NOW()
      )
      ON CONFLICT ("shop") DO UPDATE SET
        "importAutoPublish" = EXCLUDED."importAutoPublish",
        "importDuplicateDetection" = EXCLUDED."importDuplicateDetection",
        "importSourceLabel" = EXCLUDED."importSourceLabel",
        "importMinRating" = EXCLUDED."importMinRating",
        "autoPublish" = EXCLUDED."autoPublish",
        "minAutoPublishRating" = EXCLUDED."minAutoPublishRating",
        "flagProfanity" = EXCLUDED."flagProfanity",
        "requireVerifiedPurchase" = EXCLUDED."requireVerifiedPurchase",
        "minReviewLength" = EXCLUDED."minReviewLength",
        "autoRejectOneStar" = EXCLUDED."autoRejectOneStar",
        "showStarRating" = EXCLUDED."showStarRating",
        "showReviewCount" = EXCLUDED."showReviewCount",
        "showVerifiedBadge" = EXCLUDED."showVerifiedBadge",
        "showReviewerAvatar" = EXCLUDED."showReviewerAvatar",
        "updatedAt" = NOW()
    `;
  } catch {
    return { ok: false, error: "settings_table_missing" };
  }

  await prisma.shopSettings.upsert({
    where: { shop: session.shop },
    update: { autoPublish: data.autoPublish },
    create: { shop: session.shop, autoPublish: data.autoPublish },
  });

  return { ok: true };
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
  const { settings: initialSettings } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<{ ok?: boolean }>();

  const [settings, setSettings] = useState(initialSettings);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.ok) {
      shopify.toast.show("Settings saved!");
    }
    if (fetcher.state === "idle" && fetcher.data && !fetcher.data.ok) {
      shopify.toast.show("Could not save settings. Run latest DB migration.", {
        isError: true,
      });
    }
  }, [fetcher.state, fetcher.data, shopify]);

  const update = (key: keyof typeof settings, value: string | boolean) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const persist = (next: typeof settings) => {
    const fd = new FormData();
    for (const [k, v] of Object.entries(next)) fd.set(k, String(v));
    fetcher.submit(fd, { method: "post" });
  };

  const updateAndSave = (key: keyof typeof settings, value: string | boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    persist(next);
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
                onBlur={() => persist(settings)}
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
                onBlur={() => persist(settings)}
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
