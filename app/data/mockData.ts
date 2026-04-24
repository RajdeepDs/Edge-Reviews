export interface Review {
  id: number;
  customer: string;
  initials: string;
  rating: number;
  text: string;
  product: string;
  date: string;
  status?: "published" | "pending" | "rejected";
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

export const mockAllReviews: Review[] = [
  { id: 1, customer: "Priya Sharma", initials: "PS", rating: 5, text: "Absolutely love this product! The quality is exceptional and delivery was super fast.", product: "Organic Face Serum", date: "Jan 15, 2025", status: "published" },
  { id: 2, customer: "Rahul Mehta", initials: "RM", rating: 4, text: "Great product overall. Works exactly as described. Would recommend to friends and family.", product: "Wireless Earbuds Pro", date: "Jan 14, 2025", status: "published" },
  { id: 3, customer: "Sarah Johnson", initials: "SJ", rating: 5, text: "Exceeded my expectations. The packaging was beautiful and the product is top notch.", product: "Minimalist Watch", date: "Jan 13, 2025", status: "published" },
  { id: 4, customer: "Arjun Patel", initials: "AP", rating: 3, text: "Decent product but shipping took longer than expected. Quality is okay for the price.", product: "Leather Wallet", date: "Jan 12, 2025", status: "pending" },
  { id: 5, customer: "Emma Wilson", initials: "EW", rating: 5, text: "Perfect gift! My friend was absolutely thrilled with it. Beautiful presentation.", product: "Scented Candle Set", date: "Jan 11, 2025", status: "published" },
  { id: 6, customer: "Vikram Singh", initials: "VS", rating: 2, text: "Product did not match the description. Very disappointed with the quality.", product: "Leather Wallet", date: "Jan 10, 2025", status: "rejected" },
  { id: 7, customer: "Anika Gupta", initials: "AG", rating: 4, text: "Good quality and fast delivery. Packaging could be better but overall happy.", product: "Organic Face Serum", date: "Jan 9, 2025", status: "pending" },
  { id: 8, customer: "James Carter", initials: "JC", rating: 5, text: "Amazing! Will definitely order again. Best purchase I have made in a long time.", product: "Wireless Earbuds Pro", date: "Jan 8, 2025", status: "published" },
  { id: 9, customer: "Neha Kapoor", initials: "NK", rating: 1, text: "Terrible experience. Product broke within a week. Not worth the money at all.", product: "Minimalist Watch", date: "Jan 7, 2025", status: "rejected" },
  { id: 10, customer: "Tom Bradley", initials: "TB", rating: 4, text: "Very satisfied with this purchase. The product works as advertised.", product: "Scented Candle Set", date: "Jan 6, 2025", status: "pending" },
  { id: 11, customer: "Kavya Reddy", initials: "KR", rating: 5, text: "Absolutely fantastic! Exceeded all my expectations. Will recommend to everyone.", product: "Organic Face Serum", date: "Jan 5, 2025", status: "published" },
  { id: 12, customer: "Michael Chen", initials: "MC", rating: 3, text: "Average product. Nothing special but gets the job done.", product: "Wireless Earbuds Pro", date: "Jan 4, 2025", status: "pending" },
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
