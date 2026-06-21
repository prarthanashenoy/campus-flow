import { useState } from 'react'
import type { CreateOpportunityDto } from '../hooks/useOrganizerOpportunities'

const CATEGORIES = [
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'RESEARCH', label: 'Research' },
  { value: 'VOLUNTEER', label: 'Volunteer' },
  { value: 'EVENT', label: 'Event' },
  { value: 'WORKSHOP', label: 'Workshop' },
  { value: 'OTHER', label: 'Other' },
]

interface OpportunityFormProps {
  initialValues?: Partial<CreateOpportunityDto>
  onSubmit: (values: CreateOpportunityDto) => void
  isPending: boolean
  submitLabel: string
  error?: string | null
}

function toInputDate(isoString?: string | null): string {
  if (!isoString) return ''
  return isoString.slice(0, 10)
}

export function OpportunityForm({
  initialValues,
  onSubmit,
  isPending,
  submitLabel,
  error,
}: OpportunityFormProps) {
  const [values, setValues] = useState<CreateOpportunityDto>({
    title: initialValues?.title ?? '',
    description: initialValues?.description ?? '',
    category: initialValues?.category ?? 'EVENT',
    location: initialValues?.location ?? '',
    startDate: toInputDate(initialValues?.startDate),
    endDate: toInputDate(initialValues?.endDate),
    capacity: initialValues?.capacity ?? null,
  })

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CreateOpportunityDto, string>>>({})

  const set = (field: keyof CreateOpportunityDto, value: unknown) => {
    setValues((v) => ({ ...v, [field]: value }))
    setFieldErrors((e) => ({ ...e, [field]: undefined }))
  }

  const validate = (): boolean => {
    const errors: Partial<Record<keyof CreateOpportunityDto, string>> = {}
    if (!values.title.trim()) errors.title = 'Title is required'
    if (!values.description.trim()) errors.description = 'Description is required'
    if (!values.location.trim()) errors.location = 'Location is required'
    if (!values.startDate) errors.startDate = 'Start date is required'
    if (values.endDate && values.startDate && values.endDate < values.startDate) {
      errors.endDate = 'End date must be after start date'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      ...values,
      endDate: values.endDate || null,
    })
  }

  return (
    <form className="opportunity-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          placeholder="e.g. Machine Learning Research Assistant"
          className={fieldErrors.title ? 'input-error' : ''}
        />
        {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
      </div>

      <div className="form-field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          rows={4}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Describe the opportunity, requirements, and what participants will gain…"
          className={fieldErrors.description ? 'input-error' : ''}
        />
        {fieldErrors.description && (
          <span className="field-error">{fieldErrors.description}</span>
        )}
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={values.category}
            onChange={(e) => set('category', e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="location">Location</label>
          <input
            id="location"
            type="text"
            value={values.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="e.g. Building C, Room 204 or Remote"
            className={fieldErrors.location ? 'input-error' : ''}
          />
          {fieldErrors.location && (
            <span className="field-error">{fieldErrors.location}</span>
          )}
        </div>
      </div>

      <div className="form-row">
        <div className="form-field">
          <label htmlFor="startDate">Start date</label>
          <input
            id="startDate"
            type="date"
            value={values.startDate}
            onChange={(e) => set('startDate', e.target.value)}
            className={fieldErrors.startDate ? 'input-error' : ''}
          />
          {fieldErrors.startDate && (
            <span className="field-error">{fieldErrors.startDate}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="endDate">End date <span className="label-optional">(optional)</span></label>
          <input
            id="endDate"
            type="date"
            value={values.endDate ?? ''}
            onChange={(e) => set('endDate', e.target.value || null)}
            className={fieldErrors.endDate ? 'input-error' : ''}
          />
          {fieldErrors.endDate && (
            <span className="field-error">{fieldErrors.endDate}</span>
          )}
        </div>

        <div className="form-field">
          <label htmlFor="capacity">Capacity <span className="label-optional">(optional)</span></label>
          <input
            id="capacity"
            type="number"
            min={1}
            value={values.capacity ?? ''}
            onChange={(e) =>
              set('capacity', e.target.value ? Number(e.target.value) : null)
            }
            placeholder="Unlimited"
          />
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
