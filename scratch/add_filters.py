import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(filepath, content):
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# 1. DASHBOARD
content = process_file('src/app/page.js')
if 'const [filterStatus, setFilterStatus]' not in content:
    content = content.replace("const [search, setSearch] = useState('');", "const [search, setSearch] = useState('');\n  const [filterStatus, setFilterStatus] = useState('todos');")
    
    # UI
    search_ui = '''
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
'''
    content = re.sub(r'<div style={{ position: \'relative\', width: \'300px\' }}>.*?</div>', search_ui, content, flags=re.DOTALL)
    
    # Filter logic
    content = content.replace(
        "const filteredClientes = data.clientes_status ? data.clientes_status.filter(c => c.nome.toLowerCase().includes(search.toLowerCase())) : [];",
        "const filteredClientes = data.clientes_status ? data.clientes_status.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()) && (filterStatus === 'todos' ? true : (filterStatus === 'recebido' ? c.status === 'recebido' : (c.status === 'pendente' || c.status === 'parcial')))) : [];"
    )
    write_file('src/app/page.js', content)

# 2. RECEBIMENTOS
content = process_file('src/app/recebimentos/page.js')
if 'const [filterStatus, setFilterStatus]' not in content:
    content = content.replace("const [search, setSearch] = useState('');", "const [search, setSearch] = useState('');\n  const [filterStatus, setFilterStatus] = useState('todos');")
    
    # UI
    search_ui = '''
        <div className="flex gap-4">
          <select className="select" style={{ width: '150px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="recebido">Recebidos</option>
            <option value="pendente">Pendentes</option>
          </select>
          <div style={{ position: 'relative', width: '250px' }}>
'''
    content = content.replace('<div className="flex gap-4">\n          <div style={{ position: \'relative\', width: \'250px\' }}>', search_ui)
    
    # Filter logic
    content = content.replace(
        "return clientesGrouped.filter(c => c.cliente_nome?.toLowerCase().includes(search.toLowerCase()));",
        "return clientesGrouped.filter(c => c.cliente_nome?.toLowerCase().includes(search.toLowerCase()) && (filterStatus === 'todos' ? true : (filterStatus === 'recebido' ? c.recebido === 1 : c.recebido === 0)));"
    )
    write_file('src/app/recebimentos/page.js', content)

# 3. PAGAMENTOS
content = process_file('src/app/pagamentos/page.js')
if 'const [filterStatus, setFilterStatus]' not in content:
    content = content.replace('const [search, setSearch] = useState("");', 'const [search, setSearch] = useState("");\n  const [filterStatus, setFilterStatus] = useState("todos");')
    
    search_ui = '''
        <div className="flex gap-4">
          <select className="select" style={{ width: '150px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="todos">Todas</option>
            <option value="pago">Pagas</option>
            <option value="pendente">Pendentes</option>
          </select>
          <div style={{ position: 'relative', width: '250px' }}>
'''
    content = content.replace('<div className="flex gap-4">\n          <div style={{ position: \'relative\', width: \'250px\' }}>', search_ui)
    
    # Filter logic
    content = content.replace(
        "{pagamentos.filter(p => p.despesa_nome.toLowerCase().includes(search.toLowerCase())).map(p => (",
        "{pagamentos.filter(p => p.despesa_nome.toLowerCase().includes(search.toLowerCase()) && (filterStatus === 'todos' ? true : (filterStatus === 'pago' ? p.pago === 1 : p.pago === 0))).map(p => ("
    )
    write_file('src/app/pagamentos/page.js', content)

# 4. CLIENTES
content = process_file('src/app/clientes/page.js')
if 'const [filterRegime, setFilterRegime]' not in content:
    content = content.replace("const [search, setSearch] = useState('');", "const [search, setSearch] = useState('');\n  const [filterRegime, setFilterRegime] = useState('todos');")
    
    search_ui = '''
        <div className="flex gap-4">
          <select className="select" style={{ width: '180px' }} value={filterRegime} onChange={e => setFilterRegime(e.target.value)}>
            <option value="todos">Todos Regimes</option>
            <option value="Simples Nacional">Simples Nacional</option>
            <option value="Lucro Presumido">Lucro Presumido</option>
            <option value="Lucro Real">Lucro Real</option>
            <option value="MEI">MEI</option>
          </select>
          <div style={{ position: 'relative', width: '250px' }}>
'''
    content = content.replace('<div className="flex gap-4">\n          <div style={{ position: \'relative\', width: \'250px\' }}>', search_ui)
    
    # Filter logic for Clientes
    filter_logic = '''{clientes.filter(c => {
                if (!c.nome.toLowerCase().includes(search.toLowerCase())) return false;
                if (filterRegime === 'todos') return true;
                const regimeCampo = c.campos?.find(cv => {
                  const def = campos.find(cd => cd.id === cv.campo_id);
                  return def && def.nome === 'Regime Tributário';
                });
                return regimeCampo && regimeCampo.valor === filterRegime;
              }).map(c => ('''
    content = content.replace('{clientes.filter(c => c.nome.toLowerCase().includes(search.toLowerCase())).map(c => (', filter_logic)
    write_file('src/app/clientes/page.js', content)

print("Filters Added!")
