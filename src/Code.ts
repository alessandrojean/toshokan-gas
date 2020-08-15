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
