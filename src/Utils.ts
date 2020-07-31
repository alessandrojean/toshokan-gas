namespace Utils {
  export function slugify(string: string): string {
    return string.normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s$*_+~.()'"!\-:@]+/g, '')
      .trim()
      .replace(/[\s-]+/g, '-')
      .toLowerCase() 
  }

  export function convertIsbn13ToIsbn10(isbn13: string): string {
    const equalPart = isbn13.slice(3, -1)
    const lastDigit = equalPart.split('')
      .map((d, i) => parseInt(d) * (i + 1))
      .reduce((acm, crr) => acm + crr, 0)
      
    return equalPart + (lastDigit % 11)
  }

  export function getAppProperties() {
    return {
      script: PropertiesService.getScriptProperties().getProperties(),
      user: PropertiesService.getUserProperties().getProperties()
    }
  }

  export interface IPagination {
    hasPrevious: boolean,
    hasNext: boolean,
    current: number,
    last: number
  }

  export function getPagination(row: number): IPagination {
    const hasPrevious = row > 5
    const hasNext = SpreadsheetApp.getActiveSheet()
      .getRange('B5:B')
      .getValues()
      .filter(String)
    
    return {
      hasPrevious,
      hasNext: row < 4 + hasNext.length,
      current: row - 4,
      last: hasNext.length
    }
  }
}
