import SocketIO, { Server } from "socket.io";
import http from "http";
import { CORS } from "../environments/variables";
import { WebsocketEvents } from "../events/websocket-events";

export class Sockets {
  private io: Server;
  constructor(server: http.Server) {
    this.io = new SocketIO.Server(server, ({
      cors: {
        origin: CORS.origin,
        methods: ['GET', 'POST', 'UPDATE', 'DELETE'],
        credentials: CORS.credentials
      },
      path: '/socket-io'
    }))
    this.io.on('disconnect', reason => {
      console.log(`Client Disconnected: ${reason}`)
    });
    this.comments();
    console.log('Websocket Initialized!');
  }

  comments() {
    this.io.on(WebsocketEvents.CONNECT, (socket) => {
      // Create
      socket.on(WebsocketEvents.CREATE_COMMENT, res=> {
        console.log('Create Comment:\n', JSON.stringify({CommentData: res}));
        socket.broadcast.emit(WebsocketEvents.CREATE_COMMENT, res);
        socket.emit(WebsocketEvents.CREATE_COMMENT, res);
      });

      // Update
      socket.on(WebsocketEvents.UPDATE_COMMENT, res=> {
        console.log('Socket Update Comment:\n', JSON.stringify({CommentData: res}));
        socket.broadcast.emit(WebsocketEvents.UPDATE_COMMENT, res);
        socket.emit(WebsocketEvents.UPDATE_COMMENT, res);
      });

      // Delete
      socket.on(WebsocketEvents.DELETE_COMMENT, res=> {
        console.log('Socket Delete Comment:\n', JSON.stringify({CommentData: res}));
        socket.broadcast.emit(WebsocketEvents.DELETE_COMMENT, res);
        socket.emit(WebsocketEvents.DELETE_COMMENT, res);
      });
    });
  }
}
