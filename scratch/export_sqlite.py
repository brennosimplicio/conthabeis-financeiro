import sqlite3

def export_data():
    conn = sqlite3.connect('data/conthabeis.db')
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    tables = [
        'socios', 'clientes', 'split_socios', 'campos_cliente', 'valores_campos_cliente',
        'despesas', 'recebimentos_mensais', 'pagamentos_mensais', 'receitas_extras'
    ]

    sql = []

    for table in tables:
        c.execute(f"SELECT * FROM {table}")
        rows = c.fetchall()
        for row in rows:
            cols = list(row.keys())
            vals = []
            for val in row:
                if val is None:
                    vals.append("NULL")
                elif isinstance(val, (int, float)):
                    vals.append(str(val))
                else:
                    v = str(val).replace("'", "''")
                    vals.append(f"'{v}'")
            
            sql.append(f"INSERT INTO {table} ({', '.join(cols)}) VALUES ({', '.join(vals)});")
        
        # Reset the sequence for serial columns in postgres
        sql.append(f"SELECT setval('{table}_id_seq', (SELECT MAX(id) FROM {table}));")

    with open('scratch/migrate_data.sql', 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql))

if __name__ == '__main__':
    export_data()
