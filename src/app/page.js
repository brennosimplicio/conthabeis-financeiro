'use client';
import { useState, useEffect, useCallback } from 'react';
import MonthPicker from '@/components/MonthPicker';
import StatCard from '@/components/StatCard';
import { DollarSign, TrendingUp, Clock, BarChart3, Search, Printer } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [date, setDate] = useState({ ano: new Date().getFullYear(), mes: new Date().getMonth() + 1 });
  const [data, setData] = useState(null);
  const [comparativo, setComparativo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?ano=${date.ano}&mes=${date.mes}`).catch(() => null);
      if (res && res.ok) {
        setData(await res.json());
      }
      
      const resComp = await fetch(`/api/dashboard/comparativo`).catch(() => null);
      if (resComp && resComp.ok) {
        setComparativo(await resComp.json());
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
      <div className="flex-between no-print" style={{ marginBottom: '1rem' }}>
        <MonthPicker ano={date.ano} mes={date.mes} onChange={(ano, mes) => setDate({ ano, mes })} />
        <button className="btn btn-secondary" onClick={() => window.print()}>
          <Printer size={18} /> Exportar PDF
        </button>
      </div>

      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <StatCard title="Faturamento Total" value={formatCurrency(data.faturamento_total)} icon={DollarSign} color="blue" />
        <StatCard title="Total Recebido" value={formatCurrency(data.total_recebido)} icon={TrendingUp} color="green" />
        <StatCard title="Total a Receber" value={formatCurrency(data.total_a_receber)} icon={Clock} color="amber" />
        <StatCard title="Resultado ContHabeis" value={formatCurrency(data.conthabeis?.resultado)} icon={BarChart3} color={(data.conthabeis?.resultado || 0) >= 0 ? 'green' : 'red'} />
      </div>

      {comparativo.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Evolução Mensal (Últimos 12 meses)</h3>
          <div style={{ width: '100%', height: 350 }}>
            <ResponsiveContainer>
              <BarChart data={comparativo} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)' }} />
                <YAxis tickFormatter={(v) => `R$ ${v/1000}k`} tick={{ fill: 'var(--text-secondary)' }} />
                <Tooltip formatter={(val) => formatCurrency(val)} contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'rgba(0,0,0,0.1)', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="receitas" name="Receitas" fill="var(--accent-green)" radius={[4,4,0,0]} />
                <Bar dataKey="despesas" name="Despesas" fill="var(--accent-red)" radius={[4,4,0,0]} />
                <Bar dataKey="lucro" name="Lucro" fill="var(--accent-blue)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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
              <span style={{ color: 'var(--accent-amber)', fontWeight: 600 }}>{formatCurrency(s.a_receber || s.pendente || 0)}</span>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--bg-darkest)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${(s.recebido + (s.a_receber || s.pendente || 0)) > 0 ? (s.recebido / (s.recebido + (s.a_receber || s.pendente || 0))) * 100 : 0}%`, height: '100%', background: 'var(--accent-blue)' }}></div>
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
