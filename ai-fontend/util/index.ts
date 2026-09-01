export function generateRandomUserId() {
  return `test-identity-${String(Math.random() * 100_000).slice(0, 5)}` as const;
}
