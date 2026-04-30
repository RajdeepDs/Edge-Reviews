import { useState } from "react";
import {
  Card,
  BlockStack,
  InlineStack,
  Text,
  Button,
  Box,
  ProgressBar,
  Icon,
} from "@shopify/polaris";
import {
  CheckCircleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  AlertCircleIcon,
  XIcon,
} from "@shopify/polaris-icons";

interface SetupGuideCardProps {
  embedActivated: boolean;
  reviewsImported: boolean;
  reviewConfirmedWorking: boolean;
  onDismiss: () => void;
  onOpenThemeSettings: () => void;
  onMarkEmbedDone: () => void;
  onImportReviews: () => void;
  onMarkImportDone: () => void;
  onMarkConfirmedWorking: () => void;
}

export function SetupGuideCard({
  embedActivated,
  reviewsImported,
  reviewConfirmedWorking,
  onDismiss,
  onOpenThemeSettings,
  onMarkEmbedDone,
  onImportReviews,
  onMarkImportDone,
  onMarkConfirmedWorking,
}: SetupGuideCardProps) {
  const steps = [
    {
      id: "embed",
      title: "Activate app embed in Shopify",
      description:
        "Activate and save the app embed in your theme settings to make your reviews widget live.",
      completed: embedActivated,
      actions: (
        <InlineStack gap="200">
          <Button variant="primary" onClick={onOpenThemeSettings}>
            Open theme settings
          </Button>
          <Button onClick={onMarkEmbedDone}>I have done it</Button>
        </InlineStack>
      ),
    },
    {
      id: "import",
      title: "Import your reviews (CSV)",
      description: "Upload a CSV file to bring in existing reviews from another platform or source.",
      completed: reviewsImported,
      actions: !reviewsImported ? (
        <InlineStack gap="200">
          <Button variant="primary" onClick={onImportReviews}>Import reviews</Button>
          <Button onClick={onMarkImportDone}>Mark as done</Button>
        </InlineStack>
      ) : null,
    },
    {
      id: "confirm",
      title: "Confirm your reviews widget is working",
      description: "Visit your storefront and verify the reviews widget appears correctly.",
      completed: reviewConfirmedWorking,
      actions: reviewsImported ? (
        <InlineStack gap="200">
          <Button onClick={onMarkConfirmedWorking}>Mark as done</Button>
        </InlineStack>
      ) : null,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const progress = (completedCount / totalCount) * 100;
  const currentStepIndex = steps.findIndex((s) => !s.completed);

  const [guideOpen, setGuideOpen] = useState(true);

  return (
    <Card>
      <BlockStack gap="200">
        {/* Header */}
        <InlineStack align="space-between" blockAlign="center">
          <BlockStack gap="0">
            <Text as="h2" variant="headingMd" fontWeight="semibold">
              Setup guide
            </Text>
            <Text as="p" tone="subdued">
              Follow these steps to start using the Edge Reviews app
            </Text>
          </BlockStack>

          <InlineStack gap="100" blockAlign="center">
            <Button
              variant="plain"
              icon={guideOpen ? ChevronUpIcon : ChevronDownIcon}
              onClick={() => setGuideOpen((o) => !o)}
              accessibilityLabel="Toggle setup guide"
            />
            <Button
              variant="plain"
              icon={XIcon}
              onClick={onDismiss}
              accessibilityLabel="Dismiss setup guide"
            />
          </InlineStack>
        </InlineStack>

        {/* Progress */}
        <BlockStack gap="200">
          <Text as="p" tone="base" variant="bodySm">
            {completedCount} / {totalCount} steps completed
          </Text>
          <ProgressBar progress={progress} size="small" tone="primary" />
        </BlockStack>

        {/* Steps */}
        {guideOpen && (
          <BlockStack gap="100">
            {steps.map((step, index) => {
              const isCurrent = index === currentStepIndex;

              return (
                <Box
                  key={step.id}
                  padding={isCurrent ? "300" : "200"}
                  background={isCurrent ? "bg-surface-secondary" : undefined}
                  borderRadius={isCurrent ? "100" : undefined}
                >
                  <BlockStack gap="200">
                    {/* Step Header */}
                    <InlineStack align="space-between" blockAlign="center">
                      <InlineStack gap="300" blockAlign="center">
                        {step.completed ? (
                          <Icon source={CheckCircleIcon} tone="base" />
                        ) : (
                          <Icon source={AlertCircleIcon} tone="subdued" />
                        )}

                        <Text
                          as="h3"
                          variant="bodyMd"
                          fontWeight={isCurrent ? "semibold" : "regular"}
                          tone={step.completed ? "subdued" : undefined}
                        >
                          {step.title}
                        </Text>
                      </InlineStack>
                    </InlineStack>

                    {/* Expanded content for active step */}
                    {isCurrent && !step.completed && (
                      <>
                        {step.description && (
                          <Text as="p" tone="subdued" variant="bodySm">
                            {step.description}
                          </Text>
                        )}

                        {step.actions}
                      </>
                    )}
                  </BlockStack>
                </Box>
              );
            })}
          </BlockStack>
        )}
      </BlockStack>
    </Card>
  );
}
