export interface AuditResult {
  url: string;
  timestamp: string;
  id: string;
  performance: CategoryResult;
  seo: CategoryResult;
  accessibility: CategoryResult;
  security: CategoryResult;
  details: AuditDetails;
  priorities: PriorityAction[];
  globalScore: number;
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
  impact?: "high" | "medium" | "low";
  recommendation?: string;
}

export interface PriorityAction {
  priority: number; // 1 = highest
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  category: string;
  effort: "easy" | "medium" | "hard";
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
  technologies: string[];
  htmlSize: number;
  domElements: number;
  hasRobotsTxt?: boolean;
  hasSitemap?: boolean;
  hasFavicon: boolean;
  hasStructuredData: boolean;
  httpsRedirect: boolean;
  mixedContent: boolean;
  inlineStyles: number;
  iframeCount: number;
  wordCount: number;
}

export interface HeadingInfo {
  tag: string;
  text: string;
}

export interface ImageInfo {
  src: string;
  alt: string;
  hasAlt: boolean;
  isLazy?: boolean;
}

export interface LinkInfo {
  internal: number;
  external: number;
  broken: number;
  nofollow: number;
}

export interface MobileInfo {
  hasViewport: boolean;
  isResponsive: boolean;
  hasTouchIcons: boolean;
  textTooSmall: boolean;
}
