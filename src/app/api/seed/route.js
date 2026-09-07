import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const supabase = getDb();
    
    const [{ count: countClientes }, { count: countDespesas }] = await Promise.all([
      supabase.from('clientes').select('*', { count: 'exact', head: true }),
      supabase.from('despesas').select('*', { count: 'exact', head: true })
    ]);

    return NextResponse.json({
      seeded: (countClientes > 0 || countDespesas > 0),
      clientes: countClientes || 0,
      despesas: countDespesas || 0
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = getDb();
    const data = await request.json();
    const { clientes, despesas } = data;
    
    let countImported = 0;

    if (clientes && Array.isArray(clientes)) {
      for (const c of clientes) {
        const { data: cliente, error: cliErr } = await supabase
          .from('clientes')
          .insert([{ nome: c.nome, faturamento: c.faturamento || 0, dia_vencimento: c.dia_vencimento || 10 }])
          .select()
          .single();
          
        if (cliErr) continue;
        countImported++;
        const clienteId = cliente.id;
        
        const splits = [];
        if (c.brenno !== undefined) splits.push({ cliente_id: clienteId, socio_id: 1, valor: c.brenno });
        if (c.josimar !== undefined) splits.push({ cliente_id: clienteId, socio_id: 2, valor: c.josimar });
        if (c.joice !== undefined) splits.push({ cliente_id: clienteId, socio_id: 3, valor: c.joice });
        if (c.conthabeis !== undefined) splits.push({ cliente_id: clienteId, socio_id: 4, valor: c.conthabeis });
        
        if (splits.length > 0) {
          await supabase.from('split_socios').insert(splits);
        }
      }
    }

    if (despesas && Array.isArray(despesas)) {
      const despesasToInsert = despesas.map(d => ({
        nome: d.nome,
        categoria: d.categoria || 'Outros',
        valor: d.valor || 0,
        dia_vencimento: d.dia_vencimento || 10
      }));
      
      if (despesasToInsert.length > 0) {
        const { data: inserted, error: despErr } = await supabase.from('despesas').insert(despesasToInsert).select();
        if (!despErr && inserted) {
          countImported += inserted.length;
        }
      }
    }
    
    return NextResponse.json({ success: true, count: countImported });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
