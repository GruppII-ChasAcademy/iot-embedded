import { EventHubConsumerClient, earliestEventPosition } from "@azure/event-hubs";
import dotenv from "dotenv"; dotenv.config();
import { pushRecent } from "./store/recent.js";

const cs   = process.env.EVENTHUB_COMPAT_CONNECTION_STRING;
const name = process.env.EVENTHUB_NAME;

export async function startConsumer(){
  const client = new EventHubConsumerClient(EventHubConsumerClient.defaultConsumerGroupName, cs, name);
  await client.subscribe({
    processEvents: async (events) => {
      for (const e of events) {
        try {
          const body = typeof e.body === "string" ? JSON.parse(e.body) : e.body;
          pushRecent({
            deviceId: body?.deviceId || e.systemProperties?.["iothub-connection-device-id"] || "unknown",
            payload: body, time: new Date().toISOString()
          });
        } catch {
          pushRecent({ deviceId:"unknown", payload:e.body, time:new Date().toISOString() });
        }
      }
    },
    processError: async (err) => console.error("[EH]", err.message)
  }, { startPosition: earliestEventPosition });
}