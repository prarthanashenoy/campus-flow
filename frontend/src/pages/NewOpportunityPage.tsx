import { useNavigate } from 'react-router-dom'
import { RequireAuth } from '../auth/RequireAuth'
import { OpportunityForm } from '../components/OpportunityForm'
import { useCreateOpportunity } from '../hooks/useOrganizerOpportunities'
import type { CreateOpportunityDto } from '../hooks/useOrganizerOpportunities'

function NewOpportunityContent() {
  const navigate = useNavigate()
  const { mutate: create, isPending, isError, error } = useCreateOpportunity()

  const handleSubmit = (values: CreateOpportunityDto) => {
    create(values, {
      onSuccess: (opp) => {
        navigate(`/organizer/opportunities/${opp.id}/edit`)
      },
    })
  }

  return (
    <main className="page">
      <div className="page-header">
        <h1>New Opportunity</h1>
        <p className="page-subtitle">Fill in the details below to create a new opportunity.</p>
      </div>
      <OpportunityForm
        onSubmit={handleSubmit}
        isPending={isPending}
        submitLabel="Create opportunity"
        error={
          isError
            ? error instanceof Error
              ? error.message
              : 'Failed to create opportunity.'
            : null
        }
      />
    </main>
  )
}

export function NewOpportunityPage() {
  return (
    <RequireAuth>
      <NewOpportunityContent />
    </RequireAuth>
  )
}
