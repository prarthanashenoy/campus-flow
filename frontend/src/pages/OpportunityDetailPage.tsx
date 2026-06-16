import { useParams, Navigate } from 'react-router-dom'
import { useOpportunity } from '../hooks/useOpportunities'
import { OpportunityDetails } from '../components/OpportunityDetails'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'

export function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return <Navigate to="/opportunities" replace />
  }

  return <OpportunityDetailContent id={id} />
}

function OpportunityDetailContent({ id }: { id: string }) {
  const { data, isLoading, isError, error, refetch } = useOpportunity(id)

  if (isLoading) {
    return (
      <main className="page">
        <LoadingState message="Loading opportunity…" />
      </main>
    )
  }

  if (isError) {
    return (
      <main className="page">
        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : 'Failed to load opportunity.'
          }
          onRetry={() => refetch()}
        />
      </main>
    )
  }

  if (!data) {
    return null
  }

  return (
    <main className="page">
      <OpportunityDetails opportunity={data} />
    </main>
  )
}
