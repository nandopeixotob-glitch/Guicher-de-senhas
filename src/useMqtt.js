import { useEffect, useRef, useState } from 'react';
import mqtt from 'mqtt';

export function useMqtt(topic, onMessage) {
  const [status, setStatus] = useState('Desconectado');
  const callbackRef = useRef(onMessage);
  callbackRef.current = onMessage;

  useEffect(() => {
    const url = import.meta.env.VITE_MQTT_WS_URL ||
      `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:9001`;
    const client = mqtt.connect(url, {
      username: 'painel_user',
      password: 'senha_mqtt_123',
      reconnectPeriod: 2000
    });
    client.on('connect', () => {
      setStatus('Conectado');
      client.subscribe(topic);
    });
    client.on('reconnect', () => setStatus('Reconectando'));
    client.on('close', () => setStatus('Desconectado'));
    client.on('error', () => setStatus('Erro de conexão'));
    client.on('message', (receivedTopic, payload) => {
      if (receivedTopic !== topic) return;
      try {
        callbackRef.current(JSON.parse(payload.toString()));
      } catch {
        setStatus('Mensagem inválida');
      }
    });
    return () => client.end(true);
  }, [topic]);

  return status;
}
