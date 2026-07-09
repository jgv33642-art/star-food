import winston from 'winston';

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `[${info.timestamp}] [${info.level.toUpperCase()}]: ${info.message}`
  )
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      format
    )
  })
];

// Só usa arquivos de log se não estiver na Vercel
if (!process.env.VERCEL) {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format
    })
  );
  transports.push(
    new winston.transports.File({ 
      filename: 'logs/all.log',
      format
    })
  );
}

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format,
  transports,
});

// Captura erros fatais que não foram tratados e derrubariam o servidor sem logar
process.on('uncaughtException', (error) => {
  logger.error(`[UNCAUGHT EXCEPTION] ${error.message}\nStack: ${error.stack}`);
  // Em produção, você pode disparar um webhook para Discord/Slack aqui
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`[UNHANDLED REJECTION] Reason: ${reason}`);
  // Opcional: process.exit(1);
});
