import mqtt from 'mqtt';
import config from '../config/index.js';

let client = null;

export async function connectMqtt() {
  if (!config.mqtt.brokerUrl) {
    console.log('[MQTT] No broker URL configured — MQTT disabled');
    return;
  }

  return new Promise((resolve, reject) => {
    client = mqtt.connect(config.mqtt.brokerUrl, {
      clientId: config.mqtt.clientId,
      username: config.mqtt.username || undefined,
      password: config.mqtt.password || undefined,
      clean: true,
      reconnectPeriod: 0, // Do not auto-reconnect — we handle this manually
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

    client.on('error', (err) => {
      console.warn(`[MQTT] Connection error: ${err.message} — MQTT will remain disabled until broker is available`);
      client.end(true); // Stop the client cleanly
      client = null;
      reject(err);
    });

    client.on('close', () => {
      // Only log if we were previously connected (avoid spam)
      if (client?.connected === false && client?._reconnecting) {
        // Suppress repeated close logs
      }
    });
  });
}

export function getMqttClient() { return client; }
export function publishMqtt(topic, msg) { if (client?.connected) client.publish(topic, JSON.stringify(msg), { qos: 1 }); }
