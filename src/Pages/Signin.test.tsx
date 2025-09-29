import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Signin from './Signin';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Mock fetch globally for all tests in this file
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

describe('Signin Page', () => {
  beforeEach(() => {
    render(
      <BrowserRouter>
        <Signin />
      </BrowserRouter>
    );
  });

  it('renders Google and GitHub sign in buttons', () => {
    expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in with github/i })).toBeInTheDocument();
  });
});