const { Readable } = require("stream");
const register = require("../api/register");
const login = require("../api/login");
const { saveUsers } = require("../api/utils");

function makeReq(method, url, body) {
  const req = new Readable({ read() {} });
  req.method = method;
  req.url = url;
  req.headers = { "content-type": "application/json" };
  process.nextTick(() => {
    if (body) req.push(body);
    req.push(null);
  });
  return req;
}

function makeRes(callback) {
  const res = {
    statusCode: 200,
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
    },
    end(chunk) {
      callback(this.statusCode, this.headers, chunk && chunk.toString());
    }
  };
  return res;
}

(async () => {
  // clear users file
  saveUsers([]);

  console.log('=== register ===');
  register(makeReq('POST','/api/register', JSON.stringify({ username:'alice', password:'pass' })), makeRes((status, headers, body) => {
    console.log(status, headers, body);

    console.log('=== login success ===');
    login(makeReq('POST','/api/login', JSON.stringify({ username:'alice', password:'pass' })), makeRes((status2, headers2, body2) => {
      console.log(status2, headers2, body2);

      console.log('=== login fail ===');
      login(makeReq('POST','/api/login', JSON.stringify({ username:'alice', password:'wrong' })), makeRes((status3, headers3, body3) => {
        console.log(status3, headers3, body3);
      }));
    }));
  }));
})();
