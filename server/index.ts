import { WebSocketServer } from 'ws';
// We use the direct require for y-websocket utils to work with the library
const { setupWSConnection } = require('y-websocket/bin/utils');

const wss = new WebSocketServer({ port: 1234 });

console.log('⚡ Bun Server is running on ws://localhost:1234');

wss.on('connection', (ws, req) => {
  // Get the room name from the URL (e.g., ws://localhost:1234/my-room)
  const url = new URL(req.url!, 'http://localhost');
  const roomName = url.pathname.replace('/', '') || 'default-room';
  
  console.log(`User connected to room: ${roomName}`);
  
  setupWSConnection(ws, req, { docName: roomName });
});