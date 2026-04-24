export interface Review {
  id: number;
  customer: string;
  initials: string;
  rating: number;
  text: string;
  product: string;
  date: string;
}

export interface FunnelStep {
  label: string;
  count: number;
  color: string;
}

export interface TopProduct {
  id: number;
  name: string;
  emoji: string;
  avgRating: number;
  reviewCount: number;
}

export interface DashboardStats {
  totalReviews: number;
  averageRating: number;
  requestsSent: number;
  conversionRate: number;
}

export const mockStats: DashboardStats = {
  totalReviews: 247,
  averageRating: 4.6,
  requestsSent: 89,
  conversionRate: 34,
};

export const mockReviews: Review[] = [
  {
    id: 1,
    customer: "Priya Sharma",
    initials: "PS",
    rating: 5,
    text: "Absolutely love this product! The quality is exceptional and delivery was super fast. Will definitely order again.",
    product: "Organic Face Serum",
    date: "Jan 15, 2025",
  },
  {
    id: 2,
    customer: "Rahul Mehta",
    initials: "RM",
    rating: 4,
    text: "Great product overall. Works exactly as described. Would recommend to friends and family.",
    product: "Wireless Earbuds Pro",
    date: "Jan 14, 2025",
  },
  {
    id: 3,
    customer: "Sarah Johnson",
    initials: "SJ",
    rating: 5,
    text: "Exceeded my expectations. The packaging was beautiful and the product is top notch.",
    product: "Minimalist Watch",
    date: "Jan 13, 2025",
  },
  {
    id: 4,
    customer: "Arjun Patel",
    initials: "AP",
    rating: 3,
    text: "Decent product but shipping took longer than expected. Quality is okay for the price.",
    product: "Leather Wallet",
    date: "Jan 12, 2025",
  },
  {
    id: 5,
    customer: "Emma Wilson",
    initials: "EW",
    rating: 5,
    text: "Perfect gift! My friend was absolutely thrilled with it. Beautiful presentation.",
    product: "Scented Candle Set",
    date: "Jan 11, 2025",
  },
];

export const mockFunnelSteps: FunnelStep[] = [
  { label: "Sent", count: 89, color: "#2563eb" },
  { label: "Opened", count: 67, color: "#7c3aed" },
  { label: "Clicked", count: 41, color: "#d97706" },
  { label: "Reviewed", count: 30, color: "#16a34a" },
];

export const mockTopProducts: TopProduct[] = [
  { id: 1, name: "Organic Face Serum", emoji: "🧴", avgRating: 4.9, reviewCount: 42 },
  { id: 2, name: "Wireless Earbuds Pro", emoji: "🎧", avgRating: 4.7, reviewCount: 38 },
  { id: 3, name: "Minimalist Watch", emoji: "⌚", avgRating: 4.6, reviewCount: 29 },
  { id: 4, name: "Leather Wallet", emoji: "👜", avgRating: 4.4, reviewCount: 24 },
  { id: 5, name: "Scented Candle Set", emoji: "🕯️", avgRating: 4.8, reviewCount: 19 },
];
