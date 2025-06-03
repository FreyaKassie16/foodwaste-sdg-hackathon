import React from 'react';

const formatPickupTime = (dateStr, startTimeStr, endTimeStr) => {
  if (!dateStr || !startTimeStr || !endTimeStr) return { dayDisplay: "Date/Time not set", timeWindowDisplay: "" };
  try {
    const date = new Date(dateStr);   
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dayDisplay;
    if (date.toDateString() === today.toDateString()) {
      dayDisplay = "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      dayDisplay = "Tomorrow";
    } else {
      dayDisplay = date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    }

    const startDateObj = new Date(startTimeStr);
    const startH = startDateObj.getHours();
    const startM = startDateObj.getMinutes();

    const endDateObj = new Date(endTimeStr);
    const endH = endDateObj.getHours();
    const endM = endDateObj.getMinutes();

    const formatTime = (h, m) => {
      const ampm = h >= 12 ? "PM" : "AM";
      const formattedHour = h % 12 || 12;
      const formattedMinute = m < 10 ? `0${m}`: m;
      return `${formattedHour}:${formattedMinute} ${ampm}`;
    };

    const timeWindowDisplay = `${formatTime(startH, startM)} - ${formatTime(endH, endM)}`;
    return { dayDisplay, timeWindowDisplay };

  } catch (error) {
    console.error("Error formatting pickup time:", error);
    return { dayDisplay: "Invalid Date/Time", timeWindowDisplay: "" };
  }
};

const ListingItem = ({ listing, onViewEdit, onMarkAsPickedUp, onDelete }) => {
  const {
    food_name,
    status,
    pickup_date,
    pickup_window_start,
    pickup_window_end,
    claimer_profile
  } = listing;

  const { dayDisplay, timeWindowDisplay } = formatPickupTime(pickup_date, pickup_window_start, pickup_window_end);

  return (
    <div className="listing-item-card">
      <h3>{food_name}</h3>
      {status === "CLAIMED" && claimer_profile && claimer_profile.display_name && (
        <p className="listing-status claimed">
          Claimed by <span className="claimed-by-org">{claimer_profile.display_name}</span>
        </p>
      )}
      {status === "CLAIMED" && (!claimer_profile || !claimer_profile.display_name) && (
        <p className="listing-status claimed">
          Claimed (info unavailable)
        </p>
      )}
      {status === "Available" && (
        <div className="listing-availability">
          <p className="listing-pickup-day">{dayDisplay}</p>
          <p className="listing-pickup-window">{timeWindowDisplay}</p>
        </div>
      )}
      {(status === "PickedUp" || status === "Expired") && (
         <div className="listing-availability">
          <p className="listing-pickup-day">{dayDisplay}</p>
          <p className="listing-pickup-window">{timeWindowDisplay}</p>
        </div>
      )}
      <div className="listing-actions">
        <button onClick={() => onViewEdit(listing.id)} className="btn btn-secondary">Edit</button>
        {status !== "PickedUp" && status !== "Expired" && (
          <button onClick={() => onMarkAsPickedUp(listing.id)} className="btn btn-primary">Picked Up</button>
        )}
        {status !== "PickedUp" && (
           <button onClick={() => onDelete(listing.id)} className="btn btn-danger">Delete</button>
        )}
      </div>
    </div>
  );
};

export default ListingItem;
