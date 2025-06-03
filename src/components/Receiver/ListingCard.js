import React from "react";
import { FaClock, FaHashtag, FaUsers } from "react-icons/fa";

const ListingCard = ({ listing, onViewMore, onClaim, onFindSimilar }) => {
  const {
    foodItemName,    // This is listing.food_name from BrowseListings
    providerName,    // This is listing.profiles.display_name
    pickupAddressShort, // This is listing.pickup_address
    pickupWindowStart, // Full timestamp string
    pickupWindowEnd,   // Full timestamp string
    quantityUnit,      // This is listing.quantity (which includes unit)
    status,
    category // Added category to destructuring for onFindSimilar, was implicitly used before
  } = listing;

  const formatTime = (timeStr) => {
    if (!timeStr) return 'N/A';
    try {
      // Assuming timeStr is like "YYYY-MM-DDTHH:MM:SS"
      const date = new Date(timeStr);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch (e) {
      return timeStr; // Fallback in case of an invalid date string
    }
  };

  const timeDisplay = `${formatTime(pickupWindowStart)} - ${formatTime(pickupWindowEnd)}`;

  const canClaim = status === "Available"; // Changed from "ACTIVE" to "Available"

  return (
    <div className={`listing-card ${status === "CLAIMED" ? "claimed" : ""}`}>
      <div className="listing-card-header">
        <h4>{foodItemName}</h4>
        <span className={`status-badge ${status === "CLAIMED" ? "status-claimed" : status === "Available" ? "status-active" : "status-other"}`}>
          {status}
        </span>
      </div>
      <p className="provider-address">{providerName} - {pickupAddressShort}</p>

      <div className="listing-card-details">
        <div className="detail-item">
          <FaClock className="detail-icon"/>
          <span>{timeDisplay}</span>
      </div>
      {quantityUnit && (
        <div className="detail-item">
          <FaHashtag className="detail-icon" />
          <span>{quantityUnit}</span>
        </div>
      )}
    </div>

    <div className="listing-card-actions">
      <button onClick={() => onViewMore(listing.id)}className="btn btn-secondary">View More</button>
      {canClaim && (
        <button onClick={() => onClaim(listing.id)} className="btn btn-primary">Claim</button>
      )}
      {!canClaim && onFindSimilar && (
        // Pass listing.category if available, otherwise foodItemName for similarity search
        <button onClick={() => onFindSimilar(category || foodItemName)} className="btn btn-secondary">Find Similar</button>
      )}
    </div>
  </div>
  );
};

export default ListingCard;
