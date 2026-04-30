export function StarFilled({ size = 14, color = "#f59e0b" }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22,9.81a1,1,0,0,0-.83-.69l-5.7-.78L12.88,3.53a1,1,0,0,0-1.76,0L8.57,8.34l-5.7.78a1,1,0,0,0-.82.69,1,1,0,0,0,.28,1l4.09,3.73-1,5.24A1,1,0,0,0,6.88,20.9L12,18.38l5.12,2.52a1,1,0,0,0,.44.1,1,1,0,0,0,1-1.18l-1-5.24,4.09-3.73A1,1,0,0,0,22,9.81Z"
        fill={color}
      />
    </svg>
  );
}

function StarEmpty({ size = 14, color = "#f59e0b" }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
      <polygon
        points="12 4 9.22 9.27 3 10.11 7.5 14.21 6.44 20 12 17.27 17.56 20 16.5 14.21 21 10.11 14.78 9.27 12 4"
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </svg>
  );
}

export function Stars({
  n,
  size = 14,
  color = "#f59e0b",
  emptyColor = "rgba(200,200,200,0.5)",
  glow = false,
}: {
  n: number;
  size?: number;
  color?: string;
  emptyColor?: string;
  glow?: boolean;
}) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 1.5 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          style={{
            display: "inline-flex",
            filter: glow && i < n ? `drop-shadow(0 1px 2px ${color}90)` : "none",
          }}
        >
          {i < n ? <StarFilled size={size} color={color} /> : <StarEmpty size={size} color={emptyColor} />}
        </span>
      ))}
    </span>
  );
}
