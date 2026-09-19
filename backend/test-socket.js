const io = require('socket.io-client');

// Connect to the server (using the Nginx proxy IP)
const socket = io('http://192.168.51.109');

socket.on('connect', () => {
  console.log('? Connected to WebSocket server!');
  console.log('Waiting for ticket events...');
});

// Listen for new tickets
socket.on('ticket:created', (data) => {
  console.log('?? [REAL-TIME] New Ticket Created!');
  console.log(`   Ticket Number: ${data.number}`);
  console.log(`   Subject: ${data.subject}`);
});

// Listen for new thread entries (replies/notes/emails)
socket.on('ticket:1:thread', (data) => {
  console.log('?? [REAL-TIME] New Thread Entry on Ticket #1!');
  console.log(`   Type: ${data.type}`);
  console.log(`   Body: ${data.body}`);
});

socket.on('disconnect', () => {
  console.log('Disconnected.');
});