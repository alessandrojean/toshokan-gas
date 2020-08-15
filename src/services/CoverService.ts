namespace CoverService {
  const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.89 Safari/537.36'

  // Error messages.
  const SITE_NOT_SUPPORTED = 'O site da editora não suporta a busca por capas.'
  const NO_RESULTS_FOUND = 'Nenhum resultado.'
  const COVER_NOT_FOUND = 'Capa não encontrada.'

  interface ICoverHandler {
    run: (book: BookModel.Book) => string
  }

  class DirectUrlHandler implements ICoverHandler {
    url: string
    property: string
    propertyTransformer?: (value: any) => any

    constructor(properties: IDirectUrlHandlerProperties) {
      Object.assign(this, properties)
    }

    run(book: BookModel.Book): string {
      let valueToReplace = book[this.property]
      
      if (this.propertyTransformer) {
        valueToReplace = this.propertyTransformer(valueToReplace)
      }
      
      return this.url.replace(/\{value\}/g, valueToReplace)
    }
  }

  interface IDirectUrlHandlerProperties {
    url: string
    property: string
    propertyTransformer?: (value: any) => any
  }

  class WordpressHandler implements ICoverHandler {
    url: string
    collection: string = 'posts'
    queryParameter: string = 'search'
    searchWith: string
    queryTransformer?: (value: any) => any

    constructor(properties: IWordpressHandlerProperties) {
      Object.assign(this, properties)
    }

    run(book: BookModel.Book): string {
      const collection = this.collection
      const searchParam = this.queryParameter
      let searchQuery = book[this.searchWith]
      
      if (this.queryTransformer) {
        searchQuery = this.queryTransformer(searchQuery) 
      }
      
      const wpJsonUrl = this.url + '/wp-json/wp/v2/' + collection 
        + '?_embed=' + 'wp:featuredmedia'
        + '&' + searchParam + '=' + encodeURIComponent(searchQuery)
        
      const apiResponse = UrlFetchApp.fetch(wpJsonUrl, {
        method: 'get',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br',
          'User-Agent': USER_AGENT
        }
      })
      const jsonResponse: Object[] = JSON.parse(apiResponse.getContentText()) 
      
      if (jsonResponse.length == 0) {
        throw NO_RESULTS_FOUND
      }
    
      if (!jsonResponse[0]['_embedded']['wp:featuredmedia']) {
        throw COVER_NOT_FOUND
      }
    
      return jsonResponse[0]['_embedded']['wp:featuredmedia'][0]['source_url']
    }
  }

  interface IWordpressHandlerProperties {
    url: string,
    collection?: string,
    queryParameter?: string,
    searchWith: string,
    queryTransformer?: (value: any) => any
  }

  class OEmbedHandler implements ICoverHandler {
    baseUrl: string = ''
    createPath: (book: BookModel.Book) => string

    constructor (properties: IOEmbedHandlerProperties) {
      Object.assign(this, properties)
    }

    run(book: BookModel.Book): string {
      const urlPath = this.createPath(book)

      const wpJsonUrl = this.baseUrl + '/wp-json/oembed/1.0/embed'
        + '?url=' + encodeURIComponent(this.baseUrl + urlPath)

      const apiResponse = UrlFetchApp.fetch(wpJsonUrl, {
        method: 'get',
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br',
          'User-Agent': USER_AGENT
        }
      })

      if (apiResponse.getResponseCode() !== 200) {
        throw NO_RESULTS_FOUND
      }

      const jsonResponse: Object = JSON.parse(apiResponse.getContentText())

      if (!jsonResponse['thumbnail_url']) {
        throw COVER_NOT_FOUND
      }

      return jsonResponse['thumbnail_url'] 
    }
  }

  interface IOEmbedHandlerProperties {
    baseUrl: string,
    createPath: (book: BookModel.Book) => string
  }

  interface SiteMap {
    [imprint: string]: ICoverHandler
  }

  const AVAILABLE_SITES: SiteMap = {
    'NewPOP': new WordpressHandler({
      url: 'https://www.newpop.com.br',
      searchWith: BookModel.PROPERTIES.ISBN
    }),
    'Pipoca & Nanquim': new WordpressHandler({
      url: 'https://pipocaenanquim.com.br',
      searchWith: BookModel.PROPERTIES.TITLE,
      collection: 'product'
    }),
    'Veneta': new WordpressHandler({
      url: 'https://veneta.com.br',
      searchWith: BookModel.PROPERTIES.TITLE,
      collection: 'product'
    }),
    // 'JBC': new WordpressHandler({
    //   url: 'https://mangasjbc.com.br',
    //   searchWith: BookModel.PROPERTIES.TITLE,
    //   queryParameter: 'slug',
    //   queryTransformer: title => Utils.slugify(title).replace('especial', 'esp')
    // }),
    'JBC': new OEmbedHandler({
      baseUrl: 'https://editorajbc.com.br',
      createPath: book => {
        const series = Utils.slugify(book.titleParts[0]).replace('especial', 'esp')
        const title = Utils.slugify(book.title).replace('especial', 'esp')

        return `/mangas/colecao/${series}/vol/${title}/`
      }
    }),
    'Vertical': new WordpressHandler({
      url: 'https://readvertical.com',
      searchWith: BookModel.PROPERTIES.ISBN,
      collection: 'product',
      queryTransformer: isbn => isbn.replace(/-/g, '')
    }),
    'Mino': new WordpressHandler({
      url: 'https://editoramino.com',
      searchWith: BookModel.PROPERTIES.TITLE,
      collection: 'project'
    }),
    'Zarabatana': new WordpressHandler({
      url: 'https://zarabatana.com.br',
      searchWith: BookModel.PROPERTIES.TITLE,
      collection: 'product',
      queryParameter: 'slug',
      queryTransformer: title => Utils.slugify(title)
    }),
    'Shueisha': new DirectUrlHandler({
      url: 'https://dosbg3xlm0x1t.cloudfront.net/images/items/{value}/1200/{value}.jpg',
      property: BookModel.PROPERTIES.ISBN,
      propertyTransformer: isbn => isbn.replace(/-/g, '')
    }),
    'VIZ Media': new DirectUrlHandler({
      url: 'https://dw9to29mmj727.cloudfront.net/products/{isbn10}.jpg',
      property: BookModel.PROPERTIES.ISBN,
      propertyTransformer: isbn => Utils.convertIsbn13ToIsbn10(isbn.replace(/-/g, ''))
    })
  }

  export function findCover(book: BookModel.Book): string {
    const siteHandler = AVAILABLE_SITES[book.imprint]

    if (!siteHandler) {
      throw SITE_NOT_SUPPORTED
    }

    return siteHandler.run(book)
  }
}
