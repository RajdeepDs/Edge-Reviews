import { useState, useCallback } from "react";
import { useFetcher, useNavigate } from "react-router";
import { Modal, Text, BlockStack, Banner, Spinner, Icon, TextField } from "@shopify/polaris";
import { SearchIcon, CheckIcon } from "@shopify/polaris-icons";
import type { ImportProduct } from "./import-reviews-modal";

const SAMPLE_REVIEWS = [
  { customerName: "Sarah M.", rating: 5, title: "Absolutely love this!", body: "This product has completely exceeded my expectations. The quality is outstanding and it arrived quickly. I've already recommended it to several friends and family members. Will definitely be purchasing again!", customerEmail: "sarah.m@example.com", date: "2025-03-15" },
  { customerName: "James T.", rating: 5, title: "Best purchase I've made this year", body: "I was skeptical at first but wow, this is genuinely impressive. Everything about it is top-notch. The attention to detail is clear and it works exactly as described. Very happy customer here.", customerEmail: "james.t@example.com", date: "2025-03-22" },
  { customerName: "Emily R.", rating: 4, title: "Great product, minor packaging issue", body: "Really happy with this overall. It does exactly what it says and the quality feels premium. Took off one star because the packaging was slightly damaged on arrival, but the product itself was perfect. Would buy again.", customerEmail: "emily.r@example.com", date: "2025-04-01" },
  { customerName: "David K.", rating: 5, title: "Exceeded all my expectations", body: "Outstanding from start to finish. The product quality is exceptional and the results have been amazing. I use it every day now and couldn't imagine going without it. A true must-have!", customerEmail: "david.k@example.com", date: "2025-04-08" },
  { customerName: "Priya S.", rating: 5, title: "Game changer for me", body: "I've tried similar products before but nothing compares to this. It's made such a positive difference in my daily routine. The quality is evident from the moment you open the box. 100% worth every penny.", customerEmail: "priya.s@example.com", date: "2025-04-14" },
  { customerName: "Michael O.", rating: 4, title: "Solid product, does what it promises", body: "Good product overall. Does exactly what it says on the tin. Build quality feels durable and well-made. Shipping was fast and it was well packaged. My only suggestion would be to include better instructions but that's minor.", customerEmail: "michael.o@example.com", date: "2025-04-20" },
  { customerName: "Laura B.", rating: 5, title: "Can't imagine life without it now", body: "This has become an essential part of my routine. The results speak for themselves — I noticed a difference almost immediately. The quality is top-tier and customer service was helpful when I had a quick question. Highly recommend!", customerEmail: "laura.b@example.com", date: "2025-04-27" },
  { customerName: "Ahmed N.", rating: 5, title: "Fantastic quality and fast delivery", body: "Really impressed with the quality of this product. It arrived ahead of schedule, was packaged securely, and looks and feels premium. This is exactly what I was looking for. Will be buying more as gifts for friends.", customerEmail: "ahmed.n@example.com", date: "2025-05-03" },
  { customerName: "Jessica L.", rating: 4, title: "Very happy with my purchase", body: "Great product that delivers on its promises. The quality is noticeably better than cheaper alternatives I've tried. It's become a staple for me. Took off one star just because I'd love to see more colour options, but the product itself is excellent.", customerEmail: "jessica.l@example.com", date: "2025-05-06" },
  { customerName: "Tom W.", rating: 5, title: "Incredible — worth every penny", body: "I rarely write reviews but this product deserves it. From unboxing to using it daily, everything has been a pleasure. Premium feel, great results, and the company clearly cares about quality. Highly recommend to anyone on the fence.", customerEmail: "tom.w@example.com", date: "2025-05-09" },
];

function initials(title: string) {
  const w = title.trim().split(/\s+/);
  return w.length === 1 ? w[0].slice(0, 2).toUpperCase() : (w[0][0] + w[1][0]).toUpperCase();
}

interface Props {
  open: boolean;
  onClose: () => void;
  products: ImportProduct[];
}

export function SampleReviewsModal({ open, onClose, products }: Props) {
  const navigate = useNavigate();
  const fetcher = useFetcher<{
    ok: boolean;
    succeeded?: number;
    failed?: number;
    total?: number;
    error?: string;
  }>();

  const [step, setStep] = useState<"select" | "result">("select");
  const [selectedProduct, setSelectedProduct] = useState<ImportProduct | null>(null);
  const [productSearch, setProductSearch] = useState("");

  const isSubmitting = fetcher.state !== "idle";

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    setStep("select");
    setSelectedProduct(null);
    setProductSearch("");
    onClose();
  }, [isSubmitting, onClose]);

  const handleLoad = () => {
    if (!selectedProduct) return;
    const fd = new FormData();
    fd.set("intent", "import");
    fd.set("productId", selectedProduct.id);
    fd.set("productTitle", selectedProduct.title);
    fd.set("filename", "sample-reviews.csv");
    fd.set("rows", JSON.stringify(SAMPLE_REVIEWS));
    fetcher.submit(fd, { method: "post", action: "/app/reviews" });
    setStep("result");
  };

  const filteredProducts = productSearch.trim()
    ? products.filter((p) => p.title.toLowerCase().includes(productSearch.toLowerCase()))
    : products;

  const result = step === "result" ? fetcher.data : undefined;

  const selectStep = (
    <BlockStack gap="400">
      <Banner tone="info">
        <p>
          This loads <strong>{SAMPLE_REVIEWS.length} realistic sample reviews</strong> for the selected product so you can preview widgets immediately. All reviews are added as <strong>pending</strong> — publish them to see them on your storefront.
        </p>
      </Banner>
      <TextField
        label="Search products"
        labelHidden
        placeholder="Search products…"
        value={productSearch}
        onChange={setProductSearch}
        prefix={<Icon source={SearchIcon} />}
        autoComplete="off"
      />
      <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid #e1e3e5", borderRadius: 8 }}>
        {filteredProducts.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "#8c9196", fontSize: 14 }}>No products found</div>
        ) : (
          filteredProducts.map((product) => {
            const active = selectedProduct?.id === product.id;
            return (
              <div
                key={product.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedProduct(product)}
                onKeyDown={(e) => e.key === "Enter" && setSelectedProduct(product)}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", cursor: "pointer",
                  borderBottom: "1px solid #f6f6f7",
                  background: active ? "#f0f7ff" : "transparent",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "#f9f9f9"; }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 8, overflow: "hidden",
                  flexShrink: 0, background: "#f1f1f1",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 600, color: "#6d7175",
                }}>
                  {product.imageUrl
                    ? <img src={product.imageUrl} alt={product.title} width={40} height={40} style={{ objectFit: "cover", display: "block" }} />
                    : initials(product.title)}
                </div>
                <Text as="span" variant="bodyMd" fontWeight={active ? "semibold" : "regular"}>{product.title}</Text>
                {active && (
                  <div style={{ marginLeft: "auto", color: "#005bd3" }}>
                    <Icon source={CheckIcon} tone="interactive" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </BlockStack>
  );

  const resultView = (
    <div style={{ padding: "8px 0" }}>
      {isSubmitting ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "48px 0" }}>
          <Spinner size="large" />
          <Text as="p" variant="bodyMd" tone="subdued">Loading sample reviews…</Text>
        </div>
      ) : result?.ok ? (
        <BlockStack gap="500">
          <Banner title="Sample reviews loaded!" tone="success">
            <p>
              {result.succeeded ?? 0} sample reviews have been added as pending for <strong>{selectedProduct?.title}</strong>. Publish them from the table below to make them visible on your storefront.
            </p>
          </Banner>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { label: "Total added", value: result.succeeded ?? 0, color: "#2d7a3f" },
              { label: "Status",      value: "Pending",              color: "#6d7175" },
              { label: "Skipped",     value: result.failed ?? 0,     color: (result.failed ?? 0) > 0 ? "#b52b27" : "#6d7175" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: "center", padding: "20px 16px", background: "#f6f6f7", borderRadius: 10 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 13, color: "#8c9196", marginTop: 6 }}>{label}</div>
              </div>
            ))}
          </div>
        </BlockStack>
      ) : (
        <Banner title="Failed to load sample reviews" tone="critical">
          <p>{result?.error ?? "Something went wrong. Please try again."}</p>
        </Banner>
      )}
    </div>
  );

  const primaryAction =
    step === "select"
      ? { content: "Load Sample Reviews", onAction: handleLoad, disabled: !selectedProduct || isSubmitting, loading: isSubmitting }
      : {
          content: "View reviews",
          onAction: () => { handleClose(); navigate("/app/reviews"); },
        };

  const secondaryActions =
    step === "result"
      ? [{ content: "Close", onAction: handleClose }]
      : [{ content: "Cancel", onAction: handleClose }];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Load Sample Reviews"
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
      size="large"
    >
      <Modal.Section>
        {step === "select" && selectStep}
        {step === "result" && resultView}
      </Modal.Section>
    </Modal>
  );
}
