/**
 * Tu Socia! — Servidor MCP de Producción
 *
 * Este proceso corre EN EL SERVIDOR REMOTO y expone herramientas
 * de administración y deploy al agente Claude Code local a través de SSH.
 *
 * Transporte: stdio (stdin/stdout) → Claude Code lo invoca vía SSH
 * Protocolo:  Model Context Protocol (MCP) v1
 *
 * Herramientas expuestas:
 *   - run_command   → Ejecuta cualquier comando shell en el servidor
 *   - write_file    → Escribe/sobreescribe un archivo en el proyecto
 *   - read_file     → Lee un archivo del proyecto
 *   - pm2_status    → Estado de todos los procesos PM2
 *   - full_deploy   → Pipeline completo: git pull → install → build → restart
 *   - docker_status → Estado de los contenedores Docker del cliente activo
 *
 * Uso desde Claude Code local:
 *   El agente simplemente llama a las tools por nombre.
 *   SSH hace de transporte transparente.
 *
 * Seguridad:
 *   - Solo accesible por SSH con la clave privada del operador
 *   - PROJECT_ROOT limita el scope de write_file y read_file
 *   - Timeouts en todos los comandos para evitar bloqueos
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { config } from 'dotenv';

config();

// ─── Configuración ────────────────────────────────────────────
const PROJECT_ROOT = process.env.PROJECT_ROOT || '/opt/tusocia/app';
const MAX_OUTPUT_BYTES = 50 * 1024; // 50 KB máximo en respuestas

// ─── Definición de herramientas ───────────────────────────────

const tools: Tool[] = [
  {
    name: 'run_command',
    description:
      'Ejecuta un comando shell en el servidor de producción. Devuelve stdout y stderr. ' +
      'Usar para: git, npm, pm2, docker, systemctl, verificar puertos, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Comando shell a ejecutar. Soporta pipes y operadores (&&, ||, etc.).',
        },
        cwd: {
          type: 'string',
          description:
            `Directorio de trabajo. Default: ${PROJECT_ROOT}. ` +
            'Ejemplo: "/opt/tusocia/app/templates/01-whatsapp-agent"',
        },
        timeout_ms: {
          type: 'number',
          description: 'Timeout en milisegundos. Default: 60000 (1 min). Máximo: 300000 (5 min).',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'write_file',
    description:
      'Crea o sobreescribe un archivo en el servidor de producción. ' +
      'La ruta es relativa a la raíz del proyecto (' + PROJECT_ROOT + '). ' +
      'Crea directorios intermedios automáticamente. Usar para subir configs, .env, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description:
            'Ruta relativa al proyecto. Ejemplo: "server/.env" o "clients/abc123/agent/config/template.json"',
        },
        content: {
          type: 'string',
          description: 'Contenido completo del archivo (UTF-8).',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'read_file',
    description:
      'Lee el contenido de un archivo del servidor de producción. ' +
      'La ruta es relativa a la raíz del proyecto. Útil para verificar configs, logs, etc.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Ruta relativa al proyecto. Ejemplo: "server/.env" o "logs/app.log"',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'pm2_status',
    description:
      'Devuelve el estado de todos los procesos PM2 en formato JSON. ' +
      'Incluye: nombre, estado (online/stopped/errored), CPU, memoria, uptime, reinicios.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'full_deploy',
    description:
      'Ejecuta el pipeline completo de deployment: ' +
      'git pull → npm install → npm run build → pm2 restart. ' +
      'Usar cuando hay cambios en el repositorio que desplegar. ' +
      'Devuelve el resultado de cada paso con éxito/fallo.',
    inputSchema: {
      type: 'object',
      properties: {
        branch: {
          type: 'string',
          description: 'Rama a desplegar. Default: "main".',
        },
      },
      required: [],
    },
  },
  {
    name: 'docker_status',
    description:
      'Devuelve el estado de los contenedores Docker del stack de WhatsApp. ' +
      'Muestra: nombre, estado, puertos y uptime de cada container.',
    inputSchema: {
      type: 'object',
      properties: {
        client_path: {
          type: 'string',
          description:
            'Ruta relativa al directorio del agente del cliente. ' +
            'Ejemplo: "clients/abc123/agent" o "templates/01-whatsapp-agent". ' +
            'Default: "templates/01-whatsapp-agent"',
        },
      },
      required: [],
    },
  },
];

// ─── Handlers de cada herramienta ─────────────────────────────

function handleRunCommand(args: Record<string, unknown>) {
  const command = args.command as string;
  const cwd = (args.cwd as string | undefined) || PROJECT_ROOT;
  const timeoutMs = Math.min(
    (args.timeout_ms as number | undefined) || 60_000,
    300_000
  );

  try {
    const output = execSync(command, {
      cwd,
      timeout: timeoutMs,
      encoding: 'utf-8',
      maxBuffer: MAX_OUTPUT_BYTES,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const truncated = output.length > MAX_OUTPUT_BYTES;
    const displayOutput = truncated
      ? output.substring(0, MAX_OUTPUT_BYTES) + '\n... [TRUNCADO — demasiado largo]'
      : output;

    return {
      success: true,
      output: displayOutput,
      cwd,
      truncated,
    };
  } catch (error: unknown) {
    const err = error as { message: string; stderr?: string; status?: number };
    return {
      success: false,
      error: err.message,
      stderr: (err.stderr || '').substring(0, 2000),
      exit_code: err.status ?? -1,
      cwd,
    };
  }
}

function handleWriteFile(args: Record<string, unknown>) {
  const filePath = args.path as string;
  const content = args.content as string;

  // Seguridad: no permitir rutas que escapen del PROJECT_ROOT
  const fullPath = path.resolve(PROJECT_ROOT, filePath);
  if (!fullPath.startsWith(PROJECT_ROOT)) {
    return {
      success: false,
      error: `Ruta no permitida: "${filePath}" intenta escapar de ${PROJECT_ROOT}`,
    };
  }

  const dir = path.dirname(fullPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(fullPath, content, 'utf-8');

  return {
    success: true,
    path: fullPath,
    bytes_written: Buffer.byteLength(content, 'utf-8'),
  };
}

function handleReadFile(args: Record<string, unknown>) {
  const filePath = args.path as string;
  const fullPath = path.resolve(PROJECT_ROOT, filePath);

  if (!fullPath.startsWith(PROJECT_ROOT)) {
    return {
      success: false,
      error: `Ruta no permitida: "${filePath}"`,
    };
  }

  if (!existsSync(fullPath)) {
    return {
      success: false,
      error: `Archivo no encontrado: ${fullPath}`,
    };
  }

  const content = readFileSync(fullPath, 'utf-8');
  const truncated = content.length > MAX_OUTPUT_BYTES;

  return {
    success: true,
    path: fullPath,
    content: truncated
      ? content.substring(0, MAX_OUTPUT_BYTES) + '\n... [TRUNCADO]'
      : content,
    size_bytes: Buffer.byteLength(content, 'utf-8'),
    truncated,
  };
}

function handlePm2Status() {
  try {
    const raw = execSync('pm2 jlist', { encoding: 'utf-8', timeout: 10_000 });
    const processes = JSON.parse(raw) as Array<{
      name: string;
      pm2_env?: {
        status?: string;
        pm_uptime?: number;
        restart_time?: number;
        NODE_APP_INSTANCE?: number;
      };
      monit?: { memory?: number; cpu?: number };
    }>;

    const summary = processes.map((p) => ({
      name: p.name,
      status: p.pm2_env?.status ?? 'unknown',
      uptime_ms: p.pm2_env?.pm_uptime ?? 0,
      restarts: p.pm2_env?.restart_time ?? 0,
      memory_mb: Math.round((p.monit?.memory ?? 0) / 1024 / 1024),
      cpu_percent: p.monit?.cpu ?? 0,
    }));

    return { success: true, processes: summary, total: summary.length };
  } catch (error: unknown) {
    const err = error as { message: string };
    return { success: false, error: err.message };
  }
}

function handleFullDeploy(args: Record<string, unknown>) {
  const branch = (args.branch as string | undefined) || 'main';

  const steps = [
    {
      name: 'git_pull',
      command: `git fetch origin && git checkout ${branch} && git pull origin ${branch}`,
    },
    {
      name: 'npm_install_root',
      command: 'npm install --omit=dev',
    },
    {
      name: 'npm_install_server',
      command: 'cd server && npm install --omit=dev',
    },
    {
      name: 'build_frontend',
      command: 'npm run build',
    },
    {
      name: 'pm2_restart',
      command: 'pm2 restart ecosystem.config.cjs --update-env',
    },
    {
      name: 'pm2_save',
      command: 'pm2 save',
    },
  ];

  const results: Array<{
    step: string;
    success: boolean;
    output?: string;
    error?: string;
    duration_ms: number;
  }> = [];

  for (const step of steps) {
    const start = Date.now();
    try {
      const output = execSync(step.command, {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
        timeout: 180_000,
        maxBuffer: MAX_OUTPUT_BYTES,
      });
      results.push({
        step: step.name,
        success: true,
        output: output.substring(0, 1000),
        duration_ms: Date.now() - start,
      });
    } catch (error: unknown) {
      const err = error as { message: string; stderr?: string };
      results.push({
        step: step.name,
        success: false,
        error: err.message,
        duration_ms: Date.now() - start,
      });
      // Parar en el primer fallo
      break;
    }
  }

  const allSuccess = results.every((r) => r.success);
  const completedSteps = results.filter((r) => r.success).length;

  return {
    success: allSuccess,
    branch,
    steps_completed: `${completedSteps}/${steps.length}`,
    results,
  };
}

function handleDockerStatus(args: Record<string, unknown>) {
  const clientPath =
    (args.client_path as string | undefined) || 'templates/01-whatsapp-agent';
  const composePath = path.resolve(PROJECT_ROOT, clientPath);

  try {
    const output = execSync('docker compose ps --format json', {
      cwd: composePath,
      encoding: 'utf-8',
      timeout: 15_000,
    });

    // docker compose ps --format json devuelve un JSON por línea
    const containers = output
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as Record<string, unknown>;
        } catch {
          return { raw: line };
        }
      });

    return { success: true, containers, path: composePath };
  } catch (error: unknown) {
    const err = error as { message: string };
    return {
      success: false,
      error: err.message,
      tip: 'Verifica que Docker está corriendo y que el docker-compose.yml existe en esa ruta.',
    };
  }
}

// ─── Servidor MCP ─────────────────────────────────────────────

const server = new Server(
  {
    name: 'tusocia-deploy-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Listar herramientas disponibles
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools,
}));

// Ejecutar herramienta solicitada
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  let result: unknown;

  switch (name) {
    case 'run_command':
      result = handleRunCommand(args);
      break;
    case 'write_file':
      result = handleWriteFile(args);
      break;
    case 'read_file':
      result = handleReadFile(args);
      break;
    case 'pm2_status':
      result = handlePm2Status();
      break;
    case 'full_deploy':
      result = handleFullDeploy(args);
      break;
    case 'docker_status':
      result = handleDockerStatus(args);
      break;
    default:
      result = { success: false, error: `Herramienta desconocida: "${name}"` };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
});

// ─── Arranque ─────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // No logueamos a stdout — está reservado para el protocolo MCP
  // Los errores van a stderr para no contaminar el canal MCP
  process.stderr.write(
    `[tusocia-mcp] Servidor iniciado. PROJECT_ROOT=${PROJECT_ROOT}\n`
  );
}

main().catch((err) => {
  process.stderr.write(`[tusocia-mcp] Error fatal: ${err}\n`);
  process.exit(1);
});
