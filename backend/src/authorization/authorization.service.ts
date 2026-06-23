import { Injectable, ForbiddenException, OnModuleInit } from '@nestjs/common'
import { Oso } from 'oso-cloud'

export type OsoAction =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'read_registrations'

export type OsoResourceType = 'Opportunity' | 'Registration'

@Injectable()
export class AuthorizationService implements OnModuleInit {
  private oso: Oso | null = null

  onModuleInit() {
    const apiKey = process.env.OSO_CLOUD_API_KEY
    if (apiKey && apiKey !== '') {
      this.oso = new Oso('https://cloud.osohq.com', apiKey)
    }
  }

  /**
   * Returns true when Oso Cloud is configured.
   * When not configured callers fall back to DB-level ownership checks.
   */
  isEnabled(): boolean {
    return this.oso !== null
  }

  /**
   * Assert the user may perform `action` on `resource`.
   * Throws ForbiddenException (403) on denial; resolves silently on allow.
   */
  async authorize(
    actorId: string,
    action: OsoAction,
    resourceType: OsoResourceType,
    resourceId: string,
  ): Promise<void> {
    if (!this.oso) return

    const allowed = await this.oso.authorize(
      { type: 'User', id: actorId },
      action,
      { type: resourceType, id: resourceId },
    )

    if (!allowed) {
      throw new ForbiddenException(
        `Not authorized to ${action} ${resourceType}/${resourceId}`,
      )
    }
  }

  // ── Fact management ──────────────────────────────────────────

  async grantRole(
    userId: string,
    role: string,
    resourceType: OsoResourceType,
    resourceId: string,
  ) {
    if (!this.oso) return
    await this.oso.insert([
      'has_role',
      { type: 'User', id: userId },
      role,
      { type: resourceType, id: resourceId },
    ] as Parameters<typeof this.oso.insert>[0])
  }

  async revokeRole(
    userId: string,
    role: string,
    resourceType: OsoResourceType,
    resourceId: string,
  ) {
    if (!this.oso) return
    await this.oso.delete([
      'has_role',
      { type: 'User', id: userId },
      role,
      { type: resourceType, id: resourceId },
    ] as Parameters<typeof this.oso.delete>[0])
  }

  /**
   * Sync a user's application role to Oso Cloud as a global fact.
   * Called on every login to keep roles current.
   */
  async syncUserRole(userId: string, role: 'STUDENT' | 'ORGANIZER') {
    if (!this.oso) return
    const osoRole = role === 'ORGANIZER' ? 'organizer' : 'student'
    await this.oso.insert([
      'has_role',
      { type: 'User', id: userId },
      osoRole,
      { type: 'Opportunity', id: 'global' },
    ] as Parameters<typeof this.oso.insert>[0])
  }

  async grantOpportunityOwner(userId: string, opportunityId: string) {
    await this.grantRole(userId, 'owner', 'Opportunity', opportunityId)
  }

  async revokeOpportunityOwner(userId: string, opportunityId: string) {
    await this.revokeRole(userId, 'owner', 'Opportunity', opportunityId)
  }
}
