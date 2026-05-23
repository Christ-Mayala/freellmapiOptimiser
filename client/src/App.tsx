import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import KeysPage from '@/pages/KeysPage'
import PlaygroundPage from '@/pages/PlaygroundPage'
import FallbackPage from '@/pages/FallbackPage'
import AnalyticsPage from '@/pages/AnalyticsPage'

const queryClient = new QueryClient()

function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto w-full h-full scroll-smooth">
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 md:py-12 w-full animate-fade-in">
        {children}
      </div>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <div className="flex h-screen w-screen bg-background text-foreground overflow-hidden selection:bg-primary/30">
          <Sidebar />
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
            <Routes>
              <Route path="/" element={<Navigate to="/c/new" replace />} />
              <Route path="/c/:id" element={<PlaygroundPage />} />
              <Route path="/c/new" element={<PlaygroundPage />} />
              <Route path="/keys" element={<PageLayout><KeysPage /></PageLayout>} />
              <Route path="/fallback" element={<PageLayout><FallbackPage /></PageLayout>} />
              <Route path="/analytics" element={<PageLayout><AnalyticsPage /></PageLayout>} />
              <Route path="*" element={<Navigate to="/c/new" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
