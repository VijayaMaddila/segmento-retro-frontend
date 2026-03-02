import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './magicLogin.css';

function MagicLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      console.error('No token provided in URL');
      setStatus('error');
      return;
    }

    // Call backend magic login endpoint
    fetch(`http://localhost:8080/api/auth/magic-login?token=${token}`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Invalid or expired token');
        }
        return response.json();
      })
      .then((data) => {
        console.log('Magic login successful:', data);
        
        // Store the JWT token and user info
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        if (data.userId) {
          localStorage.setItem('userId', data.userId);
        }
        if (data.name) {
          localStorage.setItem('name', data.name);
        }
        if (data.role) {
          localStorage.setItem('role', data.role);
        }
        
        setStatus('success');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/retroDashboard');
        }, 1500);
      })
      .catch((error) => {
        console.error('Magic login failed:', error);
        setStatus('error');
      });
  }, [searchParams, navigate]);

  return (
    <div className="magic-login-container">
      <div className="magic-login-card">
        {status === 'verifying' && (
          <>
            <div className="spinner"></div>
            <h2 className="magic-login-title">🔐 Verifying your link...</h2>
            <p className="magic-login-text">Please wait while we authenticate you.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="success-icon">✅</div>
            <h2 className="magic-login-title">Success!</h2>
            <p className="magic-login-text">Redirecting to your dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="error-icon">❌</div>
            <h2 className="magic-login-title">Invalid Link</h2>
            <p className="magic-login-text">
              This link is invalid or has expired. Please contact your admin for a new invitation.
            </p>
            <button 
              className="magic-login-btn"
              onClick={() => navigate('/login')}
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default MagicLogin;
