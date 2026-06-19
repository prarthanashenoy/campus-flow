import { Link } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'
import type { Opportunity } from '../types/opportunity'
import { useRegister } from '../hooks/useRegistrations'

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
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

interface OpportunityDetailsProps {
  opportunity: Opportunity
}

export function OpportunityDetails({ opportunity }: OpportunityDetailsProps) {
  const { isAuthenticated, loginWithRedirect } = useAuth0()
  const { mutate: register, isPending, isSuccess, isError, error } = useRegister(opportunity.id)

  const spotsLeft =
    opportunity.capacity != null
      ? opportunity.capacity - opportunity._count.registrations
      : null

  const isFull = spotsLeft === 0

  const handleRegister = () => {
    if (!isAuthenticated) {
      void loginWithRedirect({ appState: { returnTo: window.location.pathname } })
      return
    }
    register()
  }

  const alreadyRegistered =
    isError && error instanceof Error && error.message.includes('already registered')

  return (
    <article className="opportunity-details">
      <Link to="/opportunities" className="back-link">
        ← Back to opportunities
      </Link>

      <div className="details-header">
        <span className={`category-badge category-${opportunity.category.toLowerCase()}`}>
          {CATEGORY_LABELS[opportunity.category] ?? opportunity.category}
        </span>
        {spotsLeft !== null && (
          <span className={`spots-badge ${isFull ? 'spots-full' : ''}`}>
            {isFull
              ? 'Full'
              : `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left`}
          </span>
        )}
      </div>

      <h1 className="details-title">{opportunity.title}</h1>

      <div className="details-meta">
        <div className="meta-row">
          <span className="meta-label">Location</span>
          <span>{opportunity.location}</span>
        </div>
        <div className="meta-row">
          <span className="meta-label">Start date</span>
          <span>{formatDate(opportunity.startDate)}</span>
        </div>
        {opportunity.endDate && (
          <div className="meta-row">
            <span className="meta-label">End date</span>
            <span>{formatDate(opportunity.endDate)}</span>
          </div>
        )}
        {opportunity.capacity != null && (
          <div className="meta-row">
            <span className="meta-label">Capacity</span>
            <span>
              {opportunity._count.registrations} / {opportunity.capacity} registered
            </span>
          </div>
        )}
        <div className="meta-row">
          <span className="meta-label">Organizer</span>
          <span>{opportunity.organizer.name}</span>
        </div>
      </div>

      <div className="details-description">
        <h2>About this opportunity</h2>
        <p>{opportunity.description}</p>
      </div>

      <div className="register-section">
        {isSuccess ? (
          <p className="register-success">
            You are registered for this opportunity.{' '}
            <Link to="/my-registrations">View my registrations →</Link>
          </p>
        ) : alreadyRegistered ? (
          <p className="register-already">
            You are already registered.{' '}
            <Link to="/my-registrations">View my registrations →</Link>
          </p>
        ) : (
          <>
            <button
              className="btn btn-primary"
              onClick={handleRegister}
              disabled={isPending || isFull}
            >
              {isPending
                ? 'Registering…'
                : isFull
                  ? 'No spots available'
                  : isAuthenticated
                    ? 'Register'
                    : 'Log in to register'}
            </button>
            {isError && !alreadyRegistered && (
              <p className="register-error">
                {error instanceof Error ? error.message : 'Registration failed.'}
              </p>
            )}
          </>
        )}
      </div>
    </article>
  )
}
