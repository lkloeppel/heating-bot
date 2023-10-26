export interface EnphaseOptions {
  apiKey: string;
  clientId: string;
  clientSecret: string;
  enphaseBaseUrl?: string;
}

export interface RequestMetadata {
  status: 'normal';
  last_report_at: number;
  last_energy_at: number;
  operational_at: number;
}

export interface ExportInterval {
  end_at: number;
  wh_exported: number;
}

export interface EnergeyExportTelemetry {
  system_id: number;
  granularity: Granularity;
  start_date: number;
  end_date: number;
  items: string;
  intervals: [ExportInterval[]];
  meta: RequestMetadata;
}

// eslint-disable-next-line no-shadow
export enum Granularity {
  MINS = '15mins',
  DAY = 'day',
  WEEK = 'week'
}
