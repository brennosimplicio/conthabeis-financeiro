import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const ano = parseInt(request.nextUrl.searchParams.get('ano'));
    const mes = parseInt(request.nextUrl.searchParams.get('mes'));

    if (!ano || !mes) return NextResponse.json({ error: 'ano and mes required' }, { status: 400 });

    const supabase = getDb();
    
    let { data: pagamentos, error } = await supabase
      .from('pagamentos_mensais')
      .select('*')
      .eq('ano', ano)
      .eq('mes', mes);
      
    if (error) throw error;

    if (!pagamentos || pagamentos.length === 0) {
      // Auto-generate
      const { data: despesas, error: despesasError } = await supabase
        .from('despesas')
        .select('id, valor')
        .eq('ativa', 1);
        
      if (despesasError) throw despesasError;

      const newPagamentos = despesas.map(d => ({
        despesa_id: d.id,
        ano,
        mes,
        valor_esperado: d.valor || 0,
        valor_pago: 0,
        pago: 0
      }));

      if (newPagamentos.length > 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('pagamentos_mensais')
          .insert(newPagamentos)
          .select();
          
        if (insertError) throw insertError;
        pagamentos = inserted;
      }
    }

    return NextResponse.json(pagamentos || []);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = getDb();
    const data = await request.json();
    
    if (!Array.isArray(data)) return NextResponse.json({ error: 'Expected array of pagamentos' }, { status: 400 });

    const { error } = await supabase
      .from('pagamentos_mensais')
      .upsert(data.map(item => ({
        ...(item.id ? { id: item.id } : {}),
        despesa_id: item.despesa_id,
        ano: item.ano,
        mes: item.mes,
        valor_esperado: item.valor_esperado || 0,
        valor_pago: item.valor_pago || 0,
        data_pagamento: item.data_pagamento || null,
        observacao: item.observacao || null,
        pago: item.pago ? 1 : 0
      })));
      
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const supabase = getDb();
    const data = await request.json();
    const { id, valor_pago, pago, data_pagamento, observacao } = data;
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updates = {};
    if (valor_pago !== undefined) updates.valor_pago = valor_pago;
    if (pago !== undefined) updates.pago = pago ? 1 : 0;
    if (data_pagamento !== undefined) updates.data_pagamento = data_pagamento;
    if (observacao !== undefined) updates.observacao = observacao;

    const { error } = await supabase
      .from('pagamentos_mensais')
      .update(updates)
      .eq('id', id);
      
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
