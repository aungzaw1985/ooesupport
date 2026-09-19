import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

// Configure CORS for the frontend URL later
@WebSocketGateway({
  cors: {
    origin: '*', // Change to your frontend URL in production
  },
})
export class TicketsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('TicketsGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // In a full app, you would verify the JWT token here via client.handshake.auth.token
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Method to emit new tickets to all connected agents
  emitNewTicket(ticket: any) {
    this.server.emit('ticket:created', ticket);
  }

  // Method to emit new thread entries (replies/notes)
  emitNewThreadEntry(ticketId: number, entry: any) {
    this.server.emit(`ticket:${ticketId}:thread`, entry);
  }
  
  // Method to emit ticket updates (e.g., new reply moved it to top of queue)
  emitTicketUpdated(ticketId: number) {
    this.server.emit('ticket:updated', { id: ticketId });
  }
}
