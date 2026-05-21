const http = require('http');

function request(path, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: Number(process.argv[2] || 3001),
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          resolve({ statusCode: res.statusCode, headers: res.headers, body });
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTest(route) {
  const res = await request(route, JSON.stringify({ username: 'verceluser', password: 'test1234' }));
  console.log(`POST ${route}`);
  console.log(res);
}

(async () => {
  try {
    await runTest('/api/register');
    await runTest('/api/register.js');
    await runTest('/api/login');
    await runTest('/api/login.js');
  } catch (err) {
    console.error(err);
  }
})();
