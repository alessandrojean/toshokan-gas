/**
 * @OnlyCurrentDoc Limits the script to only accessing the current sheet.
 */

function onOpen() {
  const ui = SpreadsheetApp.getUi()

  ui.createMenu('Toshokan')
    .addItem('Adicionar…', 'displayCreationModal')
    .addItem('Editar…', 'displayEditionModal')
    .addSeparator()
    .addSubMenu(
      ui.createMenu('Exportar')
        .addItem('Libib', 'exportToLibib')
    )
    .addSeparator()
    .addItem('Configurações', 'displaySettingsModal')
    .addToUi();
}

// HTML Template Helper Functions

function include(fileName: string): string {
  return HtmlService
    .createHtmlOutputFromFile(fileName)
    .getContent()
}

function includeComponent(component: string): string {
  return HtmlService
    .createHtmlOutputFromFile(`src/components/${component}`)
    .getContent()
}

function includeJson(name: string, content: any): string {
  return `
    <script type="application/json" id="${name}-json">
      ${JSON.stringify(content)}
    </script>
  `
}

function includeJsDependencies(): string {
  const cdn = 'https://cdn.jsdelivr.net/npm'

  const dependencies = [
    { package: 'vue@2.6.12', file: 'dist/vue.js' },
    { package: 'vuex@3.5.1', file: 'dist/vuex.js' },
    { package: 'vuelidate@0.7.6', file: 'dist/vuelidate.min.js' },
    { package: 'vuelidate@0.7.6', file: 'dist/validators.min.js' },
    { package: 'slugify@1.4.6', file: 'slugify.min.js' },
    { package: 'marked@1.2.4', file: 'marked.min.js' }
  ]

  return dependencies
    .map(({ package, file }) => {
      return `<script src="${cdn}/${package}/${file}"></script>`
    })
    .join('\n')
}

function includeCssDependencies(): string {
  const prefetch = [
    'cdn.jsdelivr.net',
    'rsms.me',
    'use.fontawesome.com',
    'fonts.googleapis.com'
  ]

  const dependencies = [
    'https://cdn.jsdelivr.net/npm/bulma@0.9.1/css/bulma.min.css',
    'https://rsms.me/inter/inter.css',
    'https://fonts.googleapis.com/css2?family=Roboto+Mono:ital@0;1&display=swap',
    'https://use.fontawesome.com/releases/v5.3.1/css/all.css'
  ]

  const prefetchTags = prefetch.map(host => {
    return `<link rel="dns-prefetch" href="//${host}/">`
  })

  const dependenciesTags = dependencies.map(url => {
    return `<link href="${url}" rel="stylesheet">`
  })

  return prefetchTags.join('\n') + '\n' + dependenciesTags.join('\n')
}

// WebApp/API stuff

// function doPost(event: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput {
//   return ApiService.handlePost(event)
// }
