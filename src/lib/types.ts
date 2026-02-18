export interface AuditResult {
  url: string;
  timestamp: string;
  id: string;
  performance: CategoryResult;
  seo: CategoryResult;
  accessibility: CategoryResult;
  details: AuditDetails;
}

export interface CategoryResult {
  score: number; // 0-100
  label: string;
  color: string;
  items: AuditItem[];
}

export interface AuditItem {
  title: string;
  description: string;
  status: "pass" | "fail" | "warning";
  value?: string;
}

export interface AuditDetails {
  title: string;
  metaDescription: string;
  loadTime: number;
  pageSize: number;
  requestCount: number;
  headings: HeadingInfo[];
  images: ImageInfo[];
  links: LinkInfo;
  mobile: MobileInfo;
}

export interface HeadingInfo {
  tag: string;
  text: string;
}

export interface ImageInfo {
  src: string;
  alt: string;
  hasAlt: boolean;
}

export interface LinkInfo {
  internal: number;
  external: number;
  broken: number;
}

export interface MobileInfo {
  hasViewport: boolean;
  isResponsive: boolean;
}
