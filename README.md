# Sistema de Chamados e Atendimento de Guichê

Aplicação de gerenciamento de senhas com três telas: totem para emitir senhas, painel do atendente para chamar e finalizar atendimentos e painel da TV para exibir as chamadas.

## Requisitos

- Node.js e npm
- Docker e Docker Compose

## Iniciar a aplicação completa com Docker

Na primeira execução, crie o arquivo de autenticação do Mosquitto. O comando solicita a senha de forma interativa:

```bash
docker run --rm -it \
  -v "$PWD/mosquitto/config:/mosquitto/config" \
  eclipse-mosquitto:2 \
  mosquitto_passwd -c /mosquitto/config/passwd painel_user
```

Compile o frontend e inicie os serviços:

```bash
npm install
npm run build
docker compose up -d --build
```

O Compose inicia o MySQL, o broker MQTT, a API e o Nginx. A aplicação fica disponível em:

- Totem: `http://localhost/totem`
- Painel do atendente: `http://localhost/guiche`
- Painel da TV: `http://localhost/tv`

Para verificar se os containers estão ativos e se a API responde:

```bash
docker compose ps
curl http://localhost/api/health
```

Para acompanhar os logs:

```bash
docker compose logs -f
```

Para executar os testes do backend:

```bash
npm --prefix backend test
```

Para parar os serviços sem apagar o banco de dados:

```bash
docker compose down
```

O banco persiste no volume `mysql_data`. **Não use `docker compose down -v` se quiser preservar os dados**, pois esse comando também remove o volume.

## Desenvolvimento local

Inicie o MySQL, o Mosquitto e a API pelo Docker:

```bash
docker compose up -d mysql mosquitto backend
```

Em outro terminal, inicie o frontend com o servidor de desenvolvimento do Vite:

```bash
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite, normalmente `http://localhost:5173`. Para disponibilizar o servidor em uma interface de rede, por exemplo em um ambiente remoto:

```bash
npm run dev -- --host 0.0.0.0
```

O Vite encaminha as requisições `/api` para a API na porta `3000`. O painel usa o WebSocket MQTT na porta `9001`.

## Como usar

1. **Totem (`/totem`)**: selecione atendimento normal ou preferencial. A senha emitida entra na fila.
2. **Atendente (`/guiche`)**: selecione o guichê e, se desejar, informe o nome do atendente. Use **Chamar próxima senha** para chamar a próxima pessoa; use **Chamar novamente** para repetir o aviso e **Finalizar atendimento** ao concluir.
3. **TV (`/tv`)**: mantenha a tela aberta para exibir a chamada atual, as últimas chamadas e o tamanho da fila. Os dados são atualizados automaticamente. Clique em **Ativar Som/Voz** uma vez para permitir que o navegador reproduza o aviso sonoro e fale a senha.

## Portas e configurações

- `80`: aplicação web servida pelo Nginx
- `3000`: API (acessível internamente pelo Docker; no desenvolvimento, encaminhada pelo Vite)
- `1883`: MQTT
- `9001`: MQTT via WebSocket, usado pelo painel da TV

As credenciais definidas no repositório são valores de desenvolvimento. Altere-as antes de expor a aplicação a uma rede pública e mantenha as configurações do Mosquitto, da API e do frontend compatíveis.
