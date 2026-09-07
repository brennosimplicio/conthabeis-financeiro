import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const supabase = getDb();
    const { data: socios, error } = await supabase.from('socios').select('*').eq('ativo', 1);
    if (error) throw error;
    return NextResponse.json(socios);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = getDb();
    const data = await request.json();
    const { nome, is_empresa } = data;
    
    const { data: socio, error } = await supabase
      .from('socios')
      .insert([{ nome, is_empresa: is_empresa ? 1 : 0 }])
      .select()
      .single();
      
    if (error) throw error;
    return NextResponse.json(socio);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const supabase = getDb();
    const data = await request.json();
    const { id, nome, is_empresa, ativo } = data;
    
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const updates = {};
    if (nome !== undefined) updates.nome = nome;
    if (is_empresa !== undefined) updates.is_empresa = is_empresa ? 1 : 0;
    if (ativo !== undefined) updates.ativo = ativo ? 1 : 0;

    const { error } = await supabase
      .from('socios')
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
      .from('socios')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
