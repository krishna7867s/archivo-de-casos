import { randomBytes, randomInt } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createVault, drawTalent, smtpDelivery } from './vault.mjs';

export default function localVault() {
  return {
    name: 'securevault-local',
    apply: 'serve',
    async configureServer(server) {
      const directory = resolve(server.config.root, '.vault');
      await mkdir(directory, { recursive: true });
      const keyFile = resolve(directory, 'local.key');
      let key = process.env.VAULT_KEY && Buffer.from(process.env.VAULT_KEY, 'base64');
      if (!key) {
        try {
          await writeFile(keyFile, randomBytes(32), { flag: 'wx', mode: 0o600 });
        } catch (error) {
          if (error.code !== 'EEXIST') throw error;
        }
        key = await readFile(keyFile);
      }

      const talents = JSON.parse(await readFile(new URL('./local-talents.json', import.meta.url), 'utf8'));
      const origins = new Set();
      for (const base of ['http://localhost', 'http://127.0.0.1']) {
        const url = new URL(base);
        url.port = String(server.config.server.port ?? 5173);
        origins.add(url.origin);
      }
      const vault = await createVault({
        filename: process.env.VAULT_DB || resolve(directory, 'securevault.sqlite'),
        key,
        origin: process.env.APP_ORIGIN || [...origins][0],
        allowedOrigins: process.env.APP_ORIGIN ? [process.env.APP_ORIGIN] : origins,
        sort: process.env.SUPABASE_SERVER_KEY ? drawTalent : () => talents[randomInt(talents.length)],
        deliverReset: smtpDelivery(process.env),
      });
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0];
        if (path === '/health' || path === '/api' || path?.startsWith('/api/')) {
          return vault.app(req, res, next);
        }
        next();
      });
      server.httpServer?.once('close', () => vault.db.close());
    },
  };
}
