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

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    
    // --- CLIENTES ---
    if (name === "get_clientes") {
      const res = await fetch(`${API_URL}/api/clientes`);
      if (!res.ok) throw new Error("Erro ao buscar clientes da API");
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    
    if (name === "alterar_cliente") {
      const res = await fetch(`${API_URL}/api/clientes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      });
      if (!res.ok) throw new Error("Erro ao atualizar cliente via API");
      return { content: [{ type: "text", text: "Cliente atualizado com sucesso respeitando regras de negócio." }] };
    }

    // --- DESPESAS ---
    if (name === "get_despesas") {
      const res = await fetch(`${API_URL}/api/despesas`);
      if (!res.ok) throw new Error("Erro ao buscar despesas");
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    // --- RECEBIMENTOS ---
    if (name === "get_recebimentos") {
      const { ano, mes } = args;
      const res = await fetch(`${API_URL}/api/recebimentos?ano=${ano}&mes=${mes}`);
      if (!res.ok) throw new Error("Erro ao gerar/buscar recebimentos");
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    
    if (name === "registrar_recebimento") {
      const { recebimento_id, valor_recebido } = args;
      const res = await fetch(`${API_URL}/api/recebimentos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: recebimento_id,
          recebido: 1,
          valor_recebido,
          data_recebimento: new Date().toISOString()
        })
      });
      if (!res.ok) throw new Error("Erro ao registrar recebimento via API");
      return { content: [{ type: "text", text: "Recebimento registrado com sucesso e validado pela API!" }] };
    }

    // --- PAGAMENTOS ---
    if (name === "get_pagamentos") {
      const { ano, mes } = args;
      const res = await fetch(`${API_URL}/api/pagamentos?ano=${ano}&mes=${mes}`);
      if (!res.ok) throw new Error("Erro ao gerar/buscar pagamentos");
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    
    if (name === "registrar_pagamento") {
      const { pagamento_id, valor_pago } = args;
      const res = await fetch(`${API_URL}/api/pagamentos`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: pagamento_id,
          pago: 1,
          valor_pago,
          data_pagamento: new Date().toISOString()
        })
      });
      if (!res.ok) throw new Error("Erro ao registrar pagamento via API");
      return { content: [{ type: "text", text: "Pagamento registrado com sucesso e validado pela API!" }] };
    }

    // --- RECEITAS EXTRAS ---
    if (name === "get_receitas_extras") {
      const { ano, mes } = args;
      const res = await fetch(`${API_URL}/api/receitas-extras?ano=${ano}&mes=${mes}`);
      if (!res.ok) throw new Error("Erro ao buscar receitas extras");
      const data = await res.json();
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    if (name === "criar_receita_extra") {
      const res = await fetch(`${API_URL}/api/receitas-extras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      });
      if (!res.ok) throw new Error("Erro ao registrar receita extra via API");
      return { content: [{ type: "text", text: "Receita extra cadastrada com sucesso!" }] };
    }

    // --- RELATORIO MENSAL ---
    if (name === "gerar_relatorio_mensal") {
      const { ano, mes } = args;
      
      const dashboardRes = await fetch(`${API_URL}/api/dashboard?ano=${ano}&mes=${mes}`);
      if (!dashboardRes.ok) throw new Error("Erro ao processar relatório pelo Dashboard");
      const dash = await dashboardRes.json();
      
      const report = `Relatório Oficial de ${mes}/${ano}\n\n` +
`Faturamento Total Ativo: R$ ${dash.faturamento_total?.toFixed(2)}\n` +
`Total Já Recebido dos Clientes: R$ ${dash.total_recebido?.toFixed(2)}\n` +
`Total Pendente a Receber: R$ ${dash.total_a_receber?.toFixed(2)}\n\n` +
`Despesas Fixas Esperadas: R$ ${dash.conthabeis?.despesas_total?.toFixed(2)}\n` +
`Despesas Já Pagas: R$ ${dash.conthabeis?.despesas_pagas?.toFixed(2)}\n\n` +
`Receitas Extras (Avulsas): R$ ${dash.receitas_extras_total?.toFixed(2)}\n\n` +
`Resultado Financeiro da ContHabeis (Caixa): R$ ${dash.conthabeis?.resultado?.toFixed(2)}\n`;

      return { content: [{ type: "text", text: report }] };
    }

    throw new Error("Ferramenta não encontrada.");
  } catch (error) {
    return { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true };
  }
});

import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import cors from "cors";

if (process.argv.includes("--stdio")) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("ContHabeis MCP Server running on stdio");
} else {
  const app = express();
  app.use(cors());
  
  let sseTransport;
  
  app.get("/sse", async (req, res) => {
    sseTransport = new SSEServerTransport("/messages", res);
    await server.connect(sseTransport);
    console.log("Client connected via SSE");
  });
  
  app.post("/messages", async (req, res) => {
    if (sseTransport) {
      try {
        await sseTransport.handlePostMessage(req, res);
      } catch (err) {
        console.error("Error handling post message:", err);
        res.status(500).send("Error");
      }
    } else {
      res.status(503).send("No active SSE connection");
    }
  });

  const PORT = process.env.PORT || 3333;
  app.listen(PORT, () => {
    console.log(`ContHabeis MCP Server (Admin Edition) running on HTTP SSE at http://localhost:${PORT}/sse`);
  });
}
