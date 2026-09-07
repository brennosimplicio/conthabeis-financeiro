'use client';
import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import Modal from '@/components/Modal';
import { useToast } from '@/components/Toast';

export default function ClientesPage() {
  const { showToast } = useToast();
  const [clientes, setClientes] = useState([]);
  const [socios, setSocios] = useState([]);
  const [campos, setCampos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterRegime, setFilterRegime] = useState('todos');
  
  const fetchData = async () => {
    setLoading(true);
    try {
      const [cliRes, socRes, camRes] = await Promise.all([
        fetch('/api/clientes'),
        fetch('/api/socios'),
        fetch('/api/campos-cliente')
      ]);
      
      if (cliRes.ok) setClientes(await cliRes.json());
      if (socRes.ok) {
        const allSocios = await socRes.json();
        setSocios(allSocios.filter(s => s.is_empresa === 0)); // Only non-company for splits
      }
      if (camRes.ok) setCampos(await camRes.json());
      
    } catch (e) {
      showToast('Erro ao carregar dados', 'error');
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
    
    const splits = socios.map(s => ({
      socio_id: s.id,
      valor: parseFloat(formData.get(`split_${s.id}`) || 0)
    }));

    const camposValues = campos.map(c => ({
      campo_id: c.id,
      valor: formData.get(`campo_${c.id}`) || ''
    }));

    const payload = {
      nome: formData.get('nome'),
      faturamento: parseFloat(formData.get('faturamento') || 0),
      dia_vencimento: parseInt(formData.get('diaVencimento') || 10),
      splits,
      campos: camposValues
    };

    try {
      if (editing) {
        payload.id = editing.id;
        await fetch('/api/clientes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        showToast('Cliente atualizado com sucesso');
      } else {
        await fetch('/api/clientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        showToast('Cliente cadastrado com sucesso');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      showToast('Erro ao salvar cliente', 'error');
    }
  };

  const handleDelete = async (id) => {
    if(confirm('Excluir este cliente?')) {
      try {
        await fetch(`/api/clientes?id=${id}`, { method: 'DELETE' });
        showToast('Cliente excluído');
        fetchData();
      } catch (e) {
        showToast('Erro ao excluir cliente', 'error');
      }
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  // Helper to get edit value for splits
  const getSplitValue = (socioId) => {
    if (!editing || !editing.splits) return '';
    const split = editing.splits.find(s => s.socio_id === socioId);
    return split ? split.valor : '';
  };

  // Helper to get edit value for campos
  const getCampoValue = (campoId) => {
    if (!editing || !editing.campos) return '';
    const campo = editing.campos.find(c => c.campo_id === campoId);
    return campo ? campo.valor : '';
  };

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: '2rem' }}>
        <h2>Clientes</h2>
        
        <div className="flex gap-4">
          <select className="select" style={{ width: '180px' }} value={filterRegime} onChange={e => setFilterRegime(e.target.value)}>
            <option value="todos">Todos Regimes</option>
            <option value="Simples Nacional">Simples Nacional</option>
            <option value="Lucro Presumido">Lucro Presumido</option>
            <option value="Lucro Real">Lucro Real</option>
            <option value="MEI">MEI</option>
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
          <button className="btn btn-primary" onClick={() => { setEditing(null); setModalOpen(true); }}>
            <Plus size={18} /> Novo Cliente
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? <div className="flex-center" style={{ height: '200px' }}><div className="spinner"></div></div> : (
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                {campos.map(c => <th key={c.id}>{c.nome}</th>)}
                <th>Faturamento</th>
                <th>Vencimento</th>
                <th style={{ width: '100px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {clientes.filter(c => {
                if (!c.nome.toLowerCase().includes(search.toLowerCase())) return false;
                if (filterRegime === 'todos') return true;
                const regimeCampo = c.campos?.find(cv => {
                  const def = campos.find(cd => cd.id === cv.campo_id);
                  return def && def.nome === 'Regime Tributário';
                });
                return regimeCampo && regimeCampo.valor === filterRegime;
              }).map(c => (
                <tr key={c.id} className="table-row">
                  <td>{c.nome}</td>
                  {campos.map(campo => {
                    const cValor = c.campos?.find(cv => cv.campo_id === campo.id);
                    return <td key={campo.id}>{cValor ? cValor.valor : '-'}</td>;
                  })}
                  <td>{formatCurrency(c.faturamento)}</td>
                  <td>Dia {c.dia_vencimento}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(c); setModalOpen(true); }}><Edit2 size={16} /></button>
                      <button className="btn btn-ghost btn-sm" style={{color: 'var(--accent-red)'}} onClick={() => handleDelete(c.id)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Cliente' : 'Novo Cliente'}>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Nome do Cliente</label>
            <input type="text" name="nome" className="input" defaultValue={editing?.nome} required />
          </div>
          
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Faturamento (R$)</label>
              <input type="number" step="0.01" name="faturamento" className="input" defaultValue={editing?.faturamento} />
            </div>
            <div className="form-group">
              <label className="form-label">Dia de Vencimento</label>
              <input type="number" name="diaVencimento" className="input" defaultValue={editing?.dia_vencimento || 10} />
            </div>
          </div>

          <h4 style={{ margin: '1.5rem 0 1rem' }}>Dados Cadastrais</h4>
          <div className="grid-2">
            {campos.map(c => (
              <div className="form-group" key={c.id}>
                <label className="form-label">{c.nome}</label>
                {c.tipo === 'select' ? (
                  <select name={`campo_${c.id}`} className="select" defaultValue={getCampoValue(c.id)}>
                    <option value="">Selecione...</option>
                    {c.opcoes && JSON.parse(c.opcoes).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input type={c.tipo || 'text'} name={`campo_${c.id}`} className="input" defaultValue={getCampoValue(c.id)} />
                )}
              </div>
            ))}
          </div>

          <h4 style={{ margin: '1.5rem 0 1rem' }}>Split por Sócio (Valor R$)</h4>
          <div className="grid-3">
            {socios.map(s => (
              <div className="form-group" key={s.id}>
                <label className="form-label">{s.nome}</label>
                <input type="number" step="0.01" name={`split_${s.id}`} className="input" defaultValue={getSplitValue(s.id)} />
              </div>
            ))}
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
