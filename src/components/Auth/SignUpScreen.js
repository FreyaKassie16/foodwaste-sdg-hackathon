import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { FaArrowLeft, FaGoogle } from 'react-icons/fa';

const SignUpScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("receiver");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;    
    }
    if (password.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role,
          }
        }
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([{ id: data.user.id, email: data.user.email, role: role, created_at: new Date() }]);
        
        if (profileError) {
          console.error("Error creating profile:", profileError);
          setError(`Account created but profile setup failed: ${profileError.message}. Please contact support.`);
        } else {
          setMessage("Sign up successful! Please check your email to verify your account before loggin in.");
        }
      } else if (data.session === null && data.user === null) {
        setMessage("Sign up successful! Please check your email to verify your account.");
      }
    } catch (err) {
      console.error("Sign up error:", err);
      setError(err.message || "Failed to sign up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    console.log("Role being sent to Google OAuth:", role);
    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + '/auth/callback',
          data: {
            role: role,
          }
        }
      });
      if (googleError) throw googleError;
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
      <h2>Sign up</h2>

      <form onSubmit={handleSignUp}>
        <div className="form-group">
            <label htmlFor="role">I am a:</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)} className="input-field" disabled={loading}>
                <option value="receiver">Food Receiver (Charity, Individual)</option>
                <option value="provider">Food Provider (Business)</option>
            </select>
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" required disabled={loading} />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password (min. 6 characters)</label>
          <input type="password" id="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" required disabled={loading} />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input type="password" id="confirmPassword" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input-field" required disabled={loading} />
        </div>
        
        {error && <p className="error-message">{error}</p>}
        {message && <p className="success-message">{message}</p>}

        <button type="submit" className="btn btn-primary btn-full-width" disabled={loading}>
          {loading ? 'Signing up...' : 'Sign up'}
        </button>
      </form>

      <p style={{ textAlign: 'center', margin: '20px 0', color: '#777' }}>Or</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={handleGoogleSignIn} className="btn btn-secondary btn-full-width" disabled={loading}><FaGoogle style={{ marginRight: '8px' }}/> Sign up with Google</button>
      </div>

      <p className="auth-link" style={{ marginTop: '30px' }}>
        Have an account already? <Link to="/signin">Sign in</Link>
      </p>
    </div>
  );
};

export default SignUpScreen;
