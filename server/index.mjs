import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import express from 'express';
import { createVault, resendDelivery, smtpDelivery } from './vault.mjs';

const railway = Boolean(process.env.RAILWAY_ENVIRONMENT_ID);
const production = railway || process.env.NODE_ENV === 'production';
const volume = process.env.RAILWAY_VOLUME_MOUNT_PATH;
const databasePath = process.env.VAULT_DB || (railway && volume && resolve(volume, 'securevault.sqlite'));
const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN;
const publicOrigin = process.env.APP_ORIGIN || (railway && railwayDomain && `https://${railwayDomain}`);
if (production && !databasePath) throw new Error('Configurá VAULT_DB o adjuntá el volumen de Railway.');
if (production && !publicOrigin) throw new Error('Configurá APP_ORIGIN o generá el dominio público de Railway.');
if (production && !process.env.SUPABASE_SERVER_KEY) throw new Error('Configurá SUPABASE_SERVER_KEY.');
const filename = resolve(databasePath || '.vault/securevault.sqlite');
const origin = new URL(publicOrigin || 'http://localhost:5173').origin;
mkdirSync(dirname(filename), { recursive: true });
const vault = await createVault({
  filename, origin, production, key: Buffer.from(process.env.VAULT_KEY || '', 'base64'),
  proxy: process.env.TRUST_PROXY ? process.env.TRUST_PROXY === '1' : railway,
  internalHealthHost: railway ? 'healthcheck.railway.app' : undefined,
  deliverReset: resendDelivery(process.env) ?? (railway ? undefined : smtpDelivery(process.env)),
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
