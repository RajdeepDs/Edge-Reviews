import { useState } from "react";
import { mockProducts } from "../../data/mockData";

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  active: { bg: "#dcfce7", color: "#15803d" },
  draft: { bg: "#f3f4f6", color: "#6b7280" },
  archived: { bg: "#fef3c7", color: "#92400e" },
};

export function ProductsList() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sort, setSort] = useState("name-asc");

  const filtered = mockProducts
    .filter((p) => {
      if (!query) return true;
      const q = query.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.vendor.toLowerCase().includes(q);
    })
    .filter((p) => (statusFilter ? p.status === statusFilter : true))
    .sort((a, b) => {
      if (sort === "name-asc") return a.name.localeCompare(b.name);
      if (sort === "name-desc") return b.name.localeCompare(a.name);
      if (sort === "price-asc") return parseFloat(a.price.slice(1)) - parseFloat(b.price.slice(1));
      if (sort === "price-desc") return parseFloat(b.price.slice(1)) - parseFloat(a.price.slice(1));
      if (sort === "inventory-asc") return a.inventory - b.inventory;
      if (sort === "inventory-desc") return b.inventory - a.inventory;
      return 0;
    });

  return (
    <s-section padding="none">
      <s-stack gap="small-200">

        {/* Search + status filter + save */}
        <s-grid
          gridTemplateColumns="1fr auto"
          gap="base"
          alignItems="center"
          paddingInline="base"
          paddingBlockStart="base"
        >
          <s-grid gridTemplateColumns="1fr auto" gap="small-200" alignItems="center">
            <div onInput={(e: any) => setQuery(e.target.value)}>
              <s-text-field
                icon="search"
                placeholder="Filter products"
                value={query}
              />
            </div>
            <s-button commandFor="status-filter-popover">
              {statusFilter
                ? `Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`
                : "Status"}
            </s-button>
            <s-popover id="status-filter-popover">
              <s-stack gap="small-200" padding="small-200">
                {(["active", "draft", "archived"] as const).map((s) => (
                  <s-button
                    key={s}
                    variant={statusFilter === s ? "primary" : "tertiary"}
                    onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </s-button>
                ))}
                {statusFilter && (
                  <s-link
                    href=""
                    onClick={(e: any) => {
                      e.preventDefault();
                      setStatusFilter(null);
                    }}
                  >
                    Clear
                  </s-link>
                )}
              </s-stack>
            </s-popover>
          </s-grid>
          <s-button variant="secondary">Save</s-button>
        </s-grid>

        {/* Applied filter chip */}
        {statusFilter && (
          <s-stack direction="inline" gap="small-400" paddingInline="base">
            <s-clickable-chip removable onClick={() => setStatusFilter(null)}>
              Status: {statusFilter}
            </s-clickable-chip>
          </s-stack>
        )}

        {/* Select all + sort */}
        <s-grid
          gridTemplateColumns="1fr auto"
          gap="base"
          alignItems="center"
          paddingInline="base"
        >
          <s-checkbox
            label={`Showing ${filtered.length} product${filtered.length !== 1 ? "s" : ""}`}
          />
          <div onChange={(e: any) => setSort(e.target.value)}>
            <s-select value={sort}>
              <s-option value="name-asc">Name A–Z</s-option>
              <s-option value="name-desc">Name Z–A</s-option>
              <s-option value="price-asc">Price: Low to high</s-option>
              <s-option value="price-desc">Price: High to low</s-option>
              <s-option value="inventory-asc">Inventory: Low to high</s-option>
              <s-option value="inventory-desc">Inventory: High to low</s-option>
            </s-select>
          </div>
        </s-grid>

        {/* Product rows */}
        <s-stack>
          {filtered.length === 0 ? (
            <s-stack gap="base" alignItems="center" padding="base">
              <s-paragraph color="subdued">No products match your filters.</s-paragraph>
            </s-stack>
          ) : (
            filtered.map((product) => (
              <s-clickable
                key={product.id}
                borderStyle="solid none none none"
                border="base"
                paddingInline="base"
                paddingBlock="small"
              >
                <s-grid gridTemplateColumns="1fr auto" gap="base" alignItems="center">
                  <s-stack direction="inline" gap="small" alignItems="center">
                    <s-checkbox />
                    <s-avatar initials={product.initials} />
                    <s-stack>
                      <s-heading>{product.name}</s-heading>
                      <s-text>{product.vendor} · {product.type}</s-text>
                    </s-stack>
                  </s-stack>
                  <s-stack direction="inline" gap="base" alignItems="center">
                    <span
                      style={{
                        padding: "2px 10px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        background: STATUS_COLORS[product.status].bg,
                        color: STATUS_COLORS[product.status].color,
                      }}
                    >
                      {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                    </span>
                    <s-text>{product.price}</s-text>
                    <s-text color="subdued">
                      {product.inventory > 0
                        ? `${product.inventory} in stock`
                        : "Out of stock"}
                    </s-text>
                    <s-button
                      icon="menu-horizontal"
                      variant="tertiary"
                      accessibilityLabel={`Actions for ${product.name}`}
                    />
                  </s-stack>
                </s-grid>
              </s-clickable>
            ))
          )}
        </s-stack>

      </s-stack>
    </s-section>
  );
}
