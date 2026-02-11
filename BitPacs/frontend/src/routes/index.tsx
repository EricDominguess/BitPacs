import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Users } from '@/pages/Users/Users';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/common';

// Lazy loading para melhor performance
const Home = lazy(() => import('../pages/Home/Home').then(m => ({ default: m.Home })));
const Login = lazy(() => import('../pages/Login/Login').then(m => ({ default: m.Login })));
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const UserDashboard = lazy(() => import('../pages/Dashboard/UserDashboard').then(m => ({ default: m.UserDashboard })));
const Studies = lazy(() => import('../pages/Studies/Studies').then(m => ({ default: m.Studies })));
const Viewer = lazy(() => import('../pages/Viewer/Viewer').then(m => ({ default: m.Viewer })));

// Loading Component
function PageLoader() {
  return (
    <div className="min-h-screen bg-tangaroa flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-purple/30 rounded-full" />
          <div className="absolute inset-0 border-4 border-ultra border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-white/60 text-sm">Carregando...</p>
      </div>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<PageLoader />}>
        <PublicOnlyRoute>
          <Home />
        </PublicOnlyRoute>
      </Suspense>
    ),
  },
  {
    path: '/users',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute allowedRoles={['Master', 'Admin']}>
          <Users />
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <PublicOnlyRoute>
          <Login />
        </PublicOnlyRoute>
      </Suspense>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute allowedRoles={['Master', 'Admin']}>
          <Dashboard />
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/user-dashboard',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute allowedRoles={['Medico', 'Enfermeiro']}>
          <UserDashboard />
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/studies',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <Studies />
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/viewer',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <Viewer />
        </ProtectedRoute>
      </Suspense>
    ),
  },
  {
    path: '/viewer/:studyId',
    element: (
      <Suspense fallback={<PageLoader />}>
        <ProtectedRoute>
          <Viewer />
        </ProtectedRoute>
      </Suspense>
    ),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
