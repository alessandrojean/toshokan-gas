function displayCreationModal() {
  const htmlTemplate = HtmlService.createTemplateFromFile('src/modal/ModalCreationHtml')
  htmlTemplate.properties = Utils.getAppProperties()
  htmlTemplate.entityUniqueProperties = DatabaseService.getEntityUniqueProperties()

  const html = htmlTemplate.evaluate()
    .setWidth(800)
    .setHeight(600)
  
  SpreadsheetApp.getUi()
    .showModalDialog(html, 'Adicionar…')
}

function searchOccurrencies(bookProperties: BookModel.IBookProperties): BookModel.Book | null {
  const book = new BookModel.Book(bookProperties)

  const allEntries = SpreadsheetApp.getActiveSheet()
    .getRange('B5:J')

  const allBooks = allEntries.getDisplayValues()
    .map(BookModel.Book.createFromRow)

  const possibleMatches = allBooks
    .map((b, i) => ({ book: b, index: i }))
    .filter(({ book: b }) => b.isBefore(book))

  if (possibleMatches.length) {
    const { book: bookBefore, index } = possibleMatches.pop()

    const bookNumber = book.getTitleNumber()
    bookBefore.setTitleNumber(bookNumber)
    bookBefore.rowBefore = allEntries.getRow() + index

    return bookBefore
  }

  return null
}

interface ICreationResult {
  bookResult: BookModel.Book,
  sheetResult?: BookModel.Book
}

function searchForCreation(isbn: string): ICreationResult {
  const result = CblService.searchByIsbn(isbn)

  if (!result) {
    throw 'Nenhum resultado encontrado.'
  }

  const sheetResult = searchOccurrencies(result)

  return {
    bookResult: result,
    sheetResult
  }
}

function findRowBefore(data: string[]) {
  const book = BookModel.Book.createFromRow(data)

  const allEntries = SpreadsheetApp.getActiveSpreadsheet()
    .getActiveSheet()
    .getRange('B5:J')

  const allBooks = allEntries.getDisplayValues()
    .map(BookModel.Book.createFromRow)
    .map((b, index) => ({ book: b, index }))

  const rowBefore = allBooks.find(({ book: b }) => {
    return book.title.localeCompare(b.title) <= 0
  })
    
  return allEntries.getRow() + (rowBefore ? rowBefore.index : 0) - 1
}

function createEntryRow(data: string[], rowBefore?: number) {
  if (!rowBefore) {
    rowBefore = findRowBefore(data)
  }

  const sheet = SpreadsheetApp.getActiveSheet()
  sheet.insertRowAfter(rowBefore)

  const range = sheet.getRange(rowBefore + 1, 2, 1, 9)
  range.setValues([data])

  sheet.setActiveRange(range)
}