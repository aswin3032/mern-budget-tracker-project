import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Insights from './pages/Insights';
import Nav from './components/Nav';
import ToastProvider from './components/ToastProvider';

const FullScreenLoader = () => (
  <div className="flex justify-center items-center h-screen bg-secondary">
    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
        <ToastProvider />
      </BrowserRouter>
    </AuthProvider>
  );
}

const AppContent = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // --- START OF THE FINAL, CORRECTED LAYOUT ---
  return (
    <div className="h-screen-dynamic bg-secondary flex flex-col md:flex-row">
      
      {/* Sidebar for Desktop */}
      <div className="hidden md:block">
        <Nav />
      </div>

      {/* Main scrollable content area */}
      {/* This will now correctly fill the space above the mobile nav */}
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Bottom Navigation for Mobile */}
      {/* This is now a simple flex item at the end of the vertical stack */}
      <div className="md:hidden">
        <Nav />
      </div>
    </div>
    // --- END OF THE FINAL, CORRECTED LAYOUT ---
  );
};

export default App;