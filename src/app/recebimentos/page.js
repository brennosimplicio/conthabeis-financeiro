'use client';
import { useState, useEffect, useMemo } from 'react';
import { Search } from 'lucide-react';
import MonthPicker from '@/components/MonthPicker';
import { useToast } from '@/components/Toast';

export default function RecebimentosPage() {
  const { showToast } = useToast();
  const [date, setDate] = useState({ ano: new Date().getFullYear(), mes: new Date().getMonth() + 1 });
  const [clientesGrouped, setClientesGrouped] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');

  const fetchData = async () => {
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
              valor_esperado: 0,
              valor_recebido: 0,
              recebido: 1, // assume true until proven false
              data_recebimento: r.data_recebimento || '',
              observacao: r.observacao || '',
              originais: []
            };
          }
          cmap[r.cliente_id].valor_esperado += r.valor_esperado;
          cmap[r.cliente_id].valor_recebido += r.valor_recebido;
          if (r.recebido === 0) cmap[r.cliente_id].recebido = 0;
          if (r.data_recebimento && !cmap[r.cliente_id].data_recebimento) {
            cmap[r.cliente_id].data_recebimento = r.data_recebimento;
          }
          if (r.observacao && !cmap[r.cliente_id].observacao) {
            cmap[r.cliente_id].observacao = r.observacao;
          }
          cmap[r.cliente_id].originais.push(r);
        }
        
        setClientesGrouped(Object.values(cmap));
      }
    } catch (e) {
      showToast('Erro ao carregar recebimentos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [date.ano, date.mes]);

  const handleChange = (cliente_id, field, value) => {
    setClientesGrouped(prev => prev.map(c => {
      if (c.cliente_id === cliente_id) {
        const updated = { ...c, [field]: value };
        
        // Se mudou o checkbox de "recebido" para marcado, preenchemos o valor recebido = valor esperado
        if (field === 'recebido' && value === 1 && updated.valor_recebido === 0) {
          updated.valor_recebido = updated.valor_esperado;
        }
        
        // Update originais proportionately
        if (field === 'valor_recebido' || field === 'recebido') {
          const totalVal = field === 'valor_recebido' ? value : updated.valor_recebido;
          const ratio = updated.valor_esperado > 0 ? (totalVal / updated.valor_esperado) : 0;
          
          updated.originais = updated.originais.map(o => ({
            ...o,
            valor_recebido: parseFloat((o.valor_esperado * ratio).toFixed(2)),
            recebido: updated.recebido // assume all sub-items get the same status
          }));
        } else if (field === 'data_recebimento' || field === 'observacao') {
          updated.originais = updated.originais.map(o => ({
            ...o,
            [field]: value
          }));
        }
        
        return updated;
      }
      return c;
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const allOriginais = clientesGrouped.flatMap(c => c.originais);
      await fetch('/api/recebimentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allOriginais)
      });
      showToast('Recebimentos atualizados com sucesso');
    } catch (e) {
      showToast('Erro ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const filteredClientes = useMemo(() => {
    return clientesGrouped.filter(c => c.cliente_nome?.toLowerCase().includes(search.toLowerCase()) && (filterStatus === 'todos' ? true : (filterStatus === 'recebido' ? c.recebido === 1 : c.recebido === 0)));
  }, [clientesGrouped, search, filterStatus]);

  return (
    <div>
      <MonthPicker onChange={(ano, mes) => setDate({ ano, mes })} />

      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <h2>Controle de Recebimentos</h2>
        
        <div className="flex gap-4">
          <select className="select" style={{ width: '150px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="recebido">Recebidos</option>
            <option value="pendente">Pendentes</option>
          </select>
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
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="flex-center" style={{ height: '200px' }}><div className="spinner"></div></div> : (
          <table className="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Valor Mensal (Total)</th>
                <th>Valor Recebido</th>
                <th>Data Recebimento</th>
                <th>Status</th>
                <th>Obs</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map(c => (
                <tr key={c.cliente_id} className="table-row">
                  <td>{c.cliente_nome}</td>
                  <td>{formatCurrency(c.valor_esperado)}</td>
                  <td>
                    <input 
                      type="number" 
                      step="0.01"
                      className="input" 
                      value={c.valor_recebido === 0 && c.recebido === 0 ? '' : c.valor_recebido} 
                      onChange={(e) => handleChange(c.cliente_id, 'valor_recebido', parseFloat(e.target.value) || 0)} 
                      style={{ width: '120px', padding: '0.4rem' }}
                    />
                  </td>
                  <td>
                    <input 
                      type="date" 
                      className="input" 
                      value={c.data_recebimento || ''} 
                      onChange={(e) => handleChange(c.cliente_id, 'data_recebimento', e.target.value)}
                      style={{ padding: '0.4rem' }}
                    />
                  </td>
                  <td>
                    <input 
                      type="checkbox" 
                      className="checkbox" 
                      checked={c.recebido === 1}
                      onChange={(e) => handleChange(c.cliente_id, 'recebido', e.target.checked ? 1 : 0)}
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      className="input" 
                      value={c.observacao || ''} 
                      onChange={(e) => handleChange(c.cliente_id, 'observacao', e.target.value)}
                      style={{ padding: '0.4rem' }}
                    />
                  </td>
                </tr>
              ))}
              {filteredClientes.length === 0 && (
                <tr><td colSpan="6" className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>Nenhum recebimento encontrado.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
