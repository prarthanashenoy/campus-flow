import { Link } from 'react-router-dom'
import { useMyRegistrations } from '../hooks/useRegistrations'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { RequireAuth } from '../auth/RequireAuth'
import type { Registration } from '../types/registration'

const CATEGORY_LABELS: Record<string, string> = {
  INTERNSHIP: 'Internship',
  RESEARCH: 'Research',
  VOLUNTEER: 'Volunteer',
  EVENT: 'Event',
  WORKSHOP: 'Workshop',
  OTHER: 'Other',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function RegistrationCard({ registration }: { registration: Registration }) {
  const { opportunity } = registration
  return (
    <li>
      <Link to={`/opportunities/${opportunity.id}`} className="card-link">
        <article className="opportunity-card">
          <div className="card-header">
            <span
              className={`category-badge category-${opportunity.category.toLowerCase()}`}
            >
              {CATEGORY_LABELS[opportunity.category] ?? opportunity.category}
            </span>
            <span className="registration-date">
              Registered {formatDate(registration.createdAt)}
            </span>
          </div>
          <h2 className="card-title">{opportunity.title}</h2>
          <div className="card-meta">
            <span className="meta-item">📍 {opportunity.location}</span>
            <span className="meta-item">
              📅 {formatDate(opportunity.startDate)}
              {opportunity.endDate && ` – ${formatDate(opportunity.endDate)}`}
            </span>
            {opportunity.organizer && (
              <span className="meta-item">👤 {opportunity.organizer.name}</span>
            )}
          </div>
        </article>
      </Link>
    </li>
  )
}

function MyRegistrationsContent() {
  const { data, isLoading, isError, error, refetch } = useMyRegistrations()

  if (isLoading) return <LoadingState message="Loading your registrations…" />

  if (isError) {
    return (
      <ErrorState
        message={
          error instanceof Error ? error.message : 'Failed to load registrations.'
        }
        onRetry={() => refetch()}
      />
    )
  }

  return (
    <>
      {data && data.length === 0 ? (
        <div className="empty-state">
          <p>You have not registered for any opportunities yet.</p>
          <Link to="/opportunities" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Browse opportunities
          </Link>
        </div>
      ) : (
        <ul className="opportunity-list">
          {data?.map((reg) => (
            <RegistrationCard key={reg.id} registration={reg} />
          ))}
        </ul>
      )}
    </>
  )
}

export function MyRegistrationsPage() {
  return (
    <RequireAuth>
      <main className="page">
        <div className="page-header">
          <h1>My Registrations</h1>
          <p className="page-subtitle">Opportunities you have signed up for.</p>
        </div>
        <MyRegistrationsContent />
      </main>
    </RequireAuth>
  )
}
