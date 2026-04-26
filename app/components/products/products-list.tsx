import {
  IndexTable,
  LegacyCard,
  IndexFilters,
  useSetIndexFiltersMode,
  useIndexResourceState,
  Text,
  Badge,
  InlineStack,
  useBreakpoints,
  ChoiceList,
} from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import type { IndexFiltersProps, TabProps } from "@shopify/polaris";
import { useState, useCallback } from "react";
import type { ProductWithStats } from "../../routes/app.products";

const STATUS_KEYS = ["all", "active", "draft", "archived"] as const;

function statusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge tone="success">Active</Badge>;
    case "draft":
      return <Badge>Draft</Badge>;
    case "archived":
      return <Badge tone="warning">Archived</Badge>;
    default:
      return null;
  }
}

function StarRating({ avg }: { avg: number }) {
  const full = Math.floor(avg);
  const half = avg - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <Text as="span" variant="bodyMd">
      <span style={{ color: "#f59e0b" }}>
        {"★".repeat(full)}
        {half ? "½" : ""}
        {"☆".repeat(empty)}
      </span>{" "}
      <Text as="span" variant="bodySm" tone="subdued">
        {avg.toFixed(1)}
      </Text>
    </Text>
  );
}

interface ProductsListProps {
  products: ProductWithStats[];
}

export function ProductsList({ products }: ProductsListProps) {
  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const { smDown } = useBreakpoints();
  const [selected, setSelected] = useState(0);
  const [queryValue, setQueryValue] = useState("");
  const [typeFilter, setTypeFilter] = useState<string[] | undefined>(undefined);
  const [sortSelected, setSortSelected] = useState(["name asc"]);
  const { mode, setMode } = useSetIndexFiltersMode();

  const allTypes = Array.from(
    new Set(products.map((p) => p.type).filter(Boolean)),
  ).sort();

  const tabs: TabProps[] = [
    { content: "All", onAction: () => {}, id: "all-0", isLocked: true },
    { content: "Active", onAction: () => {}, id: "active-1", isLocked: true },
    { content: "Draft", onAction: () => {}, id: "draft-2", isLocked: true },
    {
      content: "Archived",
      onAction: () => {},
      id: "archived-3",
      isLocked: true,
    },
  ];

  const sortOptions: IndexFiltersProps["sortOptions"] = [
    { label: "Name", value: "name asc", directionLabel: "A–Z" },
    { label: "Name", value: "name desc", directionLabel: "Z–A" },
    { label: "Rating", value: "rating desc", directionLabel: "Highest first" },
    { label: "Rating", value: "rating asc", directionLabel: "Lowest first" },
    { label: "Reviews", value: "reviews desc", directionLabel: "Most first" },
    { label: "Reviews", value: "reviews asc", directionLabel: "Fewest first" },
  ];

  const handleTypeFilterChange = useCallback(
    (value: string[]) => setTypeFilter(value),
    [],
  );
  const handleTypeFilterRemove = useCallback(
    () => setTypeFilter(undefined),
    [],
  );
  const handleQueryChange = useCallback(
    (value: string) => setQueryValue(value),
    [],
  );
  const handleQueryClear = useCallback(() => setQueryValue(""), []);
  const handleFiltersClearAll = useCallback(() => {
    setTypeFilter(undefined);
    setQueryValue("");
  }, []);

  const filters = [
    {
      key: "type",
      label: "Type",
      filter: (
        <ChoiceList
          title="Type"
          titleHidden
          choices={allTypes.map((t) => ({ label: t, value: t }))}
          selected={typeFilter || []}
          onChange={handleTypeFilterChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
  ];

  const appliedFilters: IndexFiltersProps["appliedFilters"] = [];
  if (typeFilter && typeFilter.length > 0) {
    appliedFilters.push({
      key: "type",
      label: `Type: ${typeFilter.join(", ")}`,
      onRemove: handleTypeFilterRemove,
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
  const filteredProducts = products
    .filter((p) => tabStatus === "all" || p.status === tabStatus)
    .filter((p) => {
      if (!queryValue) return true;
      const q = queryValue.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.vendor.toLowerCase().includes(q)
      );
    })
    .filter((p) => {
      if (!typeFilter || typeFilter.length === 0) return true;
      return typeFilter.includes(p.type);
    })
    .sort((a, b) => {
      const [field, dir] = sortSelected[0].split(" ");
      const mult = dir === "asc" ? 1 : -1;
      if (field === "name") return mult * a.name.localeCompare(b.name);
      if (field === "rating") return mult * (a.avgRating - b.avgRating);
      if (field === "reviews") return mult * (a.reviewCount - b.reviewCount);
      return 0;
    });

  const resourceName = { singular: "product", plural: "products" };
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(filteredProducts);

  const promotedBulkActions = [
    {
      content: "Set as active",
      onAction: () => console.log("Todo: bulk activate"),
    },
    {
      content: "Set as archived",
      onAction: () => console.log("Todo: bulk archive"),
    },
  ];

  const bulkActions = [
    {
      content: "Export selected",
      onAction: () => console.log("Todo: bulk export"),
    },
    {
      icon: DeleteIcon,
      destructive: true,
      content: "Delete products",
      onAction: () => console.log("Todo: bulk delete"),
    },
  ];

  const rowMarkup = filteredProducts.map((product, index) => (
    <IndexTable.Row
      id={product.id}
      key={product.id}
      selected={selectedResources.includes(product.id)}
      position={index}
    >
      <IndexTable.Cell>
        <InlineStack gap="200" blockAlign="center">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 6,
              overflow: "hidden",
              flexShrink: 0,
              background: "#f1f1f1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 600,
              color: "#6d7175",
            }}
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                width={36}
                height={36}
                style={{ objectFit: "cover", display: "block" }}
              />
            ) : (
              product.initials
            )}
          </div>
          <div>
            <InlineStack gap="200" blockAlign="center">
              <Text variant="bodyMd" fontWeight="semibold" as="span">
                {product.name}
              </Text>
              {product.reviewCount === 0 && <Badge tone="new">No reviews</Badge>}
            </InlineStack>
            <Text variant="bodySm" tone="subdued" as="p">
              {product.vendor}
              {product.type ? ` · ${product.type}` : ""}
            </Text>
          </div>
        </InlineStack>
      </IndexTable.Cell>
      <IndexTable.Cell>{statusBadge(product.status)}</IndexTable.Cell>
      <IndexTable.Cell>
        {product.reviewCount > 0 && <StarRating avg={product.avgRating} />}
      </IndexTable.Cell>
      <IndexTable.Cell>
        {product.reviewCount > 0 && (
          <Text as="span" variant="bodyMd">
            {product.reviewCount}
          </Text>
        )}
      </IndexTable.Cell>
      <IndexTable.Cell>
        {product.pendingCount > 0 && (
          <Badge tone="attention">{String(product.pendingCount)}</Badge>
        )}
      </IndexTable.Cell>
      <IndexTable.Cell>
        {product.lastReview && (
          <Text as="span" variant="bodyMd" tone="subdued">
            {product.lastReview}
          </Text>
        )}
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <LegacyCard>
      <IndexFilters
        sortOptions={sortOptions}
        sortSelected={sortSelected}
        queryValue={queryValue}
        queryPlaceholder="Search by product or vendor"
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
        itemCount={filteredProducts.length}
        selectedItemsCount={
          allResourcesSelected ? "All" : selectedResources.length
        }
        onSelectionChange={handleSelectionChange}
        promotedBulkActions={promotedBulkActions}
        bulkActions={bulkActions}
        headings={[
          { title: "Product" },
          { title: "Status" },
          { title: "Avg Rating" },
          { title: "Reviews" },
          { title: "Pending" },
          { title: "Last Review" },
        ]}
      >
        {rowMarkup}
      </IndexTable>
    </LegacyCard>
  );
}
