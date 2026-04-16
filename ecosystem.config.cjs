/**
 * PM2 Ecosystem — Tu Socia!
 *
 * Mantiene activos en background:
 *   - tusocia-server   → Express webhook en puerto 3001
 *   - tusocia-frontend → Vite build servido en puerto 3000 (producción)
 *
 * Comandos rápidos:
 *   pm2 start ecosystem.config.cjs   → Arranca todo
 *   pm2 save                          → Persiste la lista de procesos
 *   pm2 startup                       → Genera hook para boot del sistema
 *   pm2 status                        → Ver estado
 *   pm2 logs tusocia-server           → Logs del backend
 *   pm2 restart all                   → Reiniciar todo
 */

module.exports = {
  apps: [
    // ─── 1. BACKEND — Express webhook ──────────────────────────────
    {
      name: 'tusocia-server',
      script: 'tsx',
      args: 'index.ts',
      cwd: './server',
      interpreter: 'none',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 3000,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_file: './server/.env',
      log_file: './logs/pm2-server.log',
      error_file: './logs/pm2-server-error.log',
      out_file: './logs/pm2-server-out.log',
      merge_logs: true,
      time: true,
      // Salud: si el servidor no responde, PM2 lo reinicia
      kill_timeout: 5000,
      listen_timeout: 10000
    },

    // ─── 2. FRONTEND — Vite en modo preview (producción) ───────────
    //     Para desarrollo local, puedes cambiar script/args a 'vite'
    {
      name: 'tusocia-frontend',
      script: 'npx',
      args: 'vite preview --port 3000 --host 0.0.0.0',
      cwd: './',
      interpreter: 'none',
      watch: false,
      autorestart: true,
      max_restarts: 5,
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production'
      },
      log_file: './logs/pm2-frontend.log',
      error_file: './logs/pm2-frontend-error.log',
      out_file: './logs/pm2-frontend-out.log',
      merge_logs: true,
      time: true
    }
  ]
};
