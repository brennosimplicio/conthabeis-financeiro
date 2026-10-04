import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const server = new Server(
  {
    name: "conthabeis-financeiro-mcp",
    version: "1.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tools Definition
const tools = [
  // --- CLIENTES ---
  {
    name: "get_clientes",
    description: "Lista os clientes ativos do sistema, seus dados e faturamento.",
    inputSchema: { type: "object", properties: {} }
  },
  {
    name: "alterar_cliente",
    description: "Altera o faturamento, nome ou dia de vencimento de um cliente existente.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "number" },
        nome: { type: "string" },
        faturamento: { type: "number" },
        dia_vencimento: { type: "number" }
      },
      required: ["id"]
    }
  },
  
  // --- DESPESAS ---
  {
    name: "get_despesas",
    description: "Lista as despesas fixas cadastradas no sistema.",
    inputSchema: { type: "object", properties: {} }
  },
  
  // --- RECEBIMENTOS ---
  {
    name: "get_recebimentos",
    description: "Lista os recebimentos (contas a receber) de um determinado mês e ano.",
    inputSchema: {
      type: "object",
      properties: {
        ano: { type: "number" },
        mes: { type: "number" }
      },
      required: ["ano", "mes"]
    }
  },
  {
    name: "registrar_recebimento",
    description: "Marca um recebimento de cliente como pago.",
    inputSchema: {
      type: "object",
      properties: {
        recebimento_id: { type: "number" },
        valor_recebido: { type: "number" }
      },
      required: ["recebimento_id", "valor_recebido"]
    }
  },

  // --- PAGAMENTOS ---
  {
    name: "get_pagamentos",
    description: "Lista os pagamentos (contas a pagar) de despesas de um determinado mês e ano.",
    inputSchema: {
      type: "object",
      properties: {
        ano: { type: "number" },
        mes: { type: "number" }
      },
      required: ["ano", "mes"]
    }
  },
  {
    name: "registrar_pagamento",
    description: "Marca uma despesa como paga no mês.",
    inputSchema: {
      type: "object",
      properties: {
        pagamento_id: { type: "number" },
        valor_pago: { type: "number" }
      },
      required: ["pagamento_id", "valor_pago"]
    }
  },

  // --- RECEITAS EXTRAS ---
  {
    name: "get_receitas_extras",
    description: "Lista as receitas extras de um determinado mês e ano.",
    inputSchema: {
      type: "object",
      properties: {
        ano: { type: "number" },
        mes: { type: "number" }
      },
      required: ["ano", "mes"]
    }
  },
  {
    name: "criar_receita_extra",
    description: "Registra uma nova receita extra no sistema.",
    inputSchema: {
      type: "object",
      properties: {
        descricao: { type: "string" },
        valor: { type: "number" },
        ano: { type: "number" },
        mes: { type: "number" },
        socio_id: { type: "number" }
      },
      required: ["descricao", "valor", "ano", "mes", "socio_id"]
    }
  },

  // --- RELATORIO MENSAL ---
  {
    name: "gerar_relatorio_mensal",
    description: "Gera um relatório financeiro resumido do mês (totais esperados e realizados).",
    inputSchema: {
      type: "object",
      properties: {
        ano: { type: "number" },
        mes: { type: "number" }
      },
      required: ["ano", "mes"]
    }
  }
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    
    // --- CLIENTES ---
    if (name === "get_clientes") {
      const { data, error } = await supabase.from('clientes').select('*').eq('ativo', 1);
      if (error) throw error;
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] } };
    }
    
    if (name === "alterar_cliente") {
      const { id, nome, faturamento, dia_vencimento } = args;
      const updates = { atualizado_em: new Date().toISOString() };
      if (nome !== undefined) updates.nome = nome;
      if (faturamento !== undefined) updates.faturamento = faturamento;
      if (dia_vencimento !== undefined) updates.dia_vencimento = dia_vencimento;
      const { error } = await supabase.from('clientes').update(updates).eq('id', id);
      if (error) throw error;
      return { toolResult: { content: [{ type: "text", text: "Cliente atualizado com sucesso no banco de dados." }] } };
    }

    // --- DESPESAS ---
    if (name === "get_despesas") {
      const { data, error } = await supabase.from('despesas').select('*').eq('ativa', 1);
      if (error) throw error;
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] } };
    }

    // --- RECEBIMENTOS ---
    if (name === "get_recebimentos") {
      const { ano, mes } = args;
      const { data, error } = await supabase.from('recebimentos_mensais').select('*, clientes(nome)').eq('ano', ano).eq('mes', mes);
      if (error) throw error;
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] } };
    }
    
    if (name === "registrar_recebimento") {
      const { recebimento_id, valor_recebido } = args;
      const { error } = await supabase.from('recebimentos_mensais').update({ recebido: 1, valor_recebido, data_recebimento: new Date().toISOString() }).eq('id', recebimento_id);
      if (error) throw error;
      return { toolResult: { content: [{ type: "text", text: "Recebimento registrado com sucesso!" }] } };
    }

    // --- PAGAMENTOS ---
    if (name === "get_pagamentos") {
      const { ano, mes } = args;
      const { data, error } = await supabase.from('pagamentos_mensais').select('*, despesas(nome, categoria)').eq('ano', ano).eq('mes', mes);
      if (error) throw error;
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] } };
    }
    
    if (name === "registrar_pagamento") {
      const { pagamento_id, valor_pago } = args;
      const { error } = await supabase.from('pagamentos_mensais').update({ pago: 1, valor_pago, data_pagamento: new Date().toISOString() }).eq('id', pagamento_id);
      if (error) throw error;
      return { toolResult: { content: [{ type: "text", text: "Pagamento registrado com sucesso!" }] } };
    }

    // --- RECEITAS EXTRAS ---
    if (name === "get_receitas_extras") {
      const { ano, mes } = args;
      const { data, error } = await supabase.from('receitas_extras').select('*').eq('ano', ano).eq('mes', mes);
      if (error) throw error;
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] } };
    }

    if (name === "criar_receita_extra") {
      const { descricao, valor, ano, mes, socio_id } = args;
      const { error } = await supabase.from('receitas_extras').insert([{ descricao, valor, ano, mes, socio_id }]);
      if (error) throw error;
      return { toolResult: { content: [{ type: "text", text: "Receita extra cadastrada com sucesso!" }] } };
    }

    // --- RELATORIO MENSAL ---
    if (name === "gerar_relatorio_mensal") {
      const { ano, mes } = args;
      
      const { data: recs } = await supabase.from('recebimentos_mensais').select('*').eq('ano', ano).eq('mes', mes);
      const { data: pags } = await supabase.from('pagamentos_mensais').select('*').eq('ano', ano).eq('mes', mes);
      const { data: extras } = await supabase.from('receitas_extras').select('*').eq('ano', ano).eq('mes', mes);
      
      const totalEsperadoRec = (recs || []).reduce((sum, r) => sum + r.valor_esperado, 0);
      const totalRecebido = (recs || []).filter(r => r.recebido === 1).reduce((sum, r) => sum + r.valor_recebido, 0);
      
      const totalEsperadoPag = (pags || []).reduce((sum, p) => sum + p.valor_esperado, 0);
      const totalPago = (pags || []).filter(p => p.pago === 1).reduce((sum, p) => sum + p.valor_pago, 0);
      
      const totalExtras = (extras || []).reduce((sum, e) => sum + e.valor, 0);
      
      const report = `Relatório de ${mes}/${ano}\n\n` +
`Recebimentos Esperados: R$ ${totalEsperadoRec.toFixed(2)}\n` +
`Total Já Recebido: R$ ${totalRecebido.toFixed(2)}\n\n` +
`Pagamentos de Despesas Esperados: R$ ${totalEsperadoPag.toFixed(2)}\n` +
`Total Já Pago: R$ ${totalPago.toFixed(2)}\n\n` +
`Receitas Extras (Entradas isoladas): R$ ${totalExtras.toFixed(2)}\n\n` +
`Saldo Atual (Recebido + Extras - Pago): R$ ${(totalRecebido + totalExtras - totalPago).toFixed(2)}\n`;
      return { toolResult: { content: [{ type: "text", text: report }] } };
    }

    throw new Error("Ferramenta não encontrada.");
  } catch (error) {
    return { toolResult: { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true } };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("ContHabeis MCP Server (Admin Edition) running on stdio");
