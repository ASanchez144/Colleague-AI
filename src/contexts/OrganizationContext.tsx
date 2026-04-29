import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { Organization, OrganizationMember, OrgRole } from '../types/database';
import type { OrganizationWithMembership } from '../types/organization';

export type { OrganizationWithMembership };

interface OrganizationContextValue {
  organizations: OrganizationWithMembership[];
  currentOrganization: Organization | null;
  currentMembership: OrganizationMember | null;
  currentRole: OrgRole | null;
  loading: boolean;
  error: string | null;
  setCurrentOrganizationId: (id: string) => void;
  refreshOrganizations: () => Promise<void>;
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
}

const STORAGE_KEY = 'sebas_current_org_id';

const OrganizationContext = createContext<OrganizationContextValue | null>(null);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationWithMembership[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = useCallback(async () => {
    if (!user) {
      // Explicit logout cleanup — clear org state and localStorage
      setOrganizations([]);
      setCurrentOrgId(null);
      localStorage.removeItem(STORAGE_KEY);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('organization_members')
        .select('*, organization:organizations(*)')
        .eq('profile_id', user.id);

      if (fetchError) throw fetchError;

      type RawRow = OrganizationMember & { organization: Organization };
      const rows = (data ?? []) as RawRow[];

      const items: OrganizationWithMembership[] = rows.map((row) => ({
        membership: {
          id: row.id,
          organization_id: row.organization_id,
          profile_id: row.profile_id,
          role: row.role,
          invited_at: row.invited_at,
          joined_at: row.joined_at,
          created_at: row.created_at,
        },
        organization: row.organization,
      }));

      setOrganizations(items);

      setCurrentOrgId((prev) => {
        if (items.length === 0) return prev;
        const found = items.find((i) => i.organization.id === prev);
        if (found) return prev;
        const firstId = items[0].organization.id;
        localStorage.setItem(STORAGE_KEY, firstId);
        return firstId;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando organizaciones');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const setCurrentOrganizationId = useCallback((id: string) => {
    setCurrentOrgId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const current = organizations.find((o) => o.organization.id === currentOrgId) ?? null;
  const currentOrganization = current?.organization ?? null;
  const currentMembership = current?.membership ?? null;
  const currentRole = currentMembership?.role ?? null;

  // OrgRole includes 'viewer' (DB schema enum) but UI roles for Fase 3 are owner/admin/member.
  // viewer is not assigned yet — isMember true for viewer is intentional (read-only access).
  const isOwner = currentRole === 'owner';
  const isAdmin = currentRole === 'admin' || currentRole === 'owner';
  const isMember = currentRole !== null;

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrganization,
        currentMembership,
        currentRole,
        loading,
        error,
        setCurrentOrganizationId,
        refreshOrganizations: fetchOrganizations,
        isOwner,
        isAdmin,
        isMember,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const ctx = useContext(OrganizationContext);
  if (!ctx) throw new Error('useOrganization must be used inside OrganizationProvider');
  return ctx;
}
