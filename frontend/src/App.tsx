import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './auth/AuthProvider'
import { Navbar } from './components/Navbar'
import { OpportunitiesPage } from './pages/OpportunitiesPage'
import { OpportunityDetailPage } from './pages/OpportunityDetailPage'
import { MyRegistrationsPage } from './pages/MyRegistrationsPage'
import { OrganizerOpportunitiesPage } from './pages/OrganizerOpportunitiesPage'
import { NewOpportunityPage } from './pages/NewOpportunityPage'
import { EditOpportunityPage } from './pages/EditOpportunityPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to="/opportunities" replace />} />
            <Route path="/opportunities" element={<OpportunitiesPage />} />
            <Route path="/opportunities/:id" element={<OpportunityDetailPage />} />
            <Route path="/my-registrations" element={<MyRegistrationsPage />} />
            <Route path="/organizer/opportunities" element={<OrganizerOpportunitiesPage />} />
            <Route path="/organizer/opportunities/new" element={<NewOpportunityPage />} />
            <Route path="/organizer/opportunities/:id/edit" element={<EditOpportunityPage />} />
            <Route path="/organizer/opportunities/:id/registrations" element={<EditOpportunityPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
