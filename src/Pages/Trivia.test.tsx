import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Trivia from './Trivia';
import '@testing-library/jest-dom';

(global as any).fetch = (global as any).fetch || (() => Promise.resolve({ json: () => Promise.resolve({}) }));

// Mock fetch for Trivia component
beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation((url) => {
    if (typeof url === 'string' && url.includes('/api/user')) {
      return Promise.resolve({
        json: () => Promise.resolve({}),
      }) as any;
    }
    if (typeof url === 'string' && url.includes('/get-trivia')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            results: [
              {
                category: 'General Knowledge',
                type: 'multiple',
                difficulty: 'easy',
                question: 'What is 2+2?',
                correct_answer: '4',
                incorrect_answers: ['3', '5', '6'],
              },
            ],
          }),
      }) as any;
    }
    if (typeof url === 'string' && url.includes('/api/my-trivia-results')) {
      return Promise.resolve({
        json: () => Promise.resolve([]),
      }) as any;
    }
    return Promise.resolve({
      json: () => Promise.resolve({}),
    }) as any;
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ...existing code...

describe('Trivia Page', () => {
  it('renders Get Trivia Question button and answer option buttons after fetching', async () => {
    render(<Trivia />);
    // The Get Trivia Question button should be present
    expect(screen.getByRole('button', { name: /get trivia question/i })).toBeInTheDocument();

    // Click the Get Trivia Question button
    fireEvent.click(screen.getByRole('button', { name: /get trivia question/i }));

    // Wait for the question and answer buttons to appear
    await waitFor(() => {
      expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
    });

    // There should be answer option buttons
    expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '6' })).toBeInTheDocument();
  });

  it('shows result popup after answering a question', async () => {
    render(<Trivia />);
    fireEvent.click(screen.getByRole('button', { name: /get trivia question/i }));

    await waitFor(() => {
      expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
    });

    // Click an answer button
    fireEvent.click(screen.getByRole('button', { name: '4' }));

    // Wait for result popup to appear
    await waitFor(() => {
      expect(screen.getByText(/correct!/i)).toBeInTheDocument();
      expect(screen.getByText(/your answer:/i)).toBeInTheDocument();
      expect(screen.getByText(/correct answer:/i)).toBeInTheDocument();
    });
  });

  it('shows "Sign in to save your trivia results" message when not logged in and question is loaded', async () => {
    render(<Trivia />);
    fireEvent.click(screen.getByRole('button', { name: /get trivia question/i }));

    await waitFor(() => {
      expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/sign in to save your trivia results and view them later!/i)
    ).toBeInTheDocument();
  });

  it('shows "Get Another Question" button after answering', async () => {
    render(<Trivia />);
    fireEvent.click(screen.getByRole('button', { name: /get trivia question/i }));

    await waitFor(() => {
      expect(screen.getByText('What is 2+2?')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: '4' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /get another question/i })).toBeInTheDocument();
    });
  });
});
