import { useState, useMemo } from 'react'
import { useOpportunities } from '../hooks/useOpportunities'
import { OpportunityList } from '../components/OpportunityList'
import { LoadingState } from '../components/LoadingState'
import { ErrorState } from '../components/ErrorState'
import type { Category } from '../types/opportunity'

const CATEGORIES: { value: Category | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All categories' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'RESEARCH', label: 'Research' },
  { value: 'VOLUNTEER', label: 'Volunteer' },
  { value: 'EVENT', label: 'Event' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'OTHER', label: 'Other' },
]

export function OpportunitiesPage() {
  const { data, isLoading, isError, error, refetch } = useOpportunities()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Category | 'ALL'>('ALL')

  const filtered = useMemo(() => {
    if (!data) return []
    return data.filter((opp) => {
      const matchesCategory = category === 'ALL' || opp.category === category
      const matchesSearch =
        search.trim() === '' ||
        opp.title.toLowerCase().includes(search.toLowerCase()) ||
        opp.description.toLowerCase().includes(search.toLowerCase()) ||
        opp.location.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [data, search, category])

  return (
    <main className="page">
      <div className="page-header">
        <h1>Opportunities</h1>
        <p className="page-subtitle">
          Discover internships, research positions, volunteer roles, and campus events.
        </p>
      </div>

      <div className="filters">
        <input
          type="search"
          className="search-input"
          placeholder="Search opportunities…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search opportunities"
        />
        <div className="category-filters" role="group" aria-label="Filter by category">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`filter-btn ${category === cat.value ? 'active' : ''}`}
              onClick={() => setCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <LoadingState message="Loading opportunities…" />}

      {isError && (
        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : 'Failed to load opportunities.'
          }
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && (
        <>
          {data && data.length > 0 && (
            <p className="results-count">
              Showing {filtered.length} of {data.length} opportunities
            </p>
          )}
          <OpportunityList
            opportunities={filtered}
            emptyMessage={
              search || category !== 'ALL'
                ? 'No opportunities match your filters.'
                : 'No opportunities available yet.'
            }
          />
        </>
      )}
    </main>
  )
}
