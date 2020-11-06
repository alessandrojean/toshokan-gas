namespace DatabaseService {
  function getUniquePropertyValues(range: string): string[] {
    const actualEntity = SpreadsheetApp.getActiveSheet()
    const allPropertyValues = actualEntity
      .getRange(range)
      .getDisplayValues()
      .map(row => row[0])
      .filter((imprint, i, self) => {
        return imprint.length > 0 && self.indexOf(imprint) === i
      })
      .sort()

    return allPropertyValues
  }

  export function getEntityImprints(): string[] {
    return getUniquePropertyValues('E5:E')
  }

  export function getEntityStores(): string[] {
    return getUniquePropertyValues('I5:I')
  }

  export interface UniqueProperties {
    imprints: string[];
    stores: string[]
  }

  export function getEntityUniqueProperties(): UniqueProperties {
    return {
      imprints: getEntityImprints(),
      stores: getEntityStores()
    }
  }
}
