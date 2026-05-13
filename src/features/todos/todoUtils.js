import { travelImages } from "../../data/travelImages.js";

export const bucketImages = [
  "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=300&q=80",
  "https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=300&q=80",
  travelImages[7]
];

export const packingCategories = ["Tech", "Documents", "Clothing", "Toiletries", "Health", "Money", "Other"];

export function groupItems(items) {
  const groups = items.reduce((acc, item) => {
    const category = item.category || "Essentials";
    acc[category] = [...(acc[category] || []), item];
    return acc;
  }, {});

  return Object.entries(groups);
}

export function normalizeSection(todo) {
  if (todo.section) return todo.section;
  return /book|visit|reserve|tour|ticket/i.test(todo.title) ? "bucket" : "packing";
}

export function categoryIcon(category) {
  const normalized = category.toLowerCase();
  if (normalized.includes("tech")) return "plug";
  if (normalized.includes("cloth")) return "shirt";
  if (normalized.includes("document")) return "file";
  if (normalized.includes("toiletr")) return "person";
  if (normalized.includes("health")) return "heart";
  if (normalized.includes("money")) return "language";
  return "plus";
}

export function normalizeImageUrl(value, fallbackIndex, width = 1400) {
  if (!value) return travelImages[fallbackIndex % travelImages.length];
  if (value.includes("images.unsplash.com") || value.startsWith("data:image/")) return value;

  const unsplashPhotoId = value.match(/unsplash\.com\/photos\/(?:[^/]*-)?([A-Za-z0-9_-]+)(?:[/?#]|$)/)?.[1];
  if (unsplashPhotoId) {
    return `https://source.unsplash.com/${unsplashPhotoId}/${width}x${Math.round(width * 0.66)}`;
  }

  return value;
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
