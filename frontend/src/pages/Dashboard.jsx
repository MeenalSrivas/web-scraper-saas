// frontend/src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import api from '../api';

export default function Dashboard() {
  const [targetUrl, setTargetUrl] = useState('');
  const [instructions, setInstructions] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch History: Component load hote hi backend se purani jobs mangwao
  const fetchJobsHistory = async () => {
    try {
      const response = await api.get('/jobs/history');
      setJobs(response.data.jobs);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError("Failed to load history.");
    }
  };

  // Jab bhi Dashboard khulega, fetchJobsHistory ek baar chalega
  useEffect(() => {
    fetchJobsHistory();
  }, []);

  // 2. Create Job: Naya URL scrape karne ke liye backend ko bhejo
  const handleScrape = async (e) => {
    e.preventDefault();
    if (!targetUrl || !instructions) return; // Dono fields zaroori hain

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
      // Agar error string hai toh direct dikhao
      if (typeof errorDetail === 'string') {
        setError(errorDetail);
      } 
      // Agar FastAPI ne Array bheja hai (422 validation error)
      else if (Array.isArray(errorDetail)) {
        setError(`Data Error: ${errorDetail[0].msg} (Check: ${errorDetail[0].loc.join(', ')})`);
      } 
      // Koi aur unexpected error
      else {
        setError(err.message || "Something went wrong during scraping.");
      }
    } finally {
      setLoadingAction(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2>Dashboard</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span>{auth.currentUser?.email}</span>
          <button 
            onClick={() => signOut(auth)} 
            style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#ff4d4f', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Logout
          </button>
        </div>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* SCRAPING FORM SECTION */}
      <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '30px' }}>
        <h3>New Scraping Job</h3>
        <form onSubmit={handleScrape} style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <input 
            type="url" 
            placeholder="Enter website URL (e.g., https://example.com)" 
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            required
            style={{ flex: 1, padding: '10px' }}
          />
          <textarea
            placeholder="What should we extract? (e.g., 'Get all h2 headings', 'Extract product title and price')"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            required
            rows="3"
            style={{ padding: '10px', resize: 'vertical' }}
          />
          <button 
            type="submit" 
            disabled={loadingAction}
            style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#1890ff', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            {loadingAction ? 'Scraping...' : 'Start Scraping'}
          </button>
        </form>
      </div>

      {/* JOBS HISTORY SECTION */}
      <div>
        <h3>Your Scraping History</h3>
        {jobs.length === 0 ? (
          <p style={{ color: 'gray' }}>No scraping jobs found. Start by entering a URL above!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
            {jobs.map((job) => (
              <div key={job.id} style={{ padding: '15px', border: '1px solid #eee', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <strong>{job.target_url}</strong>
                  <span style={{ color: job.status === 'completed' ? 'green' : 'orange' }}>
                    {job.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                  {new Date(job.created_at).toLocaleString()}
                </div>
                
                {/* Yahan par hum scraped data ka chhota sa preview dikha rahe hain */}
                <details style={{ cursor: 'pointer', backgroundColor: '#fff', padding: '10px', border: '1px solid #ddd' }}>
                  <summary>View Data Preview</summary>
                  <pre style={{ overflowX: 'auto', fontSize: '12px', marginTop: '10px' }}>
                    {JSON.stringify(job.result_data, null, 2)}
                  </pre>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}