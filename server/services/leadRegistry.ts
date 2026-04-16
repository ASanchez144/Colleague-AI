/**
 * Registro de Leads
 * Almacenamiento local en JSON para desarrollo.
 * En producción, migrar a Supabase o PostgreSQL.
 */

import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger.js';

const DATA_DIR = path.resolve(import.meta.dirname, '../../clients');
const REGISTRY_FILE = path.join(DATA_DIR, 'leads-registry.json');

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  sector: string;
  status: string;
  createdAt: string;
  pipeline: {
    emailSent: boolean;
    templateAssigned: string | null;
    agentCreated: boolean;
    confidence?: number;
    reasoning?: string;
  };
  [key: string]: any;
}

// ─── Helpers ─────────────────────────────────────────

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // Directory exists
  }
}

async function readRegistry(): Promise<Lead[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(REGISTRY_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeRegistry(leads: Lead[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(REGISTRY_FILE, JSON.stringify(leads, null, 2), 'utf-8');
}

// ─── Public API ──────────────────────────────────────

/**
 * Registra un nuevo lead en el sistema
 */
export async function registerLead(leadData: Lead): Promise<Lead> {
  const leads = await readRegistry();
  leads.push(leadData);
  await writeRegistry(leads);

  // También guardar archivo individual del cliente
  const clientDir = path.join(DATA_DIR, leadData.id);
  await fs.mkdir(clientDir, { recursive: true });
  await fs.writeFile(
    path.join(clientDir, 'lead-data.json'),
    JSON.stringify(leadData, null, 2),
    'utf-8'
  );

  logger.debug(`Lead ${leadData.id} registrado en disco`);
  return leadData;
}

/**
 * Obtiene todos los leads
 */
export async function getLeads(): Promise<Lead[]> {
  return readRegistry();
}

/**
 * Obtiene un lead por ID
 */
export async function getLeadById(id: string): Promise<Lead | null> {
  const leads = await readRegistry();
  return leads.find(l => l.id === id) || null;
}

/**
 * Actualiza campos de un lead
 */
export async function updateLeadStatus(
  id: string,
  updates: Record<string, any>
): Promise<Lead | null> {
  const leads = await readRegistry();
  const index = leads.findIndex(l => l.id === id);

  if (index === -1) {
    logger.warn(`Lead ${id} no encontrado para actualizar`);
    return null;
  }

  // Soportar dot notation para updates anidados (e.g. 'pipeline.emailSent')
  for (const [key, value] of Object.entries(updates)) {
    const parts = key.split('.');
    if (parts.length === 1) {
      leads[index][key] = value;
    } else {
      let obj: any = leads[index];
      for (let i = 0; i < parts.length - 1; i++) {
        if (obj[parts[i]] === undefined) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
    }
  }

  leads[index].updatedAt = new Date().toISOString();
  await writeRegistry(leads);

  // Actualizar archivo individual
  const clientDir = path.join(DATA_DIR, id);
  try {
    await fs.writeFile(
      path.join(clientDir, 'lead-data.json'),
      JSON.stringify(leads[index], null, 2),
      'utf-8'
    );
  } catch {
    // Client dir might not exist yet
  }

  return leads[index];
}
