namespace ApiService {
  interface Request {
    parameters: Record<string, any>
  }

  interface Routes {
    [key: string]: (request: Request) => GoogleAppsScript.Content.TextOutput
  }

  const routes: Routes = {
    'isbn/find': ({ parameters }) => {
      const { isbn } = parameters

      if (!isbn) {
        return responseWithError('Missing isbn')
      }

      try {
        const result = searchForCreation(isbn)
        
        return responseWithJson(result)
      } catch (error) {
        return responseWithError(error)
      }
    }
  }

  function responseWithJson(json: any): GoogleAppsScript.Content.TextOutput {
    const jsonString = JSON.stringify(json)

    return ContentService.createTextOutput(jsonString)
      .setMimeType(ContentService.MimeType.JSON)
  }

  function responseWithError(errorMsg: string): GoogleAppsScript.Content.TextOutput {
    return responseWithJson({ error: errorMsg })
  }

  export function handleGet(event: GoogleAppsScript.Events.DoGet) {

  }

  export function handlePost(event: GoogleAppsScript.Events.DoPost) {
    const contentType = event.postData.type

    if (contentType === 'application/json') {
      const jsonData = JSON.parse(event.postData.contents)

      if (!jsonData.route) {
        return responseWithError('Route missing')
      }

      const routeHandler = routes[jsonData.route]

      if (!routeHandler) {
        return responseWithError('Route not found')
      }

      return routeHandler({ parameters: jsonData })
    }

    return responseWithError('Content type not supported')
  }
}
