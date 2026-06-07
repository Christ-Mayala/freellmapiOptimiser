import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { buildApiUrl } from '@/lib/api'
import KeysPage from '@/pages/KeysPage'
import PlaygroundPage from '@/pages/PlaygroundPage'
import FallbackPage from '@/pages/FallbackPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ProfilePage from '@/pages/ProfilePage'
import PresentationPage from '@/pages/PresentationPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'

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

function AuthenticatedApp() {
  return (
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
          <Route path="/profile" element={<PageLayout><ProfilePage /></PageLayout>} />
          <Route path="/profile/presentation" element={<PageLayout><PresentationPage /></PageLayout>} />
          <Route path="*" element={<Navigate to="/c/new" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  const [apiConnected, setApiConnected] = useState(true);
  const [apiChecking, setApiChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const checkApi = async () => {
      try {
        const res = await fetch(buildApiUrl('/health/live'), { method: 'HEAD' });
        if (!cancelled) setApiConnected(res.ok);
      } catch {
        if (!cancelled) setApiConnected(false);
      }
      if (!cancelled) setApiChecking(false);
    };
    const timer = setTimeout(checkApi, 1500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  const { loading } = useAuth()

  if (apiChecking && !apiConnected) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Connexion au serveur...</p>
        </div>
      </div>
    )
  }

  if (!apiChecking && !apiConnected) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background p-4">
        <div className="max-w-md text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 className="text-base font-semibold">Serveur inaccessible</h2>
          <p className="text-sm text-muted-foreground">
            Impossible de se connecter à l'API. Vérifiez que le serveur est en ligne ou que la variable <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">VITE_API_URL</code> est correctement configurée.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-primary hover:underline mt-2 inline-block"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        <div className="flex gap-1.5 items-center h-10 px-1">
          <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="size-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AuthenticatedApp />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
