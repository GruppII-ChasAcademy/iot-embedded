import aedes from 'aedes';
import { createServer } from 'net';
const PORT = Number(process.env.MQTT_PORT || process.argv[2] || 1884);
const broker = aedes();
const server = createServer(broker.handle);
server.listen(PORT, () => console.log('Aedes broker listening on :' + PORT));
broker.on('client', c => console.log('[broker] client connected:', c?.id));
broker.on('subscribe', (subs) => console.log('[broker] subscribe:', subs.map(s=>s.topic).join(',')));
broker.on('publish', (p, c) => { if (c) console.log('[broker] publish:', p.topic); });
