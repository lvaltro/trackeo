// server/ecosystem.config.js
// Configuración PM2 para Trackeo.cl backend.
// Uso:
//   pm2 start ecosystem.config.js          # Primera vez
//   pm2 restart app-trackeo --update-env   # Deploy posterior
//   pm2 save                               # Persistir lista de procesos

module.exports = {
  apps: [
    {
      name:             'app-trackeo',
      script:           'index.js',
      cwd:              '/root/personas-trackeo/server',
      instances:        1,
      exec_mode:        'fork',

      // Variables de entorno base (los valores reales vienen de server/.env,
      // que el proceso carga al arrancar desde el propio index.js)
      env: {
        NODE_ENV: 'production',
      },

      // Logs — el directorio logs/ se crea automáticamente al arrancar
      error_file:       '/root/personas-trackeo/server/logs/pm2-error.log',
      out_file:         '/root/personas-trackeo/server/logs/pm2-out.log',
      log_date_format:  'YYYY-MM-DD HH:mm:ss Z',
      merge_logs:       true,

      // Política de restart — evita restart loop en errores de config
      restart_delay:    3000,    // ms antes de reintentar
      max_restarts:     5,       // máximo de reinicios en ventana de tiempo
      min_uptime:       '10s',   // debe estar vivo al menos 10s para contar como "stable"

      // No watchear archivos (el deploy reinicia manualmente)
      watch:            false,

      // Tiempo máximo para que el proceso levante
      listen_timeout:   8000,
      kill_timeout:     5000,
    },
  ],
};
