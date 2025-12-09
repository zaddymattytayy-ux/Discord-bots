module.exports = {
  apps: [
    {
      name: "OPAL-Ticket-System",
      cwd: "C:/Discord-bots/ticket-system/open-ticket",
      script: "index.js",
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "OPAL-Core-Bot",
      cwd: "C:/Discord-bots/opal-core",
      script: "node",
      args: "index.js",
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
