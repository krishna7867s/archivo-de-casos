# Archivo de casos

Catálogo de fans de Danganronpa con datos públicos de Supabase y un archivo privado de cuentas y notas en Node.js.

## Desarrollo local

Usá Node.js 24.7 o posterior dentro de la serie 24.

```sh
npm ci
npm run dev
npm test
```

Vite sirve el sitio y la API local. La base de datos y la llave de desarrollo se guardan en `.vault/`.

## Railway Free desde GitHub

1. Vinculá la CLI al proyecto en Railway. Aplicá `.railway/railway.ts` con `railway config apply` para crear el servicio conectado a `krishna7867s/archivo-de-casos` en `main`, configurar `/health` y montar su volumen persistente en `/data`.
2. Generá un dominio de Railway en **Settings → Networking**. El servidor usa el volumen para SQLite y el dominio para el origen HTTPS.
3. Guardá `VAULT_KEY` y `SUPABASE_SERVER_KEY` en **Variables** del servicio. La primera es una llave de 32 bytes codificados en Base64, que debe mantenerse estable entre despliegues. La segunda es la clave privada del proyecto Supabase que permite ejecutar el sorteo de talentos. Hasta que se configure, el sitio público sigue disponible y el registro devuelve un aviso.
4. Para habilitar la recuperación de contraseña, configurá `RESEND_API_KEY` y `MAIL_FROM` con un remitente verificado. El servidor usa HTTPS para enviar el correo en Railway.
5. Aplicá los cambios y comprobá que la portada abra por HTTPS y que `/health` devuelva `{"status":"ok"}`.

La base de Railway se inicializa en el volumen del servicio. Las cuentas locales se quedan en `.vault/`.

El plan Free incluye un dominio de Railway, un volumen y $1 de uso mensual. Consultá el saldo en el workspace. [Plan Free](https://docs.railway.com/pricing/free-plan)

Railway despliega los cambios de la rama conectada. Para los detalles de configuración, consultá [GitHub Autodeploys](https://docs.railway.com/deployments/github-autodeploys) y [red saliente de Railway](https://docs.railway.com/networking/outbound-networking).
