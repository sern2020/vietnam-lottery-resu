import type { LotteryResult, Region } from './types'
import { format } from 'date-fns'

const CORS_PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://corsproxy.io/?',
]

export async function fetchNorthernResults(date?: Date): Promise<LotteryResult | null> {
  const targetDate = date || new Date()
  const formattedDate = format(targetDate, 'dd-MM-yyyy')
  const baseUrl = `https://xoso.com.vn/xsmb-${formattedDate}.html`
  
  for (const proxy of CORS_PROXIES) {
    try {
      let url: string
      let html: string
      
      if (proxy.includes('allorigins')) {
        url = `${proxy}${encodeURIComponent(baseUrl)}`
        const response = await fetch(url)
        
        if (!response.ok) {
          continue
        }
        
        const data = await response.json()
        html = data.contents
      } else {
        url = `${proxy}${encodeURIComponent(baseUrl)}`
        const response = await fetch(url)
        
        if (!response.ok) {
          continue
        }
        
        html = await response.text()
      }
      
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
