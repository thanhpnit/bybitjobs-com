const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH Connection Ready. Rebuilding Docker Containers...');
  
  const projectPath = '/root/bybitjobs-com';
  
  // Commands to build and deploy everything on the VPS using Docker Compose:
  // 1. Fetch and hard reset to match origin/main (GitHub)
  // 2. Rebuild and restart API docker container
  // 3. Rebuild and restart Web Admin docker container
  const commands = [
    `cd "${projectPath}"`,
    `git fetch origin`,
    `git reset --hard origin/main`,
    `echo "=== Rebuilding bybitjobs-api container ==="`,
    `cd "${projectPath}/bybitjobs-api" && docker compose down && docker compose up -d --build`,
    `echo "=== Rebuilding bybitjobs-web-admin container ==="`,
    `cd "${projectPath}/bybitjobs-web-admin" && docker compose down && docker compose up -d --build`,
    `echo "=== Docker Status ==="`,
    `docker ps`
  ].join(' && ');

  console.log(`Executing commands:\n${commands.replace(/ && /g, '\n')}`);
  
  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log(`\nDeployment finished with exit code ${code}`);
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
