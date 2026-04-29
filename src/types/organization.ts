import type { Organization, OrganizationMember, OrgRole } from './database';

export type { Organization, OrganizationMember, OrgRole };

export interface OrganizationWithMembership {
  organization: Organization;
  membership: OrganizationMember;
}
