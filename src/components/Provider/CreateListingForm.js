import React, { useState, useEffect } from 'react';
import Header from '../common/Header';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';

const CreateListingForm = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    food_name: '',
    category: '',
    quantity: '',
    description: '',
    allergens: '',
    pickup_address: '',
    latitude: null,
    longitude: null,
    pickup_date: '',
    pickup_window_start: '',
    pickup_window_end: '',
    contact_person: '',
    contact_number: '',
    // 'status' will default to 'Available' in the DB or can be set explicitly
    // 'provider_id' will be added from currentUser.id
  });

  // Get the currently authenticated user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error.message);
        // Handle error, maybe redirect to login
        return;
      }
      if (session?.user) {
        setCurrentUser(session.user);
        // You might want to fetch their profile here too if needed for role checks on client
        // const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
        // if (profile && profile.role !== 'provider') { /* redirect or disable form */ }
      } else {
        // No user session, redirect to login
        console.log("No user session, redirecting to login is advised.");
        // history.push('/login');
      }
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setCurrentUser(session?.user ?? null);
      }
    );

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [/* history */]); // Add history if using it for redirection

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('You must be logged in to create a listing.');
      navigate('/signin');
      return;
    }

    // Basic client-side validation
    if (!formData.food_name || !formData.category || !formData.quantity || !formData.pickup_address || !formData.pickup_date || !formData.pickup_window_start || !formData.pickup_window_end) {
      alert('Please fill in all required fields marked with *.');
      return;
    }
    setIsLoading(true);

    let fullPickupWindowStart = null;
    let fullPickupWindowEnd = null;
    let fullPickupDateForDB = null;

    if (formData.pickup_date && formData.pickup_window_start) {
      fullPickupWindowStart = `${formData.pickup_date}T${formData.pickup_window_start}:00`;
    }

    if (formData.pickup_date && formData.pickup_window_end) {
      fullPickupWindowEnd = `${formData.pickup_date}T${formData.pickup_window_end}:00`;
    }

    if (formData.pickup_date) {
      fullPickupDateForDB = `${formData.pickup_date}T00:00:00`; // Start of the day
  }

    console.log(currentUser.id)  
  // Prepare data for Supabase, including provider_id
    const listingData = {
      ...formData,
      provider_id: currentUser.id, // Crucial: associate listing with the logged-in provider
      status: 'Available', // Explicitly set status if not defaulted in DB
      // Convert date and time to a format Supabase expects for timestamp or time types if necessary
      // For example, if pickup_date is just a date string and your DB expects timestamptz:
      // pickup_date: new Date(formData.pickupDate).toISOString(),
      // pickup_window_start: formData.pickupWindowStart, // Supabase 'time' type accepts "HH:MM:SS"
      // pickup_window_end: formData.pickupWindowEnd,
      pickup_date: fullPickupDateForDB,
      pickup_window_start: fullPickupWindowStart,
      pickup_window_end: fullPickupWindowEnd,
    };
    console.log("Submitting to Supabase:", listingData);

    // Remove latitude/longitude if they are null and your DB doesn't like null for numeric from client
    // Or ensure they are properly typed if your DB column is, e.g., numeric
    if (listingData.latitude === null || listingData.latitude === '') delete listingData.latitude;
    if (listingData.longitude === null || listingData.longitude === '') delete listingData.longitude;


    const { data, error } = await supabase
      .from('food_listings')
      .insert([listingData]) // insert takes an array of objects
      .select(); // Optionally select the inserted data back

    setIsLoading(false);

    if (error) {
      console.error('Error creating listing:', error.message);
      alert(`Failed to create listing: ${error.message}`);
    } else {
      console.log('Listing created successfully:', data);
      alert('Listing created successfully!');
      // Reset form
      setFormData({
        food_name: '', category: '', quantity: '', description: '', allergens: '',
        pickup_address: '', latitude: null, longitude: null, pickup_date: '',
        pickup_window_start: '', pickup_window_end: '', contact_person: '', contact_number: '',
      });
      // Optionally navigate to MyListings page
      // history.push('/provider/my-listings');
    }
  };

  const handleBack = () => {
    // history.push('/provider/my-listings');
    navigate('/provider/my-listings')
  };

  if (!currentUser && !isLoading) { // Check isLoading to prevent premature message if auth check is pending
      // Initial state before user is fetched. Could show a loader too.
      // Or if fetchUser determined no session, this could be a message or redirect.
      // For now, form will be mostly disabled if no currentUser
  }


  return (
    <>
      <Header title="Create New Food Listing" showBackButton onBackClick={handleBack} />
      <div className="container">
        <form onSubmit={handleSubmit}>
          <label htmlFor="food_name" className="form-label">Food Item Name*</label>
          <input
            type="text"
            id="food_name"
            name="food_name"
            placeholder="e.g., Sourdough Bread, Apples"
            value={formData.food_name}
            onChange={handleChange}
            className="input-field"
            required
          />

          <label htmlFor="category" className="form-label">Category*</label>
          <input
            type="text"
            id="category"
            name="category"
            placeholder="e.g., Baked Goods, Produce, Dairy"
            value={formData.category}
            onChange={handleChange}
            className="input-field"
            required
          />

          <label htmlFor="quantity" className="form-label">Quantity*</label>
          <input
            type="text"
            id="quantity"
            name="quantity"
            placeholder="e.g., 5 loaves, approx 2kg"
            value={formData.quantity}
            onChange={handleChange}
            className="input-field"
            required
          />

          <label htmlFor="description" className="form-label">Description</label>
          <textarea
            id="description"
            name="description"
            placeholder="e.g., Freshly baked today, slightly misshapen but delicious"
            value={formData.description}
            onChange={handleChange}
            className="input-field"
            rows="3"
          />

          <label htmlFor="allergens" className="form-label">Allergens</label>
          <input
            type="text"
            id="allergens"
            name="allergens"
            placeholder="e.g., Contains nuts, gluten-free (if applicable)"
            value={formData.allergens}
            onChange={handleChange}
            className="input-field"
          />

          <label htmlFor="pickup_address" className="form-label">Pickup Address*</label>
          <input
            type="text"
            id="pickup_address"
            name="pickup_address"
            placeholder="Full address for pickup"
            value={formData.pickup_address}
            onChange={handleChange} // Standard text input now
            className="input-field"
            required
          />

          <label htmlFor="pickup_date" className="form-label">Pickup Date*</label>
          <input
            type="date"
            id="pickup_date"
            name="pickup_date"
            value={formData.pickup_date}
            onChange={handleChange}
            className="input-field"
            required
            // Set min date to today
            min={new Date().toISOString().split("T")[0]}
          />

          <label htmlFor="pickup_window_start" className="form-label">Pickup Window Start*</label>
          <input
            type="time"
            id="pickup_window_start"
            name="pickup_window_start"
            value={formData.pickup_window_start}
            onChange={handleChange}
            className="input-field"
            required
          />

          <label htmlFor="pickup_window_end" className="form-label">Pickup Window End*</label>
          <input
            type="time"
            id="pickup_window_end"
            name="pickup_window_end"
            value={formData.pickup_window_end}
            onChange={handleChange}
            className="input-field"
            required
          />

          <label htmlFor="contact_person" className="form-label">Contact Person</label>
          <input
            type="text"
            id="contact_person"
            name="contact_person"
            placeholder="Name (Optional)"
            value={formData.contact_person}
            onChange={handleChange}
            className="input-field"
          />

          <label htmlFor="contact_number" className="form-label">Contact Number</label>
          <input
            type="tel"
            id="contact_number"
            name="contact_number"
            placeholder="Phone (Optional)"
            value={formData.contact_number}
            onChange={handleChange}
            className="input-field"
          />

          <button type="submit" className="btn btn-primary btn-full-width">Create Listing</button>
        </form>
      </div>
    </>
  );
};

export default CreateListingForm;