export type Category =
  | 'INTERNSHIP'
  | 'RESEARCH'
  | 'VOLUNTEER'
  | 'EVENT'
  | 'WORKSHOP'
  | 'OTHER'

export interface Organizer {
  id: string
  name: string
  email: string
}

export interface Opportunity {
  id: string
  title: string
  description: string
  category: Category
  location: string
  startDate: string
  endDate: string | null
  capacity: number | null
  isPublished: boolean
  createdAt: string
  updatedAt: string
  organizerId: string
  organizer: Organizer
  _count: {
    registrations: number
  }
}
