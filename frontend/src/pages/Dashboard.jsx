// frontend/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import api from '../api';
import './Dashboard.css'; 
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  
  const [targetUrl, setTargetUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState('');
  
  // Yeh Navbar ke Profile Dropdown ke liye hai
  const [showDropdown, setShowDropdown] = useState(false);
  
  // NAYA: Yeh History ke URLs ko Open/Close karne ke liye hai
  const [expandedUrls, setExpandedUrls] = useState({});

  const fetchJobsHistory = async () => {
    try {
      const response = await api.get('/jobs/history');
      setJobs(response.data.jobs);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("Failed to load history.");
    }
  };

  useEffect(() => {
    fetchJobsHistory();
  }, []);

  const handleScrape = async (e) => {
    e.preventDefault();
    if (!targetUrl || !instructions) return;

    setLoadingAction(true);
    setError('');

    try {
      await api.post('/jobs/create', {
        target_url: targetUrl,
        instructions: instructions
      });
      
      setTargetUrl('');
      setInstructions(''); 
      fetchJobsHistory(); 
      
    } catch (err) {
      const errorDetail = err.response?.data?.detail;
      if (typeof errorDetail === 'string') {
        setError(errorDetail);
      } else if (Array.isArray(errorDetail)) {
        setError(`Data Error: ${errorDetail[0].msg}`);
      } else {
        setError(err.message || "Something went wrong during scraping.");
      }
    } finally {
      setLoadingAction(false);
    }
  };

  // NAYA: Specific URL ki history toggle karne ka function
  const toggleHistory = (url) => {
    setExpandedUrls((prev) => ({
      ...prev,
      [url]: !prev[url]
    }));
  };

  // NAYA: Code clean rakhne ke liye grouping logic ko yahan upar nikal liya
  const groupedJobs = jobs.reduce((acc, job) => {
    if (!acc[job.target_url]) acc[job.target_url] = [];
    acc[job.target_url].push(job);
    return acc;
  }, {});

  const userInitial = auth.currentUser?.email ? auth.currentUser.email.charAt(0).toUpperCase() : 'U';

  return (
    <div className="dashboard-container">
      
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">🕸️ WebScrappy</div>

        <div className="profile-section">
          <div className="profile-trigger" onClick={() => setShowDropdown(!showDropdown)}>
            <span className="user-email">{auth.currentUser?.email}</span>
            <div className="avatar">{userInitial}</div>
            <span className="dropdown-icon">▼</span>
          </div>

          {showDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={() => { navigate('/profile'); setShowDropdown(false); }}>
                ✏️ Edit Profile
              </div>
              <div className="dropdown-item" onClick={() => { document.getElementById('history-section').scrollIntoView({ behavior: 'smooth' }); setShowDropdown(false); }}>
                📜 My History
              </div>
              <div className="dropdown-item logout" onClick={() => signOut(auth)}>
                🚪 Logout
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="main-content">
        
        {error && <div className="error-message">{error}</div>}

        {/* SCRAPING FORM */}
        <div className="form-card">
          <h3 className="section-title">New Scraping Job</h3>
          <form onSubmit={handleScrape} className="input-group">
            <input 
              type="url" 
              className="input-field"
              placeholder="Enter website URL (e.g., https://example.com)" 
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              required
            />
            <textarea
              className="input-field"
              placeholder="What should we extract? (e.g., 'Extract product title and price')"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              required
              rows="3"
            />
            <button type="submit" className="btn-primary" disabled={loadingAction}>
              {loadingAction ? 'Scraping Data...' : 'Start Scraping'}
            </button>
          </form>
        </div>

        {/* HISTORY SECTION */}
        <div id="history-section">
          <h3 className="section-title">Your Scraping History</h3>
          {jobs.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', marginTop: '40px' }}>No scraping jobs found. Start by entering a URL above!</p>
          ) : (
            <div className="history-list">
              
              {Object.entries(groupedJobs).map(([url, urlJobs]) => {
                const isExpanded = expandedUrls[url]; // Check karega ki is URL ka dropdown khula hai ya nahi
                const latestJob = urlJobs[0]; // Sabse taazi query
                const olderJobs = urlJobs.slice(1); // Baaki purani queries

                const isRecent = (new Date() - new Date(latestJob.created_at)) < (24 * 60 * 60 * 1000); 

                return (
                  <div key={url} className="job-card">
                    {/* Header */}
                    <div className="job-header">
                      <div className="job-url">🔗 {url}</div>
                      
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span className="status-badge status-completed">
                          {urlJobs.length} {urlJobs.length === 1 ? 'Query' : 'Queries'}
                        </span>
                        
                        {/* Dropdown Button sirf tab aayega jab 1 se zyada query ho */}
                        {urlJobs.length > 1 && (
                          <button 
                            onClick={() => toggleHistory(url)} 
                            className="btn-dropdown"
                          >
                            {isExpanded ? 'Hide History ▲' : 'Show History ▼'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* LATEST QUERY (Humesha visible rahegi) */}
                    <div className="queries-container">
                      <div className="query-item latest-query">
                        <div className="job-date">
                          📅 {new Date(latestJob.created_at).toLocaleString()} 
                          {isRecent &&(<span style={{color: '#10b981', fontWeight: 'bold', fontSize: '12px', marginLeft: '8px'}}>(New)</span>)}
                        </div>
                        <div className="query-question">
                          <strong>Q:</strong> {latestJob.instructions || "Older query (Instructions not saved)"}
                        </div>
                        <details className="data-preview">
                          <summary>View Extracted Data</summary>
                          <pre className="data-code">
                            {JSON.stringify(latestJob.result_data, null, 2)}
                          </pre>
                        </details>
                      </div>

                      {/* OLDER QUERIES (Hide/Show hogi button dabane par) */}
                      {isExpanded && olderJobs.map((job) => (
                        <div key={job.id} className="query-item older-query">
                          <div className="job-date">📅 {new Date(job.created_at).toLocaleString()}</div>
                          <div className="query-question">
                            <strong>Q:</strong> {job.instructions || "Older query (Instructions not saved)"}
                          </div>
                          <details className="data-preview">
                            <summary>View Extracted Data</summary>
                            <pre className="data-code">
                              {JSON.stringify(job.result_data, null, 2)}
                            </pre>
                          </details>
                        </div>
                      ))}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}