import type { LotteryResult, Region } from './types'
import { format } from 'date-fns'

const CORS_PROXIES = [
  { url: 'https://api.allorigins.win/get?url=', type: 'allorigins' },
  { url: 'https://corsproxy.io/?', type: 'corsproxy' },
  { url: 'https://api.codetabs.com/v1/proxy?quest=', type: 'codetabs' },
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
        },
        signal: AbortSignal.timeout(10000),
      })
      
      if (!response.ok) {
        console.warn(`Proxy ${proxy.type} returned status ${response.status}`)
        continue
      }
      
      if (proxy.type === 'allorigins') {
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
        console.log(`Successfully fetched results using ${proxy.type}`)
        return result
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error with proxy ${proxy.type}:`, error.message)
      }
      continue
    }
  }
  
  console.warn('All CORS proxies failed or returned invalid data')
  return null
}

function parseNorthernHTML(html: string, date: Date): LotteryResult | null {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    const prizes: Array<{ tier: string; numbers: string[] }> = []
    
    const prizeMapping = [
      { tier: 'Special Prize', className: 'giaidb', count: 1 },
      { tier: 'First Prize', className: 'giai1', count: 1 },
      { tier: 'Second Prize', className: 'giai2', count: 2 },
      { tier: 'Third Prize', className: 'giai3', count: 6 },
      { tier: 'Fourth Prize', className: 'giai4', count: 4 },
      { tier: 'Fifth Prize', className: 'giai5', count: 6 },
      { tier: 'Sixth Prize', className: 'giai6', count: 3 },
      { tier: 'Seventh Prize', className: 'giai7', count: 4 },
    ]
    
    for (const mapping of prizeMapping) {
      const numbers: string[] = []
      
      const row = doc.querySelector(`.${mapping.className}`)
      
      if (row) {
        const numberElements = row.querySelectorAll('td')
        
        numberElements.forEach(td => {
          const text = td.textContent?.trim()
          if (text && /^\d+$/.test(text)) {
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
      return null
    }
    
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
