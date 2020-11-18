namespace ExportService {
  const LIBIB_CSV_COLUMNS = [
    'ISBN 13',
    'ISBN 10',
    //'EAN',
    'Title',
    'Group',
    'Authors',
    //'Publisher',
    'Price',
    'Status',
    'Added Date'
  ]

  export function generateLibibCsv(books: BookModel.Book[]): String {
    const csvRows = books
      .filter(book => book.isbn !== 'N/A' && book.isbnType !== 'EAN-13')
      .map(book => {
        const values = [
          book.isbnType === 'ISBN-13' ? book.isbn.replace(/-/g, '') : '',
          book.isbnType === 'ISBN-10' ? book.isbn.replace(/-/g, '') : '',
          //book.isbnType === 'EAN-13' ? book.isbn.replace(/-/g, '') : '',
          '"' + book.title + '"',
          '"' + book.titleParts[0] + '"',
          '"' + book.authors.replace(/;\s+/g, ',') + '"',
          //book.imprint,
          parseFloat(book.price.value.replace(',', '.')),
          book.status === 'Lido' ? 'Completed' : 'Not Begun',
          book.date8601
        ]

        return values.join(',')
      })

    return LIBIB_CSV_COLUMNS.join(',') + '\n' + csvRows.join('\n')
  }
}

function exportToLibib() {
  const actualEntity = SpreadsheetApp.getActiveSheet()
  const allBooks = actualEntity
    .getRange('B5:J')
    .getDisplayValues()
    .filter(row => row[0].length > 0)
    .map(BookModel.Book.createFromRow)

  const csv = ExportService.generateLibibCsv(allBooks)

  const html = HtmlService.createHtmlOutput(`<pre>${csv}</pre>`)
    .setTitle('Resultado')

  SpreadsheetApp.getUi()
    .showModalDialog(html, 'Resultado')
}
