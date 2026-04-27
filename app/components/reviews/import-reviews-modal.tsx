import { Fragment, useState, useCallback } from "react";
import { useFetcher, useNavigate } from "react-router";
import {
  Modal,
  TextField,
  Select,
  Banner,
  Spinner,
  DropZone,
  Text,
  BlockStack,
  Divider,
  Icon,
} from "@shopify/polaris";
import { SearchIcon, CheckIcon } from "@shopify/polaris-icons";

// ── Types ────────────────────────────────────────────────────────────────────

export type ImportProduct = {
  id: string;
  title: string;
  imageUrl: string | null;
};

type Mapping = {
  customerName: string;
  rating: string;
  title: string;
  body: string;
  customerEmail: string;
  date: string;
  imageUrl: string;
};

type CsvData = { headers: string[]; rows: string[][] };

type Step = 1 | 2 | 3 | "result";

interface Props {
  open: boolean;
  onClose: () => void;
  products: ImportProduct[];
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

function parseCSVText(text: string): CsvData {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const parseRow = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (ch === "," && !inQ) { out.push(cur.trim()); cur = ""; }
      else cur += ch;
    }
    out.push(cur.trim());
    return out;
  };
  const valid = lines.filter((l) => l.trim());
  if (!valid.length) return { headers: [], rows: [] };
  return { headers: parseRow(valid[0]), rows: valid.slice(1).map(parseRow) };
}

function autoDetect(headers: string[]): Partial<Mapping> {
  const norm = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const find = (...keys: string[]) => {
    const i = norm.findIndex((h) => keys.some((k) => h.includes(k)));
    return i >= 0 ? headers[i] : "";
  };
  return {
    customerName: find("name", "customer", "author", "reviewer", "fullname", "user"),
    rating: find("rating", "star", "score", "stars", "rate"),
    title: find("title", "subject", "headline", "summary"),
    body: find("body", "review", "text", "comment", "content", "message", "description"),
    customerEmail: find("email", "mail"),
    date: find("date", "createdat", "created", "timestamp"),
    imageUrl: find("image", "imageurl", "photo", "picture", "avatar", "img"),
  };
}

function initials(title: string) {
  const w = title.trim().split(/\s+/);
  return w.length === 1 ? w[0].slice(0, 2).toUpperCase() : (w[0][0] + w[1][0]).toUpperCase();
}

// ── Step indicator ────────────────────────────────────────────────────────────

const STEP_LABELS = ["Select Product", "Upload CSV", "Map Fields"];

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

// ── Field mapping row ─────────────────────────────────────────────────────────

function FieldRow({
  label,
  description,
  required,
  options,
  value,
  onChange,
  sample,
}: {
  label: string;
  description: string;
  required?: boolean;
  options: { label: string; value: string }[];
  value: string;
  onChange: (v: string) => void;
  sample: string | null;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "200px 1fr 130px",
        gap: 14,
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid #f6f6f7",
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <Text as="span" variant="bodyMd" fontWeight="semibold">{label}</Text>
          {required && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "1px 6px",
              background: "#fce8e6", color: "#b52b27", borderRadius: 20,
            }}>
              Required
            </span>
          )}
        </div>
        <Text as="p" variant="bodySm" tone="subdued">{description}</Text>
      </div>
      <Select label={label} labelHidden options={options} value={value} onChange={onChange} />
      <div style={{ fontSize: 12, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {sample
          ? <span style={{ background: "#f6f6f7", padding: "2px 7px", borderRadius: 4, color: "#303030" }}>{sample.length > 16 ? sample.slice(0, 16) + "…" : sample}</span>
          : <span style={{ color: "#c4c4c4" }}>—</span>}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const EMPTY_MAPPING: Mapping = { customerName: "", rating: "", title: "", body: "", customerEmail: "", date: "", imageUrl: "" };

export function ImportReviewsModal({ open, onClose, products }: Props) {
  const navigate = useNavigate();
  const fetcher = useFetcher<{
    ok: boolean;
    intent?: string;
    succeeded?: number;
    failed?: number;
    total?: number;
    importId?: string;
    error?: string;
  }>();

  const [step, setStep] = useState<Step>(1);
  const [selectedProduct, setSelectedProduct] = useState<ImportProduct | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CsvData | null>(null);
  const [mapping, setMapping] = useState<Mapping>(EMPTY_MAPPING);

  const isSubmitting = fetcher.state !== "idle";
  const result = step === "result" ? fetcher.data : undefined;

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    setStep(1);
    setSelectedProduct(null);
    setProductSearch("");
    setCsvFile(null);
    setCsvData(null);
    setMapping(EMPTY_MAPPING);
    onClose();
  }, [isSubmitting, onClose]);

  const handleFileDrop = useCallback(
    (_all: File[], accepted: File[]) => {
      const file = accepted[0];
      if (!file) return;
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = parseCSVText(e.target?.result as string);
        setCsvData(data);
        const detected = autoDetect(data.headers);
        setMapping({
          customerName: detected.customerName ?? "",
          rating: detected.rating ?? "",
          title: detected.title ?? "",
          body: detected.body ?? "",
          customerEmail: detected.customerEmail ?? "",
          date: detected.date ?? "",
          imageUrl: detected.imageUrl ?? "",
        });
      };
      reader.readAsText(file);
    },
    [],
  );

  const handleImport = () => {
    if (!selectedProduct || !csvData || !mapping.customerName || !mapping.rating || !mapping.body) return;
    const { headers, rows } = csvData;
    const idx = (col: string) => headers.indexOf(col);
    const mappedRows = rows
      .filter((r) => r.some((c) => c.trim()))
      .map((row) => ({
        customerName: row[idx(mapping.customerName)] ?? "",
        rating: Number(row[idx(mapping.rating)] ?? 0),
        body: row[idx(mapping.body)] ?? "",
        ...(mapping.title ? { title: row[idx(mapping.title)] ?? "" } : {}),
        ...(mapping.customerEmail ? { customerEmail: row[idx(mapping.customerEmail)] ?? "" } : {}),
        ...(mapping.date ? { date: row[idx(mapping.date)] ?? "" } : {}),
        ...(mapping.imageUrl ? { imageUrl: row[idx(mapping.imageUrl)] ?? "" } : {}),
      }));

    const fd = new FormData();
    fd.set("intent", "import");
    fd.set("productId", selectedProduct.id);
    fd.set("productTitle", selectedProduct.title);
    fd.set("filename", csvFile?.name ?? "import.csv");
    fd.set("rows", JSON.stringify(mappedRows));
    fetcher.submit(fd, { method: "post", action: "/app/reviews" });
    setStep("result");
  };

  const sampleFor = (col: string) => {
    if (!csvData || !col) return null;
    const i = csvData.headers.indexOf(col);
    if (i < 0) return null;
    return csvData.rows[0]?.[i]?.trim() || null;
  };

  const setField = (key: keyof Mapping) => (v: string) =>
    setMapping((prev) => ({ ...prev, [key]: v }));

  // ── Column option lists ──────────────────────────────────────────────────────

  const colOptions = [
    { label: "— Select column —", value: "" },
    ...(csvData?.headers.map((h) => ({ label: h, value: h })) ?? []),
  ];
  const colOptional = [
    { label: "— Skip —", value: "" },
    ...(csvData?.headers.map((h) => ({ label: h, value: h })) ?? []),
  ];

  // ── Validity gates ───────────────────────────────────────────────────────────

  const canNext: Record<number, boolean> = {
    1: !!selectedProduct,
    2: !!csvFile && !!(csvData?.headers.length),
    3: !!mapping.customerName && !!mapping.rating && !!mapping.body,
  };

  const filteredProducts = productSearch.trim()
    ? products.filter((p) => p.title.toLowerCase().includes(productSearch.toLowerCase()))
    : products;

  // ── Step 1: Select Product ───────────────────────────────────────────────────

  const step1 = (
    <BlockStack gap="400">
      <Text as="p" tone="subdued">
        Choose which product these reviews belong to. All imported reviews will be linked to this product.
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
      {selectedProduct && (
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px", borderRadius: 8,
          background: "#f0f7ff", border: "1px solid #b5d4f7",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 6, overflow: "hidden", flexShrink: 0,
            background: "#e1e3e5", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#6d7175",
          }}>
            {selectedProduct.imageUrl
              ? <img src={selectedProduct.imageUrl} alt="" width={32} height={32} style={{ objectFit: "cover" }} />
              : initials(selectedProduct.title)}
          </div>
          <Text as="span" variant="bodySm">
            <Text as="span" tone="subdued">Importing for: </Text>
            <strong>{selectedProduct.title}</strong>
          </Text>
        </div>
      )}
    </BlockStack>
  );

  // ── Step 2: Upload CSV ────────────────────────────────────────────────────────

  const step2 = (
    <BlockStack gap="400">
      <Text as="p" tone="subdued">
        Upload a CSV file with your reviews. The first row must contain column headers.
      </Text>
      {!csvFile ? (
        <DropZone onDrop={handleFileDrop} accept=".csv,text/csv" allowMultiple={false} label="Drop CSV here">
          <div style={{ padding: "36px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, background: "#f6f6f7",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="26" height="26" stroke="#8c9196" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <BlockStack gap="100" inlineAlign="center">
              <Text as="p" variant="bodyMd" fontWeight="semibold">Drop your CSV here, or click to browse</Text>
              <Text as="p" variant="bodySm" tone="subdued">Accepts .csv files only</Text>
            </BlockStack>
          </div>
        </DropZone>
      ) : (
        <BlockStack gap="400">
          {/* File info */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
            background: "#f6f6f7", border: "1px solid #e1e3e5", borderRadius: 8,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 8, background: "#e3f1df",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width="20" height="20" stroke="#2d7a3f" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text as="p" variant="bodyMd" fontWeight="semibold">{csvFile.name}</Text>
              <Text as="p" variant="bodySm" tone="subdued">
                {(csvData?.rows.length ?? 0).toLocaleString()} rows · {csvData?.headers.length ?? 0} columns detected
              </Text>
            </div>
            <button
              onClick={() => { setCsvFile(null); setCsvData(null); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6d7175", padding: 6, borderRadius: 4, fontSize: 16, lineHeight: 1 }}
              title="Remove file"
            >
              ✕
            </button>
          </div>

          {/* Detected columns */}
          <div>
            <Text as="p" variant="bodySm" tone="subdued" fontWeight="medium">Columns detected:</Text>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {csvData?.headers.map((h) => (
                <span key={h} style={{
                  fontSize: 12, padding: "3px 10px", background: "#f1f1f1",
                  borderRadius: 20, color: "#303030", fontFamily: "monospace",
                }}>
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* Row preview */}
          {csvData && csvData.rows.length > 0 && (
            <div>
              <Text as="p" variant="bodySm" tone="subdued" fontWeight="medium">Preview (first 3 rows):</Text>
              <div style={{ marginTop: 8, overflowX: "auto", border: "1px solid #e1e3e5", borderRadius: 6 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "#f6f6f7" }}>
                      {csvData.headers.map((h) => (
                        <th key={h} style={{ padding: "7px 10px", textAlign: "left", borderBottom: "1px solid #e1e3e5", fontWeight: 600, color: "#6d7175", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.rows.slice(0, 3).map((row, ri) => (
                      <tr key={ri} style={{ borderBottom: "1px solid #f1f1f1" }}>
                        {csvData.headers.map((_, ci) => (
                          <td key={ci} style={{ padding: "6px 10px", color: "#303030", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {row[ci] ?? ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </BlockStack>
      )}
    </BlockStack>
  );

  // ── Step 3: Map Fields ────────────────────────────────────────────────────────

  const step3 = (
    <BlockStack gap="400">
      <Text as="p" tone="subdued">
        Map your CSV columns to the correct review fields. Required fields must be mapped before importing.
      </Text>

      {/* Column headers */}
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr 130px", gap: 14, padding: "0 0 4px" }}>
        <Text as="span" variant="bodySm" tone="subdued" fontWeight="medium">FIELD</Text>
        <Text as="span" variant="bodySm" tone="subdued" fontWeight="medium">YOUR COLUMN</Text>
        <Text as="span" variant="bodySm" tone="subdued" fontWeight="medium">SAMPLE VALUE</Text>
      </div>
      <Divider />

      <FieldRow label="Customer Name"  description="Full name of the reviewer"      required options={colOptions}  value={mapping.customerName}  onChange={setField("customerName")}  sample={sampleFor(mapping.customerName)} />
      <FieldRow label="Star Rating"    description="Number from 1 to 5"             required options={colOptions}  value={mapping.rating}        onChange={setField("rating")}        sample={sampleFor(mapping.rating)} />
      <FieldRow label="Review Text"    description="The written review content"     required options={colOptions}  value={mapping.body}          onChange={setField("body")}          sample={sampleFor(mapping.body)} />

      <div style={{ paddingTop: 8 }}>
        <Text as="p" variant="bodyMd" fontWeight="semibold" tone="subdued">Optional Fields</Text>
      </div>
      <Divider />

      <FieldRow label="Review Title"   description="Short headline for the review"           options={colOptional} value={mapping.title}         onChange={setField("title")}         sample={sampleFor(mapping.title)} />
      <FieldRow label="Customer Email" description="Reviewer's email address"                options={colOptional} value={mapping.customerEmail} onChange={setField("customerEmail")} sample={sampleFor(mapping.customerEmail)} />
      <FieldRow label="Review Date"    description="When the review was written"             options={colOptional} value={mapping.date}          onChange={setField("date")}          sample={sampleFor(mapping.date)} />
      <FieldRow label="Review Image"   description="URL of an image attached to the review"  options={colOptional} value={mapping.imageUrl}      onChange={setField("imageUrl")}      sample={sampleFor(mapping.imageUrl)} />

      {/* Row estimate */}
      {csvData && (
        <div style={{ padding: "10px 14px", background: "#f6f6f7", borderRadius: 8, marginTop: 4 }}>
          <Text as="p" variant="bodySm" tone="subdued">
            <strong>{csvData.rows.filter((r) => r.some((c) => c.trim())).length.toLocaleString()}</strong> rows will be processed.
            Rows with missing or invalid required fields will be skipped.
          </Text>
        </div>
      )}
    </BlockStack>
  );

  // ── Result view ───────────────────────────────────────────────────────────────

  const resultView = (
    <div style={{ padding: "8px 0" }}>
      {isSubmitting ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "48px 0" }}>
          <Spinner size="large" />
          <Text as="p" variant="bodyMd" tone="subdued">Importing reviews, please wait…</Text>
        </div>
      ) : result?.ok ? (
        <BlockStack gap="500">
          <Banner
            title={result.failed === 0 ? "Import complete!" : result.succeeded === 0 ? "Import failed" : "Import partially complete"}
            tone={result.failed === 0 ? "success" : result.succeeded === 0 ? "critical" : "warning"}
          >
            <p>
              {(result.succeeded ?? 0).toLocaleString()} of {(result.total ?? 0).toLocaleString()} rows imported successfully.
              {(result.failed ?? 0) > 0 && ` ${result.failed!.toLocaleString()} rows were skipped due to missing or invalid data.`}
            </p>
          </Banner>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { label: "Total rows",  value: result.total ?? 0,     color: "#6d7175" },
              { label: "Imported",    value: result.succeeded ?? 0,  color: "#2d7a3f" },
              { label: "Skipped",     value: result.failed ?? 0,     color: (result.failed ?? 0) > 0 ? "#b52b27" : "#6d7175" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: "center", padding: "20px 16px", background: "#f6f6f7", borderRadius: 10 }}>
                <div style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>{value.toLocaleString()}</div>
                <div style={{ fontSize: 13, color: "#8c9196", marginTop: 6 }}>{label}</div>
              </div>
            ))}
          </div>

          {(result.succeeded ?? 0) > 0 && (
            <Text as="p" variant="bodySm" tone="subdued">
              Imported reviews are pending approval. Publish them from the Reviews page to make them visible on your storefront.
            </Text>
          )}
        </BlockStack>
      ) : (
        <Banner title="Import failed" tone="critical">
          <p>{result?.error ?? "Something went wrong. Please try again."}</p>
        </Banner>
      )}
    </div>
  );

  // ── Modal wiring ──────────────────────────────────────────────────────────────

  const TITLES: Record<Step, string> = {
    1: "Import Reviews — Select Product",
    2: "Import Reviews — Upload CSV",
    3: "Import Reviews — Map Fields",
    result: "Import Reviews",
  };

  const primaryAction =
    step === 1 ? { content: "Continue", onAction: () => setStep(2), disabled: !canNext[1] }
    : step === 2 ? { content: "Continue", onAction: () => setStep(3), disabled: !canNext[2] }
    : step === 3 ? { content: isSubmitting ? "Importing…" : "Import Reviews", onAction: handleImport, disabled: !canNext[3] || isSubmitting, loading: isSubmitting }
    : {
        content: "View imported reviews",
        onAction: () => {
          handleClose();
          navigate("/app/reviews");
        },
      };

  const secondaryActions =
    step === "result"
      ? [{ content: "Close", onAction: handleClose }]
      : step === 1
      ? [{ content: "Cancel", onAction: handleClose }]
      : [{ content: "Back", onAction: () => setStep((s) => ((s as number) - 1) as Step) }];

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
        {step !== "result" && <StepIndicator current={step as number} />}
        {step === 1 && step1}
        {step === 2 && step2}
        {step === 3 && step3}
        {step === "result" && resultView}
      </Modal.Section>
    </Modal>
  );
}
