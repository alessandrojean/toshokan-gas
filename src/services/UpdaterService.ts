namespace UpdaterService {
  const VERSION = '0.1.5'
  const ENVIRONMENT = 'development'

  export function getAppInfo() {
    return { version: VERSION, environment: ENVIRONMENT }
  }
}
