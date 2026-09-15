'use client';
import { useState, useEffect } from 'react';
import { Search, FileText, Copy, Check } from 'lucide-react';
import MonthPicker from '@/components/MonthPicker';
import { useToast } from '@/components/Toast';

export default function RelatorioPage() {
  const { showToast } = useToast();
  const [date, setDate] = useState({ ano: new Date().getFullYear(), mes: new Date().getMonth() + 1 });
  const [clientes, setClientes] = useState([]);
  const [selectedClientes, setSelectedClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [relatorio, setRelatorio] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');

  const meses = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/recebimentos?ano=${date.ano}&mes=${date.mes}`);
      if (res.ok) {
        const recebimentos = await res.json();
        // Group by client
        const cmap = {};
        for (const r of recebimentos) {
          if (!cmap[r.cliente_id]) {
            cmap[r.cliente_id] = {
              cliente_id: r.cliente_id,
              cliente_nome: r.cliente_nome,
              valor_esperado: 0
            };
          }
          cmap[r.cliente_id].valor_esperado += r.valor_esperado;
        }
        setClientes(Object.values(cmap));
      }
    } catch (e) {
      showToast('Erro ao carregar clientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
    setSelectedClientes([]);
    setRelatorio(null);
  }, [date.ano, date.mes]);

  const toggleCliente = (clienteId) => {
    setSelectedClientes(prev => 
      prev.includes(clienteId) 
        ? prev.filter(id => id !== clienteId)
        : [...prev, clienteId]
    );
  };

  const selectAll = () => {
    const filteredIds = filteredClientes.map(c => c.cliente_id);
    const allSelected = filteredIds.every(id => selectedClientes.includes(id));
    if (allSelected) {
      setSelectedClientes(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedClientes(prev => [...new Set([...prev, ...filteredIds])]);
    }
  };

  const generateRelatorio = async () => {
    if (selectedClientes.length === 0) {
      showToast('Selecione pelo menos um cliente', 'error');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/relatorio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente_ids: selectedClientes, ano: date.ano, mes: date.mes })
      });
      if (res.ok) {
        setRelatorio(await res.json());
      }
    } catch (e) {
      showToast('Erro ao gerar relatório', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const generateText = () => {
    if (!relatorio) return '';
    
    let text = `📋 *RELATÓRIO DE PAGAMENTOS*\n`;
    text += `📅 ${meses[date.mes]}/${date.ano}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    text += `✅ *Clientes que pagaram:*\n`;
    for (const c of relatorio.clientes) {
      text += `• ${c.nome} — ${formatCurrency(c.total)}\n`;
    }
    
    text += `\n💰 *Total recebido:* ${formatCurrency(relatorio.total_geral)}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    text += `💸 *Transferir para:*\n`;
    for (const s of relatorio.socios) {
      if (s.total > 0 && !s.is_empresa) {
        text += `• ${s.nome}: ${formatCurrency(s.total)}\n`;
      }
    }
    
    // ContHabeis (empresa) at the end
    const empresa = relatorio.socios.find(s => s.is_empresa);
    if (empresa && empresa.total > 0) {
      text += `• ${empresa.nome} (Empresa): ${formatCurrency(empresa.total)}\n`;
    }
    
    return text;
  };

  const copyToClipboard = async () => {
    const text = generateText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast('Relatório copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      showToast('Erro ao copiar', 'error');
    }
  };

  const filteredClientes = clientes.filter(c => 
    c.cliente_nome?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <MonthPicker onChange={(ano, mes) => setDate({ ano, mes })} />

      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <h2>Relatório de Pagamentos</h2>
        <div className="flex gap-4">
          <div style={{ position: 'relative', width: '250px' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar cliente..." 
              className="input" 
              style={{ paddingLeft: '2.5rem' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={generateRelatorio} disabled={generating || selectedClientes.length === 0}>
            <FileText size={18} />
            {generating ? 'Gerando...' : 'Gerar Relatório'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: relatorio ? '1fr 1fr' : '1fr', gap: '1rem' }}>
        {/* Left: Client selection */}
        <div className="card" style={{ padding: 0 }}>
          {loading ? <div className="flex-center" style={{ height: '200px' }}><div className="spinner"></div></div> : (
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input 
                      type="checkbox" 
                      className="checkbox"
                      checked={filteredClientes.length > 0 && filteredClientes.every(c => selectedClientes.includes(c.cliente_id))}
                      onChange={selectAll}
                    />
                  </th>
                  <th>Cliente</th>
                  <th>Valor Mensal</th>
                </tr>
              </thead>
              <tbody>
                {filteredClientes.map(c => (
                  <tr key={c.cliente_id} className="table-row" style={{ cursor: 'pointer' }} onClick={() => toggleCliente(c.cliente_id)}>
                    <td>
                      <input 
                        type="checkbox" 
                        className="checkbox"
                        checked={selectedClientes.includes(c.cliente_id)}
                        onChange={() => toggleCliente(c.cliente_id)}
                      />
                    </td>
                    <td>{c.cliente_nome}</td>
                    <td>{formatCurrency(c.valor_esperado)}</td>
                  </tr>
                ))}
                {filteredClientes.length === 0 && (
                  <tr><td colSpan="3" className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>Nenhum cliente encontrado.</td></tr>
                )}
              </tbody>
            </table>
          )}
          <div style={{ padding: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {selectedClientes.length} cliente(s) selecionado(s)
          </div>
        </div>

        {/* Right: Report result */}
        {relatorio && (
          <div className="card">
            <div className="flex-between" style={{ marginBottom: '1rem' }}>
              <h3>📋 Memorando</h3>
              <button className="btn btn-secondary" onClick={copyToClipboard}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Copiado!' : 'Copiar para WhatsApp'}
              </button>
            </div>

            <div style={{ background: 'var(--bg-darkest)', borderRadius: 'var(--radius-md)', padding: '1.5rem', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {generateText()}
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>Detalhamento por Sócio</h4>
              {relatorio.socios.filter(s => s.total > 0).map(s => (
                <div key={s.socio_id} className="card" style={{ marginBottom: '0.5rem', padding: '1rem' }}>
                  <div className="flex-between">
                    <strong>{s.nome} {s.is_empresa ? '(Empresa)' : ''}</strong>
                    <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{formatCurrency(s.total)}</span>
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {s.clientes.map((c, i) => (
                      <span key={i}>{c.cliente_nome}: {formatCurrency(c.valor)} {i < s.clientes.length - 1 ? ' | ' : ''}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
