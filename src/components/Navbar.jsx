import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ isLoggedIn, user, onLogout }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  return (
    <div className="navbar">
      <div className="dropdown">
        <button className="dropbtn" onClick={toggleDropdown}>☰</button>
        <div className={`dropdown-content ${isDropdownOpen ? 'show' : ''}`}>
          <Link to="/" onClick={closeDropdown}>Home</Link>
          <Link to="/trivia" onClick={closeDropdown}>Trivia</Link>
        </div>
      </div>
      
      {isLoggedIn ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto', marginRight: '10px' }}>
          <span style={{ color: 'white' }}>{user?.displayName}</span>
          <button onClick={onLogout}>Logout</button>
        </div>
      ) : (
        <Link to="/signin">
          <button>Login</button>
        </Link>
      )}
    </div>
  );
};

export default Navbar;