// frontend/src/pages/Profile.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    username: '',
    gender: 'other',
    bio: '',
    role: 'Student'
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    // Purana data load karne ke liye
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/me');
        setProfile(res.data);
      } catch (err) { console.error(err); }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/users/update', profile);
      setMsg('✅ Profile updated successfully!');
      setTimeout(() => navigate('/dashboard'), 2000); // 2 sec baad wapas dashboard
    } catch (err) {
      setMsg('❌ Failed to update profile');
    } finally { setLoading(false); }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>← Back</button>
        <h2>Edit Profile</h2>
        {msg && <p className="status-msg">{msg}</p>}

        <form onSubmit={handleUpdate} className="profile-form">
          <label>Username</label>
          <input 
            type="text" 
            value={profile.username} 
            onChange={(e) => setProfile({...profile, username: e.target.value})} 
            placeholder="Enter username" required
          />

          <label>Gender</label>
          <div className="radio-group">
            <label><input type="radio" name="gender" value="male" checked={profile.gender === 'male'} onChange={(e) => setProfile({...profile, gender: e.target.value})} /> Male</label>
            <label><input type="radio" name="gender" value="female" checked={profile.gender === 'female'} onChange={(e) => setProfile({...profile, gender: e.target.value})} /> Female</label>
            <label><input type="radio" name="gender" value="other" checked={profile.gender === 'other'} onChange={(e) => setProfile({...profile, gender: e.target.value})} /> Other</label>
          </div>

          <label>Your Role</label>
          <select value={profile.role} onChange={(e) => setProfile({...profile, role: e.target.value})}>
            <option value="Student">Student</option>
            <option value="Researcher">Researcher</option>
            <option value="Developer">Developer</option>
            <option value="Data Analyst">Data Analyst</option>
          </select>

          <label>Bio (Short description)</label>
          <textarea 
            value={profile.bio} 
            onChange={(e) => setProfile({...profile, bio: e.target.value})} 
            placeholder="Tell us about yourself..."
          />

          <button type="submit" disabled={loading} className="save-btn">
            {loading ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}