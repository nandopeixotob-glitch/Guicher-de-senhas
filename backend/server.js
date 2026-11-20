const express = require('express');
const mysql = require('mysql2/promise');
const mqtt = require('mqtt');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  user: process.env.DB_USER || 'atendimento_user',
  password: process.env.DB_PASSWORD || 'atendimento_pass',
  database: process.env.DB_NAME || 'atendimento_db',
  waitForConnections: true,
  connectionLimit: 10
});

const mqttClient = mqtt.connect(process.env.MQTT_URL || 'mqtt://mosquitto:1883', {
  username: process.env.MQTT_USER || 'painel_user',
  password: process.env.MQTT_PASSWORD || 'senha_mqtt_123',
  reconnectPeriod: 2000
});

mqttClient.on('error', (error) => console.error('Erro MQTT:', error.message));

const TOPICO_CHAMADA = 'atendimento/painel/chamada';

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/senhas', async (req, res) => {
  try {
    const tipo = req.body.tipo === 'PREFERENCIAL' ? 'PREFERENCIAL' : 'NORMAL';
    const prefixo = tipo === 'PREFERENCIAL' ? 'P' : 'N';
    const [rows] = await pool.query(
      'SELECT COALESCE(MAX(CAST(SUBSTRING(codigo, 3) AS UNSIGNED)), 0) AS ultimo FROM senhas WHERE tipo = ?',
      [tipo]
    );
    const codigo = `${prefixo}-${String(rows[0].ultimo + 1).padStart(3, '0')}`;
    const [result] = await pool.query(
      'INSERT INTO senhas (codigo, tipo, status) VALUES (?, ?, "AGUARDANDO")',
      [codigo, tipo]
    );
    res.status(201).json({ id: result.insertId, codigo, tipo, status: 'AGUARDANDO' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.post('/api/senhas/chamar-proxima', async (req, res) => {
  const { guiche } = req.body;
  if (!guiche) return res.status(400).json({ erro: 'Informe o guichê' });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query(
      'UPDATE senhas SET status = "ATENDIDA", finalizado_em = NOW() WHERE guiche = ? AND status = "CHAMANDO"',
      [guiche]
    );
    const [fila] = await conn.query(
      `SELECT * FROM senhas
       WHERE status = "AGUARDANDO"
       ORDER BY FIELD(tipo, 'PREFERENCIAL', 'NORMAL'), criado_em ASC
       LIMIT 1 FOR UPDATE`
    );
    if (fila.length === 0) {
      await conn.commit();
      return res.status(404).json({ mensagem: 'Nenhuma senha na fila' });
    }
    const senha = fila[0];
    await conn.query(
      'UPDATE senhas SET status = "CHAMANDO", guiche = ?, chamado_em = NOW() WHERE id = ?',
      [guiche, senha.id]
    );
    await conn.commit();
    const payload = {
      id: senha.id,
      senha: senha.codigo,
      tipo: senha.tipo,
      guiche,
      timestamp: new Date().toISOString()
    };
    mqttClient.publish(TOPICO_CHAMADA, JSON.stringify(payload));
    res.json(payload);
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ erro: error.message });
  } finally {
    conn.release();
  }
});

app.post('/api/senhas/:id/repetir', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM senhas WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ erro: 'Senha não encontrada' });
    const senha = rows[0];
    const payload = {
      id: senha.id,
      senha: senha.codigo,
      tipo: senha.tipo,
      guiche: senha.guiche,
      timestamp: new Date().toISOString()
    };
    mqttClient.publish(TOPICO_CHAMADA, JSON.stringify(payload));
    res.json(payload);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.put('/api/senhas/:id/finalizar', async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE senhas SET status = "ATENDIDA", finalizado_em = NOW() WHERE id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ erro: 'Senha não encontrada' });
    res.json({ id: Number(req.params.id), status: 'ATENDIDA' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.get('/api/chamadas/historico', async (_req, res) => {
  try {
    const [ultimas] = await pool.query(
      'SELECT id, codigo AS senha, tipo, guiche, chamado_em FROM senhas WHERE chamado_em IS NOT NULL ORDER BY chamado_em DESC LIMIT 6'
    );
    const [aguardando] = await pool.query(
      'SELECT id, codigo, tipo, criado_em FROM senhas WHERE status = "AGUARDANDO" ORDER BY FIELD(tipo, "PREFERENCIAL", "NORMAL"), criado_em ASC'
    );
    res.json({ ultimas, aguardando });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`API Guichê rodando na porta ${port}`));
