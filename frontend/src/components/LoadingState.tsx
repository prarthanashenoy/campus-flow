export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="loading-state">
      <div className="spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  )
}
