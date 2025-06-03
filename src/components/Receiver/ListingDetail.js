import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Header from '../common/Header';
import { FaArrowLeft, FaMapMarkerAlt, FaCalendarAlt, FaClock, FaBoxOpen, FaStickyNote, FaExclamationTriangle } from 'react-icons/fa';

const ListingDetail = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claimError, setClaimError] = useState(null);
  const [claimSuccess, setClaimSuccess] = useState(false);

  // Placeholder for current receiver ID - replace with actual auth user ID
  const currentReceiverId = 'receiver123';

  useEffect(() => {
    const fetchListingDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
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
            description,             
            allergens,         
            provider_id,
            profiles!provider_id ( display_name )
          `)
          .eq('id', listingId)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') { 
            setError('Listing not found.');
          } else {
            throw fetchError;
          }
        }
        setListing(data);
      } catch (err) {
        console.error('Failed to fetch listing details:', err);
        setError('Failed to load listing details. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    if (listingId) {
      fetchListingDetails();
    }
  }, [listingId]);

  const handleClaimItem = async () => {
    if (!listing || listing.status !== 'Available') {
      setClaimError('This listing is no longer available.');
      return;
    }

    setIsClaiming(true);
    setClaimError(null);
    
    try {
      // Get the current user's ID from the session
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to claim a listing.');
      }

      // First, verify the listing is still available (to prevent race conditions)
      const { data: currentListing, error: fetchError } = await supabase
        .from('food_listings')
        .select('status')
        .eq('id', listingId)
        .single();

      if (fetchError) throw fetchError;
      if (currentListing.status !== 'Available') {
        throw new Error('This listing has already been claimed.');
      }

      // Update the listing to mark it as claimed
      const updateData = {
        status: 'CLAIMED',
        claimed_by_id: user.id,
        updated_at: new Date().toISOString()
      };
      
      const { error: updateError } = await supabase
        .from('food_listings')
        .update(updateData)
        .eq('id', listingId)
        .eq('status', 'Available');

      if (updateError) throw updateError;

      // Update the local state to reflect the claim
      setListing(prev => ({
        ...prev,
        ...updateData
      }));
      
      setClaimSuccess(true);
      
      // Optionally, redirect after a short delay
      setTimeout(() => {
        navigate('/receiver/browse');
      }, 2000);
      
    } catch (err) {
      console.error('Error claiming listing:', err);
      setClaimError(err.message || 'Failed to claim listing. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
      });
    } catch (e) {
      return dateStr; 
    }
  };
  
  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    try {
      const date = new Date(timeStr);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (e) {
      return timeStr;
    }
  };

  if (isLoading) return <div className="container"><p>Loading listing details...</p></div>;
  if (error) return <div className="container"><p style={{ color: 'red' }}>Error: {error}</p><button onClick={() => navigate(-1)} className="button-secondary">Go Back</button></div>;
  if (!listing) return <div className="container"><p>Listing not found.</p><button onClick={() => navigate(-1)} className="button-secondary">Go Back</button></div>;

  const provider = listing.profiles;
  const quantityDisplay = listing.quantity;

  return (
    <>
      <Header title={listing.food_name || 'Listing Details'} showBackButton onBackClick={() => navigate(-1)} />
      <div className="container listing-detail-page">
        <h2>{listing.food_name}</h2>
        <p className="listing-category">Category: {listing.category || 'N/A'}</p>
        
        <div className="detail-section">
          <FaBoxOpen /> <span><strong>Quantity:</strong> {quantityDisplay || 'N/A'}</span>
        </div>

        <div className="detail-section">
          <FaMapMarkerAlt /> <span><strong>Pickup Address:</strong> {listing.pickup_address || 'N/A'}</span>
        </div>

        <div className="detail-section">
          <FaCalendarAlt /> <span><strong>Pickup Date & Time:</strong></span>
          <p>From: {formatTime(listing.pickup_window_start)}</p>
          <p>To: {formatTime(listing.pickup_window_end)}</p>
        </div>

        {listing.description && (
          <div className="detail-section notes-section">
            <FaStickyNote /> <span><strong>Description:</strong></span>
            <p>{listing.description}</p>
          </div>
        )}

        {listing.allergens && (
          <div className="detail-section allergens-section">
            <FaExclamationTriangle /> <span><strong>Allergens:</strong></span>
            <p>{listing.allergens}</p>
          </div>
        )}

        <div className="provider-info-section">
          <h4>Provided by:</h4>
          <p><strong>{provider?.display_name || 'Provider details not available'}</strong></p>
          {provider?.organization_name && <p>{provider.organization_name}</p>}
          {/* Consider showing contact info based on privacy settings/rules */}
          {/* <p>Email: {provider?.contact_email || 'N/A'}</p> */}
          {/* <p>Phone: {provider?.contact_phone || 'N/A'}</p> */}
        </div>

        <div className="action-buttons">
          {listing.status === 'Available' ? (
            <>
              <button 
                onClick={handleClaimItem} 
                className="btn btn-primary"
                disabled={isClaiming || claimSuccess}
              >
                {isClaiming ? 'Claiming...' : 'Claim This Item'}
              </button>
              {claimError && <p className="error-message" style={{ color: 'red' }}>{claimError}</p>}
              {claimSuccess && (
                <p className="success-message" style={{ color: 'green' }}>
                  Successfully claimed! Redirecting...
                </p>
              )}
            </>
          ) : (
            <div className="status-message">
              <p>This item has been {listing.status.toLowerCase()}.</p>
              {listing.claimed_by_id === currentReceiverId && (
                <p>You claimed this item on {formatDateTime(listing.updated_at)}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ListingDetail;
