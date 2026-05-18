export function formatDate(date) {
  if (!date) return null;
  return new Date(date).toISOString().split("T")[0];
}
