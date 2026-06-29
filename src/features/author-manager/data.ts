import { useQuery } from "@tanstack/react-query";
import type {
  Application,
  Author,
  License,
  LoadState,
  PaginatedQuery,
  PaginatedResult,
  Product,
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

export interface DashboardStats {
  totalAuthors: number;
  pendingApplications: number;
  verifiedAuthors: number;
  suspendedAuthors: number;
  publishedProducts: number;
  pendingReviews: number;
  revenue: number;
  royalties: number;
  downloads: number;
  activeLicenses: number;
  supportTickets: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["author-manager", "dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => ({
      totalAuthors: 0,
      pendingApplications: 0,
      verifiedAuthors: 0,
      suspendedAuthors: 0,
      publishedProducts: 0,
      pendingReviews: 0,
      revenue: 0,
      royalties: 0,
      downloads: 0,
      activeLicenses: 0,
      supportTickets: 0,
    }),
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
