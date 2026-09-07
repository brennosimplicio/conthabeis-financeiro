import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const supabase = getDb();
    const { data: despesas, error } = await supabase
      .from('despesas')
      .select('*')
      .eq('ativa', 1);
      
    if (error) throw error;
    return NextResponse.json(despesas);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = getDb();
    const data = await request.json();
    const { nome, categoria, valor, dia_vencimento } = data;
    
    const { data: despesa, error } = await supabase
      .from('despesas')
      .insert([{ 
        nome, 
        categoria: categoria || 'Outros', 
        valor: valor || 0, 
        dia_vencimento: dia_vencimento || 10 
      }])
      .select()
      .single();
      
    if (error) throw error;
    return NextResponse.json({ id: despesa.id, success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const supabase = getDb();
    const data = await request.json();
    const { id, nome, categoria, valor, dia_vencimento } = data;
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updates = { atualizado_em: new Date().toISOString() };
    if (nome !== undefined) updates.nome = nome;
    if (categoria !== undefined) updates.categoria = categoria;
    if (valor !== undefined) updates.valor = valor;
    if (dia_vencimento !== undefined) updates.dia_vencimento = dia_vencimento;

    const { error } = await supabase
      .from('despesas')
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
      .from('despesas')
      .update({ ativa: 0, atualizado_em: new Date().toISOString() })
      .eq('id', id);
      
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
