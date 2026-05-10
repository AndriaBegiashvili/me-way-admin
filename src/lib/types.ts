export type AdminRole = "read_only" | "full_access";

export type IndicatorTone = "neutral" | "yellow" | "orange" | "red" | "green";

export interface SectionColumn {
  label: string;
  indicator?: string;
  tone?: IndicatorTone;
  action?: string;
}

export interface SectionSpec {
  key: string;
  title: string;
  summary: string;
  columns: SectionColumn[];
}

export interface KpiSpec {
  key: string;
  label: string;
  description: string;
  clickAction: string;
  tone?: IndicatorTone;
}
