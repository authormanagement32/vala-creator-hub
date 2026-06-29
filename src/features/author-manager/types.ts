export type AuthorStatus = "verified" | "pending" | "suspended" | "rejected";
export type ApplicationStage =
  | "registration"
  | "identity"
  | "kyc"
  | "portfolio"
  | "interview"
  | "agreement"
  | "approved"
  | "rejected";

export interface Author {
  id: string;
  name: string;
  email: string;
  company: string | null;
  country: string | null;
  status: AuthorStatus;
  verified: boolean;
  products: number;
  rating: number | null;
  revenue: number;
  royalties: number;
  healthScore: number;
  riskScore: number;
  joinedAt: string;
}

export interface Application {
  id: string;
  applicantName: string;
  email: string;
  country: string | null;
  stage: ApplicationStage;
  submittedAt: string;
  updatedAt: string;
  reviewer: string | null;
}

export interface Product {
  id: string;
  name: string;
  authorId: string;
  category: string;
  type: "software" | "saas" | "apk" | "source" | "template" | "theme" | "plugin" | "ai";
  version: string;
  price: number;
  status: "draft" | "review" | "published" | "rejected" | "archived";
  downloads: number;
  rating: number | null;
}

export interface License {
  id: string;
  key: string;
  productId: string;
  customerEmail: string;
  type: "personal" | "commercial" | "enterprise";
  status: "active" | "expired" | "revoked";
  activations: number;
  maxActivations: number;
  issuedAt: string;
  expiresAt: string | null;
}

export interface PaginatedQuery {
  page: number;
  pageSize: number;
  sort?: { id: string; desc: boolean } | null;
  search?: string;
  filters?: Record<string, unknown>;
}

export interface PaginatedResult<T> {
  rows: T[];
  total: number;
}

export type LoadState = "idle" | "loading" | "empty" | "error" | "ready";
