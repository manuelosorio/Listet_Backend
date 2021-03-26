import SocketIO, { Server, Socket } from "socket.io";
import http from "http";
import chalk from "chalk";
import { CORS } from "../environments/variables";
import { CommentEvents } from "../events/comment.events";
import { ListItemEvents } from "../events/list-item.events";

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

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const emit = (event: string | CommentEvents | ListItemEvents, data) => {
  const io = getIoInstance();
  try {
    switch (event) {
      case ListItemEvents.COMPLETE_ITEM: {
        io.sockets.to(`${data.username}-${data.slug}`).emit(event, data);
        break;
      }
      case ListItemEvents.DELETE_ITEM: {
        console.log(chalk.bgCyan.black(event, 'emitted'));
        io.sockets.emit(event, data);
        break;
      }
      default: {
        console.log(chalk.bgCyan.black(event, 'emitted'));
        io.to(data.listInfo).sockets.emit(event, data);
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
