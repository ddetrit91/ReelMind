export function useMockData(): boolean {
  return process.env.USE_MOCK_DATA === "true";
}

export function getIngestSecret(): string | undefined {
  return process.env.INGEST_SECRET;
}

export function assertIngestAuthorized(headerSecret: string | null): boolean {
  const expected = getIngestSecret();
  if (!expected) return true;
  return headerSecret === expected;
}
