'use client';
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';

export default function SociosPage() {
  const { showToast } = useToast();
  const [socios, setSocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const fetchSocios = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/socios');
      if (res.ok) {
        setSocios(await res.json());
      }
    } catch (e) {
      showToast('Erro ao carregar sócios', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocios();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    const nome = e.target.nome.value;
    const is_empresa = e.target.is_empresa.checked ? 1 : 0;
    
    try {
      if (editing) {
        await fetch('/api/socios', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.id, nome, is_empresa, ativo: 1 })
        });
        showToast('Sócio atualizado com sucesso');
      } else {
        await fetch('/api/socios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome, is_empresa })
        });
        showToast('Sócio cadastrado com sucesso');
      }
      setModalOpen(false);
      fetchSocios();
    } catch (e) {
      showToast('Erro ao salvar sócio', 'error');
    }
  };

  const handleDelete = async (id) => {
    if(confirm('Excluir este sócio?')) {
      try {
        await fetch(`/api/socios?id=${id}`, { method: 'DELETE' });
        showToast('Sócio excluído');
        fetchSocios();
      } catch (e) {
        showToast('Erro ao excluir sócio', 'error');
      }
    }
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h2>Sócios / Empresas</h2>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
          <Plus size={18} /> Novo Sócio
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="flex-center" style={{ height: '200px' }}><div className="spinner"></div></div> : (
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th style={{ width: '100px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {socios.map(s => (
                <tr key={s.id} className="table-row">
                  <td>{s.nome}</td>
                  <td>{s.is_empresa ? <span className="badge badge-warning">Empresa</span> : <span className="badge badge-success">Pessoa</span>}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(s); setModalOpen(true); }}><Edit2 size={16} /></button>
                      <button className="btn btn-ghost btn-sm" style={{color: 'var(--accent-red)'}} onClick={() => handleDelete(s.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Sócio' : 'Novo Sócio'}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Nome</label>
            <input type="text" name="nome" className="input" defaultValue={editing?.nome} required />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" name="is_empresa" className="checkbox" defaultChecked={editing?.is_empresa === 1} id="is_empresa" />
            <label htmlFor="is_empresa" style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>É a empresa ContHabeis?</label>
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
