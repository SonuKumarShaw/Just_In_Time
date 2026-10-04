const http = require('http');
const server = http.createServer((req, res) => res.end('hi'));
server.listen(4006, () => console.log('Pure Node Listening 4006'));
process.on('exit', c => console.log('Exit:', c));
