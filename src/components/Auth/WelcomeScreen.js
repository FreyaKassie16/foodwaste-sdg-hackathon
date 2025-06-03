import React from "react";
import { useNavigate } from "react-router-dom";
import "./AuthFormElements.css"

const WelcomeScreen = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-screen">
      <div className="logo-container">
        <img src="/kaintayo-logo.png" alt="KainTayo Logo" />
      </div>
      <h1>KainTayo</h1>
      <p>Connecting communities, reducing food waste.</p>
      
      <div className="action-buttons">
        <button onClick={() => navigate('/signup')} className="btn btn-primary">
          Sign Up
        </button>
        <button onClick={() => navigate('/signin')} className="btn btn-secondary">
          Sign In
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;
