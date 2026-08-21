import mqtt from 'mqtt';
import config from '../config/index.js';

let client = null;

export async function connectMqtt() {
  if (!config.mqtt.brokerUrl) {
    console.log('[MQTT] No broker URL configured — skipping');
    return;
  }

  return new Promise((resolve, reject) => {
    client = mqtt.connect(config.mqtt.brokerUrl, {
      clientId: config.mqtt.clientId,
      username: config.mqtt.username || undefined,
      password: config.mqtt.password || undefined,
      clean: true,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
    });

    client.on('connect', () => {
      console.log('[MQTT] Connected:', config.mqtt.brokerUrl);
      client.subscribe('sys/product/+/status', { qos: 1 });
      client.subscribe('thing/product/+/requests', { qos: 1 });
      resolve(client);
    });

    client.on('message', (topic, payload) => {
      try {
        const msg = JSON.parse(payload.toString());
        console.log(`[MQTT] ${topic}:`, JSON.stringify(msg).substring(0, 200));
      } catch {}
    });

    client.on('error', (err) => { reject(err); });
    client.on('close', () => { console.log('[MQTT] Closed'); });
  });
}

export function getMqttClient() { return client; }
export function publishMqtt(topic, msg) { if (client?.connected) client.publish(topic, JSON.stringify(msg), { qos: 1 }); }
