import { defineRailway, github, project, service, volume } from 'railway/iac';

export default defineRailway(() => {
  const data = volume('archivo-data', { sizeMB: 500 });
  const web = service('archivo-web', {
    source: github('krishna7867s/archivo-de-casos', { branch: 'main' }),
    build: 'npm run build',
    start: 'npm start',
    healthcheck: '/health',
    healthcheckTimeout: 60,
    volumeMounts: { '/data': data },
  });

  return project('archivo-de-casos', { resources: [web, data] });
});
