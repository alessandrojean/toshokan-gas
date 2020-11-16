namespace UpdaterService {
  const VERSION = '0.1.1'
  const ENVIRONMENT = 'development'

  export function getAppInfo() {
    return { version: VERSION, environment: ENVIRONMENT }
  }
}
