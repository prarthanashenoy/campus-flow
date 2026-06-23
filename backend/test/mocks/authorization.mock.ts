/**
 * Shared no-op mock for AuthorizationService.
 * Used in unit tests that don't exercise Oso Cloud logic.
 */
export const mockAuthorizationService = {
  isEnabled: jest.fn().mockReturnValue(false),
  authorize: jest.fn().mockResolvedValue(undefined),
  grantRole: jest.fn().mockResolvedValue(undefined),
  revokeRole: jest.fn().mockResolvedValue(undefined),
  syncUserRole: jest.fn().mockResolvedValue(undefined),
  grantOpportunityOwner: jest.fn().mockResolvedValue(undefined),
  revokeOpportunityOwner: jest.fn().mockResolvedValue(undefined),
}
