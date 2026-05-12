// frontend/src/pages/Auth.jsx
import { useState } from 'react';
import { auth, googleProvider } from '../firebase'; 
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup 
} from 'firebase/auth';
import api from '../api';
import './Auth.css';
// Apni image import karo (path apne hisaab se adjust kar lena)
import skeletonImg from '../assets/skeleton-bg.png'; 

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        await api.post('/users/sync'); 
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      await api.post('/users/sync');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-layout">
      
      {/* LEFT PANEL - Illustration & Tagline */}
      <div className="auth-left-panel">
        <div className="illustration-container">
          <img src={skeletonImg} alt="Skeleton Scraper" className="auth-illustration" />
        </div>
        <div className="auth-taglines">
          <h1>Scrape the web to the bare bones.</h1>
          <p>Scrape smarter, not harder</p>
        </div>
      </div>

      {/* RIGHT PANEL - Form Container */}
      <div className="auth-right-panel">
        <div className="auth-form-container">
          <div className="auth-header-light">
            <h2>{isLogin ? 'Login to your Account' : 'Create an Account'}</h2>
            <p>See what is going on with your business</p>
          </div>

          {error && <div className="auth-error-light">{error}</div>}

          {/* Google Button Top Par */}
          <button 
            onClick={handleGoogleSignIn} 
            disabled={loading}
            className="google-btn-light"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="auth-divider-light">
            <span>or Sign in with Email</span>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSubmit} className="auth-form-light">
            <div className="input-group">
              <label>Email</label>
              <input 
                type="email" 
                placeholder="mail@abc.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            
            <div className="input-group">
              <label>Password</label>
              <input 
                type="password" 
                placeholder="••••••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>

            {/* Remember me & Forgot Password Row */}
            {isLogin && (
              <div className="form-options">
                <label className="remember-me">
                  <input type="checkbox" /> Remember Me
                </label>
                <a href="#" className="forgot-password">Forgot Password?</a>
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Sign Up')}
            </button>
          </form>

          <p className="auth-footer-text">
            {isLogin ? "Not Registered Yet?" : "Already have an account?"}{' '}
            <a href="#" onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); }}>
              {isLogin ? "Create an account" : "Login"}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}