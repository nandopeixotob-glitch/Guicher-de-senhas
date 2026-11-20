import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../api';

export default function Guiche() {
  const guiches = Array.from({ length: 10 }, (_, index) => `Guichê ${String(index + 1).padStart(2, '0')}`);
  const [guiche, setGuiche] = useState(localStorage.getItem('guiche') || guiches[0]);
  const [atendente, setAtendente] = useState(localStorage.getItem('atendente') || '');
  const [atual, setAtual] = useState(null);
  const [fila, setFila] = useState([]);
  const [erro, setErro] = useState('');
  const [avisando, setAvisando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const data = await apiRequest('/chamadas/historico');
      setFila(data.aguardando || []);
      const chamado = (data.ultimas || []).find((item) => item.guiche === guiche && item.chamado_em);
      if (chamado) setAtual((anterior) => anterior?.id === chamado.id ? anterior : { id: chamado.id, senha: chamado.senha, tipo: chamado.tipo, guiche: chamado.guiche });
      setErro('');
    } catch (error) {
      setErro(error.message);
    }
  }, [guiche]);

  useEffect(() => {
    carregar();
    const timer = setInterval(carregar, 5000);
    return () => clearInterval(timer);
  }, [carregar]);

  useEffect(() => {
    localStorage.setItem('guiche', guiche);
  }, [guiche]);
  useEffect(() => {
    localStorage.setItem('atendente', atendente);
  }, [atendente]);

  const chamarProxima = async () => {
    setAvisando(true);
    setErro('');
    try {
      const senha = await apiRequest('/senhas/chamar-proxima', {
        method: 'POST',
        body: JSON.stringify({ guiche })
      });
      setAtual(senha);
      await carregar();
    } catch (error) {
      setErro(error.message);
    } finally {
      setAvisando(false);
    }
  };

  const repetir = async () => {
    if (!atual) return;
    try {
      await apiRequest(`/senhas/${atual.id}/repetir`, { method: 'POST' });
    } catch (error) {
      setErro(error.message);
    }
  };

  const finalizar = async () => {
    if (!atual) return;
    try {
      await apiRequest(`/senhas/${atual.id}/finalizar`, { method: 'PUT' });
      setAtual(null);
      await carregar();
    } catch (error) {
      setErro(error.message);
    }
  };

  const espera = (criadoEm) => {
    const segundos = Math.max(0, Math.floor((Date.now() - new Date(criadoEm).getTime()) / 1000));
    const minutos = Math.floor(segundos / 60);
    return `${minutos}:${String(segundos % 60).padStart(2, '0')}`;
  };

  return (
    <main className="guiche-page">
      <header className="admin-header">
        <div>
          <span className="eyebrow">PAINEL DO ATENDENTE</span>
          <h1>Gerenciamento de chamadas</h1>
        </div>
        <div className="operator-fields">
          <label>
            Atendimento
            <select value={guiche} onChange={(event) => setGuiche(event.target.value)}>
              {guiches.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>
            Nome do atendente
            <input value={atendente} onChange={(event) => setAtendente(event.target.value)} placeholder="Digite seu nome" />
          </label>
        </div>
      </header>
      {erro && <div className="admin-error">{erro}</div>}
      <section className="admin-grid">
        <div className="column-main">
          <article className="current-ticket">
            <span>ATENDIMENTO ATUAL</span>
            <strong>{atual?.senha || 'Aguardando chamada'}</strong>
            {atual && <small>{atual.tipo === 'PREFERENCIAL' ? 'Preferencial' : 'Normal'} • {atual.guiche}</small>}
            <div className="ticket-actions">
              <button className="secondary-button" onClick={repetir} disabled={!atual}>Chamar novamente</button>
              <button className="finish-button" onClick={finalizar} disabled={!atual}>Finalizar atendimento</button>
            </div>
          </article>
          <button className="next-button" onClick={chamarProxima} disabled={avisando}>
            {avisando ? 'Chamando...' : 'Chamar próxima senha'}
          </button>
        </div>
        <article className="queue-panel">
          <div className="queue-title">
            <h2>Fila de espera</h2>
            <span>{fila.length}</span>
          </div>
          <div className="queue-table">
            <div className="queue-row queue-head"><b>Senha</b><b>Tipo</b><b>Espera</b></div>
            {fila.map((item) => (
              <div className="queue-row" key={item.id}>
                <strong>{item.codigo}</strong>
                <span className={item.tipo === 'PREFERENCIAL' ? 'tag preferential-tag' : 'tag'}>{item.tipo}</span>
                <time>{espera(item.criado_em)}</time>
              </div>
            ))}
            {!fila.length && <p className="empty-state">Nenhuma senha aguardando.</p>}
          </div>
        </article>
      </section>
    </main>
  );
}
