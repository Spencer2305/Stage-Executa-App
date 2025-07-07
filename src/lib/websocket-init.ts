import { initializeWebSocket } from './websocket';

// Global flag to track if WebSocket is initialized
let isWebSocketInitialized = false;

export function initWebSocketIfNeeded() {
  if (isWebSocketInitialized) return;

  // Only initialize in development or if explicitly enabled
  if (process.env.NODE_ENV === 'development' || process.env.ENABLE_WEBSOCKET === 'true') {
    try {
      // For development, we'll use a simple HTTP server
      const http = require('http');
      const server = http.createServer();
      
      // Initialize WebSocket server
      const io = initializeWebSocket(server);
      
      // Start server on WebSocket port
      const wsPort = parseInt(process.env.WEBSOCKET_PORT || '3001');
      server.listen(wsPort, () => {
        console.log(`🔌 WebSocket server running on port ${wsPort}`);
        isWebSocketInitialized = true;
      });

      // Handle server errors
      server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          console.log(`⚠️  Port ${wsPort} is already in use, WebSocket server not started`);
        } else {
          console.error('WebSocket server error:', error);
        }
      });

    } catch (error) {
      console.error('Failed to initialize WebSocket server:', error);
    }
  }
}

// Auto-initialize when module is imported (for development)
if (typeof window === 'undefined') { // Server-side only
  initWebSocketIfNeeded();
} 