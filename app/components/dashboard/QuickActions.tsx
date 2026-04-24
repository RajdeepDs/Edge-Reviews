interface QuickActionsProps {
  onImportReviews: () => void;
  onCustomizeWidget: () => void;
  onSendReviewRequest: () => void;
}

export function QuickActions({
  onImportReviews,
  onCustomizeWidget,
  onSendReviewRequest,
}: QuickActionsProps) {
  return (
    <s-section heading="Quick Actions">
      <s-stack direction="inline" gap="small-300">
        <s-button icon="import" onClick={onImportReviews}>
          Import Reviews
        </s-button>
        <s-button icon="paint-brush-flat" onClick={onCustomizeWidget}>
          Customize Widget
        </s-button>
        <s-button variant="primary" icon="send" onClick={onSendReviewRequest}>
          Send Review Request
        </s-button>
      </s-stack>
    </s-section>
  );
}
