import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

function App() {
  // Check if the user has a JWT token in localStorage
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <Routes>
      {/* If not logged in, go to Login. If logged in, go to Dashboard */}
      <Route 
        path="/" 
        element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
      />
      
      <Route 
        path="/login" 
        element={!isAuthenticated ? <Login /> : <Navigate to="/" />} 
      />
    </Routes>
  );
}

export default App;