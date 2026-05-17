// Shared server-side pagination. Used by the REST list endpoints and the
// admin/public list pages so "page" / "pageSize" behave identically and a
// 10k-row table never ships a full table dump to the client (SoftUni §
// Scalability: server-side data paging).

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export type PageParams = {
  page: number;
  pageSize: number;
  /** Drizzle .limit() */
  limit: number;
  /** Drizzle .offset() */
  offset: number;
};

function toPositiveInt(value: unknown, fallback: number): number {
  const n =
    typeof value === "string"
      ? Number.parseInt(value, 10)
      : typeof value === "number"
        ? value
        : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/**
 * Parse `page` / `pageSize` from either a URLSearchParams (route handlers)
 * or a plain searchParams object (RSC pages). Clamps pageSize to
 * [1, MAX_PAGE_SIZE] so a caller can't request the whole table at once.
 */
export function getPageParams(
  source:
    | URLSearchParams
    | Record<string, string | string[] | undefined>
    | undefined
): PageParams {
  const read = (key: string): string | undefined => {
    if (!source) return undefined;
    if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
    const v = source[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const page = toPositiveInt(read("page"), 1);
  const requested = toPositiveInt(read("pageSize"), DEFAULT_PAGE_SIZE);
  const pageSize = Math.min(MAX_PAGE_SIZE, requested);

  return { page, pageSize, limit: pageSize, offset: (page - 1) * pageSize };
}

export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function pageMeta(
  params: PageParams,
  total: number
): PageMeta {
  return {
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
  };
}
