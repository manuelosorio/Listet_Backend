import express from 'express';
import Flash from 'express-flash';
import http from 'http';
import helmet from 'helmet';
import environment from './environments/environment';
import { APP, variables } from './environments/variables';
import listApi from './api/lists.api';
import tokensApi from './api/tokens.api';
import userApi from './api/user.api';
import searchApi from './api/search.api';
import { Sockets } from './utilities/sockets';
import { ok } from './utilities/response';

// if (variables.nodeEnv === 'production') {
//   console.log = () => {
//     return;
//   };
// }
const app = express();

const server = new http.Server(app);

app.set('port', variables.port || 3000);
app.set('trust proxy', APP.trustProxy);
app.use(helmet());
app.use(
  express.json({
    limit: APP.requestLimit,
    strict: true,
  })
);
app.get('/health', (req, res) => {
  const data = {
    uptime: process.uptime(),
    message: 'Ok',
    date: new Date(),
  };

  ok(res, data);
});
app.use(environment);
app.use(Flash() as any);
app.use(userApi);
app.use(listApi);
app.use(tokensApi);
app.use('/search', searchApi);

if (APP.debug) {
  app.get('/debug/proxy', (req, res) => {
    ok(res, {
      protocol: req.protocol,
      secure: req.secure,
      host: req.get('host'),
      xForwardedProto: req.get('x-forwarded-proto'),
      xForwardedPort: req.get('x-forwarded-port'),
      xForwardedFor: req.get('x-forwarded-for'),
    });
  });
}

app.use(errorHandler);

new Sockets(server).connect();
server.listen(app.get('port'), () => {
  console.log('Server listening on port ' + app.get('port'));
});

export function errorHandler(err: any, req: any, res: any, _next: any) {
  console.error('🔥 API ERROR:', {
    method: req.method,
    url: req.originalUrl,
    message: err?.message,
    stack: err?.stack,
  });

  if (res.headersSent) return;

  res.status(err?.statusCode ?? 500).json({
    message: err?.message ?? 'Internal Server Error',
  });
}
