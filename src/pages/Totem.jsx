import { useState } from 'react';
import { apiRequest } from '../api';

export default function Totem() {
  const [senha, setSenha] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const retirar = async (tipo) => {
    setCarregando(true);
    setErro('');
    try {
      const novaSenha = await apiRequest('/senhas', {
        method: 'POST',
        body: JSON.stringify({ tipo })
      });
      setSenha(novaSenha);
      setTimeout(() => setSenha(null), 4000);
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="totem-page">
      <header className="totem-header">
        <div className="brand-mark dark">SAÚDE <b>+</b></div>
        <div><strong>Retirada de Senha</strong><small>Selecione o tipo de atendimento</small></div>
      </header>
      {erro && <div className="admin-error">{erro}</div>}
      <section className="totem-options">
        <button className="totem-card normal" onClick={() => retirar('NORMAL')} disabled={carregando}>
          <span className="totem-icon">N</span>
          <strong>Atendimento<br />Normal</strong>
          <small>Retirar senha</small>
        </button>
        <button className="totem-card preferential" onClick={() => retirar('PREFERENCIAL')} disabled={carregando}>
          <span className="totem-icon">P</span>
          <strong>Atendimento<br />Preferencial</strong>
          <small>Idosos, PcD e gestantes</small>
        </button>
      </section>
      {senha && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Senha retirada">
          <div className="ticket-modal">
            <span>Sua senha é</span>
            <strong>{senha.codigo}</strong>
            <small>{senha.tipo === 'PREFERENCIAL' ? 'Atendimento Preferencial' : 'Atendimento Normal'}</small>
            <button onClick={() => window.print()}>Imprimir senha</button>
          </div>
        </div>
      )}
    </main>
  );
}
