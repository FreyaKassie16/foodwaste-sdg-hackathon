import React, { useState, useEffect } from 'react';
import ListingItem from './ListingItem';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaSignOutAlt } from 'react-icons/fa'; 

const MyListings = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false); 

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        console.log("User session found:", session.user);
      } else {
        console.log("No active user session.");
        setError("Please log in to view your listings.");
      }
    };
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          console.log("User logged out or session expired.");
        }
      }
    );

    return () => {
      if (authListener && typeof authListener.unsubscribe === "function") {
        authListener.unsubscribe();
      } else if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };

  }, []);

  useEffect(() => {
    const loadListings = async () => {
      if (!user) {
        setIsLoading(false);
        if (!error) setError("Authentication required to load listings.");
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const { data: fetchedListings, error: dbError } = await supabase
          .from("food_listings")
          .select(`
            *,
            claimer_profile:profiles!claimed_by_id(display_name)
          `)
          .eq("provider_id", user.id)
          .order("created_at", { ascending: false });

        if (dbError) throw dbError;
        setListings(fetchedListings || []);
      } catch (err) {
        console.error("Failed to fetch listings:", err);
        setError(`Failed to load your listings: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadListings();
    } else {
      setListings([]);
      setIsLoading(false);
    }

  }, [user, error]); 

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleSignOut = async () => {
    setIsMenuOpen(false); 
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      navigate('/welcome'); 
    } catch (err) {
      console.error("Error signing out:", err);
      alert("Failed to sign out. Please try again.");
    }
  };

  const handleCreateNewListing = () => {
    console.log("Navigate to Create New Listing page");
    navigate("/provider/create-listing");
  };

  const handleViewEdit = (listingId) => {
    console.log(`View/Edit listing: ${listingId}`);
    alert(`Imagine navigating to edit listing ID: ${listingId}`);
  };

  const handleMarkAsPickedUp = async (listingId) => {
    try {
      const { error: updateError } = await supabase
        .from("food_listings")
        .update({ status: "PickedUp" })
        .eq("provider_id", user.id);

      if (updateError) throw updateError;

      setListings(prevListings =>
        prevListings.map(l => l.id === listingId ? { ...l, status: 'PickedUp' } : l)
      );
      alert(`Listing ${listingId} marked as Picked Up`);
    } catch (err) {
      console.error("Error updating listing status:", err);
      alert(`Failed to mark as picked up: ${err.message}`);
    }
  };

  const handleDelete = async (listingId) => {
    if (window.confirm("Are you sure you want to delete this listing? This cannot be undone.")) {
      try {
        const { error: deleteError } = await supabase
          .from("food_listings")
          .delete()
          .eq("id", listingId)
          .eq("provider_id", user.id);

        if (deleteError) throw deleteError;

        setListings(prevListings => prevListings.filter(l => l.id !== listingId));
        alert(`Listing ${listingId} deleted`);
      } catch (err) {
        console.error("Error deleting listing:", err);
        alert(`Failed to delete listing: ${err.message}`);
      }
    }
  };
  
  const MyListingsHeader = () => (
    <header className="app-header my-listings-header"> 
      <h1 className="title">My Food Listings</h1>
      <div className="menu-container"> 
        <FaBars onClick={toggleMenu} className="menu-icon" />
        {isMenuOpen && (
          <div className="hamburger-menu">
            <ul>
              <li onClick={handleSignOut}>
                <FaSignOutAlt /> Sign Out
              </li>
            </ul>
          </div>
        )}
      </div>
    </header>
  );

  if (!user && !isLoading) {
    return (
      <>
        <MyListingsHeader />
        <div className="container">
            <p style={{color: 'red'}}>{error || "Please log in to view your listings."}</p>
        </div>
      </>
    );
  }

  if (isLoading) {
    return (
      <>
        <MyListingsHeader />
        <div className="container"><p>Loading your listings...</p></div>
      </>
    );
  }

  if (error && !isLoading) {
     return (
      <>
        <MyListingsHeader />
        <div className="container"><p style={{ color: 'red' }}>{error}</p></div>
      </>
    );
  }

  const activeListings = listings.filter(l => l.status === 'Available' || l.status === 'CLAIMED');

  return (
    <>
      <MyListingsHeader />
      <div className="container">
        <button onClick={handleCreateNewListing} className="btn btn-primary btn-full-width" style={{marginBottom: '20px'}}>
          + Create New Listing
        </button>

        <h2>Active Listings</h2>
        {user && listings.length === 0 && !isLoading && !error && (
            <p>You have no active listings. Create one to get started!</p>
        )}
        {user && activeListings.length > 0 ? (
          activeListings.map(listing => (
            <ListingItem
              key={listing.id}
              listing={listing}
              onViewEdit={handleViewEdit}
              onMarkAsPickedUp={handleMarkAsPickedUp}f
              onDelete={handleDelete}
            />
          ))
        ) : (
          !user && !isLoading && <p>Log in to see your listings.</p> 
        )}
      </div>
    </>
  );
};

export default MyListings;
