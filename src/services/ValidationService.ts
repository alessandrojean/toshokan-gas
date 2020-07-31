namespace ValidationService {
  export function validateIsbn(isbn: string): boolean {
    if (isbn.length !== 10 && isbn.length !== 13) {
      return false
    }
    
    if (!isbn.match(/^[0-9]{13}$|^[0-9]{9}[0-9xX]{1}$/)) { 
      return false
    }
    
    if (isbn.length === 10) {
      const sum = isbn.split('')
        .map((d, i) => (10 - i) * (d === 'X' ? 10 : parseInt(d)))
        .reduce((acm, cv) => acm + cv)
      
      return sum % 11 === 0
    }
    
    const sum = isbn.split('')
      .map((d, i) => (((i + 1) % 2 === 0) ? 3 : 1) * parseInt(d))
      .reduce((acm, cv) => acm + cv)
    
    return sum % 10 === 0
  }

  export function validateIssn(issn: string): boolean {
    if (!issn.match(/^[0-9]{7}[0-9xX]{1}$/)) {
      return false
    }
    
    const withoutDigit = issn.slice(0, -1)
    let calcDigit = withoutDigit.split('')
      .map((d, i) => parseInt(d) * (8 - i))
      .reduce((acm, cv) => acm + cv, 0)
    calcDigit = calcDigit % 11
    calcDigit = calcDigit !== 0 ? 11 - calcDigit : calcDigit
    const calcDigitStr = calcDigit === 10 ? 'X' : calcDigit.toString()
      
    return calcDigitStr === issn.slice(-1)
  }

  export function validateEan(ean: string): boolean {
    if (!ean.match(/^\d{13}$/)) {
      return false 
    }
    
    const withoutDigit = ean.slice(0, -1)
    const checkSum = withoutDigit.split('')
      .map((d, i) => parseInt(d) * (i % 2 == 0 ? 3 : 1))
      .reduce((acm, cv) => acm + cv, 0)
      
    return (10 - (checkSum % 10)) % 10 === parseInt(ean.slice(-1))
  }
}
