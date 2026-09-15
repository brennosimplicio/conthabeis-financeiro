import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const supabase = getDb();
    
    // Fetch all records
    const { data: recebimentos, error: errRec } = await supabase
      .from('recebimentos_mensais')
      .select('ano, mes, valor_recebido');
    if (errRec) throw errRec;

    const { data: pagamentos, error: errPag } = await supabase
      .from('pagamentos_mensais')
      .select('ano, mes, valor_pago');
    if (errPag) throw errPag;

    const { data: extras, error: errExt } = await supabase
      .from('receitas_extras')
      .select('ano, mes, valor');
    if (errExt) throw errExt;

    // Aggregate by ano-mes
    const meses = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const map = {};

    for (let i = 11; i >= 0; i--) {
      const td = new Date();
      td.setMonth(td.getMonth() - i);
      const y = td.getFullYear();
      const m = td.getMonth() + 1;
      const key = `${y}-${m}`;
      map[key] = {
        name: `${meses[m]}/${y}`,
        ano: y,
        mes: m,
        receitas: 0,
        despesas: 0,
        lucro: 0
      };
    }

    // Populate
    for (const r of (recebimentos || [])) {
      const k = `${r.ano}-${r.mes}`;
      if (map[k]) map[k].receitas += (r.valor_recebido || 0);
    }
    for (const r of (extras || [])) {
      const k = `${r.ano}-${r.mes}`;
      if (map[k]) map[k].receitas += (r.valor || 0);
    }
    for (const p of (pagamentos || [])) {
      const k = `${p.ano}-${p.mes}`;
      if (map[k]) map[k].despesas += (p.valor_pago || 0);
    }

    // Calculate Lucro
    Object.values(map).forEach(v => {
      v.lucro = v.receitas - v.despesas;
    });

    const result = Object.values(map).sort((a, b) => {
      if (a.ano !== b.ano) return a.ano - b.ano;
      return a.mes - b.mes;
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
