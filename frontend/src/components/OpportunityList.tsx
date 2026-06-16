import type { Opportunity } from '../types/opportunity'
import { OpportunityCard } from './OpportunityCard'

interface OpportunityListProps {
  opportunities: Opportunity[]
  emptyMessage?: string
}

export function OpportunityList({
  opportunities,
  emptyMessage = 'No opportunities found.',
}: OpportunityListProps) {
  if (opportunities.length === 0) {
    return (
      <div className="empty-state">
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <ul className="opportunity-list" aria-label="Opportunities">
      {opportunities.map((opp) => (
        <li key={opp.id}>
          <OpportunityCard opportunity={opp} />
        </li>
      ))}
    </ul>
  )
}
