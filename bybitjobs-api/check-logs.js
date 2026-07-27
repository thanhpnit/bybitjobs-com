const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Connection Ready. Fetching docker logs for bybitjobs-api from VPS...');
  
  conn.exec('docker logs bybitjobs-api --tail 50', (err, stream) => {
    if (err) {
      console.error('Error executing command:', err);
      conn.end();
      return;
    }
    stream.on('close', (code, signal) => {
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data);
    }).stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}).connect({
  host: '160.250.246.119',
  port: 22,
  username: 'root',
  password: 'Bybitjobs6789@#'
});
