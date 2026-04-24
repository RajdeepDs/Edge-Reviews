import type { TopProduct } from "../../data/mockData";

function StarRating({ rating }: { rating: number }) {
  return (
    <s-stack direction="inline" gap="small-100">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{
            color: star <= Math.round(rating) ? "#fbbf24" : "#d1d5db",
            fontSize: "12px",
            lineHeight: 1,
          }}
        >
          ★
        </span>
      ))}
    </s-stack>
  );
}

interface TopRatedProductsProps {
  products: TopProduct[];
}

export function TopRatedProducts({ products }: TopRatedProductsProps) {
  return (
    <s-section heading="Top Rated Products">
      <s-stack gap="small-400">
        {products.map((product, index) => (
          <s-stack key={product.id} gap="small-300">
            {index > 0 && <s-divider />}
            <s-grid gridTemplateColumns="auto auto 1fr auto" alignItems="center" gap="small-300">
              <s-text color="subdued">{index + 1}.</s-text>
              <span style={{ fontSize: "20px", lineHeight: 1 }}>{product.emoji}</span>
              <s-stack gap="small-100">
                <s-text color="base">{product.name}</s-text>
                <StarRating rating={product.avgRating} />
              </s-stack>
              <s-stack gap="small-100" alignItems="end">
                <s-text color="base">{product.avgRating.toFixed(1)}</s-text>
                <s-text color="subdued">{product.reviewCount} reviews</s-text>
              </s-stack>
            </s-grid>
          </s-stack>
        ))}
      </s-stack>
    </s-section>
  );
}
