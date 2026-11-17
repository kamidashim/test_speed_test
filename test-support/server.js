import http from 'node:http';

export const PAYLOAD_SIZE = 256 * 1024;

export async function startServer() {
  const payload = Buffer.alloc(PAYLOAD_SIZE, 1);

  const server = http.createServer((request, response) => {
    switch (request.url) {
      case '/file':
        response.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'Content-Length': payload.length,
        });
        response.end(payload);
        break;
      case '/stall':
        response.writeHead(200, { 'Content-Length': payload.length });
        response.write(payload.subarray(0, 1024));
        break;
      default:
        response.writeHead(404);
        response.end();
    }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      }),
  };
}
