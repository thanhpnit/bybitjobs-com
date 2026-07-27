const fs = require('fs');
const path = require('path');
const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Connection Ready. Updating .env on the VPS server...');
  
  const projectPath = '/root/bybitjobs-com';
  
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.error('.env file does not exist locally at:', envPath);
    conn.end();
    process.exit(1);
  }
  const envContent = fs.readFileSync(envPath, 'utf8');
  const base64Content = Buffer.from(envContent).toString('base64');
  
  const commands = [
    `mkdir -p "${projectPath}/bybitjobs-api"`,
    `echo "${base64Content}" | base64 -d > "${projectPath}/bybitjobs-api/.env"`,
    `echo "=== .env updated on VPS ==="`,
    `cd "${projectPath}" && git fetch origin && git reset --hard origin/main`,
    `cd "${projectPath}/bybitjobs-api" && docker compose down && docker compose build --no-cache && docker compose up -d`,
    `echo "=== Rebuilt without cache and restarted docker container on VPS ==="`,
    `docker ps`
  ].join(' && ');

  conn.exec(commands, (err, stream) => {
    if (err) {
      console.error('Error executing SSH command:', err);
      conn.end();
      return;
    }
    stream.on('close', (code, signal) => {
      console.log(`\nVPS Update finished with exit code ${code}`);
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
