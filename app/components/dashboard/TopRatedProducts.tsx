interface TopProduct {
  id: number;
  name: string;
  emoji: string;
  imageUrl?: string | null;
  avgRating: number;
  reviewCount: number;
}

function Stars({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ fontSize: "12px", letterSpacing: "1px", color: "#fbbf24" }}>
      {"★".repeat(full)}
      {half ? "½" : ""}
      <span style={{ color: "#e1e3e5" }}>{"★".repeat(5 - full - (half ? 1 : 0))}</span>
    </span>
  );
}

interface TopRatedProductsProps {
  products: TopProduct[];
}

export function TopRatedProducts({ products }: TopRatedProductsProps) {
  return (
    <s-section heading="Top Rated Products">
      <div style={{ display: "flex", flexDirection: "column" }}>
        {products.map((product, index) => (
          <div key={product.id}>
            {index > 0 && (
              <div style={{ height: "1px", background: "#f1f1f1", margin: "0 0" }} />
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "24px 40px 1fr auto",
                alignItems: "center",
                gap: "12px",
                padding: "12px 0",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#8c9196", textAlign: "center" }}>
                {index + 1}
              </span>

              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: "#f6f6f7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  flexShrink: 0,
                  overflow: "hidden",
                }}
              >
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  product.emoji
                )}
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#1a1a1a",
                    marginBottom: "3px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {product.name}
                </div>
                <Stars rating={product.avgRating} />
              </div>

              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#1a1a1a", lineHeight: 1.2 }}>
                  {product.avgRating.toFixed(1)}
                </div>
                <div style={{ fontSize: "12px", color: "#8c9196", marginTop: "2px" }}>
                  {product.reviewCount} reviews
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </s-section>
  );
}
