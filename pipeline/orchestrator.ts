/**
 * Tu Socia! - Pipeline Orchestrator
 * Coordina el flujo completo desde la recepcion de un lead hasta la creacion del agente.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

export interface ClientContext {
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

export class PipelineOrchestrator {
  private jobs: Map<string, PipelineJob> = new Map();
  private templatesDir: string;
  private clientsDir: string;

  constructor(templatesDir: string, clientsDir: string) {
    this.templatesDir = templatesDir;
    this.clientsDir = clientsDir;
  }

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
    await this.persistJob(job, leadId);

    // Background — no bloquea el webhook
    this.executePipeline(job, context).catch(async (error) => {
      job.status = 'failed';
      job.error = String(error);
      job.completedAt = new Date().toISOString();
      console.error(`Pipeline failed for ${leadId}:`, error);
      await this.persistJob(job, leadId);
    });

    return job;
  }

  private async executePipeline(job: PipelineJob, context: ClientContext): Promise<void> {
    job.status = 'processing';

    // 1. Clonar template base
    await this.runStep(job, 'clone-template', async () => {
      const clientDir = path.join(this.clientsDir, context.leadId, 'agent');
      const templateDir = path.join(this.templatesDir, job.templateId);
      await this.copyDirectory(templateDir, clientDir);
      return { clientDir };
    });

    // 2. Adaptar configuracion
    job.status = 'adapting';
    await this.runStep(job, 'adapt-config', async () => {
      const configPath = path.join(this.clientsDir, context.leadId, 'agent', 'config', 'template.json');
      let cfg: any = {};
      try {
        const raw = await fs.readFile(configPath, 'utf-8');
        cfg = JSON.parse(raw);
      } catch {
        // config puede no existir en todos los templates
      }
      if (cfg.defaultConfig) {
        cfg.defaultConfig.welcomeMessage = (cfg.defaultConfig.welcomeMessage || '')
          .replace(/\{\{company\}\}/g, context.company);
        cfg.defaultConfig.greeting = (cfg.defaultConfig.greeting || '')
          .replace(/\{\{company\}\}/g, context.company);
      }
      cfg.client = {
        leadId: context.leadId,
        company: context.company,
        sector: context.sector,
        adaptedAt: new Date().toISOString()
      };
      await fs.writeFile(configPath, JSON.stringify(cfg, null, 2)).catch(() => null);
      return { adapted: true };
    });

    // 3. Adaptar codigo (futuro: subagente IA)
    await this.runStep(job, 'adapt-code', async () => {
      return { adapted: false, note: 'Pendiente: subagente IA' };
    });

    // 4. Generar knowledge base
    await this.runStep(job, 'generate-knowledge-base', async () => {
      const kbDir = path.join(this.clientsDir, context.leadId, 'agent', 'knowledge');
      await fs.mkdir(kbDir, { recursive: true });
      const kb = {
        company: context.company,
        sector: context.sector,
        generatedAt: new Date().toISOString(),
        entries: [
          { topic: 'Tareas repetitivas', content: context.painPoints.repetitiveTasks, source: 'lead-form' },
          { topic: 'Cuellos de botella', content: context.painPoints.bottlenecks, source: 'lead-form' },
          { topic: 'Deseo del cliente', content: context.painPoints.magicWand, source: 'lead-form' }
        ].filter(e => e.content)
      };
      await fs.writeFile(path.join(kbDir, 'base-knowledge.json'), JSON.stringify(kb, null, 2));
      return { entries: kb.entries.length };
    });

    // 5. Validar
    job.status = 'testing';
    await this.runStep(job, 'validate', async () => {
      const agentDir = path.join(this.clientsDir, context.leadId, 'agent');
      const hasSrc = await this.fileExists(path.join(agentDir, 'src'));
      const hasKb = await this.fileExists(path.join(agentDir, 'knowledge', 'base-knowledge.json'));
      return { valid: hasSrc && hasKb, hasSrc, hasKb };
    });

    // 6. Empaquetar
    await this.runStep(job, 'package', async () => {
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
    await this.persistJob(job, context.leadId);
  }

  private async runStep(job: PipelineJob, stepName: string, fn: () => Promise<any>): Promise<void> {
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

  getJobStatus(jobId: string): PipelineJob | undefined {
    return this.jobs.get(jobId);
  }

  listJobs(): PipelineJob[] {
    return Array.from(this.jobs.values());
  }

  private async persistJob(job: PipelineJob, leadId: string): Promise<void> {
    try {
      const jobDir = path.join(this.clientsDir, leadId);
      await fs.mkdir(jobDir, { recursive: true });
      await fs.writeFile(path.join(jobDir, 'pipeline-job.json'), JSON.stringify(job, null, 2));
    } catch (err) {
      console.error(`[orchestrator] No se pudo persistir job ${job.id}:`, err);
    }
  }

  async getJobByLeadId(leadId: string): Promise<PipelineJob | undefined> {
    for (const job of this.jobs.values()) {
      if (job.leadId === leadId) return job;
    }
    try {
      const raw = await fs.readFile(path.join(this.clientsDir, leadId, 'pipeline-job.json'), 'utf-8');
      return JSON.parse(raw) as PipelineJob;
    } catch {
      return undefined;
    }
  }

  private async copyDirectory(src: string, dest: string): Promise<void> {
    await fs.mkdir(dest, { recursive: true });
    let entries: any[] = [];
    try {
      entries = await fs.readdir(src, { withFileTypes: true });
    } catch {
      return; // template dir puede no existir aun
    }
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
