import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const supabase = getDb();
    const { data: campos, error } = await supabase
      .from('campos_cliente')
      .select('*')
      .order('ordem', { ascending: true });
      
    if (error) throw error;
    return NextResponse.json(campos);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = getDb();
    const data = await request.json();
    const { nome, tipo, opcoes, ordem } = data;
    
    if (!nome) return NextResponse.json({ error: 'Nome required' }, { status: 400 });

    const { data: campo, error } = await supabase
      .from('campos_cliente')
      .insert([{ nome, tipo: tipo || 'text', opcoes: opcoes || null, ordem: ordem || 0, protegido: 0 }])
      .select()
      .single();
      
    if (error) throw error;
    return NextResponse.json({ id: campo.id, success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const supabase = getDb();
    
    // Check if protected
    const { data: campo, error: fetchError } = await supabase
      .from('campos_cliente')
      .select('protegido')
      .eq('id', id)
      .single();
      
    if (fetchError) throw fetchError;
    if (!campo) return NextResponse.json({ error: 'Campo not found' }, { status: 404 });
    if (campo.protegido) return NextResponse.json({ error: 'Cannot delete protected field' }, { status: 403 });

    const { error: deleteError } = await supabase
      .from('campos_cliente')
      .delete()
      .eq('id', id);
      
    if (deleteError) throw deleteError;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
