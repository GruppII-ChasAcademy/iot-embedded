export type Telemetry = {
  deviceId: string;
  ts: number;
  battery?: number;
  rssi?: number;
  data?: Record<string, unknown>;
};

export type CommandPayload =
  | { cmd: 'ping' }
  | { cmd: 'echo'; message: string }
  | { cmd: 'telemetry'; data: Record<string, unknown> };

export type ApiRequest = {
  op: string;
  params?: Record<string, unknown>;
  correlationId?: string;
};

export type ApiEnvelope<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: string;
  correlationId?: string;
};
