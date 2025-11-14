import type { LotteryResult, Region } from './types'
import { format } from 'date-fns'
import { toast } from 'sonner'

const CORS_PROXIES = [
  { url: 'https://corsproxy.io/?', type: 'corsproxy', timeout: 10000 },
  { url: 'https://api.allorigins.win/raw?url=', type: 'allorigins-raw', timeout: 12000 },
  { url: 'https://api.codetabs.com/v1/proxy?quest=', type: 'codetabs', timeout: 10000 },
  { url: 'https://proxy.cors.sh/', type: 'cors-sh', timeout: 10000 },
  { url: 'https://thingproxy.freeboard.io/fetch/', type: 'thingproxy', timeout: 10000 },
  { url: 'https://api.allorigins.win/get?url=', type: 'allorigins-json', timeout: 12000 },
]

export async function fetchNorthernResults(date?: Date): Promise<LotteryResult | null> {
  const targetDate = date || new Date()
  const formattedDate = format(targetDate, 'dd-MM-yyyy')
  const baseUrl = `https://xoso.com.vn/xsmb-${formattedDate}.html`
  
  console.log(`🎯 Fetching lottery results for ${formattedDate}`)
  console.log(`🔗 Base URL: ${baseUrl}`)
  
  toast.info('Fetching from source', {
    description: baseUrl,
    duration: 4000,
  })
  
  try {
    console.log('🔄 Attempting direct fetch (may fail due to CORS)...')
    const directResponse = await fetch(baseUrl, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(5000),
    })
    
    if (directResponse.ok) {
      const html = await directResponse.text()
      const result = parseNorthernHTML(html, targetDate)
      if (result && result.prizes.length > 0) {
        console.log('✅ Direct fetch successful!')
        return result
      }
    }
  } catch (error) {
    console.log('⚠️ Direct fetch failed (expected due to CORS), trying proxies...')
  }
  
  for (const proxy of CORS_PROXIES) {
    try {
      let html: string
      const proxyUrl = `${proxy.url}${encodeURIComponent(baseUrl)}`
      
      console.log(`🔄 Trying proxy: ${proxy.type}`)
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/html, */*',
          'Origin': window.location.origin,
        },
        signal: AbortSignal.timeout(proxy.timeout),
      })
      
      if (!response.ok) {
        console.warn(`❌ Proxy ${proxy.type} returned status ${response.status}`)
        continue
      }
      
      if (proxy.type === 'allorigins-json') {
        const data = await response.json()
        html = data.contents || ''
      } else {
        html = await response.text()
      }
      
      if (!html || html.length < 100) {
        console.warn(`❌ Proxy ${proxy.type} returned empty or invalid HTML`)
        continue
      }
      
      const result = parseNorthernHTML(html, targetDate)
      
      if (result && result.prizes.length > 0) {
        console.log(`✅ Successfully fetched live results using ${proxy.type}`)
        return result
      } else {
        console.warn(`⚠️ Proxy ${proxy.type} returned HTML but parsing failed`)
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`❌ Error with proxy ${proxy.type}:`, error.message)
      }
      continue
    }
  }
  
  console.warn('⚠️ All proxies exhausted - no valid data retrieved')
  toast.error('All fetch methods failed', {
    description: `Could not retrieve data from ${baseUrl}`,
    duration: 5000,
  })
  return null
}

function parseNorthernHTML(html: string, date: Date): LotteryResult | null {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    const prizes: Array<{ tier: string; numbers: string[] }> = []
    
    const dateForId = format(date, 'ddMMyyyy')
    const tableId = `kqngay_${dateForId}_kq`
    
    console.log(`🔍 Looking for table with id="${tableId}"`)
    
    const table = doc.getElementById(tableId)
    
    if (table) {
      console.log(`✅ Found table with id="${tableId}"`)
      
      const prizeMapping = [
        { tier: 'Special Prize', keywords: ['đặc biệt', 'db', 'giải đặc biệt', 'special'], count: 1, digits: 5, rowIndex: 1 },
        { tier: 'First Prize', keywords: ['giải nhất', 'nhất', 'giải 1', 'first'], count: 1, digits: 5, rowIndex: null },
        { tier: 'Second Prize', keywords: ['giải nhì', 'nhì', 'giải 2', 'second'], count: 2, digits: 5, rowIndex: null },
        { tier: 'Third Prize', keywords: ['giải ba', 'ba', 'giải 3', 'third'], count: 6, digits: 5, rowIndex: null },
        { tier: 'Fourth Prize', keywords: ['giải tư', 'tư', 'giải 4', 'fourth'], count: 4, digits: 4, rowIndex: null },
        { tier: 'Fifth Prize', keywords: ['giải năm', 'năm', 'giải 5', 'fifth'], count: 6, digits: 4, rowIndex: null },
        { tier: 'Sixth Prize', keywords: ['giải sáu', 'sáu', 'giải 6', 'sixth'], count: 3, digits: 3, rowIndex: null },
        { tier: 'Seventh Prize', keywords: ['giải bảy', 'bảy', 'giải 7', 'seventh'], count: 4, digits: 2, rowIndex: null },
      ]
      
      const rows = table.querySelectorAll('tr')
      
      rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td, th')
        if (cells.length < 2) return
        
        const labelCell = cells[0]
        const labelText = labelCell.textContent?.toLowerCase().trim() || ''
        
        for (const mapping of prizeMapping) {
          if (mapping.rowIndex !== null && index !== mapping.rowIndex) {
            continue
          }
          
          const isMatch = mapping.keywords.some(keyword => labelText.includes(keyword))
          
          if (isMatch) {
            const numbers: string[] = []
            
            if (mapping.tier === 'Special Prize' && index === 1) {
              console.log(`🎯 Found Special Prize (DB) in row ${index}`)
              console.log(`   Label: "${labelText}"`)
            }
            
            for (let i = 1; i < cells.length; i++) {
              const text = cells[i].textContent?.trim().replace(/\s+/g, '')
              if (text && /^\d+$/.test(text) && text.length >= mapping.digits - 1 && text.length <= mapping.digits + 1) {
                const number = text.padStart(mapping.digits, '0').substring(0, mapping.digits)
                numbers.push(number)
                
                if (mapping.tier === 'Special Prize') {
                  console.log(`   Number found: "${number}" (from "${text}")`)
                }
              }
            }
            
            if (numbers.length > 0) {
              const existingPrize = prizes.find(p => p.tier === mapping.tier)
              if (existingPrize) {
                existingPrize.numbers.push(...numbers)
              } else {
                prizes.push({
                  tier: mapping.tier,
                  numbers: numbers.slice(0, mapping.count),
                })
                
                if (mapping.tier === 'Special Prize') {
                  console.log(`   ✅ Added Special Prize: ${numbers[0]}`)
                }
              }
            }
          }
        }
      })
      
      if (prizes.length > 0) {
        console.log(`✅ Parsed ${prizes.length} prize tiers from table with ${prizes.reduce((sum, p) => sum + p.numbers.length, 0)} total numbers`)
        
        return {
          id: `north-${format(date, 'yyyy-MM-dd')}`,
          region: 'north',
          date: format(date, 'yyyy-MM-dd'),
          drawTime: '18:15',
          prizes,
        }
      }
    } else {
      console.log(`⚠️ Table with id="${tableId}" not found, trying fallback class-based parsing...`)
    }
    
    const prizeMapping = [
      { tier: 'Special Prize', classNames: ['giaidb', 'giai-db', 'special', 'db'], count: 1, digits: 5 },
      { tier: 'First Prize', classNames: ['giai1', 'giai-1', 'first', 'g1'], count: 1, digits: 5 },
      { tier: 'Second Prize', classNames: ['giai2', 'giai-2', 'second', 'g2'], count: 2, digits: 5 },
      { tier: 'Third Prize', classNames: ['giai3', 'giai-3', 'third', 'g3'], count: 6, digits: 5 },
      { tier: 'Fourth Prize', classNames: ['giai4', 'giai-4', 'fourth', 'g4'], count: 4, digits: 4 },
      { tier: 'Fifth Prize', classNames: ['giai5', 'giai-5', 'fifth', 'g5'], count: 6, digits: 4 },
      { tier: 'Sixth Prize', classNames: ['giai6', 'giai-6', 'sixth', 'g6'], count: 3, digits: 3 },
      { tier: 'Seventh Prize', classNames: ['giai7', 'giai-7', 'seventh', 'g7'], count: 4, digits: 2 },
    ]
    
    for (const mapping of prizeMapping) {
      const numbers: string[] = []
      
      let row: Element | null = null
      for (const className of mapping.classNames) {
        row = doc.querySelector(`.${className}`)
        if (row) break
      }
      
      if (row) {
        const numberElements = row.querySelectorAll('td, div, span, p, b, strong')
        
        numberElements.forEach(el => {
          const text = el.textContent?.trim().replace(/\s+/g, '')
          if (text && /^\d+$/.test(text) && text.length >= mapping.digits - 1 && text.length <= mapping.digits) {
            numbers.push(text.padStart(mapping.digits, '0'))
          }
        })
      }
      
      if (numbers.length === 0) {
        const allText = doc.body.textContent || ''
        const regex = new RegExp(`\\b\\d{${mapping.digits}}\\b`, 'g')
        const matches = allText.match(regex)
        if (matches && matches.length >= mapping.count) {
          numbers.push(...matches.slice(0, mapping.count))
        }
      }
      
      if (numbers.length > 0) {
        prizes.push({
          tier: mapping.tier,
          numbers: numbers.slice(0, mapping.count),
        })
      }
    }
    
    if (prizes.length === 0) {
      console.warn('❌ No prizes found in HTML - parsing failed')
      console.log('HTML preview (first 800 chars):', html.substring(0, 800))
      return null
    }
    
    console.log(`✅ Parsed ${prizes.length} prize tiers with ${prizes.reduce((sum, p) => sum + p.numbers.length, 0)} total numbers`)
    
    return {
      id: `north-${format(date, 'yyyy-MM-dd')}`,
      region: 'north',
      date: format(date, 'yyyy-MM-dd'),
      drawTime: '18:15',
      prizes,
    }
  } catch (error) {
    console.error('❌ Error parsing Northern lottery HTML:', error)
    return null
  }
}

export async function fetchLotteryResults(region: Region, date?: Date): Promise<LotteryResult | null> {
  if (region === 'north') {
    return await fetchNorthernResults(date)
  }
  
  return null
}
