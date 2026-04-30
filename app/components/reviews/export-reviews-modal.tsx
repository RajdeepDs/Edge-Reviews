import { Fragment, useState, useMemo, useCallback } from "react";
import {
  Modal,
  TextField,
  Text,
  BlockStack,
  InlineStack,
  Divider,
  Icon,
  ChoiceList,
} from "@shopify/polaris";
import { SearchIcon, CheckIcon } from "@shopify/polaris-icons";
import type { ReviewRow } from "./reviews-table";
import type { ImportProduct } from "./import-reviews-modal";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  reviews: ReviewRow[];
  products: ImportProduct[];
}

type StatusFilter = "all" | "published" | "pending" | "rejected";
type Step = 1 | 2 | "done";

// ── CSV helpers ───────────────────────────────────────────────────────────────

function csvEscape(val: string | number | null | undefined): string {
  const s = val === null || val === undefined ? "" : String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCSV(rows: ReviewRow[]): string {
  const headers = ["Customer Name", "Customer Email", "Rating", "Title", "Review", "Product", "Status", "Date"];
  const lines = rows.map((r) =>
    [
      csvEscape(r.customer),
      csvEscape(r.customerEmail),
      r.rating,
      csvEscape(r.title),
      csvEscape(r.text),
      csvEscape(r.product),
      r.status,
      csvEscape(r.date),
    ].join(","),
  );
  return [headers.join(","), ...lines].join("\n");
}

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function initials(title: string) {
  const w = title.trim().split(/\s+/);
  return w.length === 1 ? w[0].slice(0, 2).toUpperCase() : (w[0][0] + w[1][0]).toUpperCase();
}

// ── Step indicator ────────────────────────────────────────────────────────────

const STEP_LABELS = ["Select Products", "Configure Export"];

function StepIndicator({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 24 }}>
      {STEP_LABELS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <Fragment key={i}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 88 }}>
              <div
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700,
                  background: done || active ? "#303030" : "#e1e3e5",
                  color: done || active ? "#fff" : "#6d7175",
                  transition: "all 0.2s",
                }}
              >
                {done ? "✓" : n}
              </div>
              <span style={{
                fontSize: 12, lineHeight: 1.3, textAlign: "center",
                fontWeight: active ? 600 : 400,
                color: active ? "#303030" : "#8c9196",
              }}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div style={{
                flex: 1, height: 2, marginTop: 15,
                background: done ? "#303030" : "#e1e3e5",
                transition: "background 0.2s",
              }} />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

const CSV_COLUMNS = ["Customer Name", "Customer Email", "Rating", "Title", "Review", "Product", "Status", "Date"];

export function ExportReviewsModal({ open, onClose, reviews, products }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [productSearch, setProductSearch] = useState("");
  const [selectedAll, setSelectedAll] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string[]>(["all"]);

  // Derive unique product entries from reviews + product list
  const allProductEntries = useMemo(() => {
    const reviewCounts: Record<string, number> = {};
    for (const r of reviews) reviewCounts[r.product] = (reviewCounts[r.product] ?? 0) + 1;

    const seen = new Set<string>();
    const result: { id: string; title: string; imageUrl: string | null; total: number }[] = [];

    for (const p of products) {
      if (reviewCounts[p.title] !== undefined && !seen.has(p.title)) {
        seen.add(p.title);
        result.push({ id: p.id, title: p.title, imageUrl: p.imageUrl, total: reviewCounts[p.title] });
      }
    }
    // Products in reviews but not in the Shopify product list
    for (const [title, count] of Object.entries(reviewCounts)) {
      if (!seen.has(title)) {
        seen.add(title);
        result.push({ id: title, title, imageUrl: null, total: count });
      }
    }
    return result.sort((a, b) => b.total - a.total);
  }, [reviews, products]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return q ? allProductEntries.filter((p) => p.title.toLowerCase().includes(q)) : allProductEntries;
  }, [allProductEntries, productSearch]);

  const toggleProduct = useCallback((title: string) => {
    setSelectedAll(false);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });
  }, []);

  const isSelected = useCallback((title: string) => selectedAll || selectedIds.has(title), [selectedAll, selectedIds]);

  const selectedCount = selectedAll ? allProductEntries.length : selectedIds.size;

  const reviewsToExport = useMemo(() => {
    const status = statusFilter[0] as StatusFilter;
    return reviews.filter((r) => {
      const statusOk = status === "all" || r.status === status;
      const productOk = selectedAll || selectedIds.has(r.product);
      return statusOk && productOk;
    });
  }, [reviews, statusFilter, selectedAll, selectedIds]);

  const handleExport = useCallback(() => {
    if (!reviewsToExport.length) return;
    const date = new Date().toISOString().slice(0, 10);
    triggerDownload(buildCSV(reviewsToExport), `edge-reviews-export-${date}.csv`);
    setStep("done");
  }, [reviewsToExport]);

  const handleClose = useCallback(() => {
    setStep(1);
    setProductSearch("");
    setSelectedAll(true);
    setSelectedIds(new Set());
    setStatusFilter(["all"]);
    onClose();
  }, [onClose]);

  // ── Step 1: Select Products ──────────────────────────────────────────────────

  const step1 = (
    <BlockStack gap="400">
      <Text as="p" tone="subdued">
        Choose which products to include in the export. You can select all products or pick specific ones.
      </Text>

      <TextField
        label="Search"
        labelHidden
        placeholder="Search products…"
        value={productSearch}
        onChange={setProductSearch}
        prefix={<Icon source={SearchIcon} />}
        autoComplete="off"
      />

      <div style={{ border: "1px solid #e1e3e5", borderRadius: 8, overflow: "hidden" }}>
        {/* All products row */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => { setSelectedAll(true); setSelectedIds(new Set()); }}
          onKeyDown={(e) => e.key === "Enter" && (setSelectedAll(true), setSelectedIds(new Set()))}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "11px 14px", cursor: "pointer",
            background: selectedAll ? "#f0f7ff" : "#fafafa",
            borderBottom: "1px solid #e1e3e5",
            transition: "background 0.1s",
          }}
          onMouseEnter={(e) => { if (!selectedAll) (e.currentTarget as HTMLDivElement).style.background = "#f6f6f7"; }}
          onMouseLeave={(e) => { if (!selectedAll) (e.currentTarget as HTMLDivElement).style.background = "#fafafa"; }}
        >
          <div style={{
            width: 40, height: 40, borderRadius: 8, background: selectedAll ? "#dbeafe" : "#e1e3e5",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={selectedAll ? "#1d4ed8" : "#6d7175"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
              <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <Text as="p" variant="bodyMd" fontWeight={selectedAll ? "semibold" : "regular"}>All products</Text>
            <Text as="p" variant="bodySm" tone="subdued">{allProductEntries.length} product{allProductEntries.length === 1 ? "" : "s"} · {reviews.length} total reviews</Text>
          </div>
          {selectedAll && (
            <div style={{ color: "#005bd3" }}>
              <Icon source={CheckIcon} tone="interactive" />
            </div>
          )}
        </div>

        {/* Product list */}
        <div style={{ maxHeight: 280, overflowY: "auto" }}>
          {filteredProducts.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#8c9196", fontSize: 14 }}>No products found</div>
          ) : (
            filteredProducts.map((product, i) => {
              const active = !selectedAll && isSelected(product.title);
              return (
                <div
                  key={product.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleProduct(product.title)}
                  onKeyDown={(e) => e.key === "Enter" && toggleProduct(product.title)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "10px 14px", cursor: "pointer",
                    borderBottom: i < filteredProducts.length - 1 ? "1px solid #f6f6f7" : "none",
                    background: active ? "#f0f7ff" : "transparent",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "#f9f9f9"; }}
                  onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  <div style={{
                    width: 40, height: 40, borderRadius: 8, overflow: "hidden", flexShrink: 0,
                    background: "#f1f1f1", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#6d7175",
                  }}>
                    {product.imageUrl
                      ? <img src={product.imageUrl} alt={product.title} width={40} height={40} style={{ objectFit: "cover", display: "block" }} />
                      : initials(product.title)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text as="p" variant="bodyMd" fontWeight={active ? "semibold" : "regular"}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {product.title}
                      </span>
                    </Text>
                    <Text as="p" variant="bodySm" tone="subdued">{product.total} review{product.total === 1 ? "" : "s"}</Text>
                  </div>
                  {active && (
                    <div style={{ color: "#005bd3", flexShrink: 0 }}>
                      <Icon source={CheckIcon} tone="interactive" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Selection summary */}
      {!selectedAll && selectedCount > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px", borderRadius: 8,
          background: "#f0f7ff", border: "1px solid #b5d4f7",
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6, background: "#dbeafe",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon source={CheckIcon} tone="interactive" />
          </div>
          <Text as="span" variant="bodySm">
            <strong>{selectedCount}</strong> product{selectedCount === 1 ? "" : "s"} selected
          </Text>
        </div>
      )}
    </BlockStack>
  );

  // ── Step 2: Configure & Export ───────────────────────────────────────────────

  const step2 = (
    <BlockStack gap="400">
      <Text as="p" tone="subdued">
        Choose which review statuses to include, then export your reviews as a CSV file.
      </Text>

      {/* Products selected summary */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px", borderRadius: 8,
        background: "#f6f6f7", border: "1px solid #e1e3e5",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 6, background: "#e1e3e5",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6d7175" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
          </svg>
        </div>
        <Text as="span" variant="bodySm" tone="subdued">
          Exporting from: <strong>{selectedAll ? "All products" : `${selectedCount} product${selectedCount === 1 ? "" : "s"}`}</strong>
        </Text>
        <button
          type="button"
          onClick={() => setStep(1)}
          style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#005bd3", padding: 0, fontWeight: 500 }}
        >
          Change
        </button>
      </div>

      <Divider />

      {/* Status filter */}
      <ChoiceList
        title="Review status"
        choices={[
          { label: "All statuses", value: "all" },
          { label: "Published only", value: "published" },
          { label: "Pending only", value: "pending" },
          { label: "Rejected only", value: "rejected" },
        ]}
        selected={statusFilter}
        onChange={setStatusFilter}
      />

      <Divider />

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {[
          { label: "Reviews to export", value: reviewsToExport.length, color: "#303030" },
          { label: "Products included", value: selectedAll ? allProductEntries.length : selectedCount, color: "#303030" },
          {
            label: "Status",
            value: statusFilter[0] === "all" ? "All" : statusFilter[0].charAt(0).toUpperCase() + statusFilter[0].slice(1),
            color: statusFilter[0] === "published" ? "#2d7a3f" : statusFilter[0] === "pending" ? "#b58c00" : statusFilter[0] === "rejected" ? "#b52b27" : "#303030",
          },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: "center", padding: "18px 12px", background: "#f6f6f7", borderRadius: 10 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, color: "#8c9196", marginTop: 6 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* CSV columns preview */}
      <div>
        <Text as="p" variant="bodySm" tone="subdued" fontWeight="medium">Columns included in CSV:</Text>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {CSV_COLUMNS.map((col) => (
            <span key={col} style={{
              fontSize: 12, padding: "3px 10px", background: "#f1f1f1",
              borderRadius: 20, color: "#303030", fontFamily: "monospace",
            }}>
              {col}
            </span>
          ))}
        </div>
      </div>

      {reviewsToExport.length === 0 && (
        <div style={{ padding: "12px 14px", background: "#fff8ee", border: "1px solid #f7c752", borderRadius: 8 }}>
          <Text as="p" variant="bodySm" tone="caution">
            No reviews match the selected filters. Adjust your product selection or status filter.
          </Text>
        </div>
      )}
    </BlockStack>
  );

  // ── Done view ─────────────────────────────────────────────────────────────────

  const doneView = (
    <div style={{ padding: "8px 0" }}>
      <BlockStack gap="500">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "24px 0 16px" }}>
          <div style={{
            width: 64, height: 64, borderRadius: "50%", background: "#e3f1df",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="28" height="28" stroke="#2d7a3f" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <BlockStack gap="100" inlineAlign="center">
            <Text as="p" variant="headingMd" fontWeight="bold">Export complete!</Text>
            <Text as="p" variant="bodySm" tone="subdued">Your CSV file has been downloaded.</Text>
          </BlockStack>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { label: "Reviews exported", value: reviewsToExport.length, color: "#2d7a3f" },
            { label: "Products", value: selectedAll ? allProductEntries.length : selectedCount, color: "#303030" },
            { label: "Status", value: statusFilter[0] === "all" ? "All" : statusFilter[0].charAt(0).toUpperCase() + statusFilter[0].slice(1), color: "#303030" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: "center", padding: "18px 12px", background: "#f6f6f7", borderRadius: 10 }}>
              <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 12, color: "#8c9196", marginTop: 6 }}>{label}</div>
            </div>
          ))}
        </div>

        <Text as="p" variant="bodySm" tone="subdued">
          The file has been saved as <strong>edge-reviews-export-{new Date().toISOString().slice(0, 10)}.csv</strong> to your downloads folder.
        </Text>
      </BlockStack>
    </div>
  );

  // ── Modal wiring ──────────────────────────────────────────────────────────────

  const canProceed = selectedAll || selectedIds.size > 0;

  const TITLES: Record<Step, string> = {
    1: "Export Reviews — Select Products",
    2: "Export Reviews — Configure",
    done: "Export Reviews",
  };

  const primaryAction =
    step === 1
      ? { content: "Continue", onAction: () => setStep(2), disabled: !canProceed }
      : step === 2
      ? { content: reviewsToExport.length > 0 ? `Export ${reviewsToExport.length} review${reviewsToExport.length === 1 ? "" : "s"}` : "No reviews to export", onAction: handleExport, disabled: reviewsToExport.length === 0 }
      : { content: "Export again", onAction: () => setStep(1) };

  const secondaryActions =
    step === "done"
      ? [{ content: "Close", onAction: handleClose }]
      : step === 1
      ? [{ content: "Cancel", onAction: handleClose }]
      : [{ content: "Back", onAction: () => setStep(1) }];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={TITLES[step]}
      primaryAction={primaryAction}
      secondaryActions={secondaryActions}
      size="large"
    >
      <Modal.Section>
        {step !== "done" && <StepIndicator current={step as number} />}
        {step === 1 && step1}
        {step === 2 && step2}
        {step === "done" && doneView}
      </Modal.Section>
    </Modal>
  );
}
