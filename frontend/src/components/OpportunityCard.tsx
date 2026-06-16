import { Link } from 'react-router-dom'
import type { Opportunity } from '../types/opportunity'

const CATEGORY_LABELS: Record<string, string> = {
  INTERNSHIP: 'Internship',
  RESEARCH: 'Research',
  VOLUNTEER: 'Volunteer',
  EVENT: 'Event',
  WORKSHOP: 'Workshop',
  OTHER: 'Other',
}

interface OpportunityCardProps {
  opportunity: Opportunity
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const spotsLeft =
    opportunity.capacity != null
      ? opportunity.capacity - opportunity._count.registrations
      : null

  return (
    <Link to={`/opportunities/${opportunity.id}`} className="card-link">
      <article className="opportunity-card">
        <div className="card-header">
          <span className={`category-badge category-${opportunity.category.toLowerCase()}`}>
            {CATEGORY_LABELS[opportunity.category] ?? opportunity.category}
          </span>
          {spotsLeft !== null && (
            <span className={`spots-badge ${spotsLeft === 0 ? 'spots-full' : ''}`}>
              {spotsLeft === 0 ? 'Full' : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
            </span>
          )}
        </div>

        <h2 className="card-title">{opportunity.title}</h2>

        <p className="card-description">{opportunity.description}</p>

        <div className="card-meta">
          <span className="meta-item">
            <span aria-hidden="true">📍</span> {opportunity.location}
          </span>
          <span className="meta-item">
            <span aria-hidden="true">📅</span> {formatDate(opportunity.startDate)}
            {opportunity.endDate && ` – ${formatDate(opportunity.endDate)}`}
          </span>
          <span className="meta-item">
            <span aria-hidden="true">👤</span> {opportunity.organizer.name}
          </span>
        </div>
      </article>
    </Link>
  )
}
