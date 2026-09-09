import express from 'express';
import Flash from 'express-flash';
import http from 'http';
import helmet from 'helmet';
import environment from '#environments/environment';
import { APP, variables } from '#environments/variables';
import { Sockets } from '#utilities/sockets';
import { ok } from '#utilities/response';
import { connectRedis } from '#utilities/redis-client';

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

app.get('/health', (_req, res) => {
  ok(res, {
    uptime: process.uptime(),
    message: 'Ok',
    date: new Date(),
  });
});

app.use(environment);
app.use(Flash() as any);

async function bootstrap(): Promise<void> {
  await connectRedis();

  const [
    { globalApiLimiter },
    { default: userApi },
    { default: listApi },
    { default: tokensApi },
    { default: searchApi },
  ] = await Promise.all([
    import('#middleware/rate-limit.middleware'),
    import('#api/user.api'),
    import('#api/lists.api'),
    import('#api/tokens.api'),
    import('#api/search.api'),
  ]);

  app.use(globalApiLimiter);
  app.use(userApi);
  app.use(listApi);
  app.use(tokensApi);
  app.use('/search', searchApi);

  if (APP.debug) {
    app.get('/debug/proxy', (req, res) => {
      ok(res, {
        trustProxy: app.get('trust proxy'),
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
}

bootstrap().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
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
