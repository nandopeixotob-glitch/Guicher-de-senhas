import { useCallback, useEffect, useRef, useState } from 'react';
import { apiRequest } from '../api';
import { useMqtt } from '../useMqtt';

function spokenCode(code) {
  return code
    .replace('-', ' ')
    .split('')
    .map((char) => (char === ' ' ? '' : /\d/.test(char) ? char.replace(/[0-9]/g, (n) => ['zero','um','dois','três','quatro','cinco','seis','sete','oito','nove'][Number(n)]) : char))
    .join(' ');
}

function spokenCounter(counter) {
  const value = Number(String(counter).replace(/\D/g, '')) || 0;
  const tens = value >= 20 ? `${['','um','dois','três','quatro','cinco','sete','sete','sete','nove'][Math.floor(value / 10)]}` : '';
  return counter || String(value);
}

export default function Tv() {
  const [chamada, setChamada] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [aguardando, setAguardando] = useState([]);
  const [agora, setAgora] = useState(new Date());
  const [highlight, setHighlight] = useState(false);
  const [somAtivo, setSomAtivo] = useState(false);
  const [erro, setErro] = useState('');
  const highlightTimer = useRef(null);

  const carregar = useCallback(async () => {
    try {
      const data = await apiRequest('/chamadas/historico');
      setHistorico(data.ultimas || []);
      setAguardando(data.aguardando || []);
      if (!chamada && data.ultimas?.length) {
        const atual = data.ultimas[0];
        setChamada({ senha: atual.senha, tipo: atual.tipo, guiche: atual.guiche });
      }
      setErro('');
    } catch (error) {
      setErro(error.message);
    }
  }, [chamada]);

  const anunciar = useCallback((payload) => {
    setChamada(payload);
    setHistorico((lista) => [payload, ...lista.filter((item) => item.id !== payload.id)].slice(0, 5));
    setHighlight(true);
    clearTimeout(highlightTimer.current);
    highlightTimer.current = setTimeout(() => setHighlight(false), 3000);

    if (somAtivo) {
      try {
        const contexto = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = contexto.createOscillator();
        const gain = contexto.createGain();
        oscillator.frequency.value = 880;
        gain.gain.value = 0.12;
        oscillator.connect(gain);
        gain.connect(contexto.destination);
        oscillator.start();
        setTimeout(() => oscillator.stop(), 500);
        const texto = `Senha ${spokenCode(payload.senha)}, ${payload.guiche?.replace('Guichê', 'guichê')}`;
        const utterance = new SpeechSynthesisUtterance(texto);
        utterance.lang = 'pt-BR';
        utterance.rate = 0.85;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      } catch {
        setErro('O navegador bloqueou som ou voz');
      }
    }
  }, [somAtivo]);

  const mqttStatus = useMqtt('atendimento/painel/chamada', anunciar);

  useEffect(() => {
    carregar();
    const historicoTimer = setInterval(carregar, 15000);
    const clockTimer = setInterval(() => setAgora(new Date()), 1000);
    return () => {
      clearInterval(historicoTimer);
      clearInterval(clockTimer);
      clearTimeout(highlightTimer.current);
    };
  }, [carregar]);

  const ativarSom = () => {
    setSomAtivo(true);
    const contexto = new (window.AudioContext || window.webkitAudioContext)();
    contexto.resume();
  };

  const preferencial = chamada?.tipo === 'PREFERENCIAL';
  return (
    <main className="tv-page">
      <button className="sound-button" onClick={ativarSom}>
        {somAtivo ? 'Som/Voz ativo' : 'Ativar Som/Voz'}
      </button>
      <section className="tv-header">
        <div className="brand-mark">SAÚDE <b>+</b></div>
        <div>
          <p>Painel de Atendimento</p>
          <small>{mqttStatus}</small>
        </div>
      </section>
      {erro && <div className="connection-error">{erro}</div>}
      <section className="tv-grid">
        <article className={`current-call ${preferencial ? 'preferential' : ''} ${highlight ? 'highlight' : ''}`}>
          <span className="call-label">{preferencial ? 'ATENDIMENTO PREFERENCIAL' : 'ATENDIMENTO NORMAL'}</span>
          <div className="password">{chamada?.senha || '---'}</div>
          <div className="counter">{chamada?.guiche || 'Aguarde'}</div>
        </article>
        <aside className="history-panel">
          <h2>Últimas chamadas</h2>
          <div className="history-list">
            {historico.slice(0, 5).map((item, index) => (
              <div className="history-row" key={`${item.id || item.senha}-${index}`}>
                <b>{item.senha}</b>
                <span>{item.guiche || '—'}</span>
                <time>{item.chamado_em ? new Date(item.chamado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Agora'}</time>
              </div>
            ))}
          </div>
        </aside>
      </section>
      <footer className="tv-footer">
        <div className="date-time">
          <strong>{agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong>
          <span>{agora.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</span>
        </div>
        <div className="notice">Mantenha seu documento de identificação em mãos.</div>
        <div className="waiting">{aguardando.length} na fila</div>
      </footer>
    </main>
  );
}
