import SocketIO, { Server } from "socket.io";
import http from "http";
import { CORS } from "../environments/variables";
import { CommentEvents } from "../events/comment.events";
import { User } from "../models/user";
import { ListCommentEmitter } from "../models/list-comment";

export class Sockets {
  private io: Server;
  private session: Express.Session;
  constructor(server: http.Server, session: Express.Session) {
    this.io = new SocketIO.Server(server, ({
      cors: {
        origin: CORS.origin,
        methods: ['GET', 'POST', 'UPDATE', 'DELETE'],
        credentials: CORS.credentials
      },
      path: '/socket-io',
    }))
    this.session = session;
    this.io.on('disconnect', reason => {
      console.log(`Client Disconnected: ${reason}`)
    });
    this.comments();
    console.log('Websocket Initialized!');
  }

  comments() {
    this.io.on(CommentEvents.CONNECT, (socket) => {
      // Create
      socket.on(CommentEvents.CREATE_COMMENT, res => {
        const user: User = this.session.user[0];
        const commentData: ListCommentEmitter = {
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          comment: res.comment,
          creation_date: new Date()
        }
        console.log('Create Comment:\n', JSON.stringify(commentData));
        socket.broadcast.emit(CommentEvents.CREATE_COMMENT, commentData);
        socket.emit(CommentEvents.CREATE_COMMENT, commentData);
      });

      // Update
      socket.on(CommentEvents.UPDATE_COMMENT, res=> {
        console.log('Socket Update Comment:\n', JSON.stringify({CommentData: res}));
        socket.broadcast.emit(CommentEvents.UPDATE_COMMENT, res);
        socket.emit(CommentEvents.UPDATE_COMMENT, res);
      });

      // Delete
      socket.on(CommentEvents.DELETE_COMMENT, res=> {
        console.log('Socket Delete Comment:\n', JSON.stringify({CommentData: res}));
        socket.broadcast.emit(CommentEvents.DELETE_COMMENT, res);
        socket.emit(CommentEvents.DELETE_COMMENT, res);
      });
    });
  }
}
