import { useParams, useNavigate, Navigate, Link, useLocation } from 'react-router-dom'
import { RequireAuth } from '../auth/RequireAuth'
import { OpportunityForm } from '../components/OpportunityForm'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import { useOpportunity } from '../hooks/useOpportunities'
import { useUpdateOpportunity } from '../hooks/useOrganizerOpportunities'
import { useOpportunityRegistrations } from '../hooks/useOrganizerOpportunities'
import type { CreateOpportunityDto } from '../hooks/useOrganizerOpportunities'

function EditOpportunityContent({ id }: { id: string }) {
  const { data: opp, isLoading, isError, error } = useOpportunity(id)
  const { mutate: update, isPending, isError: saveError, error: saveErrorObj } =
    useUpdateOpportunity(id)
  const navigate = useNavigate()

  if (isLoading) return <LoadingState message="Loading opportunity…" />
  if (isError || !opp) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Failed to load opportunity.'}
      />
    )
  }

  const handleSubmit = (values: CreateOpportunityDto) => {
    update(values, {
      onSuccess: () => navigate('/organizer/opportunities'),
    })
  }

  return (
    <main className="page">
      <Link to="/organizer/opportunities" className="back-link">
        ← Back to my opportunities
      </Link>
      <div className="page-header" style={{ marginTop: '1rem' }}>
        <h1>Edit Opportunity</h1>
        <p className="page-subtitle">{opp.title}</p>
      </div>
      <OpportunityForm
        initialValues={{
          title: opp.title,
          description: opp.description,
          category: opp.category,
          location: opp.location,
          startDate: opp.startDate,
          endDate: opp.endDate,
          capacity: opp.capacity,
        }}
        onSubmit={handleSubmit}
        isPending={isPending}
        submitLabel="Save changes"
        error={
          saveError
            ? saveErrorObj instanceof Error
              ? saveErrorObj.message
              : 'Failed to save.'
            : null
        }
      />
    </main>
  )
}

function RegistrationsContent({ id }: { id: string }) {
  const { data, isLoading, isError, error } = useOpportunityRegistrations(id)

  if (isLoading) return <LoadingState message="Loading registrations…" />
  if (isError) {
    return (
      <ErrorState
        message={error instanceof Error ? error.message : 'Failed to load registrations.'}
      />
    )
  }

  return (
    <main className="page">
      <Link to="/organizer/opportunities" className="back-link">
        ← Back to my opportunities
      </Link>
      <div className="page-header" style={{ marginTop: '1rem' }}>
        <h1>Registrations</h1>
        <p className="page-subtitle">{data?.length ?? 0} student{data?.length !== 1 ? 's' : ''} registered</p>
      </div>
      {data && data.length === 0 ? (
        <div className="empty-state">
          <p>No students have registered yet.</p>
        </div>
      ) : (
        <ul className="registrations-list">
          {data?.map((reg) => (
            <li key={reg.id} className="registration-item">
              <span className="reg-name">{reg.user.name}</span>
              <span className="reg-email">{reg.user.email}</span>
              <span className="reg-date">
                {new Date(reg.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export function EditOpportunityPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  if (!id) return <Navigate to="/organizer/opportunities" replace />

  const isRegistrationsView = location.pathname.endsWith('/registrations')

  return (
    <RequireAuth>
      {isRegistrationsView
        ? <RegistrationsContent id={id} />
        : <EditOpportunityContent id={id} />
      }
    </RequireAuth>
  )
}
