import { useQuery } from "@tanstack/react-query";
import type {
  Application,
  Author,
  License,
  LoadState,
  PaginatedQuery,
  PaginatedResult,
  Product,
  ProductVersion,
  SourceRepo,
} from "./types";

/**
 * Backend-ready data hooks.
 * Currently return empty results until Lovable Cloud is enabled.
 * Each hook keeps the {rows,total} contract so server-side pagination
 * for 100k+ rows drops in without touching the UI.
 */
async function emptyPage<T>(_q: PaginatedQuery): Promise<PaginatedResult<T>> {
  return { rows: [], total: 0 };
}

export function useAuthors(q: PaginatedQuery) {
  return useQuery({
    queryKey: ["author-manager", "authors", q],
    queryFn: () => emptyPage<Author>(q),
  });
}

export function useApplications(q: PaginatedQuery) {
  return useQuery({
    queryKey: ["author-manager", "applications", q],
    queryFn: () => emptyPage<Application>(q),
  });
}

export function useProducts(q: PaginatedQuery) {
  return useQuery({
    queryKey: ["author-manager", "products", q],
    queryFn: () => emptyPage<Product>(q),
  });
}

export function useLicenses(q: PaginatedQuery) {
  return useQuery({
    queryKey: ["author-manager", "licenses", q],
    queryFn: () => emptyPage<License>(q),
  });
}

export function useSourceRepos(q: PaginatedQuery) {
  return useQuery({
    queryKey: ["author-manager", "source-repos", q],
    queryFn: () => emptyPage<SourceRepo>(q),
  });
}

export function useProductVersions(productId: string | null) {
  return useQuery({
    queryKey: ["author-manager", "product-versions", productId],
    queryFn: async (): Promise<ProductVersion[]> => [],
    enabled: !!productId,
  });
}

export interface DashboardStats {
  authed?: boolean;
  totalAuthors: number;
  verifiedAuthors: number;
  pendingAuthors?: number;
  suspendedAuthors: number;
  pendingApplications: number;
  publishedProducts: number;
  draftProducts?: number;
  pendingReviews: number;
  revenue: number;
  royalties: number;
  downloads: number;
  activeLicenses: number;
  supportTickets: number;
  reposLinked?: number;
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["author-manager", "dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const { getDashboardStats } = await import("@/lib/author-manager.functions");
      return (await getDashboardStats()) as DashboardStats;
    },
    retry: false,
    staleTime: 30_000,
  });
}

export function deriveState<T>(
  isLoading: boolean,
  isError: boolean,
  data: PaginatedResult<T> | undefined,
): LoadState {
  if (isLoading) return "loading";
  if (isError) return "error";
  if (!data || data.total === 0) return "empty";
  return "ready";
}
