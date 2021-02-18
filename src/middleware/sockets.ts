import SocketIO, { Server, Socket } from "socket.io";
import http from "http";
import { CORS } from "../environments/variables";
import { CommentEvents } from "../events/comment.events";
import { User } from "../models/user";
import { ListCommentEmitter } from "../models/list-comment";
import { ListItemEvents } from "../events/list-item.events";

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
      transports: ['polling']
    }))
    this.session = session;
    console.log('Websocket Initialized!');
    this.connect();
    this.io.on('disconnect', reason => {
      console.log(`Client Disconnected: ${reason}`)
    });
  }
  connect() {
    this.io.on('connection', (socket: Socket) => {
      console.log('Client Connected.')
      this.comments(socket);
      this.listItems(socket);
    })
  }
  comments(socket: Socket) {
    // Create
    socket.on(CommentEvents.CREATE_COMMENT, res => {
      // console.log(this.session.user);
      const user: User = this.session.user[0];
      const commentData: ListCommentEmitter = {
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        comment: res.comment,
        creation_date: new Date(),
        listInfo: res.listInfo
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
  }
  listItems(socket: Socket) {
    socket.on(ListItemEvents.ADD_ITEM, (res) => {
      socket.emit(ListItemEvents.ADD_ITEM, res);
      socket.broadcast.emit(ListItemEvents.ADD_ITEM, res);
    });

    socket.on(ListItemEvents.UPDATE_ITEM, (res) => {
      socket.emit(ListItemEvents.UPDATE_ITEM, res);
      socket.broadcast.emit(ListItemEvents.UPDATE_ITEM, res);
    });

    socket.on(ListItemEvents.DELETE_ITEM, (res) => {
      socket.emit(ListItemEvents.DELETE_ITEM, res);
      socket.broadcast.emit(ListItemEvents.DELETE_ITEM, res);
    });

    socket.on(ListItemEvents.COMPLETE_ITEM, (res) => {
      socket.emit(ListItemEvents.COMPLETE_ITEM, res);
      socket.broadcast.emit(ListItemEvents.COMPLETE_ITEM, res);
    });



  }
}