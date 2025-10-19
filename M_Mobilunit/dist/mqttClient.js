import 'dotenv/config';
import mqtt from 'mqtt';
export function makeTopics(team, deviceId) {
    const base = $, { team };
    /mobile;
    return {
        base,
        status: $
    };
    {
        base;
    }
    /status/,
        cmd;
    $;
    {
        base;
    }
    /cmd/,
        rpcReq;
    $;
    {
        base;
    }
    /rpc/ / req,
        rpcResBase;
    $;
    {
        base;
    }
    /rpc/ / res,
        telem;
    $;
    {
        base;
    }
    /telemetry/,
        lwt;
    $;
    {
        base;
    }
    /status/,
    ;
}
;
export function createClient() {
    const team = process.env.TEAM ?? 'team';
    const deviceId = process.env.DEVICE_ID ?? 'dev1';
    const host = process.env.MQTT_HOST ?? 'localhost';
    const port = Number(process.env.MQTT_PORT ?? 1883);
    const username = process.env.MQTT_USERNAME;
    const password = process.env.MQTT_PASSWORD;
    const topics = makeTopics(team, deviceId);
    const url = mqtt; //System.Management.Automation.Internal.Host.InternalHost:;
    const client = mqtt.connect(url, {
        clientId: mobile - ,
        username,
        password,
        will: {
            topic: topics.lwt,
            payload: JSON.stringify({ deviceId, status: 'offline', ts: Math.floor(Date.now() / 1000) }),
            qos: 1,
            retain: true,
        },
    });
    return { client, topics, team, deviceId };
}
export function publishHeartbeat(client, statusTopic, deviceId) {
    client.publish(statusTopic, JSON.stringify({ deviceId, status: 'online', ts: Math.floor(Date.now() / 1000) }), { retain: true, qos: 1 });
}
export async function rpcCall(client, rpcReqTopic, rpcResBase, request, timeoutMs = Number(process.env.RPC_TIMEOUT ?? 5000)) {
    const correlationId = request?.correlationId ?? Math.random().toString(36).slice(2);
    const resTopic = $, { rpcResBase };
    /;
    return await new Promise((resolve, reject) => {
        const onMsg = (topic, payload) => {
            if (topic !== resTopic)
                return;
            clearTimeout(timer);
            client.off('message', onMsg);
            client.unsubscribe(resTopic, () => { });
            try {
                resolve(JSON.parse(payload.toString('utf-8')));
            }
            catch {
                resolve(payload.toString('utf-8'));
            }
        };
        const timer = setTimeout(() => {
            client.off('message', onMsg);
            client.unsubscribe(resTopic, () => { });
            reject(new Error('RPC timeout'));
        }, timeoutMs);
        client.subscribe(resTopic, { qos: 1 }, (err) => {
            if (err) {
                clearTimeout(timer);
                return reject(err);
            }
            client.on('message', onMsg);
            client.publish(rpcReqTopic, JSON.stringify({ ...request, correlationId }), { qos: 1 });
        });
    });
}
