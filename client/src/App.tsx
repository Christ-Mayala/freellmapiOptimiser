import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Sidebar } from '@/components/Sidebar'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { buildApiUrl } from '@/lib/api'

import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import LogoutPage from '@/pages/LogoutPage'
import PlaygroundPage from '@/pages/PlaygroundPage'
import KeysPage from '@/pages/KeysPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import BillingPage from '@/pages/BillingPage'
import ProfilePage from '@/pages/ProfilePage'
import FeedbackPage from '@/pages/FeedbackPage'
import ApiKeysPage from '@/pages/ApiKeysPage'

const queryClient = new QueryClient()

function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  )
}

function AuthenticatedApp() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route index element={<Navigate to="/playground" replace />} />
            <Route path="playground" element={<PlaygroundPage />} />
            <Route path="keys" element={<KeysPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="feedback" element={<FeedbackPage />} />
            <Route path="api-keys" element={<ApiKeysPage />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

function App() {
  const [apiConnected, setApiConnected] = useState(true);
  const [apiChecking, setApiChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function checkApi() {
      try {
        const res = await fetch(buildApiUrl('/health/live'), { method: 'HEAD' });
        if (!cancelled) setApiConnected(res.ok);
      } catch {
        if (!cancelled) setApiConnected(false);
      } finally {
        if (!cancelled) setApiChecking(false);
      }
    }
    const timer = setTimeout(checkApi, 1500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  if (apiChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Connexion au serveur...</p>
        </div>
      </div>
    )
  }

  if (!apiConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Serveur inaccessible</h2>
          <p className="text-sm text-muted-foreground">
            Impossible de se connecter à l'API. Vérifiez que le serveur est en ligne ou que la variable <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">VITE_API_URL</code> est correctement configurée.
          </p>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/logout" element={<LogoutPage />} />
        <Route path="/*" element={
          <ProtectedRoute>
            <AuthenticatedApp />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default function AppProvider() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Toaster />
          <App />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
