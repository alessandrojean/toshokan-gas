/**
 * @OnlyCurrentDoc Limits the script to only accessing the current sheet.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Toshokan')
    .addItem('Adicionar…', 'displayCreationModal')
    .addItem('Editar…', 'displayEditionModal')
    .addSeparator()
    .addItem('Configurações', 'displaySettingsModal')
    .addToUi();
}
