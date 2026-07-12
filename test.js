import pino from 'pino'
import dotenv from "dotenv";
dotenv.config();
const transport = pino.transport({
  target: 'pino-loki',
  options: {
    host: 'https://logs-prod-042.grafana.net',
    basicAuth: {
      username: process.env.GRAFANA_LOKI_USERNAME,
      password: process.env.GRAFANA_LOKI_PASSWORD,
    },
    labels: { job: 'pino-test' },
    batching: false,   // send immediately, no delay
    silenceErrors: false,
  },
})

transport.on('error', (err) => console.error('TRANSPORT ERROR:', err))

const logger = pino(transport)
logger.info('hello from pino-loki test')

setTimeout(() => process.exit(), 3000)