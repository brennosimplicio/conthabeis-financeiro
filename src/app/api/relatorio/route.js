import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const MESES_NOMES = ['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export async function POST(request) {
  try {
    const supabase = getDb();
    const body = await request.json();
    const { itens, cliente_ids, ano, mes } = body;

    // Normalizar para lista de itens: { cliente_id, ano, mes }
    let normalizedItens = [];
    if (itens && Array.isArray(itens) && itens.length > 0) {
      normalizedItens = itens.map(item => ({
        cliente_id: Number(item.cliente_id),
        ano: Number(item.ano),
        mes: Number(item.mes)
      }));
    } else if (cliente_ids && Array.isArray(cliente_ids) && cliente_ids.length > 0 && ano && mes) {
      normalizedItens = cliente_ids.map(cid => ({
        cliente_id: Number(cid),
        ano: Number(ano),
        mes: Number(mes)
      }));
    } else {
      return NextResponse.json({ error: 'Selecione pelo menos um cliente e competência' }, { status: 400 });
    }

    // Remover duplicatas exatas (mesmo cliente_id, ano, mes) e ordenar cronologicamente
    const uniqueMap = new Map();
    for (const item of normalizedItens) {
      const key = `${item.cliente_id}_${item.ano}_${item.mes}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      }
    }
    const sortedItens = Array.from(uniqueMap.values()).sort((a, b) => {
      if (a.ano !== b.ano) return a.ano - b.ano;
      return a.mes - b.mes;
    });

    const uniqueClienteIds = [...new Set(sortedItens.map(i => i.cliente_id))];
    const uniqueAnos = [...new Set(sortedItens.map(i => i.ano))];
    const uniqueMeses = [...new Set(sortedItens.map(i => i.mes))];

    // Buscar dados dos clientes e splits padrão (para fallback caso o mês ainda não tenha sido aberto em recebimentos_mensais)
    const { data: clientesDb, error: cliError } = await supabase
      .from('clientes')
      .select('id, nome, faturamento, splits:split_socios(socio_id, valor)')
      .in('id', uniqueClienteIds);

    if (cliError) throw cliError;

    const clienteMap = {};
    for (const c of (clientesDb || [])) {
      clienteMap[c.id] = c;
    }

    // Buscar recebimentos_mensais existentes para esses clientes/anos/meses
    const { data: recebimentosDb, error: recError } = await supabase
      .from('recebimentos_mensais')
      .select('*, clientes(nome), socios(nome, is_empresa)')
      .in('cliente_id', uniqueClienteIds)
      .in('ano', uniqueAnos)
      .in('mes', uniqueMeses);

    if (recError) throw recError;

    // Buscar todos os sócios ativos
    const { data: socios, error: socError } = await supabase
      .from('socios')
      .select('*')
      .eq('ativo', 1);

    if (socError) throw socError;

    const socioMap = {};
    const porSocio = {};
    for (const s of socios) {
      socioMap[s.id] = s;
      porSocio[s.id] = {
        socio_id: s.id,
        nome: s.nome,
        is_empresa: s.is_empresa,
        total: 0,
        clientes: []
      };
    }

    // Agrupar recebimentos do banco por chave: `${cliente_id}_${ano}_${mes}`
    const recByComp = {};
    for (const r of (recebimentosDb || [])) {
      const key = `${r.cliente_id}_${r.ano}_${r.mes}`;
      if (!recByComp[key]) recByComp[key] = [];
      recByComp[key].push(r);
    }

    // Processar cada item selecionado (cliente + competência)
    const porCliente = {};

    for (const item of sortedItens) {
      const cid = item.cliente_id;
      const key = `${cid}_${item.ano}_${item.mes}`;
      const compLabel = `${MESES_NOMES[item.mes]}/${item.ano}`;
      const clienteInfo = clienteMap[cid];
      const clienteNome = clienteInfo?.nome || 'Sem nome';

      if (!porCliente[cid]) {
        porCliente[cid] = {
          cliente_id: cid,
          nome: clienteNome,
          total: 0,
          competencias: [],
          itens_competencia: [],
          splits: []
        };
      }

      let records = recByComp[key];

      // Se não existir registro em recebimentos_mensais para aquele mês/ano específico, usa os splits padrão do cliente
      if (!records || records.length === 0) {
        records = (clienteInfo?.splits || []).map(sp => ({
          cliente_id: cid,
          socio_id: sp.socio_id,
          ano: item.ano,
          mes: item.mes,
          valor_esperado: sp.valor,
          clientes: { nome: clienteNome },
          socios: socioMap[sp.socio_id] || { nome: 'Desconhecido', is_empresa: 0 }
        }));
      }

      let subtotalComp = 0;
      for (const r of records) {
        const valor = Number(r.valor_esperado) || 0;
        subtotalComp += valor;
        porCliente[cid].total += valor;

        porCliente[cid].splits.push({
          socio_id: r.socio_id,
          socio_nome: r.socios?.nome || socioMap[r.socio_id]?.nome || 'Desconhecido',
          valor,
          ano: item.ano,
          mes: item.mes,
          competencia: compLabel
        });

        if (porSocio[r.socio_id] && valor > 0) {
          porSocio[r.socio_id].total += valor;
          porSocio[r.socio_id].clientes.push({
            cliente_id: cid,
            cliente_nome: clienteNome,
            competencia: compLabel,
            ano: item.ano,
            mes: item.mes,
            valor
          });
        }
      }

      porCliente[cid].competencias.push(compLabel);
      porCliente[cid].itens_competencia.push({
        ano: item.ano,
        mes: item.mes,
        competencia: compLabel,
        valor: subtotalComp
      });
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
