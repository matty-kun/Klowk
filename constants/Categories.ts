export const CATEGORIES = [
  { id: "work", label: "Work", color: "#FBBF24", iconName: "briefcase" },
  { id: "health", label: "Health", color: "#10b981", iconName: "heart" },
  { id: "study", label: "Study", color: "#3b82f6", iconName: "book-open" },
  { id: "leisure", label: "Leisure", color: "#8b5cf6", iconName: "coffee" },
  {
    id: "other",
    label: "Other",
    color: "#6b7280",
    iconName: "more-horizontal",
  },
];

export type CategoryId = "work" | "health" | "study" | "leisure" | "other";
