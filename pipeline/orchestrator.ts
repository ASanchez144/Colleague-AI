/**
 * Tu Socia! - Pipeline Orchestrator
 *
 * Coordina el flujo completo desde la recepción de un lead
 * hasta la creación del agente personalizado.
 *
 * Flujo:
 *   1. Recibir lead (webhook)
 *   2. Enviar email de bienvenida
 *   3. Analizar necesidades → enrutar a template
 *   4. Clonar template base
 *   5. Adaptar template al contexto del cliente
 *   6. Notificar al admin
 *   7. Entregar agente al cliente
 */

import fs from 'fs/promises';
import path from 'path';

// ─── Types ───────────────────────────────────────────

export interface PipelineJob {
  id: string;
  leadId: string;
  templateId: string;
  status: 'queued' | 'processing' | 'adapting' | 'testing' | 'ready' | 'delivered' | 'failed';
  startedAt: string;
  completedAt?: string;
  error?: string;
  steps: PipelineStep[];
}

interface PipelineStep {
  name: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  startedAt?: string;
  completedAt?: string;
  output?: any;
}

interface ClientContext {
  leadId: string;
  company: string;
  sector: string;
  tools: string[];
  painPoints: {
    repetitiveTasks: string;
    bottlenecks: string;
    magicWand: string;
  };
  security: string;
}

// ─── Orchestrator ────────────────────────────────────

export class PipelineOrchestrator {
  private jobs: Map<string, PipelineJob> = new Map();
  private templatesDir: string;
  private clientsDir: string;

  constructor(templatesDir: string, clientsDir: string) {
    this.templatesDir = templatesDir;
    this.clientsDir = clientsDir;
  }

  /**
   * Inicia el pipeline de creación para un lead
   */
  async startPipeline(leadId: string, templateId: string, context: ClientContext): Promise<PipelineJob> {
    const job: PipelineJob = {
      id: `job-${Date.now()}-${leadId.slice(0, 8)}`,
      leadId,
      templateId,
      status: 'queued',
      startedAt: new Date().toISOString(),
      steps: [
        { name: 'clone-template', status: 'pending' },
        { name: 'adapt-config', status: 'pending' },
        { name: 'adapt-code', status: 'pending' },
        { name: 'generate-knowledge-base', status: 'pending' },
        { name: 'validate', status: 'pending' },
        { name: 'package', status: 'pending' }
      ]
    };

    this.jobs.set(job.id, job);

    // Ejecutar pipeline en background
    this.executePipeline(job, context).catch(error => {
      job.status = 'failed';
      job.error = String(error);
      console.error(`Pipeline failed for ${leadId}:`, error);
    });

    return job;
  }

  /**
   * Ejecuta los pasos del pipeline secuencialmente
   */
  private async executePipeline(job: PipelineJob, context: ClientContext): Promise<void> {
    job.status = 'processing';

    // ── Paso 1: Clonar template base ──
    await this.runStep(job, 'clone-template', async () => {
      const clientDir = path.join(this.clientsDir, context.leadId, 'agent');
      const templateDir = path.join(this.templatesDir, job.templateId);
      await this.copyDirectory(templateDir, clientDir);
      return { clientDir };
    });

    // ── Paso 2: Adaptar configuración ──
    job.status = 'adapting';
    await this.runStep(job, 'adapt-config', async () => {
      const configPath = path.join(this.clientsDir, context.leadId, 'agent', 'config', 'template.json');
      const configRaw = await fs.readFile(configPath, 'utf-8');
      const config = JSON.parse(configRaw);

      // Personalizar config con datos del cliente
      if (config.defaultConfig) {
        config.defaultConfig.welcomeMessage = config.defaultConfig.welcomeMessage
          ?.replace('{{company}}', context.company);
        config.defaultConfig.greeting = config.defaultConfig.greeting
          ?.replace('{{company}}', context.company);
      }

      config.client = {
        leadId: context.leadId,
        company: context.company,
        sector: context.sector,
        adaptedAt: new Date().toISOString()
      };

      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      return { adapted: true };
    });

    // ── Paso 3: Adaptar código (futuro: subagente con IA) ──
    await this.runStep(job, 'adapt-code', async () => {
      // TODO: Aquí se conectará un subagente (Haiku) que:
      // 1. Lee el template base
      // 2. Analiza los pain points del cliente
      // 3. Genera código adaptado (knowledge base, reglas de negocio, etc.)
      //
      // Por ahora, solo registramos que necesita adaptación manual
      return {
        adapted: false,
        note: 'Pendiente: adaptación por subagente de IA'
      };
    });

    // ── Paso 4: Generar knowledge base ──
    await this.runStep(job, 'generate-knowledge-base', async () => {
      const kbDir = path.join(this.clientsDir, context.leadId, 'agent', 'knowledge');
      await fs.mkdir(kbDir, { recursive: true });

      // Generar KB básica desde los pain points
      const kb = {
        company: context.company,
        sector: context.sector,
        generatedAt: new Date().toISOString(),
        entries: [
          {
            topic: 'Tareas repetitivas identificadas',
            content: context.painPoints.repetitiveTasks,
            source: 'lead-form'
          },
          {
            topic: 'Cuellos de botella',
            content: context.painPoints.bottlenecks,
            source: 'lead-form'
          },
          {
            topic: 'Deseo del cliente',
            content: context.painPoints.magicWand,
            source: 'lead-form'
          }
        ]
      };

      await fs.writeFile(
        path.join(kbDir, 'base-knowledge.json'),
        JSON.stringify(kb, null, 2)
      );

      return { entries: kb.entries.length };
    });

    // ── Paso 5: Validar ──
    job.status = 'testing';
    await this.runStep(job, 'validate', async () => {
      const agentDir = path.join(this.clientsDir, context.leadId, 'agent');
      const hasConfig = await this.fileExists(path.join(agentDir, 'config', 'template.json'));
      const hasSrc = await this.fileExists(path.join(agentDir, 'src', 'agent.ts'));
      const hasKb = await this.fileExists(path.join(agentDir, 'knowledge', 'base-knowledge.json'));

      return { valid: hasConfig && hasSrc && hasKb, hasConfig, hasSrc, hasKb };
    });

    // ── Paso 6: Empaquetar ──
    await this.runStep(job, 'package', async () => {
      // Generar manifiesto del agente
      const manifest = {
        agentId: `agent-${context.leadId.slice(0, 8)}`,
        client: context.company,
        template: job.templateId,
        createdAt: new Date().toISOString(),
        status: 'ready-for-review',
        directory: path.join(this.clientsDir, context.leadId, 'agent')
      };

      await fs.writeFile(
        path.join(this.clientsDir, context.leadId, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      return manifest;
    });

    job.status = 'ready';
    job.completedAt = new Date().toISOString();
  }

  /**
   * Ejecuta un paso individual del pipeline
   */
  private async runStep(
    job: PipelineJob,
    stepName: string,
    fn: () => Promise<any>
  ): Promise<void> {
    const step = job.steps.find(s => s.name === stepName);
    if (!step) throw new Error(`Step ${stepName} not found`);

    step.status = 'running';
    step.startedAt = new Date().toISOString();

    try {
      step.output = await fn();
      step.status = 'done';
      step.completedAt = new Date().toISOString();
    } catch (error) {
      step.status = 'failed';
      step.completedAt = new Date().toISOString();
      throw error;
    }
  }

  /**
   * Obtiene el estado de un job
   */
  getJobStatus(jobId: string): PipelineJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Lista todos los jobs
   */
  listJobs(): PipelineJob[] {
    return Array.from(this.jobs.values());
  }

  // ─── Helpers ─────────────────────────────────────

  private async copyDirectory(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    const entries = await fs.readdir(src, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);

      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
