import SocketIO, { Server, Socket } from 'socket.io';
import http from 'http';
import chalk from 'chalk';
import { CORS } from '../environments/variables';
import { CommentEvents } from '../events/comment.events';
import { ListItemEvents } from '../events/list-item.events';
import { ListCommentEmitter } from '../models/list-comment.model';
import { ListItemModel } from '../models/list-item.model';
import { ListEvents } from '../events/list.events';
import { ListModel } from '../models/list.model';

let socketInstance: SocketIO.Socket;
let ioInstance: SocketIO.Server;

function setSocketInstance(socket: SocketIO.Socket) {
  return socketInstance = socket;
}
// noinspection JSUnusedGlobalSymbols
export function getSocketInstance(): SocketIO.Socket {
  return socketInstance;
}
function setIoInstance(io: SocketIO.Server) {
  return ioInstance = io;
}
export function getIoInstance(): SocketIO.Server {
  return ioInstance;
}


export const emit = (event: string | ListEvents | CommentEvents | ListItemEvents, data: Partial<number | ListModel | ListCommentEmitter | ListItemModel>): void => {
  const io = getIoInstance();
  try {
    switch (event) {
      case ListItemEvents.COMPLETE_ITEM: {
        io.sockets.to(`${(data as ListItemModel).slug}`).emit(event, data);
        break;
      }
      case ListItemEvents.UPDATE_ITEM: {
        io.sockets.emit(event, data);
        break;
      }
      case ListEvents.UPDATE_LIST: {
        console.log(chalk.bgCyan.black(event, 'emitted'));
        console.log(data);
        io.sockets.to((data as ListModel).slug).emit(event, data);
        break;
      }
      case ListItemEvents.DELETE_ITEM:
      case ListEvents.DELETE_LIST:
      case CommentEvents.DELETE_COMMENT: {
        console.log(chalk.bgCyan.black(event, 'emitted'));
        io.sockets.emit(event, data)
        break;
      }
      default: {
        console.log(chalk.bgCyan.black(event, 'emitted'));
        if (typeof data !== 'number') {
          if ('listInfo' in data) {
            io.to(data.listInfo).emit(event, data);
          }
        }
        break;
      }
    }
  } catch (e) {
    console.error(chalk.red(e))
  }
}

export class Sockets {
  private readonly io: Server;
  constructor(server: http.Server) {
    this.io = new SocketIO.Server(server, ({
      cors: {
        origin: CORS.origin,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: CORS.credentials
      },
      path: '/socket-io',
      transports: ['polling']
    }));
    console.log(chalk.bgYellow.black('Websocket Initialized!'));
    setIoInstance(this.io);
  }
  connect(): void {
    this.io.on('connection', async (socket: Socket) => {
      console.log(chalk.bgYellow.black(`Client #${socket.id} Connected.`))
      setSocketInstance(socket);

      socket.on('join', (res) => {
        console.log(chalk.bgYellow.black(`Client #${socket.id} joined: ${res}  \n`));
        socket.join(res);
      });
      socket.on('disconnect', reason => {
        console.log(chalk.bgYellow.black(`Client #${socket.id} Disconnected: ${reason}. \n`))
      });
    })
  }
}
