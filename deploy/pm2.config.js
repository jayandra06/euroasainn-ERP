/**
 * PM2 Configuration for Euroasiann ERP API
 */

module.exports = {
  apps: [
    {
      name: 'euroasiann-api',
      script: './apps/api/dist/main.js',
      cwd: '/var/www/euroasiann-erp',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/var/log/euroasiann-erp/api-error.log',
      out_file: '/var/log/euroasiann-erp/api-out.log',
      log_file: '/var/log/euroasiann-erp/api-combined.log',
      time: true,
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
    },
  ],
};
