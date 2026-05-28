import { useState, useCallback, useEffect, useRef } from "react";
import { useFetcher } from "react-router";
import { Modal, BlockStack, InlineStack, Text, TextField, Select, Divider } from "@shopify/polaris";
import type { ReviewRow } from "./reviews-table";

interface Props {
  review: ReviewRow | null;
  onClose: () => void;
}

export function EditReviewModal({ review, onClose }: Props) {
  const fetcher = useFetcher();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [rating, setRating] = useState("5");
  const [status, setStatus] = useState<"published" | "pending" | "rejected">("pending");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const submittedReviewIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (review) {
      setCustomerName(review.customer);
      setCustomerEmail(review.customerEmail ?? "");
      setRating(String(review.rating));
      setStatus(review.status);
      setTitle(review.title ?? "");
      setBody(review.text);
      setImagePreview(review.imageUrl);
      setImageFile(null);
      setRemoveImage(false);
    }
  }, [review]);

  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  const prevFetcherState = useRef(fetcher.state);
  useEffect(() => {
    const wasSubmitting = prevFetcherState.current !== "idle";
    prevFetcherState.current = fetcher.state;
    const data = fetcher.data as { ok?: boolean; intent?: string; id?: string } | undefined;
    const submittedReviewId = submittedReviewIdRef.current;
    if (!wasSubmitting || fetcher.state !== "idle" || data?.intent !== "edit-review") {
      return;
    }

    if (data?.ok && submittedReviewId && data.id === submittedReviewId) {
      submittedReviewIdRef.current = null;
      onCloseRef.current();
    }
    if (data && !data.ok) {
      submittedReviewIdRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state, fetcher.data]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImagePreview(null);
    setImageFile(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleSubmit = useCallback(() => {
    if (!review) return;
    const fd = new FormData();
    fd.set("intent", "edit-review");
    fd.set("id", review.id);
    fd.set("customerName", customerName);
    fd.set("customerEmail", customerEmail);
    fd.set("rating", rating);
    fd.set("status", status);
    fd.set("title", title);
    fd.set("body", body);
    fd.set("removeImage", String(removeImage));
    if (imageFile) fd.set("image", imageFile);
    submittedReviewIdRef.current = review.id;
    fetcher.submit(fd, { method: "post", action: "/app/reviews", encType: "multipart/form-data" });
  }, [review, customerName, customerEmail, rating, status, title, body, imageFile, removeImage, fetcher]);

  const isSaving = fetcher.state !== "idle";

  const ratingOptions = [
    { label: "1 star", value: "1" },
    { label: "2 stars", value: "2" },
    { label: "3 stars", value: "3" },
    { label: "4 stars", value: "4" },
    { label: "5 stars", value: "5" },
  ];

  const statusOptions = [
    { label: "Published", value: "published" },
    { label: "Pending", value: "pending" },
    { label: "Rejected", value: "rejected" },
  ];

  return (
    <Modal
      open={!!review}
      onClose={onClose}
      title="Review Details"
      primaryAction={{ content: "Save Changes", onAction: handleSubmit, loading: isSaving }}
      secondaryActions={[{ content: "Cancel", onAction: onClose }]}
    >
      <Modal.Section>
        <BlockStack gap="400">

          {/* Review Images */}
          <BlockStack gap="200">
            <Text as="p" variant="bodyMd" fontWeight="bold">Review Images</Text>
            <InlineStack gap="200" blockAlign="end">
              {imagePreview && (
                <div style={{ position: "relative", display: "inline-block" }}>
                  <img
                    src={imagePreview}
                    alt="Review"
                    style={{ width: 110, height: 110, objectFit: "cover", borderRadius: 8, display: "block", border: "1px solid #e1e3e5" }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "rgba(50,50,50,0.85)",
                      border: "none",
                      color: "#fff",
                      fontSize: 13,
                      lineHeight: 1,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              )}
            </InlineStack>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            <div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: "1px solid #c9cccf",
                  borderRadius: 6,
                  background: "#fff",
                  padding: "6px 14px",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  color: "#202223",
                }}
              >
                Upload Image
              </button>
            </div>
          </BlockStack>

          {/* Product + date */}
          <BlockStack gap="0">
            <Text as="p" variant="bodyMd" fontWeight="bold">{review?.product}</Text>
            <Text as="p" variant="bodySm" tone="subdued">Submitted {review?.date}</Text>
          </BlockStack>

          <Divider />

          {/* Customer Name + Email */}
          <InlineStack gap="400" blockAlign="start">
            <div style={{ flex: 1 }}>
              <TextField
                label="Customer Name"
                value={customerName}
                onChange={setCustomerName}
                autoComplete="off"
              />
            </div>
            <div style={{ flex: 1 }}>
              <TextField
                label="Customer Email"
                value={customerEmail}
                onChange={setCustomerEmail}
                autoComplete="off"
                type="email"
                placeholder="customer@yourdomain.com"
              />
            </div>
          </InlineStack>

          {/* Rating + Status */}
          <InlineStack gap="400" blockAlign="start">
            <div style={{ flex: 1 }}>
              <Select
                label="Rating"
                options={ratingOptions}
                value={rating}
                onChange={setRating}
              />
            </div>
            <div style={{ flex: 1 }}>
              <Select
                label="Status"
                options={statusOptions}
                value={status}
                onChange={(v) => setStatus(v as "published" | "pending" | "rejected")}
              />
            </div>
          </InlineStack>

          {/* Review Title */}
          <TextField
            label="Review Title"
            value={title}
            onChange={setTitle}
            autoComplete="off"
            placeholder="Optional headline"
          />

          {/* Review Content */}
          <TextField
            label="Review Content"
            labelHidden={false}
            value={body}
            onChange={setBody}
            multiline={4}
            autoComplete="off"
          />

        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
