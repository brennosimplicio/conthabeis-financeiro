import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const ano = parseInt(request.nextUrl.searchParams.get('ano'));
    const mes = parseInt(request.nextUrl.searchParams.get('mes'));

    if (!ano || !mes) return NextResponse.json({ error: 'ano and mes required' }, { status: 400 });

    const supabase = getDb();
    
    let { data: recebimentos, error } = await supabase
      .from('recebimentos_mensais')
      .select('*')
      .eq('ano', ano)
      .eq('mes', mes);
      
    if (error) throw error;

    if (!recebimentos || recebimentos.length === 0) {
      // Auto-generate
      const { data: clientes, error: clientesError } = await supabase
        .from('clientes')
        .select('id, splits:split_socios(socio_id, valor)')
        .eq('ativo', 1);
        
      if (clientesError) throw clientesError;

      const newRecebimentos = [];
      for (const cliente of clientes) {
        if (cliente.splits) {
          for (const split of cliente.splits) {
            newRecebimentos.push({
              cliente_id: cliente.id,
              socio_id: split.socio_id,
              ano,
              mes,
              valor_esperado: split.valor,
              valor_recebido: 0,
              recebido: 0
            });
          }
        }
      }

      if (newRecebimentos.length > 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('recebimentos_mensais')
          .insert(newRecebimentos)
          .select();
        
        if (insertError) throw insertError;
        recebimentos = inserted;
      }
    }

    return NextResponse.json(recebimentos || []);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = getDb();
    const data = await request.json();
    
    if (!Array.isArray(data)) return NextResponse.json({ error: 'Expected array of recebimentos' }, { status: 400 });

    const { error } = await supabase
      .from('recebimentos_mensais')
      .upsert(data.map(item => ({
        ...(item.id ? { id: item.id } : {}),
        cliente_id: item.cliente_id,
        socio_id: item.socio_id,
        ano: item.ano,
        mes: item.mes,
        valor_esperado: item.valor_esperado || 0,
        valor_recebido: item.valor_recebido || 0,
        data_recebimento: item.data_recebimento || null,
        observacao: item.observacao || null,
        recebido: item.recebido ? 1 : 0
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
    const { id, valor_recebido, recebido, data_recebimento, observacao } = data;
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updates = {};
    if (valor_recebido !== undefined) updates.valor_recebido = valor_recebido;
    if (recebido !== undefined) updates.recebido = recebido ? 1 : 0;
    if (data_recebimento !== undefined) updates.data_recebimento = data_recebimento;
    if (observacao !== undefined) updates.observacao = observacao;

    const { error } = await supabase
      .from('recebimentos_mensais')
      .update(updates)
      .eq('id', id);
      
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
