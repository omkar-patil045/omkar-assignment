import React, { useEffect, useState } from 'react';
import { Table, Badge, Button, Collapse } from 'react-bootstrap';
import './App.css';
import headerImage from './assets/upscope_cover.jpeg'; // Path to the header image

const App = () => {
  // State to hold the data received from the WebSocket
  const [data, setData] = useState<any[]>([]);
  
  // State to manage the connection status
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  
  // State to manage which row's detailed data to show
  const [showData, setShowData] = useState<number | null>(null);
  
  // State to manage JSON data display in a modal
  const [jsonData, setJsonData] = useState<string | null>(null);

  // Dictionary to map endpoint URLs to readable names
  const endpointNames: { [key: string]: string } = {
    'https://data--us-east.upscope.io/status?stats=1': 'US East Data',
    'https://data--eu-west.upscope.io/status?stats=1': 'EU West Data',
    'https://data--eu-central.upscope.io/status?stats=1': 'EU Central Data',
    'https://data--us-west.upscope.io/status?stats=1': 'US West Data',
    'https://data--sa-east.upscope.io/status?stats=1': 'SA East Data',
    'https://data--ap-southeast.upscope.io/status?stats=1': 'AP Southeast Data',
  };

  // Function to get status badge based on the data
  const getStatusBadge = (data: any) => {
    return data.error ? <Badge bg="danger">Error</Badge> : <Badge bg="success">Healthy</Badge>;
  };

  // Function to handle showing JSON data in the modal
  const handleShowJSON = (data: any) => {
    setJsonData(JSON.stringify(data, null, 2));
  };

  // Function to handle closing the JSON modal
  const handleCloseJSON = () => {
    setJsonData(null);
  };

  // Function to handle showing detailed data in a new tab
  const handleShowDetails = (url: string) => {
    window.open(url, '_blank');
  };

  // WebSocket connection setup
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket('ws://localhost:3001');

      ws.onopen = () => {
        console.log('WebSocket connection opened');
        setConnectionStatus('Connected');
      };

      ws.onmessage = (event) => {
        console.log('Received data:', event.data);
        try {
          const receivedData = JSON.parse(event.data);
          setData(receivedData);
        } catch (error) {
          console.error('Error parsing WebSocket data:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('Error');
      };

      ws.onclose = () => {
        console.log('WebSocket connection closed');
        setConnectionStatus('Disconnected');
        setTimeout(connectWebSocket, 5000); // Retry connection after 5 seconds
      };

      // Cleanup on component unmount
      return () => {
        ws.close();
      };
    };

    connectWebSocket();

  }, []);

  return (
    <>
      <div className="header-container">
        {/* Header image with overlay for title and status */}
        <img src={headerImage} alt="Header" className="header-image" />
        <div className="title-overlay">
          <h1>System Dashboard</h1>
          <p className="status-text">
            Status: <Badge bg={connectionStatus === 'Connected' ? 'success' : 'danger'}>{connectionStatus}</Badge>
          </p>
        </div>
      </div>
      <div className="table-container">
        {/* Table displaying data */}
        <Table striped bordered hover className="table">
          <thead>
            <tr>
              <th>Geographical Data</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((item, index) => (
                <React.Fragment key={index}>
                  <tr className={item.data.error ? 'table-danger' : ''}>
                    <td style={{ textAlign: 'center' }}>{endpointNames[item.endpoint] || item.endpoint}</td>
                    <td style={{ textAlign: 'center' }}>{getStatusBadge(item.data)}</td>
                    <td className="actions">
                      <Button
                        variant="primary"
                        onClick={() => handleShowDetails(item.endpoint)}
                      >
                        Show Details
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => handleShowJSON(item.data)}
                      >
                        Show JSON
                      </Button>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3}>
                      <Collapse in={showData === index}>
                        <pre>{JSON.stringify(item.data, null, 2)}</pre>
                      </Collapse>
                    </td>
                  </tr>
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center' }}>
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {/* JSON Modal */}
      {jsonData && (
        <div className="json-modal">
          <div className="json-modal-content">
            <span className="json-modal-close" onClick={handleCloseJSON}>&times;</span>
            <pre>{jsonData}</pre>
          </div>
        </div>
      )}
    </>
  );
};

export default App;
