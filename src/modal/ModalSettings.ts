function displaySettingsModal() {
  const sheet = SpreadsheetApp.getActiveSheet()
  
  const htmlTemplate = HtmlService.createTemplateFromFile('src/modal/ModalSettingsHtml')
  htmlTemplate.properties = Utils.getAppProperties()
  
  const html = htmlTemplate.evaluate()
    .setWidth(1000)
    .setHeight(630)
  
  SpreadsheetApp.getUi()
    .showModalDialog(html, 'Configurações')  
}

interface IAppProperties {
  [key: string]: {
    [key: string]: any
  }
}

function updateSettings(propertiesToUpdate: IAppProperties) {
  const properties = {
    script: PropertiesService.getScriptProperties(),
    user: PropertiesService.getUserProperties()
  }
  
  Object.entries(propertiesToUpdate)
    .forEach(([scope, value]) => properties[scope].setProperties(value))
}