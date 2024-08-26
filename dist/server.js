"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ws_1 = require("ws");
const axios_1 = __importDefault(require("axios"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// List of endpoints to fetch data from
const endpoints = [
    'https://data--us-east.upscope.io/status?stats=1',
    'https://data--eu-west.upscope.io/status?stats=1',
    'https://data--eu-central.upscope.io/status?stats=1',
    'https://data--us-west.upscope.io/status?stats=1',
    'https://data--sa-east.upscope.io/status?stats=1',
    'https://data--ap-southeast.upscope.io/status?stats=1',
];
// Cache to store the most recent data for each endpoint
const dataCache = {};
// Create HTTP server and WebSocket server
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
const wss = new ws_1.WebSocketServer({ server });
// Function to fetch data from a single endpoint and handle errors
const fetchDataFromEndpoint = (url) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.get(url, { timeout: 5000 }); // 5-second timeout
        dataCache[url] = response.data; // Store the data in the cache
        return response.data;
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            // Handle Axios errors
            if (error.response) {
                // The request was made and the server responded with a status code
                console.error(`Error fetching data from ${url}: ${error.response.status} ${error.response.statusText}`);
            }
            else if (error.request) {
                // The request was made but no response was received
                console.error(`Error fetching data from ${url}: No response received`);
            }
            else {
                // Something happened in setting up the request
                console.error(`Error fetching data from ${url}: ${error.message}`);
            }
        }
        else {
            // Handle unexpected errors
            console.error(`Unexpected error fetching data from ${url}:`, error);
        }
        return dataCache[url] || { error: 'No data available' }; // Return cached data if available
    }
});
// Function to fetch data from all endpoints
const fetchData = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fetchPromises = endpoints.map(endpoint => fetchDataFromEndpoint(endpoint));
        yield Promise.all(fetchPromises);
        // Broadcast the updated data to all connected clients
        broadcastDataToClients();
    }
    catch (error) {
        console.error('Error fetching data from endpoints:', error);
    }
});
// Function to broadcast data to all connected clients
const broadcastDataToClients = () => {
    const allData = endpoints.map(endpoint => ({
        endpoint,
        data: dataCache[endpoint] || { error: 'No data available' },
    }));
    const message = JSON.stringify(allData);
    wss.clients.forEach((client) => {
        if (client.readyState === ws_1.WebSocket.OPEN) {
            client.send(message);
        }
    });
};
// WebSocket connection event handler
wss.on('connection', (ws) => {
    console.log('New client connected');
    // Immediately send cached data to the newly connected client
    const initialData = endpoints.map(endpoint => ({
        endpoint,
        data: dataCache[endpoint] || { error: 'No data available' },
    }));
    ws.send(JSON.stringify(initialData));
    ws.on('error', (err) => {
        console.error('WebSocket error:', err);
    });
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});
// Periodically fetch data every 60 seconds (or adjust based on load)
setInterval(fetchData, 60000);
// Fetch initial data at server start
fetchData();
