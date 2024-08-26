import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

// Mock WebSocket
class MockWebSocket {
  url: string;
  onopen?: () => void;
  onmessage?: (event: { data: string }) => void;
  onerror?: (event: { error: any }) => void;
  onclose?: () => void;
  
  constructor(url: string) {
    this.url = url;
  }

  send() {}
  close() {}
}

global.WebSocket = MockWebSocket as any;

describe('App Integration Tests', () => {
  test('renders and updates data from WebSocket', async () => {
    const mockWebSocket = global.WebSocket as jest.Mocked<typeof WebSocket>;
    const mockOnMessage = jest.fn();
    mockWebSocket.prototype.onmessage = mockOnMessage;

    const mockSocket = new MockWebSocket('ws://localhost:3001');
    mockSocket.onmessage = (event) => {
      mockOnMessage(event);
    };

    mockOnMessage({
      data: JSON.stringify([
        {
          endpoint: 'https://data--us-east.upscope.io/status?stats=1',
          data: { status: 'ok' }
        }
      ])
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/US East Data/i)).toBeInTheDocument();
      expect(screen.getByText(/Healthy/i)).toBeInTheDocument();
    });
  });

  test('handles WebSocket connection errors gracefully', async () => {
    const mockWebSocket = global.WebSocket as jest.Mocked<typeof WebSocket>;
    mockWebSocket.prototype.onerror = jest.fn(() => {
      // Simulate error handling in WebSocket
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
    });
  });
});
