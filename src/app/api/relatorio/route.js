import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request) {
  try {
    const supabase = getDb();
    const { cliente_ids, ano, mes } = await request.json();

    if (!cliente_ids || !Array.isArray(cliente_ids) || cliente_ids.length === 0) {
      return NextResponse.json({ error: 'cliente_ids array required' }, { status: 400 });
    }

    // Get recebimentos for the selected clients
    const { data: recebimentos, error: recError } = await supabase
      .from('recebimentos_mensais')
      .select('*, clientes(nome), socios(nome, is_empresa)')
      .eq('ano', ano)
      .eq('mes', mes)
      .in('cliente_id', cliente_ids);

    if (recError) throw recError;

    // Get all socios for reference
    const { data: socios, error: socError } = await supabase
      .from('socios')
      .select('*')
      .eq('ativo', 1);

    if (socError) throw socError;

    // Group by socio
    const porSocio = {};
    for (const s of socios) {
      porSocio[s.id] = {
        socio_id: s.id,
        nome: s.nome,
        is_empresa: s.is_empresa,
        total: 0,
        clientes: []
      };
    }

    // Group by client first for display
    const porCliente = {};
    for (const r of recebimentos) {
      const cid = r.cliente_id;
      if (!porCliente[cid]) {
        porCliente[cid] = {
          cliente_id: cid,
          nome: r.clientes?.nome || 'Sem nome',
          total: 0,
          splits: []
        };
      }
      porCliente[cid].total += r.valor_esperado;
      porCliente[cid].splits.push({
        socio_id: r.socio_id,
        socio_nome: r.socios?.nome || 'Desconhecido',
        valor: r.valor_esperado
      });

      // Accumulate per socio
      if (porSocio[r.socio_id]) {
        porSocio[r.socio_id].total += r.valor_esperado;
        porSocio[r.socio_id].clientes.push({
          cliente_nome: r.clientes?.nome || 'Sem nome',
          valor: r.valor_esperado
        });
      }
    }

    return NextResponse.json({
      clientes: Object.values(porCliente),
      socios: Object.values(porSocio),
      total_geral: Object.values(porCliente).reduce((sum, c) => sum + c.total, 0)
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
