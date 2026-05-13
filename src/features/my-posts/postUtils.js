export function parseTags(value = "") {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function parseImageList(value = "") {
  const text = String(value).trim();
  if (!text) return [];

  if (text.includes("data:image")) {
    return text
      .split(/\n+/)
      .map((image) => image.trim())
      .filter(Boolean);
  }

  return text
    .replace(/(https?:\/\/)/g, "\n$1")
    .split(/[\n,]+/)
    .map((image) => image.trim())
    .filter(Boolean);
}

export function normalizePostImages(images) {
  const uniqueImages = [];

  images.forEach((image) => {
    if (typeof image !== "string") return;
    const value = image.trim();
    if (value && !uniqueImages.includes(value)) {
      uniqueImages.push(value);
    }
  });

  return uniqueImages;
}

export function getPostImages(post) {
  if (Array.isArray(post.images) && post.images.length) {
    return normalizePostImages(post.images);
  }

  return normalizePostImages([post.image]);
}

export function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function formatDate(date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export function fallbackDate(index) {
  return ["Oct 12, 2023", "Sep 28, 2023", "Aug 05, 2023"][index % 3];
}

export function fallbackTags(index) {
  return [
    ["Hiking", "Nature"],
    ["Urban", "Food"],
    ["Relaxation", "Coastal"]
  ][index % 3];
}

export function inferLocation(title, index) {
  if (/alps|matterhorn|winter/i.test(title)) return "Switzerland";
  if (/shinjuku|kyoto|japan/i.test(title)) return "Japan";
  if (/oia|greece|azure/i.test(title)) return "Greece";
  return ["Switzerland", "Japan", "Greece"][index % 3];
}
