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
      .select('*, clientes(nome)')
      .eq('ano', ano)
      .eq('mes', mes);
      
    if (error) throw error;

    // Fetch active clients and their splits
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('id, nome, splits:split_socios(socio_id, valor)')
      .eq('ativo', 1);
      
    if (clientesError) throw clientesError;

    const newRecebimentos = [];
    const updates = [];
    
    // Create a lookup for existing recebimentos
    // Key: cliente_id + '_' + socio_id
    const existingMap = {};
    if (recebimentos) {
      for (const rec of recebimentos) {
        existingMap[`${rec.cliente_id}_${rec.socio_id}`] = rec;
      }
    }

    // Check against active clients
    for (const cliente of (clientes || [])) {
      if (cliente.splits) {
        for (const split of cliente.splits) {
          const key = `${cliente.id}_${split.socio_id}`;
          const existing = existingMap[key];
          
          if (!existing) {
            // Missing record -> generate it
            newRecebimentos.push({
              cliente_id: cliente.id,
              socio_id: split.socio_id,
              ano,
              mes,
              valor_esperado: split.valor,
              valor_recebido: 0,
              recebido: 0
            });
          } else {
            // Record exists. If unpaid and expected value changed, queue an update.
            if (existing.recebido === 0 && existing.valor_esperado !== split.valor) {
              updates.push({
                id: existing.id,
                valor_esperado: split.valor
              });
              // Update local object immediately so the GET response is accurate
              existing.valor_esperado = split.valor;
            }
          }
        }
      }
    }

    // Insert new missing records
    if (newRecebimentos.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('recebimentos_mensais')
        .insert(newRecebimentos)
        .select('*, clientes(nome)');
      
      if (insertError) throw insertError;
      if (!recebimentos) recebimentos = [];
      recebimentos = [...recebimentos, ...inserted];
    }
    
    // Apply updates asynchronously to avoid blocking the response unnecessarily long,
    // or just await them. We'll await them to be safe.
    if (updates.length > 0) {
      // Supabase JS doesn't support bulk update with different values easily, 
      // but upsert works if we provide all required fields, OR we just map over them.
      for (const update of updates) {
        await supabase
          .from('recebimentos_mensais')
          .update({ valor_esperado: update.valor_esperado })
          .eq('id', update.id);
      }
    }

    // Flatten the nested clientes object into cliente_nome
    const result = (recebimentos || []).map(r => ({
      ...r,
      cliente_nome: r.clientes?.nome || 'Sem nome',
      clientes: undefined
    }));

    return NextResponse.json(result);
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
