'use client';
import { useState, useEffect } from 'react';
import { Search, FileText, Copy, Check, Plus, X, Trash2 } from 'lucide-react';
import MonthPicker from '@/components/MonthPicker';
import { useToast } from '@/components/Toast';

export default function RelatorioPage() {
  const { showToast } = useToast();
  const [date, setDate] = useState({ ano: new Date().getFullYear(), mes: new Date().getMonth() + 1 });
  const [clientes, setClientes] = useState([]);
  // selectedItems: array of { cliente_id, cliente_nome, ano, mes, valor_esperado }
  const [selectedItems, setSelectedItems] = useState([]);
  const [addingCompClientId, setAddingCompClientId] = useState(null);
  const [newComp, setNewComp] = useState({ ano: new Date().getFullYear(), mes: new Date().getMonth() + 1 });
  const [loading, setLoading] = useState(true);
  const [relatorio, setRelatorio] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');

  const meses = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const mesesCurto = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

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
  }, [date.ano, date.mes]);

  // Check if a client has ANY month selected
  const isClientSelected = (clienteId) => {
    return selectedItems.some(item => item.cliente_id === clienteId);
  };

  // Get all selected items for a given client, sorted chronologically
  const getClientSelectedItems = (clienteId) => {
    return selectedItems
      .filter(item => item.cliente_id === clienteId)
      .sort((a, b) => (a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes));
  };

  // Toggle client selection: if unselected, adds current header (date.ano, date.mes). If selected, removes all months for that client.
  const toggleCliente = (cliente) => {
    const alreadySelected = isClientSelected(cliente.cliente_id);
    if (alreadySelected) {
      setSelectedItems(prev => prev.filter(item => item.cliente_id !== cliente.cliente_id));
      if (addingCompClientId === cliente.cliente_id) {
        setAddingCompClientId(null);
      }
    } else {
      setSelectedItems(prev => [
        ...prev,
        {
          cliente_id: cliente.cliente_id,
          cliente_nome: cliente.cliente_nome,
          ano: date.ano,
          mes: date.mes,
          valor_esperado: cliente.valor_esperado
        }
      ]);
    }
  };

  // Add a specific month/year for a client
  const addCompetencia = (cliente, targetAno, targetMes) => {
    const exists = selectedItems.some(
      item => item.cliente_id === cliente.cliente_id && item.ano === Number(targetAno) && item.mes === Number(targetMes)
    );
    if (exists) {
      showToast(`${meses[targetMes]}/${targetAno} já está selecionado para ${cliente.cliente_nome}`, 'error');
      return;
    }
    setSelectedItems(prev => [
      ...prev,
      {
        cliente_id: cliente.cliente_id,
        cliente_nome: cliente.cliente_nome,
        ano: Number(targetAno),
        mes: Number(targetMes),
        valor_esperado: cliente.valor_esperado
      }
    ]);
    setAddingCompClientId(null);
  };

  // Remove a single month/year from a client
  const removeCompetencia = (clienteId, targetAno, targetMes, e) => {
    if (e) e.stopPropagation();
    setSelectedItems(prev =>
      prev.filter(item => !(item.cliente_id === clienteId && item.ano === targetAno && item.mes === targetMes))
    );
  };

  // Open the inline competence selector defaulting to the previous month of the earliest selected month (or current date)
  const openAddCompetencia = (cliente, e) => {
    if (e) e.stopPropagation();
    if (addingCompClientId === cliente.cliente_id) {
      setAddingCompClientId(null);
      return;
    }
    const clientItems = getClientSelectedItems(cliente.cliente_id);
    let baseAno = date.ano;
    let baseMes = date.mes - 1;
    if (clientItems.length > 0) {
      baseAno = clientItems[0].ano;
      baseMes = clientItems[0].mes - 1;
    }
    if (baseMes < 1) {
      baseMes = 12;
      baseAno -= 1;
    }
    setNewComp({ ano: baseAno, mes: baseMes });
    setAddingCompClientId(cliente.cliente_id);
  };

  const selectAll = () => {
    const allSelected = filteredClientes.length > 0 && filteredClientes.every(c => isClientSelected(c.cliente_id));
    if (allSelected) {
      const filteredIds = filteredClientes.map(c => c.cliente_id);
      setSelectedItems(prev => prev.filter(item => !filteredIds.includes(item.cliente_id)));
    } else {
      const newSelections = [];
      for (const c of filteredClientes) {
        const hasCurrentMonth = selectedItems.some(
          item => item.cliente_id === c.cliente_id && item.ano === date.ano && item.mes === date.mes
        );
        if (!hasCurrentMonth && !isClientSelected(c.cliente_id)) {
          newSelections.push({
            cliente_id: c.cliente_id,
            cliente_nome: c.cliente_nome,
            ano: date.ano,
            mes: date.mes,
            valor_esperado: c.valor_esperado
          });
        }
      }
      setSelectedItems(prev => [...prev, ...newSelections]);
    }
  };

  const clearSelection = () => {
    setSelectedItems([]);
    setRelatorio(null);
    setAddingCompClientId(null);
  };

  const generateRelatorio = async () => {
    if (selectedItems.length === 0) {
      showToast('Selecione pelo menos um cliente', 'error');
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch('/api/relatorio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itens: selectedItems.map(i => ({
            cliente_id: i.cliente_id,
            ano: i.ano,
            mes: i.mes
          })),
          ano: date.ano,
          mes: date.mes
        })
      });
      if (res.ok) {
        setRelatorio(await res.json());
      } else {
        showToast('Erro ao gerar relatório', 'error');
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

    // Verificar todas as competências presentes no relatório
    const allComps = new Set();
    for (const c of relatorio.clientes) {
      if (c.competencias && c.competencias.length > 0) {
        c.competencias.forEach(comp => allComps.add(comp));
      }
    }
    const uniqueComps = Array.from(allComps);
    const isMultiComp = uniqueComps.length > 1;
    const headerDateText = uniqueComps.length === 1 ? uniqueComps[0] : `${meses[date.mes]}/${date.ano}`;

    let text = `📋 *RELATÓRIO DE PAGAMENTOS*\n`;
    text += `📅 ${headerDateText}${isMultiComp ? ' (Múltiplas Competências)' : ''}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    text += `✅ *Clientes que pagaram:*\n`;
    for (const c of relatorio.clientes) {
      const hasMultipleClientMonths = c.competencias && c.competencias.length > 1;
      // Mostra as competências ao lado do nome se houver mais de um mês no relatório ou se o cliente pagou mais de 1 mês
      if (isMultiComp || hasMultipleClientMonths) {
        const compStr = (c.competencias || []).join(', ');
        text += `• ${c.nome} (${compStr}) — ${formatCurrency(c.total)}\n`;
      } else {
        text += `• ${c.nome} — ${formatCurrency(c.total)}\n`;
      }
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
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "absolute";
        textArea.style.left = "-999999px";
        document.body.prepend(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
        } catch (error) {
          throw new Error("Failed to copy");
        } finally {
          textArea.remove();
        }
      }
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

  const uniqueSelectedClientsCount = new Set(selectedItems.map(i => i.cliente_id)).size;

  return (
    <div>
      <MonthPicker ano={date.ano} mes={date.mes} onChange={(ano, mes) => setDate({ ano, mes })} />

      <div className="flex-between" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2>Relatório de Pagamentos</h2>
        <div className="flex gap-2" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '240px' }}>
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
          {selectedItems.length > 0 && (
            <button className="btn btn-secondary" onClick={clearSelection} title="Limpar seleção">
              <Trash2 size={16} />
              Limpar ({selectedItems.length})
            </button>
          )}
          <button className="btn btn-primary" onClick={generateRelatorio} disabled={generating || selectedItems.length === 0}>
            <FileText size={18} />
            {generating ? 'Gerando...' : 'Gerar Relatório'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: relatorio ? '1fr 1fr' : '1fr', gap: '1rem' }}>
        {/* Left: Client selection */}
        <div className="card" style={{ padding: 0 }}>
          {loading ? <div className="flex-center" style={{ height: '200px' }}><div className="spinner"></div></div> : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        className="checkbox"
                        checked={filteredClientes.length > 0 && filteredClientes.every(c => isClientSelected(c.cliente_id))}
                        onChange={selectAll}
                      />
                    </th>
                    <th>Cliente / Competências Pagas</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClientes.map(c => {
                    const clientSelected = isClientSelected(c.cliente_id);
                    const clientItems = getClientSelectedItems(c.cliente_id);
                    const totalCliente = clientSelected
                      ? clientItems.length * c.valor_esperado
                      : c.valor_esperado;

                    return (
                      <tr
                        key={c.cliente_id}
                        className="table-row"
                        style={{
                          cursor: 'pointer',
                          backgroundColor: clientSelected ? 'rgba(140, 59, 74, 0.04)' : 'transparent'
                        }}
                        onClick={() => toggleCliente(c)}
                      >
                        <td style={{ verticalAlign: 'top', paddingTop: '1.1rem' }}>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={clientSelected}
                            onChange={() => toggleCliente(c)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td>
                          <div style={{ fontWeight: clientSelected ? 600 : 400 }}>{c.cliente_nome}</div>

                          {/* Competências selecionadas para este cliente */}
                          {clientSelected && (
                            <div
                              style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem', alignItems: 'center' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {clientItems.map(item => (
                                <span
                                  key={`${item.ano}_${item.mes}`}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    backgroundColor: 'rgba(140, 59, 74, 0.12)',
                                    color: 'var(--accent-blue)',
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '999px',
                                    fontSize: '0.78rem',
                                    fontWeight: 600
                                  }}
                                >
                                  {meses[item.mes]}/{item.ano}
                                  <button
                                    type="button"
                                    onClick={(e) => removeCompetencia(c.cliente_id, item.ano, item.mes, e)}
                                    style={{
                                      border: 'none',
                                      background: 'transparent',
                                      color: 'var(--accent-blue)',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      padding: 0,
                                      marginLeft: '2px'
                                    }}
                                    title="Remover este mês"
                                  >
                                    <X size={13} />
                                  </button>
                                </span>
                              ))}

                              <button
                                type="button"
                                onClick={(e) => openAddCompetencia(c, e)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.2rem',
                                  border: '1px dashed var(--accent-blue)',
                                  background: 'transparent',
                                  color: 'var(--accent-blue)',
                                  padding: '0.18rem 0.5rem',
                                  borderRadius: '999px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                                title="Incluir pagamento de outro mês para este cliente"
                              >
                                <Plus size={12} /> Mês
                              </button>
                            </div>
                          )}

                          {/* Seletor inline para adicionar novo mês */}
                          {addingCompClientId === c.cliente_id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                marginTop: '0.5rem',
                                padding: '0.5rem',
                                backgroundColor: 'var(--bg-darkest)',
                                borderRadius: 'var(--radius-md)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                flexWrap: 'wrap',
                                border: '1px solid rgba(0,0,0,0.08)'
                              }}
                            >
                              <select
                                className="select"
                                style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.82rem' }}
                                value={newComp.mes}
                                onChange={(e) => setNewComp(prev => ({ ...prev, mes: Number(e.target.value) }))}
                              >
                                {meses.slice(1).map((mName, idx) => (
                                  <option key={idx + 1} value={idx + 1}>{mName}</option>
                                ))}
                              </select>
                              <select
                                className="select"
                                style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.82rem' }}
                                value={newComp.ano}
                                onChange={(e) => setNewComp(prev => ({ ...prev, ano: Number(e.target.value) }))}
                              >
                                {[date.ano - 1, date.ano, date.ano + 1].map(y => (
                                  <option key={y} value={y}>{y}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => addCompetencia(c, newComp.ano, newComp.mes)}
                              >
                                Incluir
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() => setAddingCompClientId(null)}
                              >
                                Cancelar
                              </button>
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', verticalAlign: 'top', paddingTop: '1.1rem', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: clientSelected ? 600 : 400 }}>
                            {formatCurrency(totalCliente)}
                          </div>
                          {clientSelected && clientItems.length > 1 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {clientItems.length}x {formatCurrency(c.valor_esperado)}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredClientes.length === 0 && (
                    <tr><td colSpan="3" className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>Nenhum cliente encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          <div className="flex-between" style={{ padding: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <span>{uniqueSelectedClientsCount} cliente(s) selecionado(s) ({selectedItems.length} competência(s))</span>
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
                      <span key={i}>
                        {c.cliente_nome}{c.competencia ? ` (${c.competencia})` : ''}: {formatCurrency(c.valor)}
                        {i < s.clientes.length - 1 ? ' | ' : ''}
                      </span>
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
