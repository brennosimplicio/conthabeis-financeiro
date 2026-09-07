'use client';
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';

export default function DespesasPage() {
  const { showToast } = useToast();
  const [despesas, setDespesas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/despesas');
      if (res.ok) setDespesas(await res.json());
    } catch (e) {
      showToast('Erro ao carregar despesas', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      nome: formData.get('nome'),
      categoria: formData.get('categoria'),
      valor: parseFloat(formData.get('valor') || 0),
      dia_vencimento: parseInt(formData.get('diaVencimento') || 10)
    };
    
    try {
      if (editing) {
        payload.id = editing.id;
        await fetch('/api/despesas', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        showToast('Despesa atualizada com sucesso');
      } else {
        await fetch('/api/despesas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        showToast('Despesa cadastrada com sucesso');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      showToast('Erro ao salvar despesa', 'error');
    }
  };

  const handleDelete = async (id) => {
    if(confirm('Excluir esta despesa?')) {
      try {
        await fetch(`/api/despesas?id=${id}`, { method: 'DELETE' });
        showToast('Despesa excluída');
        fetchData();
      } catch (e) {
        showToast('Erro ao excluir despesa', 'error');
      }
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h2>Despesas Mensais Fixas</h2>
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
            <Plus size={18} /> Nova Despesa
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="flex-center" style={{ height: '200px' }}><div className="spinner"></div></div> : (
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Valor Padrão</th>
                <th>Dia Vencimento</th>
                <th style={{ width: '100px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {despesas.filter(d => d.nome.toLowerCase().includes(search.toLowerCase())).map(d => (
                <tr key={d.id} className="table-row">
                  <td>{d.nome}</td>
                  <td><span className="badge badge-warning">{d.categoria}</span></td>
                  <td>{formatCurrency(d.valor)}</td>
                  <td>Dia {d.dia_vencimento}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(d); setModalOpen(true); }}><Edit2 size={16} /></button>
                      <button className="btn btn-ghost btn-sm" style={{color: 'var(--accent-red)'}} onClick={() => handleDelete(d.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Despesa' : 'Nova Despesa'}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Nome da Despesa</label>
            <input type="text" name="nome" className="input" defaultValue={editing?.nome} required />
          </div>
          <div className="form-group">
            <label className="form-label">Categoria</label>
            <select name="categoria" className="select" defaultValue={editing?.categoria || 'Outros'}>
              <option value="Sistemas">Sistemas</option>
              <option value="Impostos">Impostos</option>
              <option value="Operacional">Operacional</option>
              <option value="Marketing">Marketing</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Valor (R$)</label>
              <input type="number" step="0.01" name="valor" className="input" defaultValue={editing?.valor} />
            </div>
            <div className="form-group">
              <label className="form-label">Dia de Vencimento</label>
              <input type="number" name="diaVencimento" className="input" defaultValue={editing?.dia_vencimento || 10} />
            </div>
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
