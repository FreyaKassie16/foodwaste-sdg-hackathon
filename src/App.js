import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { supabase } from "./supabaseClient";

import WelcomeScreen from "./components/Auth/WelcomeScreen";
import SignUpScreen from "./components/Auth/SignUpScreen";
import SignInScreen from "./components/Auth/SignInScreen";
import CreateListingForm from "./components/Provider/CreateListingForm";
import MyListings from "./components/Provider/MyListings";
import BrowseListings from "./components/Receiver/BrowseListings";
import ListingDetail from "./components/Receiver/ListingDetail";

const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/welcome" replace />;
  }
  return children ? children : <Outlet />;
};

function App() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  
  useEffect(() => {
    setLoadingSession(true);
    const getSessionAndProfile = async () => {
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      setSession(currentSession);

      if (currentSession?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, display_name')
          .eq('id', currentSession.user.id)
          .single();
        if (profile) {
          setUserProfile(profile);
        }
        if (profileError) console.error("Error fetching profile on initial load:", profileError);
      }
      setLoadingSession(false);
    };
    getSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        console.log("Auth state changed, new session:", currentSession);
        setSession(currentSession);
        if (currentSession?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, display_name')
            .eq('id', currentSession.user.id)
            .single();
          if (profile) {
            setUserProfile(profile);
            console.log("User profile fetched on auth change:", profile);
          } else {
            setUserProfile(null); 
          }
          if (profileError) {
            console.error("Error fetching profile on auth change:", profileError);
            setUserProfile(null);
          }
        } else {
          setUserProfile(null); 
        }
      }
    );

    return () => {
      if (authListener && typeof authListener.unsubscribe === "function") {
        authListener.unsubscribe();
      } else if (authListener && authListener.subscription && typeof authListener.subscription.unsubscribe === "function") {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const getHomePath = () => {
    if (!session?.user) return "/welcome";
    if (userProfile?.role === 'provider') return "/provider/listings";
    if (userProfile?.role === 'receiver') return "/receiver/browse";
    return "/"; 
  };

  if (loadingSession) {
    return <div>Loading session...</div>; 
  }

  return (
    <Router>
      <Routes>
        <Route path="/welcome" element={<WelcomeScreen />} />
        <Route path="/signup" element={<SignUpScreen />} />
        <Route path="/signin" element={<SignInScreen />} />
        <Route path="/auth/callback" element={<Navigate to={getHomePath()} replace />} />

        <Route element={<ProtectedRoute user={session?.user} />}>
          <Route path="/provider/listings" element={<MyListings />} />
          <Route path="/provider/create-listing" element={<CreateListingForm />} />
          <Route path="/receiver/browse" element={<BrowseListings />} />
          <Route path="/receiver/listings/:listingId" element={<ListingDetail />} />
        </Route>

        <Route path="/" element={<Navigate to={getHomePath()} replace />} />
        <Route path="*" element={<Navigate to={getHomePath()} replace />} /> 
      </Routes>
    </Router>
  );
}

export default App;
