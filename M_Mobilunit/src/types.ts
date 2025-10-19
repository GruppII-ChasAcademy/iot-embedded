export interface Telemetry {
  type: 'heartbeat';
  deviceId: string;
  ts: number; // epoch seconds
  battery?: number;
  gps?: { lat: number; lon: number };
}

export interface ApiRequest {
  method: 'GET' | 'POST';
  path: string;
  body?: any;
}

export interface ApiEnvelope {
  corrId: string;
  replyTo: string;
  request: ApiRequest;
}
