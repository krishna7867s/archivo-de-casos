import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import express from 'express';
import { createVault, smtpDelivery } from './vault.mjs';

const production = process.env.NODE_ENV === 'production';
const filename = resolve(process.env.VAULT_DB || '.vault/securevault.sqlite');
const origin = new URL(process.env.APP_ORIGIN || 'http://localhost:5173').origin;
if (production && (!process.env.VAULT_DB || !process.env.APP_ORIGIN || !process.env.SUPABASE_SERVER_KEY)) {
  throw new Error('Configurá VAULT_DB, APP_ORIGIN y SUPABASE_SERVER_KEY.');
}
mkdirSync(dirname(filename), { recursive: true });
const vault = await createVault({
  filename, origin, production, key: Buffer.from(process.env.VAULT_KEY || '', 'base64'),
  proxy: process.env.TRUST_PROXY === '1', deliverReset: smtpDelivery(process.env),
});
if (process.argv[2] === 'promover') {
  vault.provisionAdmin(process.argv[3]);
  vault.db.close();
} else {
  vault.app.use(express.static(resolve('dist')));
  vault.app.use(vault.handleError);
  const server = vault.app.listen(Number(process.env.PORT || 3001), process.env.BIND_HOST || (production ? '0.0.0.0' : '127.0.0.1'));
  server.requestTimeout = 15000;
  process.on('unhandledRejection', () => {
    console.error(JSON.stringify({ type: 'promesa_no_controlada' }));
    process.exit(1);
  });
}
