import React from "react";
import { FaArrowLeft } from 'react-icons/fa';

const Header = ({ title, showBackButton, onBackClick, rightItem }) => {
  return (
    <header className="app-header">
      <div className="header-left-item">
        {showBackButton && (
          <FaArrowLeft onClick={onBackClick} className="back-button" aria-label="Go back" />
        )}
      </div>
      <h1 className="title">{title}</h1>
      <div className="header-right-item">
        {rightItem ? rightItem : <div /> /* Render rightItem or an empty div as a spacer */}
      </div>
    </header>
  );
};

export default Header;
