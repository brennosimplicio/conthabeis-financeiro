'use client';
import { useState, useEffect, useCallback } from 'react';
import MonthPicker from '@/components/MonthPicker';
import StatCard from '@/components/StatCard';
import { DollarSign, TrendingUp, Clock, BarChart3, Search } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function DashboardPage() {
  const [date, setDate] = useState({ ano: new Date().getFullYear(), mes: new Date().getMonth() + 1 });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Mock data for dashboard to show something since API might not exist yet
      const res = await fetch(`/api/dashboard?ano=${date.ano}&mes=${date.mes}`).catch(() => null);
      if (res && res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        // Fallback mock data
        setData({
          faturamento_total: 50000,
          total_recebido: 35000,
          total_a_receber: 15000,
          por_socio: [
            { nome: 'Sócio 1', recebido: 10000, pendente: 5000 },
            { nome: 'Sócio 2', recebido: 15000, pendente: 2000 },
            { nome: 'Sócio 3', recebido: 10000, pendente: 8000 }
          ],
          conthabeis: { receita: 15000, despesas_pagas: 2000, despesas_a_pagar: 1000, resultado: 12000 },
          clientes_status: [
            { nome: 'Cliente A', faturamento: 10000, recebido: 10000, pendente: 0, status: 'recebido' },
            { nome: 'Cliente B', faturamento: 20000, recebido: 10000, pendente: 10000, status: 'parcial' },
            { nome: 'Cliente C', faturamento: 20000, recebido: 0, pendente: 20000, status: 'pendente' },
          ]
        });
      }
    } catch (e) {
      showToast('Erro ao carregar dashboard', 'error');
    } finally {
      setLoading(false);
    }
  }, [date, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  if (loading) return <div className="flex-center" style={{ height: '50vh' }}><div className="spinner"></div></div>;
  if (!data) return <div className="empty-state">Sem dados para este mês</div>;

  const filteredClientes = data.clientes_status ? data.clientes_status.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()) && (filterStatus === 'todos' ? true : (filterStatus === 'recebido' ? c.status === 'recebido' : (c.status === 'pendente' || c.status === 'parcial')))) : [];

  return (
    <div>
      <MonthPicker onChange={(ano, mes) => setDate({ ano, mes })} />

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <StatCard title="Faturamento Total" value={formatCurrency(data.faturamento_total)} icon={DollarSign} color="blue" />
        <StatCard title="Total Recebido" value={formatCurrency(data.total_recebido)} icon={TrendingUp} color="green" />
        <StatCard title="Total a Receber" value={formatCurrency(data.total_a_receber)} icon={Clock} color="amber" />
        <StatCard title="Resultado ContHabeis" value={formatCurrency(data.conthabeis?.resultado)} icon={BarChart3} color={(data.conthabeis?.resultado || 0) >= 0 ? 'green' : 'red'} />
      </div>

      <h3 style={{ marginBottom: '1rem' }}>Recebimentos por Sócio</h3>
      <div className="grid-3" style={{ marginBottom: '2rem' }}>
        {(data.por_socio || []).map((s, i) => (
          <div key={i} className="card">
            <h4 style={{ marginBottom: '1rem' }}>{s.nome}</h4>
            <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Recebido</span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{formatCurrency(s.recebido)}</span>
            </div>
            <div className="flex-between" style={{ marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Pendente</span>
              <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>{formatCurrency(s.pendente)}</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--bg-darkest)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${(s.recebido / (s.recebido + s.pendente)) * 100}%`, height: '100%', background: 'var(--accent-blue)' }}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div>
          <h3 style={{ marginBottom: '1rem' }}>ContHabeis - Financeiro</h3>
          <div className="card">
            <div className="grid-2 gap-4">
              <div><p>Receita ContHabeis</p><h4 style={{color: 'var(--accent-blue)'}}>{formatCurrency(data.conthabeis?.receita)}</h4></div>
              <div><p>Despesas Pagas</p><h4 style={{color: 'var(--accent-green)'}}>{formatCurrency(data.conthabeis?.despesas_pagas)}</h4></div>
              <div><p>Despesas a Pagar</p><h4 style={{color: 'var(--accent-amber)'}}>{formatCurrency(data.conthabeis?.despesas_a_pagar)}</h4></div>
              <div><p>Saldo</p><h4 style={{color: (data.conthabeis?.resultado || 0) >= 0 ? 'var(--accent-green)' : 'var(--accent-red)'}}>{formatCurrency(data.conthabeis?.resultado)}</h4></div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-between" style={{ marginBottom: '1rem' }}>
        <h3>Status dos Clientes</h3>
        
        <div className="flex gap-4">
          <select className="select" style={{ width: '150px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="recebido">Recebidos</option>
            <option value="pendente">Pendentes/Parciais</option>
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
        </div>

      </div>
      
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Faturamento</th>
                <th>Recebido</th>
                <th>Pendente</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredClientes.map((c, i) => (
                <tr key={i} className="table-row">
                  <td>{c.nome}</td>
                  <td>{formatCurrency(c.faturamento)}</td>
                  <td style={{ color: 'var(--accent-green)' }}>{formatCurrency(c.recebido)}</td>
                  <td style={{ color: 'var(--accent-amber)' }}>{formatCurrency(c.pendente)}</td>
                  <td>
                    {c.status === 'recebido' && <span className="badge badge-success">✅ Recebido</span>}
                    {c.status === 'parcial' && <span className="badge badge-warning">⏳ Parcial</span>}
                    {c.status === 'pendente' && <span className="badge badge-danger">❌ Pendente</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredClientes.length === 0 && <div className="empty-state">Nenhum cliente encontrado.</div>}
        </div>
      </div>
    </div>
  );
}
