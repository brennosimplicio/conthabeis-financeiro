import re

files = [
    'src/app/despesas/page.js',
    'src/app/pagamentos/page.js',
    'src/app/receitas-extras/page.js'
]

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'const [search' not in content:
        content = content.replace(
            'const [loading, setLoading] = useState(true);',
            'const [loading, setLoading] = useState(true);\n  const [search, setSearch] = useState("");'
        )
        
    if 'Search' not in content and 'lucide-react' in content:
        content = content.replace("} from 'lucide-react';", ", Search } from 'lucide-react';")

    search_ui = '''
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
'''
    
    if 'despesas' in file_path:
        content = content.replace('<h2>Despesas Mensais Fixas</h2>', '<h2>Despesas Mensais Fixas</h2>' + search_ui)
        content = content.replace('{despesas.map(d => (', '{despesas.filter(d => d.nome.toLowerCase().includes(search.toLowerCase())).map(d => (')
        content = content.replace('<button className="btn btn-primary"', '</div>\n        <button className="btn btn-primary"')
        
    elif 'pagamentos' in file_path:
        content = content.replace('<h2>Controle de Pagamentos (Despesas)</h2>', '<h2>Controle de Pagamentos (Despesas)</h2>' + search_ui)
        content = content.replace('{pagamentos.map(p => (', '{pagamentos.filter(p => p.despesa_nome.toLowerCase().includes(search.toLowerCase())).map(p => (')
        content = content.replace('<button className="btn btn-primary"', '</div>\n        <button className="btn btn-primary"')

    elif 'receitas' in file_path:
        content = content.replace('<h2>Receitas Extras</h2>', '<h2>Receitas Extras</h2>' + search_ui)
        content = content.replace('{receitas.map(r => (', '{receitas.filter(r => r.descricao.toLowerCase().includes(search.toLowerCase())).map(r => (')
        content = content.replace('<button className="btn btn-primary"', '</div>\n        <button className="btn btn-primary"')

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
