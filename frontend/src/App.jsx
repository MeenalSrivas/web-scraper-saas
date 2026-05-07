// frontend/src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard'; // Dashboard ko import kiya

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Firebase listener: Check if user is logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); 
    });
    return unsubscribe;
  }, []);

  // Show loading while checking auth status
  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;

  return (
    <BrowserRouter>
      <Routes>
        {/* Route for Login/Signup Page */}
        <Route 
          path="/" 
          element={!user ? <Auth /> : <Navigate to="/dashboard" />} 
        />
        
        {/* Route for Dashboard Page */}
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;