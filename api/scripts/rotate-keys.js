import fs from 'fs';
import crypto from 'crypto';

const generateKey = () => crypto.randomBytes(32).toString('hex');

const updateEnv = () => {
  const envPath = '.env';
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const newEnv = envContent
    .replace(/OLD_API_KEY=.*\n/, `OLD_API_KEY=${process.env.CURRENT_API_KEY}\n`)
    .replace(/CURRENT_API_KEY=.*\n/, `CURRENT_API_KEY=${generateKey()}\n`)
    .replace(/LAST_ROTATION=.*\n/, `LAST_ROTATION=${Date.now()}\n`);

  fs.writeFileSync(envPath, newEnv);

  process.kill(process.pid, 'SIGHUP');
};

updateEnv();