import { Category } from './opportunity'

export interface RegistrationOpportunity {
  id: string
  title: string
  category: Category
  location: string
  startDate: string
  endDate: string | null
  organizer?: { id: string; name: string }
}

export interface Registration {
  id: string
  userId: string
  opportunityId: string
  createdAt: string
  opportunity: RegistrationOpportunity
}
