import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RequireAuth } from '../auth/RequireAuth'
import { useMyOpportunities, useDeleteOpportunity } from '../hooks/useOrganizerOpportunities'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import type { Opportunity } from '../types/opportunity'

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

function OrganizerOpportunityRow({ opportunity }: { opportunity: Opportunity }) {
  const { mutate: deleteOpp, isPending } = useDeleteOpportunity()
  const [confirming, setConfirming] = useState(false)

  const handleDelete = () => {
    if (!confirming) { setConfirming(true); return }
    deleteOpp(opportunity.id)
  }

  return (
    <li className="organizer-row">
      <div className="organizer-row-info">
        <div className="organizer-row-header">
          <span className={`category-badge category-${opportunity.category.toLowerCase()}`}>
            {CATEGORY_LABELS[opportunity.category] ?? opportunity.category}
          </span>
          {!opportunity.isPublished && (
            <span className="draft-badge">Draft</span>
          )}
        </div>
        <h3 className="organizer-row-title">{opportunity.title}</h3>
        <p className="organizer-row-meta">
          {opportunity.location} · {formatDate(opportunity.startDate)}
          {' · '}
          <strong>{opportunity._count.registrations}</strong> registration
          {opportunity._count.registrations !== 1 ? 's' : ''}
          {opportunity.capacity != null && ` / ${opportunity.capacity}`}
        </p>
      </div>
      <div className="organizer-row-actions">
        <Link
          to={`/organizer/opportunities/${opportunity.id}/registrations`}
          className="btn btn-secondary btn-sm"
        >
          Registrations
        </Link>
        <Link
          to={`/organizer/opportunities/${opportunity.id}/edit`}
          className="btn btn-secondary btn-sm"
        >
          Edit
        </Link>
        <button
          className={`btn btn-sm ${confirming ? 'btn-danger' : 'btn-secondary'}`}
          onClick={handleDelete}
          disabled={isPending}
        >
          {confirming ? 'Confirm delete' : 'Delete'}
        </button>
        {confirming && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setConfirming(false)}
          >
            Cancel
          </button>
        )}
      </div>
    </li>
  )
}

function OrganizerOpportunitiesContent() {
  const { data, isLoading, isError, error, refetch } = useMyOpportunities()

  if (isLoading) return <LoadingState message="Loading your opportunities…" />
  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Failed to load.'}
        onRetry={() => refetch()}
      />
    )
  }

  return data && data.length === 0 ? (
    <div className="empty-state">
      <p>You have not created any opportunities yet.</p>
      <Link to="/organizer/opportunities/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
        Create your first opportunity
      </Link>
    </div>
  ) : (
    <ul className="organizer-list">
      {data?.map((opp) => (
        <OrganizerOpportunityRow key={opp.id} opportunity={opp} />
      ))}
    </ul>
  )
}

export function OrganizerOpportunitiesPage() {
  return (
    <RequireAuth>
      <main className="page">
        <div className="page-header page-header-actions">
          <div>
            <h1>My Opportunities</h1>
            <p className="page-subtitle">Manage the opportunities you organise.</p>
          </div>
          <Link to="/organizer/opportunities/new" className="btn btn-primary">
            + New opportunity
          </Link>
        </div>
        <OrganizerOpportunitiesContent />
      </main>
    </RequireAuth>
  )
}
