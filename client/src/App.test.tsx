import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from './App';
import axios from 'axios';
import '@testing-library/jest-dom';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders table headers correctly', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Geographical Data/i)).toBeInTheDocument();
      expect(screen.getByText(/Status/i)).toBeInTheDocument();
      expect(screen.getByText(/Actions/i)).toBeInTheDocument();
    });
  });

  test('shows and hides JSON modal', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        { region: 'US East', status: 'Healthy' },
      ],
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/US East Data/i)).toBeInTheDocument();
    });

    const showJSONButton = screen.getByText(/Show JSON/i);
    fireEvent.click(showJSONButton);

    expect(screen.getByText(/"region": "US East"/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/×/i));

    expect(screen.queryByText(/"region": "US East"/i)).toBeNull();
  });

  test('handles empty table data gracefully', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/No data available/i)).toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Failed to fetch data'));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Disconnected/i)).toBeInTheDocument();
    });
  });
});
