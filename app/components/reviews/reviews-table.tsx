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
import { mockAllReviews } from "../../data/mockData";

const STATUS_KEYS = ["all", "published", "pending", "rejected"] as const;

function statusBadge(status: string | undefined) {
  switch (status) {
    case "published":
      return <Badge tone="success">Published</Badge>;
    case "pending":
      return <Badge tone="attention">Pending</Badge>;
    case "rejected":
      return <Badge tone="critical">Rejected</Badge>;
    default:
      return null;
  }
}

export function ReviewsTable() {
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const { smDown } = useBreakpoints();
  const [publishedIds, setPublishedIds] = useState<Set<string>>(
    () => new Set(mockAllReviews.filter((r) => r.status === "published").map((r) => String(r.id))),
  );
  const handleTogglePublish = (id: string) => {
    setPublishedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const [selected, setSelected] = useState(0);
  const [queryValue, setQueryValue] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string[] | undefined>(
    undefined,
  );
  const [sortSelected, setSortSelected] = useState(["date desc"]);
  const { mode, setMode } = useSetIndexFiltersMode();

  const tabs: TabProps[] = [
    {
      content: "All",
      index: 0,
      onAction: () => {},
      id: "all-0",
      isLocked: true,
    },
    {
      content: "Published",
      index: 1,
      onAction: () => {},
      id: "published-1",
      isLocked: true,
    },
    {
      content: "Pending",
      index: 2,
      onAction: () => {},
      id: "pending-2",
      isLocked: true,
    },
    {
      content: "Rejected",
      index: 3,
      onAction: () => {},
      id: "rejected-3",
      isLocked: true,
    },
  ];

  const sortOptions: IndexFiltersProps["sortOptions"] = [
    { label: "Date", value: "date desc", directionLabel: "Newest first" },
    { label: "Date", value: "date asc", directionLabel: "Oldest first" },
    { label: "Customer", value: "customer asc", directionLabel: "A-Z" },
    { label: "Customer", value: "customer desc", directionLabel: "Z-A" },
    { label: "Rating", value: "rating desc", directionLabel: "Highest first" },
    { label: "Rating", value: "rating asc", directionLabel: "Lowest first" },
  ];

  const handleRatingFilterChange = useCallback(
    (value: string[]) => setRatingFilter(value),
    [],
  );
  const handleRatingFilterRemove = useCallback(
    () => setRatingFilter(undefined),
    [],
  );
  const handleQueryChange = useCallback(
    (value: string) => setQueryValue(value),
    [],
  );
  const handleQueryClear = useCallback(() => setQueryValue(""), []);
  const handleFiltersClearAll = useCallback(() => {
    setRatingFilter(undefined);
    setQueryValue("");
  }, []);

  const filters = [
    {
      key: "rating",
      label: "Rating",
      filter: (
        <ChoiceList
          title="Rating"
          titleHidden
          choices={[
            { label: "5 stars", value: "5" },
            { label: "4 stars", value: "4" },
            { label: "3 stars", value: "3" },
            { label: "2 stars", value: "2" },
            { label: "1 star", value: "1" },
          ]}
          selected={ratingFilter || []}
          onChange={handleRatingFilterChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
  ];

  const appliedFilters: IndexFiltersProps["appliedFilters"] = [];
  if (ratingFilter && ratingFilter.length > 0) {
    appliedFilters.push({
      key: "rating",
      label: `Rating: ${ratingFilter.map((r) => `${r}★`).join(", ")}`,
      onRemove: handleRatingFilterRemove,
    });
  }

  const primaryAction: IndexFiltersProps["primaryAction"] = {
    type: "save-as",
    onAction: async (_value: string) => {
      await sleep(1);
      return true;
    },
    disabled: false,
    loading: false,
  };

  const tabStatus = STATUS_KEYS[selected];
  const filteredReviews = mockAllReviews
    .filter((r) => tabStatus === "all" || r.status === tabStatus)
    .filter((r) => {
      if (!queryValue) return true;
      const q = queryValue.toLowerCase();
      return (
        r.customer.toLowerCase().includes(q) ||
        r.product.toLowerCase().includes(q)
      );
    })
    .filter((r) => {
      if (!ratingFilter || ratingFilter.length === 0) return true;
      return ratingFilter.includes(String(r.rating));
    })
    .sort((a, b) => {
      const [field, dir] = sortSelected[0].split(" ");
      const mult = dir === "asc" ? 1 : -1;
      if (field === "customer") return mult * a.customer.localeCompare(b.customer);
      if (field === "rating") return mult * (a.rating - b.rating);
      if (field === "date")
        return mult * (new Date(a.date).getTime() - new Date(b.date).getTime());
      return 0;
    });

  const reviewsWithStringIds = filteredReviews.map((r) => ({
    ...r,
    id: String(r.id),
  }));

  const resourceName = { singular: "review", plural: "reviews" };
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(reviewsWithStringIds);

  const promotedBulkActions = [
    {
      content: "Publish reviews",
      onAction: () => console.log("Todo: implement bulk publish"),
    },
    {
      content: "Reject reviews",
      onAction: () => console.log("Todo: implement bulk reject"),
    },
  ];

  const bulkActions = [
    {
      content: "Export selected",
      onAction: () => console.log("Todo: implement bulk export"),
    },
    {
      icon: DeleteIcon,
      destructive: true,
      content: "Delete reviews",
      onAction: () => console.log("Todo: implement bulk delete"),
    },
  ];

  const rowMarkup = filteredReviews.map((review, index) => (
    <IndexTable.Row
      id={String(review.id)}
      key={review.id}
      selected={selectedResources.includes(String(review.id))}
      position={index}
    >
      <IndexTable.Cell>
        <InlineStack gap="200" blockAlign="center">
          <Avatar initials={review.initials} size="sm" />
          <Text variant="bodyMd" fontWeight="semibold" as="span">
            {review.customer}
          </Text>
        </InlineStack>
      </IndexTable.Cell>
      <IndexTable.Cell>{review.product}</IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd">
          {"★".repeat(review.rating)}
          {"☆".repeat(5 - review.rating)}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>
        <Text as="span" variant="bodyMd" tone="subdued">
          {review.text.length > 80
            ? `${review.text.slice(0, 80)}…`
            : review.text}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>{statusBadge(review.status)}</IndexTable.Cell>
      <IndexTable.Cell>{review.date}</IndexTable.Cell>
      <IndexTable.Cell>
        <s-switch
          checked={publishedIds.has(String(review.id)) || undefined}
          onClick={() => handleTogglePublish(String(review.id))}
        />
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

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
        itemCount={filteredReviews.length}
        selectedItemsCount={
          allResourcesSelected ? "All" : selectedResources.length
        }
        onSelectionChange={handleSelectionChange}
        promotedBulkActions={promotedBulkActions}
        bulkActions={bulkActions}
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
