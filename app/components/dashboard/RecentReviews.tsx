import type { Review } from "../../data/mockData";

function StarRating({ rating }: { rating: number }) {
  return (
    <s-stack direction="inline" gap="small-100">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            color: star <= rating ? "#fbbf24" : "#d1d5db",
            fontSize: "14px",
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </s-stack>
  );
}

interface RecentReviewsProps {
  reviews: Review[];
  onViewAll: () => void;
  onSendFirstRequest: () => void;
}

export function RecentReviews({
  reviews,
  onViewAll,
  onSendFirstRequest,
}: RecentReviewsProps) {
  return (
    <s-section>
      <s-stack gap="base">
        {/* Header */}
        <s-grid gridTemplateColumns="1fr auto" alignItems="center">
          <s-heading>Recent Reviews</s-heading>
          {reviews.length > 0 && (
            <s-button variant="tertiary" onClick={onViewAll}>
              View all
            </s-button>
          )}
        </s-grid>

        {reviews.length === 0 ? (
          /* Empty state */
          <s-stack gap="base" alignItems="center">
            <span style={{ fontSize: "48px", lineHeight: 1 }}>⭐</span>
            <s-stack gap="small-200" alignItems="center">
              <s-heading>No reviews yet</s-heading>
              <s-paragraph color="subdued">
                Start collecting reviews by sending requests to your customers
                after they purchase.
              </s-paragraph>
            </s-stack>
            <s-button variant="primary" onClick={onSendFirstRequest}>
              Send your first review request
            </s-button>
          </s-stack>
        ) : (
          <s-stack gap="small-500">
            {reviews.map((review, index) => (
              <s-stack key={review.id} gap="small-300">
                {index > 0 && <s-divider />}
                <s-grid gridTemplateColumns="auto 1fr" gap="small-300" alignItems="start">
                  <s-avatar initials={review.initials} size="base" />
                  <s-stack gap="small-200">
                    <s-grid gridTemplateColumns="1fr auto" alignItems="center">
                      <s-text color="base">{review.customer}</s-text>
                      <s-text color="subdued">{review.date}</s-text>
                    </s-grid>
                    <s-text color="subdued">{review.product}</s-text>
                    <StarRating rating={review.rating} />
                    <s-paragraph color="base">
                      {review.text.length > 100
                        ? `${review.text.slice(0, 100)}…`
                        : review.text}
                    </s-paragraph>
                  </s-stack>
                </s-grid>
              </s-stack>
            ))}
          </s-stack>
        )}
      </s-stack>
    </s-section>
  );
}
