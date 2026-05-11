export interface SessionManifest {
  version: string;
  created_at: string;
  updated_at: string;
  tables: TableReference[];
  calculations: Calculation[];
  charts: ChartConfig[];
}

export interface TableReference {
  id: string;
  type: 'reference' | 'upload' | 'inline';
  name?: string;
  source?: string;
  metadata?: TableMetadata;
  data?: Record<string, unknown>[];
}

export interface TableMetadata {
  source: string;
  columns: ColumnDef[];
}

export interface ColumnDef {
  name: string;
  type: 'string' | 'number' | 'percent' | 'date';
}

export interface Calculation {
  id: string;
  name: string;
  type: string;
  input_tables: string[];
  parameters?: Record<string, unknown>;
}

export interface ChartConfig {
  id: string;
  type: string;
  title: string;
  data: unknown;
}

export interface Session {
  manifest: SessionManifest;
  tables: Map<string, TableReference>;
  zip?: Blob;
}
