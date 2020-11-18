function displayEditionModal() {
  const sheet = SpreadsheetApp.getActiveSheet()
  const row = sheet.getActiveCell().getRow()
  
  const file = 'src/frontend/html/ModalEdition/Modal'
  const htmlTemplate = HtmlService.createTemplateFromFile(file)
  htmlTemplate.book = findBookByRow(row)
  htmlTemplate.properties = Utils.getAppProperties()
  htmlTemplate.entityUniqueProperties = DatabaseService.getEntityUniqueProperties()
  
  const html = htmlTemplate.evaluate()
    .setWidth(1000)
    .setHeight(700)
  
  SpreadsheetApp.getUi()
    .showModalDialog(html, 'Editar…')  
}

function findBookByRow(row: number): BookModel.Book {
  const pagination = Utils.getPagination(row)
   
  const bookRow = SpreadsheetApp.getActiveSheet()
    .getRange(row, 2, 1, 9)
    .getDisplayValues()[0]  
  const book = BookModel.Book.createFromRow(bookRow)
  Object.assign(book, { row, pagination, ...findAdditionalData(book) })
   
  return book
}

function findCover(book: BookModel.Book, forceAmazon?: boolean): string | null {
  return CoverService.findCover(book, forceAmazon)
}

function findAdditionalData(book: BookModel.Book): BookModel.IBookAdditionalData {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('AddInfo')
  
  const bookId = book.getBookId()
  const match = sheet.createTextFinder(bookId).findNext()
  
  if (match) {
    const matchRow = match.getRow()
    const data = sheet.getRange(matchRow, 2, 1, 2).getDisplayValues()[0]
    
    return {
      id: data[0],
      coverUrl: data[1]
    }
  }
  
  return { id: bookId }
}

function updateAdditionalRow(additional: BookModel.IBookAdditionalData) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('AddInfo')
  
  const additionalArr = [additional.id, additional.coverUrl]
  const match = sheet.createTextFinder(additional.id).findNext()

  let rowToUpdateOrInsert = 5
  
  if (match) {
    rowToUpdateOrInsert = match.getRow()
  } else {
    sheet.insertRowBefore(rowToUpdateOrInsert) 
  }
  
  sheet.getRange(rowToUpdateOrInsert, 2, 1, 2)
    .setValues([additionalArr])
}

function updateEntryRow(row: number, data: string[], additional: BookModel.IBookAdditionalData) {
  updateAdditionalRow(additional)
  
  const sheet = SpreadsheetApp.getActiveSheet()
    
  const range = sheet.getRange(row, 2, 1, 9)
  range.setValues([data])
  
  const [currency, value] = data[6].split(' ')
  const priceCell = sheet.getRange(row, 8)
  const format = Utils.getNumberFormatForCurrency(currency)
  
  priceCell.setNumberFormat(format)
  priceCell.setValue(parseFloat(value.replace(',', '.')))
    
  sheet.setActiveRange(range)
}

function deleteEntryRow(row: number, id: string) {
  SpreadsheetApp.getActiveSheet()
    .deleteRow(row)
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('AddInfo')
    
  const match = sheet.createTextFinder(id).findNext()
  
  if (match) {
    sheet.deleteRow(match.getRow()) 
  }
}
