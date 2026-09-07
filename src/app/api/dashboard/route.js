import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const ano = parseInt(request.nextUrl.searchParams.get('ano'));
    const mes = parseInt(request.nextUrl.searchParams.get('mes'));

    if (!ano || !mes) return NextResponse.json({ error: 'ano and mes required' }, { status: 400 });

    const supabase = getDb();
    
    const [{ data: clientes }, { data: recebimentos }, { data: socios }, { data: pagamentos }, { data: receitas_extras }] = await Promise.all([
      supabase.from('clientes').select('id, nome, faturamento').eq('ativo', 1),
      supabase.from('recebimentos_mensais').select('*, clientes!inner(id, faturamento, ativo)').eq('ano', ano).eq('mes', mes).eq('clientes.ativo', 1),
      supabase.from('socios').select('*').eq('ativo', 1),
      supabase.from('pagamentos_mensais').select('*, despesas!inner(id, valor, ativa)').eq('ano', ano).eq('mes', mes).eq('despesas.ativa', 1),
      supabase.from('receitas_extras').select('*').eq('ano', ano).eq('mes', mes)
    ]);

    const clis = clientes || [];
    const recs = recebimentos || [];
    const socs = socios || [];
    const pags = pagamentos || [];
    const extras = receitas_extras || [];

    const faturamento_total = clis.reduce((acc, curr) => acc + (curr.faturamento || 0), 0);
    const clientes_total = clis.length;
    
    const total_recebido = recs.filter(r => r.recebido).reduce((acc, curr) => acc + (curr.valor_recebido || 0), 0);
    const total_a_receber = faturamento_total - total_recebido;

    const por_socio = socs.map(socio => {
      const rs = recs.filter(r => r.socio_id === socio.id);
      const esperado = rs.reduce((sum, r) => sum + (r.valor_esperado || 0), 0);
      const recebido = rs.filter(r => r.recebido).reduce((sum, r) => sum + (r.valor_recebido || 0), 0);
      return {
        socio_id: socio.id,
        nome: socio.nome,
        is_empresa: socio.is_empresa === 1,
        esperado,
        recebido,
        a_receber: esperado - recebido
      };
    });

    const conthabeisSocio = por_socio.find(s => s.is_empresa);
    
    const despesas_total = pags.reduce((acc, curr) => acc + (curr.valor_esperado || 0), 0);
    const despesas_pagas = pags.filter(p => p.pago).reduce((acc, curr) => acc + (curr.valor_pago || 0), 0);
    const despesas_a_pagar = despesas_total - despesas_pagas;

    const receitas_extras_total = extras.reduce((acc, curr) => acc + (curr.valor || 0), 0);

    const conthabeis = {
      receita: conthabeisSocio ? conthabeisSocio.recebido : 0,
      receita_esperada: conthabeisSocio ? conthabeisSocio.esperado : 0,
      despesas_pagas,
      despesas_a_pagar,
      despesas_total,
      resultado: (conthabeisSocio ? conthabeisSocio.recebido : 0) - despesas_pagas + receitas_extras_total
    };

    let clientes_recebidos = 0;
    const clientes_status = clis.map(cliente => {
      const rs = recs.filter(r => r.cliente_id === cliente.id);
      const esperado = rs.reduce((sum, r) => sum + (r.valor_esperado || 0), 0);
      const recebido = rs.filter(r => r.recebido).reduce((sum, r) => sum + (r.valor_recebido || 0), 0);
      const pendente = esperado - recebido;
      
      let status = 'pendente';
      if (recebido > 0 && pendente <= 0 && recebido >= esperado) {
        status = 'recebido';
        clientes_recebidos++;
      } else if (recebido > 0 && pendente > 0) {
        status = 'parcial';
      }

      return {
        cliente_id: cliente.id,
        nome: cliente.nome,
        faturamento: cliente.faturamento,
        esperado,
        recebido,
        pendente,
        status
      };
    });

    return NextResponse.json({
      faturamento_total,
      total_recebido,
      total_a_receber,
      por_socio,
      conthabeis,
      receitas_extras_total,
      clientes_recebidos,
      clientes_total,
      clientes_status
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
