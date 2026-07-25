import { useState } from 'react';
import apiClient from '../api/axios';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // State for user feedback
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        const response = await apiClient.post('/auth/login', { 
          email, 
          password 
        });
        
        // Save the JWT token to the browser's local storage
        localStorage.setItem('token', response.data.token);
        
        // Redirect to the dashboard (forces App.jsx to re-read the token)
        window.location.href = '/'; 
        
      } else {
        // --- REGISTER LOGIC ---
        await apiClient.post('/auth/register', { 
          email, 
          password 
        });
        
        // Switch back to login mode and clear password
        setMessage('Registration successful! Please log in.');
        setIsLogin(true);
        setPassword(''); 
      }
    } catch (err) {
      // Capture the exact error message from our Flask backend
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>{isLogin ? 'Welcome Back' : 'Create an Account'}</h2>
        
        {/* Success and Error Messages */}
        {error && <div style={styles.error}>{error}</div>}
        {message && <div style={styles.success}>{message}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="you@example.com"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" style={styles.button}>
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        {/* Toggle between Login and Register */}
        <p style={styles.toggleText}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            style={styles.toggleLink} 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setMessage('');
            }}
          >
            {isLogin ? 'Register here' : 'Log in here'}
          </span>
        </p>
      </div>
    </div>
  );
}

// Basic inline styles to keep things looking clean without external CSS files
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f3f4f6',
    fontFamily: 'sans-serif'
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px'
  },
  title: {
    textAlign: 'center',
    marginBottom: '24px',
    color: '#1f2937'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#4b5563'
  },
  input: {
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #d1d5db',
    fontSize: '16px'
  },
  button: {
    padding: '12px',
    backgroundColor: '#0061FE', // Dropbox Blue
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '8px'
  },
  toggleText: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '14px',
    color: '#4b5563'
  },
  toggleLink: {
    color: '#0061FE',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '16px',
    fontSize: '14px',
    textAlign: 'center'
  },
  success: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '16px',
    fontSize: '14px',
    textAlign: 'center'
  }
};