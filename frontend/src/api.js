// frontend/src/api.js
import axios from 'axios';
import { auth } from './firebase';

// Ek base instance banao jo humesha hamare Python backend (port 8000) par request bhejega
const api = axios.create({
    baseURL: 'https://scrappy-backend-1s2t.onrender.com', 
});

// Axios Interceptor: Request bhejne se pehle yeh code chalega
api.interceptors.request.use(async (config) => {
    // Current logged-in user ko dhoondo
    const user = auth.currentUser;
    
    if (user) {
        // Agar user hai, toh Firebase se uska fresh token maango
        const token = await user.getIdToken();
        // Uss token ko 'Authorization' header mein laga do (Jaise backend expect kar raha hai)
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;