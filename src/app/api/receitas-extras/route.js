import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const ano = parseInt(request.nextUrl.searchParams.get('ano'));
    const mes = parseInt(request.nextUrl.searchParams.get('mes'));

    if (!ano || !mes) return NextResponse.json({ error: 'ano and mes required' }, { status: 400 });

    const supabase = getDb();
    const { data: receitas, error } = await supabase
      .from('receitas_extras')
      .select('*')
      .eq('ano', ano)
      .eq('mes', mes);
      
    if (error) throw error;
    return NextResponse.json(receitas);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = getDb();
    const data = await request.json();
    const { descricao, valor, socio_id, ano, mes, data_recebimento, observacao } = data;
    
    const { data: receita, error } = await supabase
      .from('receitas_extras')
      .insert([{ 
        descricao, 
        valor: valor || 0, 
        socio_id, 
        ano, 
        mes, 
        data_recebimento, 
        observacao 
      }])
      .select()
      .single();
      
    if (error) throw error;
    return NextResponse.json({ id: receita.id, success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const supabase = getDb();
    const data = await request.json();
    const { id, descricao, valor, socio_id, ano, mes, data_recebimento, observacao } = data;
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updates = {};
    if (descricao !== undefined) updates.descricao = descricao;
    if (valor !== undefined) updates.valor = valor;
    if (socio_id !== undefined) updates.socio_id = socio_id;
    if (ano !== undefined) updates.ano = ano;
    if (mes !== undefined) updates.mes = mes;
    if (data_recebimento !== undefined) updates.data_recebimento = data_recebimento;
    if (observacao !== undefined) updates.observacao = observacao;

    const { error } = await supabase
      .from('receitas_extras')
      .update(updates)
      .eq('id', id);
      
    if (error) throw error;
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
      .from('receitas_extras')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
