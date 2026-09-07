'use client';
import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import MonthPicker from '@/components/MonthPicker';
import { useToast } from '@/components/Toast';

export default function PagamentosPage() {
  const { showToast } = useToast();
  const [date, setDate] = useState({ ano: new Date().getFullYear(), mes: new Date().getMonth() + 1 });
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pagamentos?ano=${date.ano}&mes=${date.mes}`);
      if (res.ok) setPagamentos(await res.json());
    } catch (e) {
      showToast('Erro ao carregar pagamentos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [date.ano, date.mes]);

  const handleChange = (id, field, value) => {
    setPagamentos(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/pagamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pagamentos)
      });
      showToast('Pagamentos atualizados com sucesso');
    } catch (e) {
      showToast('Erro ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  return (
    <div>
      <MonthPicker onChange={(ano, mes) => setDate({ ano, mes })} />

      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <h2>Controle de Pagamentos (Despesas)</h2>
        
        <div className="flex gap-4">
          <select className="select" style={{ width: '150px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="todos">Todas</option>
            <option value="pago">Pagas</option>
            <option value="pendente">Pendentes</option>
          </select>
          <div style={{ position: 'relative', width: '250px' }}>

            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Buscar..." 
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
                <th>Despesa</th>
                <th>Valor Esperado</th>
                <th>Valor Pago</th>
                <th>Data Pagamento</th>
                <th>Status</th>
                <th>Obs</th>
              </tr>
            </thead>
            <tbody>
              {pagamentos.filter(p => p.despesa_nome.toLowerCase().includes(search.toLowerCase()) && (filterStatus === 'todos' ? true : (filterStatus === 'pago' ? p.pago === 1 : p.pago === 0))).map(p => (
                <tr key={p.id} className="table-row">
                  <td>
                    <div><strong>{p.despesa_nome}</strong></div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.categoria}</div>
                  </td>
                  <td>{formatCurrency(p.valor_esperado)}</td>
                  <td>
                    <input 
                      type="number" 
                      step="0.01"
                      className="input" 
                      value={p.valor_pago || ''} 
                      onChange={(e) => handleChange(p.id, 'valor_pago', parseFloat(e.target.value) || 0)} 
                      style={{ width: '120px', padding: '0.4rem' }}
                    />
                  </td>
                  <td>
                    <input 
                      type="date" 
                      className="input" 
                      value={p.data_pagamento || ''} 
                      onChange={(e) => handleChange(p.id, 'data_pagamento', e.target.value)}
                      style={{ padding: '0.4rem' }}
                    />
                  </td>
                  <td>
                    <input 
                      type="checkbox" 
                      className="checkbox" 
                      checked={p.pago === 1}
                      onChange={(e) => handleChange(p.id, 'pago', e.target.checked ? 1 : 0)}
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      className="input" 
                      value={p.observacao || ''} 
                      onChange={(e) => handleChange(p.id, 'observacao', e.target.value)}
                      style={{ padding: '0.4rem' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
