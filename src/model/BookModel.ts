namespace BookModel {
  export class Book {
    isbn: string
    title: string
    authors: string
    imprint: string
    size: BookSize
    status: string
    price: IBookPrice
    store: string
    date: string
    date8601: string
  
    titleParts: string[]
    isbnType: IsbnTypes
    rowBefore?: number

    // Additional info table.
    id?: string
    coverUrl?: string

    row?: number
    pagination?: Utils.IPagination
  
    constructor(properties: IBookProperties) {
      Object.assign(this, properties)
  
      this.titleParts = this.getTitleParts()

      if (this.isbn) {
        this.isbnType = this.getIsbnType()
      }
    }
  
    static createFromRow(bookRow: string[]): Book {
      const size = bookRow[4].split(' × ')
      const price = bookRow[6].split(' ')
  
      const properties = {
        isbn: bookRow[0],
        title: bookRow[1],
        authors: bookRow[2],
        imprint: bookRow[3],
        size: new BookSize(size[0], size[1]),
        status: bookRow[5],
        price: {
          currency: price[0],
          value: price[1]
        },
        store: bookRow[7],
        date: bookRow[8],
        date8601: bookRow[8] 
          ? bookRow[8].split('/').reverse().join('-') 
          : bookRow[8]
      }
  
      return new Book(properties)
    }
  
    getBookId(): string {
      const number = this.getTitleNumber() || '01'
    
      let code = this.isbn
      if (code === 'N/A') {
        const titleSlug = Utils.slugify(this.title).toUpperCase()
        const titleFixedSize = titleSlug.length > 13 
          ? titleSlug.substring(0, 13) : titleSlug
        code = this.imprint.toUpperCase().substring(0, 3) + '-' + titleFixedSize
      }
      
      return `${code}_${number}`
    }
  
    getIsbnType(): IsbnTypes {
      const identification = this.isbn.replace(/-/g, '')
    
      if (identification.match(/^789/) /* && ValidationService.validateEan(identification) */) {
        return 'EAN-13'  
      }
      
      if (ValidationService.validateIsbn(identification)) {
        return identification.length === 13 ? 'ISBN-13' : 'ISBN-10' 
      }
      
      if (ValidationService.validateIssn(identification)) {
        return 'ISSN' 
      }
      
      return this.isbn !== 'N/A' ? 'ID' : 'N/A' 
    }
  
    isBefore(otherBook: Book): boolean {
      const titleParts = this.getTitleParts()
      const otherTitleParts = otherBook.getTitleParts()
      
      const conditions = [
        titleParts[0].toLowerCase() === otherTitleParts[0].toLowerCase(),
        parseInt(titleParts[1]) < parseInt(otherTitleParts[1]),
        this.shareAuthorsWith(otherBook),
        this.imprint.toLowerCase() === otherBook.imprint.toLowerCase()
      ]
              
      return conditions.every(v => v)
    }
  
    checkParity(otherBook: Book): boolean {
      const conditions = [
        otherBook.imprint.toLowerCase() === this.imprint.toLowerCase(),
        otherBook.size.equals(otherBook.size)
      ]
      
      return conditions.some(c => c)
    }
  
    shareAuthorsWith(otherBook: Book) : boolean {
      const authors = this.authors.split(/\s*;\s*/)
      const otherAuthors = otherBook.authors.split(/\s*;\s*/)
      
      return authors.some(a => otherAuthors.indexOf(a) !== -1)
    }
  
    getTitleParts(): string[] {
      const titleRegex = /\s+#(\d+)(?:\:\s+)?/
      return this.title.split(titleRegex)
    }
  
    getTitleNumber(): string {
      const titleParts = this.getTitleParts()
    
      return titleParts[1]
    }
  
    setTitleNumber(number: string) {
      const titleParts = this.getTitleParts()
    
      if (titleParts) {
        const numberToPut = number ? ' #' + number.replace(/^(\d)$/, '0$1') : ''
        this.title = titleParts[0] + numberToPut
      }
    }
  }

  class BookSize {
    width: string
    height: string

    constructor (width: string, height: string) {
      this.width = width
      this.height = height
    }

    equals(other: BookSize): boolean {
      return (this.width === other.width) && (this.height === other.height)
    }

    compare(other: BookSize): number {
      const widthComparison = parseFloat(this.width) - parseFloat(other.width)
      const heightComparison = parseFloat(this.height) - parseFloat(other.height)
      
      return (heightComparison === 0) ? widthComparison : heightComparison
    }
  }

  interface IBookPrice {
    currency: string,
    value: string
  }

  type IsbnTypes = 'ISBN-13' | 'ISBN-10' | 'ISSN' | 'EAN-13' | 'ID' | 'N/A'

  export interface IBookProperties {
    isbn?: string
    title?: string
    authors?: string
    imprint?: string
    size?: BookSize
    status?: string
    price?: IBookPrice
    store?: string
    date?: string
    date8601?: string
  }

  export interface IBookAdditionalData {
    id?: string
    coverUrl?: string
  }

  export const PROPERTIES = {
    ISBN: 'isbn',
    TITLE: 'title'
  }
}
