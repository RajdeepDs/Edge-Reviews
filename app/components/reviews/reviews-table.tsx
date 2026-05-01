import {
  IndexTable,
  LegacyCard,
  IndexFilters,
  useSetIndexFiltersMode,
  useIndexResourceState,
  Text,
  ChoiceList,
  Badge,
  useBreakpoints,
} from "@shopify/polaris";
import type { IndexFiltersProps, TabProps } from "@shopify/polaris";
import { useState, useCallback } from "react";
import { useFetcher, useSearchParams } from "react-router";
import { Stars } from "../Stars";
import { EditReviewModal } from "./edit-review-modal";

// ── Types ──────────────────────────────────────────────────────────────────────

export type ReviewRow = {
  id: string;
  customer: string;
  customerEmail: string | null;
  initials: string;
  title: string | null;
  rating: number;
  text: string;
  product: string;
  date: string;
  status: "published" | "pending" | "rejected";
  importId: string | null;
  imageUrl: string | null;
};

interface ReviewsTableProps {
  reviews: ReviewRow[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 25;
const STATUS_KEYS = ["all", "published", "pending", "rejected"] as const;

// ── Helpers ────────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  switch (status) {
    case "published": return <Badge tone="success">Published</Badge>;
    case "pending":   return <Badge tone="attention">Pending</Badge>;
    case "rejected":  return <Badge tone="critical">Rejected</Badge>;
    default:          return null;
  }
}


// ── Component ─────────────────────────────────────────────────────────────────

export function ReviewsTable({ reviews }: ReviewsTableProps) {
  const [searchParams] = useSearchParams();
  const fetcher = useFetcher();

  // Seed tab from ?status= URL param
  const statusParam = searchParams.get("status");
  const initialTab =
    statusParam === "published" ? 1
    : statusParam === "pending"   ? 2
    : statusParam === "rejected"  ? 3
    : 0;

  const [selected, setSelected] = useState(initialTab);
  const [queryValue, setQueryValue] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string[] | undefined>(undefined);
  const [photoFilter, setPhotoFilter] = useState<string[] | undefined>(undefined);
  const [productFilter, setProductFilter] = useState<string[] | undefined>(undefined);
  const [sortSelected, setSortSelected] = useState(["date desc"]);
  const [page, setPage] = useState(1);
  const [editingReview, setEditingReview] = useState<ReviewRow | null>(null);
  const { mode, setMode } = useSetIndexFiltersMode();

  // Optimistic local statuses — seeded from DB, updated immediately on toggle
  const [localStatuses, setLocalStatuses] = useState<Record<string, ReviewRow["status"]>>(
    () => Object.fromEntries(reviews.map((r) => [r.id, r.status])),
  );

  const handleTogglePublish = useCallback(
    (id: string) => {
      const next: ReviewRow["status"] = localStatuses[id] === "published" ? "pending" : "published";
      setLocalStatuses((prev) => ({ ...prev, [id]: next }));
      fetcher.submit(
        { intent: "toggle-status", id, status: next },
        { method: "post", action: "/app/reviews" },
      );
    },
    [localStatuses, fetcher],
  );

  const handleTabSelect = useCallback((tab: number) => { setSelected(tab); setPage(1); }, []);

  const tabs: TabProps[] = [
    { content: "All",       onAction: () => {}, id: "all-0",       isLocked: true },
    { content: "Published", onAction: () => {}, id: "published-1", isLocked: true },
    { content: "Pending",   onAction: () => {}, id: "pending-2",   isLocked: true },
    { content: "Rejected",  onAction: () => {}, id: "rejected-3",  isLocked: true },
  ];

  const sortOptions: IndexFiltersProps["sortOptions"] = [
    { label: "Date",     value: "date desc",     directionLabel: "Newest first" },
    { label: "Date",     value: "date asc",      directionLabel: "Oldest first" },
    { label: "Customer", value: "customer asc",  directionLabel: "A-Z" },
    { label: "Customer", value: "customer desc", directionLabel: "Z-A" },
    { label: "Rating",   value: "rating desc",   directionLabel: "Highest first" },
    { label: "Rating",   value: "rating asc",    directionLabel: "Lowest first" },
  ];

  const handleRatingFilterChange = useCallback((v: string[]) => { setRatingFilter(v); setPage(1); }, []);
  const handleRatingFilterRemove = useCallback(() => { setRatingFilter(undefined); setPage(1); }, []);
  const handlePhotoFilterChange = useCallback((v: string[]) => { setPhotoFilter(v); setPage(1); }, []);
  const handlePhotoFilterRemove = useCallback(() => { setPhotoFilter(undefined); setPage(1); }, []);
  const handleProductFilterChange = useCallback((v: string[]) => { setProductFilter(v); setPage(1); }, []);
  const handleProductFilterRemove = useCallback(() => { setProductFilter(undefined); setPage(1); }, []);
  const handleQueryChange = useCallback((v: string) => { setQueryValue(v); setPage(1); }, []);
  const handleQueryClear = useCallback(() => { setQueryValue(""); setPage(1); }, []);
  const handleSortChange = useCallback((v: string[]) => { setSortSelected(v); setPage(1); }, []);
  const handleFiltersClearAll = useCallback(() => {
    setRatingFilter(undefined);
    setPhotoFilter(undefined);
    setProductFilter(undefined);
    setQueryValue("");
    setPage(1);
  }, []);

  const filters = [
    {
      key: "rating",
      label: "Rating",
      filter: (
        <ChoiceList
          title="Rating"
          titleHidden
          choices={[5, 4, 3, 2, 1].map((n) => ({ label: `${n} stars`, value: String(n) }))}
          selected={ratingFilter || []}
          onChange={handleRatingFilterChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
    {
      key: "photo",
      label: "Photo",
      filter: (
        <ChoiceList
          title="Photo"
          titleHidden
          choices={[
            { label: "Has photo", value: "yes" },
            { label: "No photo", value: "no" },
          ]}
          selected={photoFilter || []}
          onChange={handlePhotoFilterChange}
        />
      ),
      shortcut: true,
    },
    {
      key: "product",
      label: "Product",
      filter: (
        <ChoiceList
          title="Product"
          titleHidden
          choices={Array.from(new Set(reviews.map((r) => r.product))).sort().map((p) => ({ label: p, value: p }))}
          selected={productFilter || []}
          onChange={handleProductFilterChange}
          allowMultiple
        />
      ),
    },
  ];

  const appliedFilters: IndexFiltersProps["appliedFilters"] = [];
  if (ratingFilter?.length) {
    appliedFilters.push({
      key: "rating",
      label: `Rating: ${ratingFilter.map((r) => `${r}★`).join(", ")}`,
      onRemove: handleRatingFilterRemove,
    });
  }
  if (photoFilter?.length) {
    appliedFilters.push({
      key: "photo",
      label: `Photo: ${photoFilter[0] === "yes" ? "Has photo" : "No photo"}`,
      onRemove: handlePhotoFilterRemove,
    });
  }
  if (productFilter?.length) {
    appliedFilters.push({
      key: "product",
      label: `Product: ${productFilter.join(", ")}`,
      onRemove: handleProductFilterRemove,
    });
  }

  const primaryAction: IndexFiltersProps["primaryAction"] = {
    type: "save-as",
    onAction: async () => true,
    disabled: false,
    loading: false,
  };

  const tabStatus = STATUS_KEYS[selected];
  const filtered = reviews
    .filter((r) => tabStatus === "all" || r.status === tabStatus)
    .filter((r) => {
      if (!queryValue) return true;
      const q = queryValue.toLowerCase();
      return r.customer.toLowerCase().includes(q) || r.product.toLowerCase().includes(q);
    })
    .filter((r) => (!ratingFilter?.length) || ratingFilter.includes(String(r.rating)))
    .filter((r) => !photoFilter?.length || (photoFilter[0] === "yes" ? r.imageUrl !== null : r.imageUrl === null))
    .filter((r) => !productFilter?.length || productFilter.includes(r.product))
    .sort((a, b) => {
      const [field, dir] = sortSelected[0].split(" ");
      const m = dir === "asc" ? 1 : -1;
      if (field === "customer") return m * a.customer.localeCompare(b.customer);
      if (field === "rating")   return m * (a.rating - b.rating);
      if (field === "date")     return m * (new Date(a.date).getTime() - new Date(b.date).getTime());
      return 0;
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const resourceName = { singular: "review", plural: "reviews" };
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(filtered);

  const handleBulkPublish = () => {
    selectedResources.forEach((id) => setLocalStatuses((p) => ({ ...p, [id]: "published" })));
    fetcher.submit(
      { intent: "bulk-publish", ids: JSON.stringify(selectedResources) },
      { method: "post", action: "/app/reviews" },
    );
  };

  const handleBulkReject = () => {
    selectedResources.forEach((id) => setLocalStatuses((p) => ({ ...p, [id]: "rejected" })));
    fetcher.submit(
      { intent: "bulk-reject", ids: JSON.stringify(selectedResources) },
      { method: "post", action: "/app/reviews" },
    );
  };

  const handleBulkDelete = () => {
    fetcher.submit(
      { intent: "bulk-delete", ids: JSON.stringify(selectedResources) },
      { method: "post", action: "/app/reviews" },
    );
  };

  const { smDown } = useBreakpoints();

  const rowMarkup = paginated.map((review, index) => {
    const effectiveStatus = localStatuses[review.id] ?? review.status;
    return (
      <IndexTable.Row
        id={review.id}
        key={review.id}
        selected={selectedResources.includes(review.id)}
        position={(safePage - 1) * PAGE_SIZE + index}
        onClick={() => setEditingReview(review)}
      >
        <IndexTable.Cell>
          <div style={{ width: 40, height: 40, borderRadius: 6, overflow: "hidden", flexShrink: 0 }}>
            <s-thumbnail
              {...({
                alt: review.imageUrl ? review.customer : "No image available",
                size: "small",
                ...(review.imageUrl ? { src: review.imageUrl } : {}),
                style: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
              } as object)}
            />
          </div>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <div>
            <Text as="p" variant="bodyMd" fontWeight="semibold">
              {review.title ?? "—"}
            </Text>
            <Text as="p" variant="bodySm" tone="subdued">
              {review.text.length > 80 ? `${review.text.slice(0, 80)}…` : review.text}
            </Text>
          </div>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Stars n={review.rating} size={13} />
        </IndexTable.Cell>
        <IndexTable.Cell>{review.product}</IndexTable.Cell>
        <IndexTable.Cell>{statusBadge(effectiveStatus)}</IndexTable.Cell>
        <IndexTable.Cell>{review.date}</IndexTable.Cell>
        <IndexTable.Cell>
          <s-switch
            {...({
              checked: effectiveStatus === "published" || undefined,
              onClick: (e: Event) => {
                e.stopPropagation();
                handleTogglePublish(review.id);
              },
            } as object)}
          />
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <>
    <LegacyCard>
      <IndexFilters
        sortOptions={sortOptions}
        sortSelected={sortSelected}
        queryValue={queryValue}
        queryPlaceholder="Search by customer or product"
        onQueryChange={handleQueryChange}
        onQueryClear={handleQueryClear}
        onSort={handleSortChange}
        primaryAction={primaryAction}
        cancelAction={{ onAction: () => {}, disabled: false, loading: false }}
        tabs={tabs}
        selected={selected}
        onSelect={handleTabSelect}
        canCreateNewView={false}
        filters={filters}
        appliedFilters={appliedFilters}
        onClearAll={handleFiltersClearAll}
        mode={mode}
        setMode={setMode}
      />
      <IndexTable
        condensed={smDown}
        resourceName={resourceName}
        itemCount={filtered.length}
        selectedItemsCount={allResourcesSelected ? "All" : selectedResources.length}
        onSelectionChange={handleSelectionChange}
        promotedBulkActions={[
          { content: "Publish reviews", onAction: handleBulkPublish },
          { content: "Reject reviews",  onAction: handleBulkReject },
        ]}
        bulkActions={[
          { content: "Delete reviews", onAction: handleBulkDelete },
        ]}
        headings={[
          { title: "" },
          { title: "Review" },
          { title: "Rating" },
          { title: "Product" },
          { title: "Status" },
          { title: "Date" },
          { title: "Published" },
        ]}
        pagination={{
          hasPrevious: safePage > 1,
          onPrevious: () => setPage((p) => p - 1),
          hasNext: safePage < totalPages,
          onNext: () => setPage((p) => p + 1),
          label: `${safePage} / ${totalPages}`,
        }}
      >
        {rowMarkup}
      </IndexTable>
    </LegacyCard>

    <EditReviewModal
      review={editingReview}
      onClose={() => setEditingReview(null)}
    />
    </>
  );
}
