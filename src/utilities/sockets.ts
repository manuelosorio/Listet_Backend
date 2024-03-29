import SocketIO, { Server, Socket } from 'socket.io';
import http from 'http';
import chalk from 'chalk';
import { CORS } from '../environments/variables';
import { CommentEvents } from '../helper/events/comment.events';
import { ListItemEvents } from '../helper/events/list-item.events';
import { ListCommentEmitter } from '../models/list-comment.model';
import { ListItemModel } from '../models/list-item.model';
import { ListEvents } from '../helper/events/list.events';
import { ListModel } from '../models/list.model';

export class Sockets {
  private static socketInstance: SocketIO.Socket;
  private static ioInstance: SocketIO.Server;
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
    Sockets.setIoInstance(this.io);
  }
  private static setSocketInstance(socket: SocketIO.Socket): void {
    this.socketInstance = socket;
  }

  public static getSocketInstance(): SocketIO.Socket {
    return this.socketInstance;
  }
  private static setIoInstance(io: SocketIO.Server): void {
    this.ioInstance = io;
  }
  public static getIoInstance(): SocketIO.Server {
    return this.ioInstance;
  }
  public connect(): void {
    this.io.on('connection', async (socket: Socket) => {
      console.log(chalk.bgYellow.black(`Client #${socket.id} Connected.`))
      Sockets.setSocketInstance(socket);

      socket.on('join', (res) => {
        console.log(chalk.bgYellow.black(`Client #${socket.id} joined: ${res}  \n`));
        return socket.join(res);
      });
      socket.on('disconnect', reason => {
        console.log(chalk.bgYellow.black(`Client #${socket.id} Disconnected: ${reason}. \n`))
      });
    })
  }


  public static emit = (event: string | ListEvents | CommentEvents | ListItemEvents, data: Partial<number | ListModel | ListCommentEmitter | ListItemModel> | any): void => {
    const io: SocketIO.Server = Sockets.ioInstance;
    try {
      switch (event) {
        case ListItemEvents.ADD_ITEM: {
          io.sockets.to((data as ListItemModel).slug).emit(event, data);
          break;
        }
        case ListItemEvents.COMPLETE_ITEM: {
          io.sockets.to((data as ListItemModel).slug).emit(event, data);
          break;
        }
        case CommentEvents.UPDATE_COMMENT:
        case ListItemEvents.UPDATE_ITEM: {
          io.sockets.emit(event, data);
          break;
        }
        case ListEvents.UPDATE_LIST: {
          console.log(chalk.bgCyan.black(event, 'emitted'));
          console.log(data);
          io.sockets.to((data as ListModel).prevSlug).emit(event, data);
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
}
