// frontend/src/pages/Auth.jsx
import { useState } from 'react';
import { auth, googleProvider } from '../firebase'; // googleProvider import kiya
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup // Popup import kiya
} from 'firebase/auth';
import api from '../api';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Email/Password wala function
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        await api.post('/users/sync'); // DB mein profile banao
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // NAYA: Google Sign-In Function
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      // Yeh ek Google login popup khholega
      await signInWithPopup(auth, googleProvider);
      
      // Login/Signup hone ke baad apne backend ko batao profile sync karne ke liye
      await api.post('/users/sync');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h2>{isLogin ? 'Login to Scraper' : 'Create an Account'}</h2>
      
      {error && <p style={{ color: 'red', fontSize: '14px' }}>{error}</p>}
      
      {/* Email/Password Form */}
      <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          style={{ padding: '10px' }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={{ padding: '10px' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '10px', cursor: 'pointer', backgroundColor: '#333', color: 'white', border: 'none' }}>
          {loading ? 'Please wait...' : (isLogin ? 'Login with Email' : 'Sign Up with Email')}
        </button>
      </form>

      <div style={{ textAlign: 'center', margin: '20px 0', color: 'gray' }}>OR</div>

      {/* NAYA: Google Auth Button */}
      <button 
        onClick={handleGoogleSignIn} 
        disabled={loading}
        style={{ 
          width: '100%', 
          padding: '10px', 
          cursor: 'pointer', 
          backgroundColor: '#4285F4', 
          color: 'white', 
          border: 'none',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" style={{width: '18px', backgroundColor: 'white', borderRadius: '50%', padding: '2px'}} />
        Continue with Google
      </button>

      <p style={{ marginTop: '20px', cursor: 'pointer', color: 'blue', textAlign: 'center' }} onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
      </p>
    </div>
  );
}