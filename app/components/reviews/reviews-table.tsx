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
  Avatar,
  InlineStack,
} from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import type { IndexFiltersProps, TabProps } from "@shopify/polaris";
import { useState, useCallback } from "react";
import { useFetcher, useSearchParams } from "react-router";

// ── Types ──────────────────────────────────────────────────────────────────────

export type ReviewRow = {
  id: string;
  customer: string;
  initials: string;
  rating: number;
  text: string;
  product: string;
  date: string;
  status: "published" | "pending" | "rejected";
  importId: string | null;
};

interface ReviewsTableProps {
  reviews: ReviewRow[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const STATUS_KEYS = ["all", "published", "pending", "rejected"] as const;

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
  const [sortSelected, setSortSelected] = useState(["date desc"]);
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

  const handleRatingFilterChange = useCallback((v: string[]) => setRatingFilter(v), []);
  const handleRatingFilterRemove = useCallback(() => setRatingFilter(undefined), []);
  const handleQueryChange = useCallback((v: string) => setQueryValue(v), []);
  const handleQueryClear = useCallback(() => setQueryValue(""), []);
  const handleFiltersClearAll = useCallback(() => { setRatingFilter(undefined); setQueryValue(""); }, []);

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
  ];

  const appliedFilters: IndexFiltersProps["appliedFilters"] = [];
  if (ratingFilter?.length) {
    appliedFilters.push({
      key: "rating",
      label: `Rating: ${ratingFilter.map((r) => `${r}★`).join(", ")}`,
      onRemove: handleRatingFilterRemove,
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
    .sort((a, b) => {
      const [field, dir] = sortSelected[0].split(" ");
      const m = dir === "asc" ? 1 : -1;
      if (field === "customer") return m * a.customer.localeCompare(b.customer);
      if (field === "rating")   return m * (a.rating - b.rating);
      if (field === "date")     return m * (new Date(a.date).getTime() - new Date(b.date).getTime());
      return 0;
    });

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

  const rowMarkup = filtered.map((review, index) => {
    const effectiveStatus = localStatuses[review.id] ?? review.status;
    return (
      <IndexTable.Row
        id={review.id}
        key={review.id}
        selected={selectedResources.includes(review.id)}
        position={index}
      >
        <IndexTable.Cell>
          <InlineStack gap="200" blockAlign="center">
            <Avatar initials={review.initials} size="sm" />
            <Text variant="bodyMd" fontWeight="semibold" as="span">{review.customer}</Text>
          </InlineStack>
        </IndexTable.Cell>
        <IndexTable.Cell>{review.product}</IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd">
            <span style={{ color: "#fbbf24" }}>{"★".repeat(review.rating)}</span>
            <span style={{ color: "#e1e3e5" }}>{"★".repeat(5 - review.rating)}</span>
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" variant="bodyMd" tone="subdued">
            {review.text.length > 80 ? `${review.text.slice(0, 80)}…` : review.text}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{statusBadge(effectiveStatus)}</IndexTable.Cell>
        <IndexTable.Cell>{review.date}</IndexTable.Cell>
        <IndexTable.Cell>
          <s-switch
            {...({
              checked: effectiveStatus === "published" || undefined,
              onClick: () => handleTogglePublish(review.id),
            } as object)}
          />
        </IndexTable.Cell>
      </IndexTable.Row>
    );
  });

  return (
    <LegacyCard>
      <IndexFilters
        sortOptions={sortOptions}
        sortSelected={sortSelected}
        queryValue={queryValue}
        queryPlaceholder="Search by customer or product"
        onQueryChange={handleQueryChange}
        onQueryClear={handleQueryClear}
        onSort={setSortSelected}
        primaryAction={primaryAction}
        cancelAction={{ onAction: () => {}, disabled: false, loading: false }}
        tabs={tabs}
        selected={selected}
        onSelect={setSelected}
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
          { title: "Customer" },
          { title: "Product" },
          { title: "Rating" },
          { title: "Review" },
          { title: "Status" },
          { title: "Date" },
          { title: "Published" },
        ]}
      >
        {rowMarkup}
      </IndexTable>
    </LegacyCard>
  );
}
