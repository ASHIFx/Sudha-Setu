const KEEP_ALIVE_INTERVAL_MS = 12 * 60 * 1000;

const getHealthUrl = () => {
  const baseUrl = process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 5000}`;
  return `${baseUrl.replace(/\/$/, '')}/api/health`;
};

const pingHealthEndpoint = async () => {
  try {
    const response = await fetch(getHealthUrl());
    if (!response.ok) {
      console.warn(`[cron] health check returned HTTP ${response.status}`);
      return;
    }
    console.log('[cron] backend health check passed');
  } catch (error) {
    console.warn(`[cron] backend health check failed: ${error.message}`);
  }
};

export const startKeepAlive = () => {
  if (process.env.NODE_ENV === 'test') return null;

  const timer = setInterval(pingHealthEndpoint, KEEP_ALIVE_INTERVAL_MS);
  timer.unref();
  console.log(`[cron] keep-alive enabled: every ${KEEP_ALIVE_INTERVAL_MS / 60000} minutes`);
  return timer;
};

export default startKeepAlive;
