import type { LotteryResult, Region } from './types'
import { format } from 'date-fns'

const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
]

export async function fetchNorthernResults(date?: Date): Promise<LotteryResult | null> {
  const targetDate = date || new Date()
  const formattedDate = format(targetDate, 'dd-MM-yyyy')
  const baseUrl = `https://xoso.com.vn/xsmb-${formattedDate}.html`
  
  for (const proxy of CORS_PROXIES) {
    try {
      const url = `${proxy}${encodeURIComponent(baseUrl)}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      })
      
      if (!response.ok) {
        continue
      }
      
      const html = await response.text()
      const result = parseNorthernHTML(html, targetDate)
      
      if (result && result.prizes.length > 0) {
        return result
      }
    } catch (error) {
      console.error(`Error with proxy ${proxy}:`, error)
      continue
    }
  }
  
  console.warn('All CORS proxies failed, falling back to mock data')
  return null
}

function parseNorthernHTML(html: string, date: Date): LotteryResult | null {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    const prizes: Array<{ tier: string; numbers: string[] }> = []
    
    const prizeMapping = [
      { tier: 'Special Prize', selectors: ['.giaidb', '[class*="special"]', 'td:contains("ĐB")'], count: 1 },
      { tier: 'First Prize', selectors: ['.giai1', '[class*="first"]', 'td:contains("G1")'], count: 1 },
      { tier: 'Second Prize', selectors: ['.giai2', '[class*="second"]', 'td:contains("G2")'], count: 2 },
      { tier: 'Third Prize', selectors: ['.giai3', '[class*="third"]', 'td:contains("G3")'], count: 6 },
      { tier: 'Fourth Prize', selectors: ['.giai4', '[class*="fourth"]', 'td:contains("G4")'], count: 4 },
      { tier: 'Fifth Prize', selectors: ['.giai5', '[class*="fifth"]', 'td:contains("G5")'], count: 6 },
      { tier: 'Sixth Prize', selectors: ['.giai6', '[class*="sixth"]', 'td:contains("G6")'], count: 3 },
      { tier: 'Seventh Prize', selectors: ['.giai7', '[class*="seventh"]', 'td:contains("G7")'], count: 4 },
    ]
    
    for (const mapping of prizeMapping) {
      const numbers: string[] = []
      
      for (const selector of mapping.selectors) {
        const elements = doc.querySelectorAll(selector)
        
        elements.forEach(el => {
          const text = el.textContent?.trim()
          if (text) {
            const matches = text.match(/\d+/g)
            if (matches) {
              matches.forEach(match => {
                if (match.length >= 2 && match.length <= 6) {
                  numbers.push(match)
                }
              })
            }
          }
        })
        
        if (numbers.length > 0) break
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
