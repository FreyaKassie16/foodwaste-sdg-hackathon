import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { FaMapMarkerAlt, FaBars, FaSignOutAlt } from 'react-icons/fa'; 
import Header from '../common/Header'; 
import ListingCard from './ListingCard'; 

const BrowseListings = () => {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationQuery, setLocationQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const navigate = useNavigate();

  useEffect(() => {
    const loadListings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let query = supabase
          .from('food_listings') 
          .select(`
            id,
            food_name,
            quantity,         
            pickup_address,
            pickup_window_start, 
            pickup_window_end,   
            status,
            category,
            provider_id,
            created_at,
            description,       
            allergens,
            profiles!provider_id ( display_name )
          `)
          .eq('status', 'Available') 
          .gt('pickup_window_end', new Date().toISOString()); 

        if (locationQuery) {
          query = query.ilike('pickup_address', `%${locationQuery}%`);
        }

        query = query.order('created_at', { ascending: false });

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        const formattedListings = data.map(listing => ({
          ...listing,
          foodItemName: listing.food_name, 
          providerName: listing.profiles ? listing.profiles.display_name : 'Unknown Provider',
          pickupAddressShort: listing.pickup_address, 
          pickupWindowStart: listing.pickup_window_start, 
          pickupWindowEnd: listing.pickup_window_end,
          quantityUnit: listing.quantity 
        }));

        setListings(formattedListings);
      } catch (err) {
        console.error("Failed to fetch listings:", err);
        setError("Failed to load available listings. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    loadListings();
  }, [locationQuery]);

  const handleLocationChange = (e) => {
    setLocationQuery(e.target.value);
  };

  const handleViewMore = (listingId) => {
    navigate(`/receiver/listings/${listingId}`);
  };

  const handleClaim = async (listingId) => {
    alert(`Claiming listing ${listingId} - functionality to be implemented with Supabase.`);
  };
  
  const handleFindSimilar = (searchTerm) => {
    alert(`Imagine searching for items similar to: ${searchTerm}`);
  };

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

  const hamburgerMenuJsx = (
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
  );

  return (
    <>
      <Header 
        title="Listings available" 
        rightItem={hamburgerMenuJsx} 
      />
      <div className="container">
        <div className="location-search-bar">
          <FaMapMarkerAlt className="location-icon" />
          <input
            type="text"
            placeholder="Search by address, city, or landmark..."
            value={locationQuery}
            onChange={handleLocationChange}
            className="location-input"
          />
        </div>

        {isLoading && <p>Loading listings...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {!isLoading && !error && listings.length === 0 && (
          <p>No listings currently available. Check back soon!</p>
        )}
        {!isLoading && !error && listings.length > 0 && (
          <div className="listings-grid">
            {listings.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing} 
                onViewMore={() => handleViewMore(listing.id)}
                onClaim={() => handleClaim(listing.id)}
                onFindSimilar={() => handleFindSimilar(listing.food_name)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default BrowseListings;
