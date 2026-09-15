import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Setup Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const server = new Server(
  {
    name: "conthabeis-financeiro-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_clientes",
        description: "Lista os clientes ativos do sistema financeiro, incluindo faturamento.",
        inputSchema: { type: "object", properties: {} }
      },
      {
        name: "get_recebimentos",
        description: "Lista os recebimentos de um determinado mês e ano.",
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
        description: "Marca um recebimento como pago.",
        inputSchema: {
          type: "object",
          properties: {
            recebimento_id: { type: "number" },
            valor_recebido: { type: "number" }
          },
          required: ["recebimento_id", "valor_recebido"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (request.params.name === "get_clientes") {
      const { data, error } = await supabase.from('clientes').select('*').eq('ativo', 1);
      if (error) throw error;
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] } };
    }
    
    if (request.params.name === "get_recebimentos") {
      const { ano, mes } = request.params.arguments;
      const { data, error } = await supabase.from('recebimentos_mensais').select('*, clientes(nome)').eq('ano', ano).eq('mes', mes);
      if (error) throw error;
      return { toolResult: { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] } };
    }
    
    if (request.params.name === "registrar_recebimento") {
      const { recebimento_id, valor_recebido } = request.params.arguments;
      const { data, error } = await supabase.from('recebimentos_mensais').update({ recebido: 1, valor_recebido }).eq('id', recebimento_id);
      if (error) throw error;
      return { toolResult: { content: [{ type: "text", text: "Recebimento registrado com sucesso!" }] } };
    }

    throw new Error("Tool not found");
  } catch (error) {
    return { toolResult: { content: [{ type: "text", text: `Erro: ${error.message}` }], isError: true } };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("ContHabeis MCP Server running on stdio");
