namespace CoverService {
  const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
    + 'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.183 Safari/537.36'

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
        muteHttpExceptions: true,
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br',
          'User-Agent': USER_AGENT
        }
      })

      if (apiResponse.getResponseCode() !== 200) {
        throw NO_RESULTS_FOUND
      }

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
        muteHttpExceptions: true,
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

  class ContentStuffHandler implements ICoverHandler {
    baseUrl: string = ''
    searchEndpoint: string = ''
    productDetailsRegex: RegExp = null
    defaultSorting: number = 5
    lastPageRegex = /Página (\d+) de (\d+)/
    imageRegex = /(\d+)_200x200\./

    constructor (properties: IContentStuffHandlerProperties) {
      Object.assign(this, properties)
    }

    run(book: BookModel.Book): string {
      const searchUrl = this.baseUrl + this.searchEndpoint
        + '?t=' + encodeURIComponent(book.titleParts[0])
        + '&o=' + this.defaultSorting
      let currentPage = 1
      let lastPage = 2

      const results: Array<{ title: string, imageUrl: string }> = []

      const searchBookSeries = book.titleParts[0].toLowerCase()
      const searchBookNumber = book.titleParts[1]
        ? parseInt(book.titleParts[1]) : null

      while (currentPage < lastPage) {
        const response = UrlFetchApp.fetch(searchUrl + `&pg=${currentPage}`, {
          method: 'get',
          muteHttpExceptions: true,
          headers: { 'User-Agent': USER_AGENT }
        })

        if (response.getResponseCode() !== 200) {
          throw NO_RESULTS_FOUND
        }

        const responseHtml = response.getContentText()
        const products = Array.from(responseHtml.matchAll(this.productDetailsRegex))

        for (const product of products) {
          const thumbUrl = product[1]
          const title = product[2].toLowerCase()

          if (title.includes(searchBookSeries)) {
            if (searchBookNumber) {
              const numbersInTitle = (title.match(/\d+/) || [])
                .map(n => parseInt(n))
  
              if (numbersInTitle.includes(searchBookNumber)) {
                results.push({ 
                  title,
                  imageUrl: this.getBetterImage(thumbUrl)
                })
              }
            } else {
              results.push({
                title,
                imageUrl:this.getBetterImage(thumbUrl)
              })
            }
          }
        }

        const pagination = responseHtml.match(this.lastPageRegex)

        if (pagination) {
          currentPage = parseInt(pagination[1]) + 1
          lastPage = parseInt(pagination[2])
        } else {
          lastPage = 1
        }
      }

      if (results.length === 0) {
        throw NO_RESULTS_FOUND
      }

      return results[0].imageUrl
    }

    private getBetterImage(thumbUrl: string): string {
      return thumbUrl.replace(this.imageRegex, (m, p1) => {
        return `${parseInt(p1) + 2}_900x900.`
      })
    }
  }

  interface IContentStuffHandlerProperties {
    baseUrl: string,
    searchEndpoint: string,
    productDetailsRegex: RegExp,
    nextPageClass?: string,
    defaultSorting?: number,
    lastPageRegex?: RegExp,
    imageRegex?: RegExp
  }

  const AVAILABLE_SITES: Record<string, ICoverHandler> = {
    // 'JBC': new WordpressHandler({
    //   url: 'https://mangasjbc.com.br',
    //   searchWith: BookModel.PROPERTIES.TITLE,
    //   queryParameter: 'slug',
    //   queryTransformer: title => Utils.slugify(title).replace('especial', 'esp')
    // }),
    'JBC': new OEmbedHandler({
      baseUrl: 'https://editorajbc.com.br',
      createPath: book => {
        const series = Utils
          .slugify(book.titleParts[0])
          .replace('especial', 'esp')
        const title = Utils
          .slugify(book.title)
          .replace('especial', 'esp')

        return `/mangas/colecao/${series}/vol/${title}/`
      }
    }),
    'Mino': new WordpressHandler({
      url: 'https://editoramino.com',
      searchWith: BookModel.PROPERTIES.TITLE,
      collection: 'project'
    }),
    'NewPOP': new WordpressHandler({
      url: 'https://www.newpop.com.br',
      searchWith: BookModel.PROPERTIES.ISBN
    }),
    'Panini': new ContentStuffHandler({
      baseUrl: 'https://loja.panini.com.br',
      searchEndpoint: '/panini/solucoes/busca.aspx',
      productDetailsRegex: /<div class="product">[^]*?<img src="(.*?)"[^]*?<h4>[^]*?_top">(.*?)<\/a>/gm
    }),
    'Pipoca & Nanquim': new WordpressHandler({
      url: 'https://pipocaenanquim.com.br',
      searchWith: BookModel.PROPERTIES.TITLE,
      collection: 'product'
    }),
    'Shueisha': new DirectUrlHandler({
      url: 'https://dosbg3xlm0x1t.cloudfront.net/images/items/{value}/1200/{value}.jpg',
      property: BookModel.PROPERTIES.ISBN,
      propertyTransformer: isbn => isbn.replace(/-/g, '')
    }),
    'Veneta': new WordpressHandler({
      url: 'https://veneta.com.br',
      searchWith: BookModel.PROPERTIES.TITLE,
      collection: 'product'
    }),
    'Vertical': new WordpressHandler({
      url: 'https://readvertical.com',
      searchWith: BookModel.PROPERTIES.ISBN,
      collection: 'product',
      queryTransformer: isbn => isbn.replace(/-/g, '')
    }),
    'VIZ Media': new DirectUrlHandler({
      url: 'https://dw9to29mmj727.cloudfront.net/products/{isbn10}.jpg',
      property: BookModel.PROPERTIES.ISBN,
      propertyTransformer: isbn => Utils.convertIsbn13ToIsbn10(isbn.replace(/-/g, ''))
    }),
    'Zarabatana': new WordpressHandler({
      url: 'https://zarabatana.com.br',
      searchWith: BookModel.PROPERTIES.TITLE,
      collection: 'product',
      queryParameter: 'slug',
      queryTransformer: title => Utils.slugify(title)
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
