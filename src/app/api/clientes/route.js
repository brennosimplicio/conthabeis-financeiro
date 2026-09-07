import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const supabase = getDb();
    
    // We assume foreign keys are correctly set up in Postgres for split_socios and valores_campos_cliente referencing clientes
    const { data: clientes, error } = await supabase
      .from('clientes')
      .select(`
        *,
        splits:split_socios(*),
        campos:valores_campos_cliente(*)
      `)
      .eq('ativo', 1);
      
    if (error) throw error;
    
    return NextResponse.json(clientes);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = getDb();
    const data = await request.json();
    const { nome, faturamento, dia_vencimento, splits, campos } = data;
    
    // Insert cliente
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .insert([{ nome, faturamento: faturamento || 0, dia_vencimento: dia_vencimento || 10 }])
      .select()
      .single();
      
    if (clienteError) throw clienteError;
    const resultId = cliente.id;
    
    // Insert splits
    if (splits && Array.isArray(splits) && splits.length > 0) {
      const splitsData = splits.map(s => ({ cliente_id: resultId, socio_id: s.socio_id, valor: s.valor || 0 }));
      const { error: splitError } = await supabase.from('split_socios').insert(splitsData);
      if (splitError) throw splitError;
    }
    
    // Insert campos
    if (campos && Array.isArray(campos) && campos.length > 0) {
      const camposData = campos.map(c => ({ cliente_id: resultId, campo_id: c.campo_id, valor: c.valor || '' }));
      const { error: campoError } = await supabase.from('valores_campos_cliente').insert(camposData);
      if (campoError) throw campoError;
    }
    
    return NextResponse.json({ id: resultId, success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const supabase = getDb();
    const data = await request.json();
    const { id, nome, faturamento, dia_vencimento, splits, campos } = data;
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updates = { atualizado_em: new Date().toISOString() };
    if (nome !== undefined) updates.nome = nome;
    if (faturamento !== undefined) updates.faturamento = faturamento;
    if (dia_vencimento !== undefined) updates.dia_vencimento = dia_vencimento;

    const { error: clienteError } = await supabase
      .from('clientes')
      .update(updates)
      .eq('id', id);
      
    if (clienteError) throw clienteError;
      
    // Update splits: delete old, insert new
    if (splits && Array.isArray(splits)) {
      await supabase.from('split_socios').delete().eq('cliente_id', id);
      if (splits.length > 0) {
        const splitsData = splits.map(s => ({ cliente_id: id, socio_id: s.socio_id, valor: s.valor || 0 }));
        await supabase.from('split_socios').insert(splitsData);
      }
    }
    
    // Update campos: delete old, insert new
    if (campos && Array.isArray(campos)) {
      await supabase.from('valores_campos_cliente').delete().eq('cliente_id', id);
      if (campos.length > 0) {
        const camposData = campos.map(c => ({ cliente_id: id, campo_id: c.campo_id, valor: c.valor || '' }));
        await supabase.from('valores_campos_cliente').insert(camposData);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const supabase = getDb();
    const { error } = await supabase
      .from('clientes')
      .update({ ativo: 0, atualizado_em: new Date().toISOString() })
      .eq('id', id);
      
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
