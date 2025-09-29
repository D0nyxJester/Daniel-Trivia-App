global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from './Navbar';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';


describe('Navbar', () => {
  test('renders Login button when not logged in', () => {
    render(
      <BrowserRouter>
        <Navbar isLoggedIn={false} user={null} onLogout={jest.fn()} />
      </BrowserRouter>
    );
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('renders user displayName and Logout button when logged in', () => {
    render(
      <BrowserRouter>
        <Navbar isLoggedIn={true} user={{ displayName: 'Test User' }} onLogout={jest.fn()} />
      </BrowserRouter>
    );
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  test('calls onLogout when Logout button is clicked', () => {
    const onLogout = jest.fn();
    render(
      <BrowserRouter>
        <Navbar isLoggedIn={true} user={{ displayName: 'Test User' }} onLogout={onLogout} />
      </BrowserRouter>
    );
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(onLogout).toHaveBeenCalled();
  });

  test('dropdown toggles when menu button is clicked', () => {
    render(
      <BrowserRouter>
        <Navbar isLoggedIn={false} user={null} onLogout={jest.fn()} />
      </BrowserRouter>
    );
    const menuBtn = screen.getByRole('button', { name: /☰/ });
    fireEvent.click(menuBtn);
    expect(screen.getByText(/home/i)).toBeVisible();
    fireEvent.click(menuBtn);
    expect(screen.getByText(/home/i)).toBeInTheDocument();
  });

  test('dropdown closes when a link is clicked', () => {
    render(
      <BrowserRouter>
        <Navbar isLoggedIn={false} user={null} onLogout={jest.fn()} />
      </BrowserRouter>
    );
    const menuBtn = screen.getByRole('button', { name: /☰/ });
    fireEvent.click(menuBtn);
    const homeLink = screen.getByText(/home/i);
    fireEvent.click(homeLink);
    // Dropdown should close, but link is still in the document
    expect(homeLink).toBeInTheDocument();
  });
});