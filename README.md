# Sistema de Chamados e Atendimento de Guichê

Aplicação completa com painel da TV, painel do atendente e totem de senhas.

## Desenvolvimento local

```bash
npm install
npm run dev
```

O frontend usa `/api` por padrão e o WebSocket MQTT em `ws://localhost:9001`.

## Docker

Crie o usuário e senha do Mosquitto:

```bash
touch mosquitto/config/passwd
docker run --rm -v "$(pwd)/mosquitto/config:/mosquitto/config" eclipse-mosquitto:2 \
  mosquitto_passwd -b /mosquitto/config/passwd painel_user senha_mqtt_123
```

Compile o frontend e inicie os containers:

```bash
npm install
npm run build
docker compose up -d --build
```

Rotas:

- TV: `http://localhost/tv`
- Guichê: `http://localhost/guiche`
- Totem: `http://localhost/totem`

O painel da TV recebe chamadas em tempo real e atualiza o histórico e a fila automaticamente. No Docker, o frontend compilado em `dist/` é servido pelo Nginx.

Endereço público do MQTT: porta `9001` com usuário `painel_user` e senha `senha_mqtt_123`.