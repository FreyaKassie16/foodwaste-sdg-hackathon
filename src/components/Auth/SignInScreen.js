import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FaArrowLeft, FaGoogle } from 'react-icons/fa';

const SignInScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        // Fetch user's role from 'profiles' table
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
            console.warn("Could not fetch user role, navigating to generic dashboard or home.", profileError);
            // For hackathon, maybe navigate to a generic landing page or let MyListings handle role logic
            navigate('/'); // Or a generic dashboard
            return;
        }
        
        // Navigate based on role
        if (profile && profile.role === 'provider') {
          navigate('/provider/listings'); // Provider dashboard
        } else if (profile && profile.role === 'receiver') {
          navigate('/receiver/browse'); // Receiver browse page
        } else {
          navigate('/'); // Fallback / Guest view
        }
      }

    } catch (err) {
      console.error("Sign in error:", err);
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback', // Or specific post-auth page
        }
      });
      if (googleError) throw googleError;
      // Supabase handles redirect
    } catch (err) {
      console.error("Google Sign In error:", err);
      setError(err.message || "Failed to sign in with Google.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-container">
      <div className="app-header" style={{ justifyContent: 'flex-start', marginBottom: '20px', boxShadow: 'none', borderBottom: 'none' }}> 
        <FaArrowLeft onClick={() => navigate(-1)} className="back-button" aria-label="Go back" />
      </div>

      <div className="logo-container" style={{ textAlign: 'center', marginBottom: '20px' }}>
        <img src="/kaintayo-logo.png" alt="KainTayo Logo" style={{ maxWidth: '100px' }}/>
      </div>
      <h2>Sign in</h2>


      <form onSubmit={handleSignIn}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" required disabled={loading} />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input type="password" id="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" required disabled={loading} />
        </div>
        
        <div className="form-group" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
            <div>
              <input type="checkbox" id="rememberMe" name="rememberMe" disabled={loading} style={{ marginRight: '5px' }} />
              <label htmlFor="rememberMe">Remember me</label>
            </div>
            <Link to="/forgot-password" className="auth-link" style={{ marginTop: '0' }}>Forgot password?</Link>
        </div>

        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="btn btn-primary btn-full-width" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p style={{ textAlign: 'center', margin: '20px 0', color: '#777' }}>Or sign in with</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={handleGoogleSignIn} className="btn btn-secondary btn-full-width" disabled={loading}><FaGoogle style={{ marginRight: '8px' }}/> Sign in with Google</button>
      </div>

      <p className="auth-link" style={{ marginTop: '30px' }}>
        No account yet? <Link to="/signup">Create a new account here.</Link>
      </p>
    </div>
  );
};

export default SignInScreen;
