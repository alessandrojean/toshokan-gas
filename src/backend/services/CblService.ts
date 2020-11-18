namespace CblService {
  const CBL_URL = 'https://servicos.cbl.org.br'
  const API_URL = 'https://isbn-search-br.search.windows.net/indexes/isbn-index/docs/search?api-version=2016-09-01'
  const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36'
  const IMPRINT_REPLACEMENTS = {
    'Editora JBC': 'JBC',
    'INK': 'JBC',
    'New Pop Editora': 'NewPOP',
    'NewPOP Editora': 'NewPOP',
    'Panini Brasil': 'Panini',
    'Panini Comics': 'Panini',
    'Bernardo Ferreira de Santana Carvalho': 'Panini',
    'CONRAD': 'Conrad',
    'Editora Alto Astral': 'Alto Astral',
    'Editora Draco': 'Draco',
    'L&PM Editores': 'L&PM',
    'Pipoca e Nanquim': 'Pipoca & Nanquim',
    'Pipoca e Nanquim Editora LTDA': 'Pipoca & Nanquim',
    'Darkside Books': 'DarkSide',
    'Kleber de Sousa': 'Devir',
    'Verus Editora': 'Verus'
  }

  // Error messages.
  const INVALID_ISBN = 'O ISBN informado não é válido.'
  const QUERY_KEY_NOT_FOUND = 'Uma chave de acesso é necessária para a utilização da busca na CBL.'

  function fixBookProperties(book: CblBook): BookModel.Book {
    function fixTitle(title: string) {
      return title.trim()
        .replace(/(?:\:| -)? ?(?:v|vol|volume)?(?:\.|\:)? ?(\d+)$/i, ' #$1')
        .replace(/\#(\d{1})$/, '#0$1')
    }

    function fixImprint(imprint: string) {
      return IMPRINT_REPLACEMENTS[imprint] || imprint;
    }

    const properties = {
      isbn: book['RowKey'],
      title: fixTitle(book['Title']),
      authors: book['Authors'].join('; '),
      imprint: fixImprint(book['Imprint'])
    }

    return new BookModel.Book(properties)
  }

  function getQueryKey(): string | null {
    return PropertiesService.getUserProperties()
      .getProperty('CBL_QUERY_KEY')
  }

  function createSearchPayload(query: string, dataOptions: SearchPayloadProperties): SearchPayloadProperties {
    let payload: SearchPayloadProperties = {
      count: true,
      facets: ['Imprint,count:50', 'Authors,count:50'],
      filter: '',
      orderby: null,
      queryType: 'full',
      search: query,
      searchFields: 'FormattedKey,RowKey,Authors,Title,Imprint',
      searchMode: 'any',
      select: 'Authors,Colection,Countries,Date,Imprint,Title,RowKey,'
        + 'PartitionKey,RecordId,FormattedKey,Subject,Veiculacao',
      skip: 0,
      top: 12,
    }
    
    if (dataOptions) {
      payload = { ...payload, ...dataOptions } 
    }
    
    return payload
  }

  export function search(query = '', options: SearchOptions): SearchReturn {
    const queryKey = getQueryKey()

    if (!queryKey) {
      throw QUERY_KEY_NOT_FOUND
    }

    const dataPayload = createSearchPayload(query, options.dataOptions)
    const fetchOptions: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'Api-Key': queryKey,
        'Origin': CBL_URL,
        'User-Agent': USER_AGENT
      },
      contentType: 'application/json; charset=UTF-8',
      payload: JSON.stringify(dataPayload)
    }

    const response = UrlFetchApp.fetch(API_URL, fetchOptions)
    const jsonResponse: SearchResult = JSON.parse(response.getContentText())

    if (options.transformData) {
      return jsonResponse.value.map(fixBookProperties)
    }

    return jsonResponse.value
  }

  export function searchByIsbn(isbn: string): BookModel.Book | null {
    if (!ValidationService.validateIsbn(isbn)) {
      throw INVALID_ISBN
    }

    const searchResults = search(isbn, {
      dataOptions: { searchFields: 'FormattedKey,RowKey' },
      transformData: true
    })

    return searchResults.length ? (searchResults as BookModel.Book[])[0] : null
  }

  type SearchReturn = CblBook[] | BookModel.Book[]

  interface SearchOptions {
    transformData?: boolean,
    dataOptions?: SearchPayloadProperties
  }

  interface SearchPayloadProperties {
    count?: boolean,
    facets?: string[],
    filter?: string,
    orderby?: string,
    queryType?: string,
    search?: string,
    searchFields?: string,
    searchMode?: string,
    select?: string,
    skip?: number,
    top?: number
  }

  interface SearchResult {
    value: CblBook[]
  }

  interface CblBook {
    Authors: string[],
    Collection?: string,
    Countries: string[],
    Date: string,
    FormattedKey: string,
    Imprint: string,
    PartitionKey: string,
    RecordId?: string,
    RowKey: string,
    Subject: string,
    Title: string,
    Veiculacao?: string
  }
}
