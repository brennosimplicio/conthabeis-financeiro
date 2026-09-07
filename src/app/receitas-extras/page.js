'use client';
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import MonthPicker from '@/components/MonthPicker';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';

export default function ReceitasExtrasPage() {
  const { showToast } = useToast();
  const [date, setDate] = useState({ ano: new Date().getFullYear(), mes: new Date().getMonth() + 1 });
  const [receitas, setReceitas] = useState([]);
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recRes, socRes] = await Promise.all([
        fetch(`/api/receitas-extras?ano=${date.ano}&mes=${date.mes}`),
        fetch('/api/socios')
      ]);
      if (recRes.ok) setReceitas(await recRes.json());
      if (socRes.ok) setSocios(await socRes.json());
    } catch (e) {
      showToast('Erro ao carregar receitas extras', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [date.ano, date.mes]);

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      descricao: formData.get('descricao'),
      valor: parseFloat(formData.get('valor') || 0),
      socio_id: parseInt(formData.get('socio_id')),
      data_recebimento: formData.get('data_recebimento'),
      observacao: formData.get('observacao'),
      ano: date.ano,
      mes: date.mes
    };

    try {
      if (editing) {
        payload.id = editing.id;
        await fetch('/api/receitas-extras', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        showToast('Receita extra atualizada');
      } else {
        await fetch('/api/receitas-extras', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        showToast('Receita extra cadastrada');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      showToast('Erro ao salvar receita', 'error');
    }
  };

  const handleDelete = async (id) => {
    if(confirm('Excluir esta receita extra?')) {
      try {
        await fetch(`/api/receitas-extras?id=${id}`, { method: 'DELETE' });
        showToast('Receita excluída');
        fetchData();
      } catch (e) {
        showToast('Erro ao excluir receita', 'error');
      }
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  return (
    <div>
      <MonthPicker onChange={(ano, mes) => setDate({ ano, mes })} />

      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h2>Receitas Extras</h2>
        <div className="flex gap-4">
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
          <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus size={18} /> Nova Receita Extra
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="flex-center" style={{ height: '200px' }}><div className="spinner"></div></div> : (
          <table className="table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Sócio Destino</th>
                <th>Valor</th>
                <th>Data</th>
                <th>Obs</th>
                <th style={{ width: '100px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {receitas.length === 0 && (
                <tr><td colSpan="6" className="text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>Nenhuma receita extra neste mês.</td></tr>
              )}
              {receitas.filter(r => r.descricao.toLowerCase().includes(search.toLowerCase())).map(r => (
                <tr key={r.id} className="table-row">
                  <td>{r.descricao}</td>
                  <td>{r.socio_nome}</td>
                  <td style={{ color: 'var(--accent-green)' }}>{formatCurrency(r.valor)}</td>
                  <td>{r.data_recebimento ? new Date(r.data_recebimento).toLocaleDateString('pt-BR') : '-'}</td>
                  <td>{r.observacao}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(r); setModalOpen(true); }}><Edit2 size={16} /></button>
                      <button className="btn btn-ghost btn-sm" style={{color: 'var(--accent-red)'}} onClick={() => handleDelete(r.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Receita Extra' : 'Nova Receita Extra'}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <input type="text" name="descricao" className="input" defaultValue={editing?.descricao} required />
          </div>
          <div className="form-group">
            <label className="form-label">Sócio Destino</label>
            <select name="socio_id" className="select" defaultValue={editing?.socio_id} required>
              <option value="">Selecione...</option>
              {socios.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
            </select>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Valor (R$)</label>
              <input type="number" step="0.01" name="valor" className="input" defaultValue={editing?.valor} required />
            </div>
            <div className="form-group">
              <label className="form-label">Data de Recebimento</label>
              <input type="date" name="data_recebimento" className="input" defaultValue={editing?.data_recebimento} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Observação</label>
            <input type="text" name="observacao" className="input" defaultValue={editing?.observacao} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Salvar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
