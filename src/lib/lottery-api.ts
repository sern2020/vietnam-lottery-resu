import type { LotteryResult, Region } from './types'
import { format } from 'date-fns'

const CORS_PROXIES = [
  { url: 'https://api.allorigins.win/raw?url=', type: 'allorigins-raw' },
  { url: 'https://api.allorigins.win/get?url=', type: 'allorigins-json' },
  { url: 'https://corsproxy.io/?', type: 'corsproxy' },
  { url: 'https://api.codetabs.com/v1/proxy?quest=', type: 'codetabs' },
  { url: 'https://thingproxy.freeboard.io/fetch/', type: 'thingproxy' },
]

export async function fetchNorthernResults(date?: Date): Promise<LotteryResult | null> {
  const targetDate = date || new Date()
  const formattedDate = format(targetDate, 'dd-MM-yyyy')
  const baseUrl = `https://xoso.com.vn/xsmb-${formattedDate}.html`
  
  for (const proxy of CORS_PROXIES) {
    try {
      let html: string
      const proxyUrl = `${proxy.url}${encodeURIComponent(baseUrl)}`
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/html, */*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(15000),
      })
      
      if (!response.ok) {
        console.warn(`Proxy ${proxy.type} returned status ${response.status}`)
        continue
      }
      
      if (proxy.type === 'allorigins-json') {
        const data = await response.json()
        html = data.contents || ''
      } else {
        html = await response.text()
      }
      
      if (!html || html.length < 100) {
        console.warn(`Proxy ${proxy.type} returned empty or invalid HTML`)
        continue
      }
      
      const result = parseNorthernHTML(html, targetDate)
      
      if (result && result.prizes.length > 0) {
        console.log(`✅ Successfully fetched live results using ${proxy.type}`)
        return result
      } else {
        console.warn(`Proxy ${proxy.type} returned HTML but parsing failed`)
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ Error with proxy ${proxy.type}:`, error.message)
      }
      continue
    }
  }
  
  console.warn('⚠️ All CORS proxies failed or returned invalid data')
  return null
}

function parseNorthernHTML(html: string, date: Date): LotteryResult | null {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    const prizes: Array<{ tier: string; numbers: string[] }> = []
    
    const prizeMapping = [
      { tier: 'Special Prize', classNames: ['giaidb', 'giai-db', 'special'], count: 1, digits: 5 },
      { tier: 'First Prize', classNames: ['giai1', 'giai-1', 'first'], count: 1, digits: 5 },
      { tier: 'Second Prize', classNames: ['giai2', 'giai-2', 'second'], count: 2, digits: 5 },
      { tier: 'Third Prize', classNames: ['giai3', 'giai-3', 'third'], count: 6, digits: 5 },
      { tier: 'Fourth Prize', classNames: ['giai4', 'giai-4', 'fourth'], count: 4, digits: 4 },
      { tier: 'Fifth Prize', classNames: ['giai5', 'giai-5', 'fifth'], count: 6, digits: 4 },
      { tier: 'Sixth Prize', classNames: ['giai6', 'giai-6', 'sixth'], count: 3, digits: 3 },
      { tier: 'Seventh Prize', classNames: ['giai7', 'giai-7', 'seventh'], count: 4, digits: 2 },
    ]
    
    for (const mapping of prizeMapping) {
      const numbers: string[] = []
      
      let row: Element | null = null
      for (const className of mapping.classNames) {
        row = doc.querySelector(`.${className}`)
        if (row) break
      }
      
      if (row) {
        const numberElements = row.querySelectorAll('td, div, span')
        
        numberElements.forEach(el => {
          const text = el.textContent?.trim()
          if (text && /^\d+$/.test(text) && text.length === mapping.digits) {
            numbers.push(text)
          }
        })
      }
      
      if (numbers.length > 0) {
        prizes.push({
          tier: mapping.tier,
          numbers: numbers.slice(0, mapping.count),
        })
      }
    }
    
    if (prizes.length === 0) {
      console.warn('No prizes found in HTML - parsing failed')
      console.log('HTML preview:', html.substring(0, 500))
      return null
    }
    
    console.log(`Parsed ${prizes.length} prize tiers from HTML`)
    
    return {
      id: `north-${format(date, 'yyyy-MM-dd')}`,
      region: 'north',
      date: format(date, 'yyyy-MM-dd'),
      drawTime: '18:15',
      prizes,
    }
  } catch (error) {
    console.error('Error parsing Northern lottery HTML:', error)
    return null
  }
}

export async function fetchLotteryResults(region: Region, date?: Date): Promise<LotteryResult | null> {
  if (region === 'north') {
    return await fetchNorthernResults(date)
  }
  
  return null
}
