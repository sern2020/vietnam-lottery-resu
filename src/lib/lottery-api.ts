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

// Store the last retrieved HTML data for debugging
let lastRetrievedHTML: string = ''
let lastRetrievedSource: string = ''
let lastTableHTML: string = ''

export function getLastRetrievedHTML(): { html: string; source: string; tableHTML: string } {
  return { html: lastRetrievedHTML, source: lastRetrievedSource, tableHTML: lastTableHTML }
}

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
      lastRetrievedHTML = html
      lastRetrievedSource = 'Direct fetch'
      console.log(`✅ Direct fetch successful! HTML Length: ${html.length} characters`)
      console.log('First 500 chars:', html.substring(0, 500))
      const result = parseNorthernHTML(html, targetDate)
      if (result && result.prizes.length > 0) {
        console.log('✅ Direct fetch successful!')
        console.log(`Parsed Results - Date: ${result.date}, Region: ${result.region}, Prizes Found: ${result.prizes.length}`)
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
      
      lastRetrievedHTML = html
      lastRetrievedSource = `Proxy: ${proxy.type}`
      console.log(`✅ Proxy ${proxy.type} returned data! HTML Length: ${html.length} characters`)
      console.log('First 500 chars:', html.substring(0, 500))
      
      const result = parseNorthernHTML(html, targetDate)
      
      if (result && result.prizes.length > 0) {
        console.log(`✅ Successfully fetched live results using ${proxy.type}`)
        console.log(`Parsed via ${proxy.type} - Date: ${result.date}, Region: ${result.region}, Prizes Found: ${result.prizes.length}`)
        result.prizes.forEach(p => console.log(`${p.tier}: ${p.numbers.join(', ')}`))
        return result
      } else {
        console.warn(`⚠️ Proxy ${proxy.type} returned HTML but parsing failed`)
        console.log('HTML was received but no prizes could be extracted.')
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

// Helper function to format HTML with indentation
function formatHTML(html: string): string {
  let formatted = ''
  let indent = 0
  const tab = '  '
  
  // Remove extra whitespace and newlines
  html = html.replace(/>\s+</g, '><').trim()
  
  // Split by tags
  const tokens = html.split(/(<[^>]+>)/g).filter(token => token.trim())
  
  tokens.forEach(token => {
    if (token.startsWith('</')) {
      // Closing tag
      indent--
      formatted += tab.repeat(Math.max(0, indent)) + token + '\n'
    } else if (token.startsWith('<') && !token.endsWith('/>') && !token.startsWith('<!')) {
      // Opening tag
      formatted += tab.repeat(indent) + token + '\n'
      if (!token.match(/<(br|hr|img|input|meta|link|area|base|col|embed|param|source|track|wbr)[^>]*>/i)) {
        indent++
      }
    } else if (token.startsWith('<') && token.endsWith('/>')) {
      // Self-closing tag
      formatted += tab.repeat(indent) + token + '\n'
    } else if (token.trim()) {
      // Text content
      formatted += tab.repeat(indent) + token.trim() + '\n'
    }
  })
  
  return formatted.trim()
}

function parseNorthernHTML(html: string, date: Date): LotteryResult | null {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    const prizes: Array<{ tier: string; numbers: string[] }> = []
    
    // Look for table with class "table-result"
    const table = doc.querySelector('table.table-result')
    
    console.log(`🔍 Looking for table.table-result`)
    
    if (table) {
      console.log(`✅ Found table.table-result`)
      
      // Store the table HTML with pretty formatting
      lastTableHTML = formatHTML(table.outerHTML)
      
      // Extract prizes from specific span elements
      const prizeConfigs = [
        { tier: 'Special Prize', className: 'special-prize', count: 1, digits: 5 },
        { tier: 'First Prize', className: 'prize1', count: 1, digits: 5 },
        { tier: 'Second Prize', className: 'prize2', count: 2, digits: 5 },
        { tier: 'Third Prize', className: 'prize3', count: 6, digits: 5 },
        { tier: 'Fourth Prize', className: 'prize4', count: 4, digits: 4 },
        { tier: 'Fifth Prize', className: 'prize5', count: 6, digits: 4 },
        { tier: 'Sixth Prize', className: 'prize6', count: 3, digits: 3 },
        { tier: 'Seventh Prize', className: 'prize7', count: 4, digits: 2 },
      ]
      
      prizeConfigs.forEach(config => {
        const spans = doc.querySelectorAll(`span.${config.className}`)
        const numbers: string[] = []
        
        spans.forEach(span => {
          const text = span.textContent?.trim()
          if (text && /^\d+$/.test(text)) {
            const number = text.padStart(config.digits, '0').substring(0, config.digits)
            numbers.push(number)
            console.log(`✅ Found ${config.tier} from span.${config.className}: ${number}`)
          }
        })
        
        if (numbers.length > 0) {
          prizes.push({
            tier: config.tier,
            numbers: numbers.slice(0, config.count)
          })
        } else {
          // No prizes found for this tier, add "-" placeholders
          prizes.push({
            tier: config.tier,
            numbers: Array(config.count).fill('-')
          })
          console.log(`⚠️ No ${config.tier} found, using placeholder "-"`)
        }
      })
      
      if (prizes.length > 0) {
        console.log(`✅ Parsed ${prizes.length} prize tiers from spans with ${prizes.reduce((sum, p) => sum + p.numbers.filter(n => n !== '-').length, 0)} total numbers`)
        
        return {
          id: `north-${format(date, 'yyyy-MM-dd')}`,
          region: 'north',
          date: format(date, 'yyyy-MM-dd'),
          drawTime: '18:15',
          prizes,
        }
      }
    } else {
      console.log(`⚠️ table.table-result not found, trying fallback parsing...`)
    }
    
    // Fallback: Try to extract from span elements even without table
    if (prizes.length === 0) {
      const prizeConfigs = [
        { tier: 'Special Prize', className: 'special-prize', count: 1, digits: 5 },
        { tier: 'First Prize', className: 'prize1', count: 1, digits: 5 },
        { tier: 'Second Prize', className: 'prize2', count: 2, digits: 5 },
        { tier: 'Third Prize', className: 'prize3', count: 6, digits: 5 },
        { tier: 'Fourth Prize', className: 'prize4', count: 4, digits: 4 },
        { tier: 'Fifth Prize', className: 'prize5', count: 6, digits: 4 },
        { tier: 'Sixth Prize', className: 'prize6', count: 3, digits: 3 },
        { tier: 'Seventh Prize', className: 'prize7', count: 4, digits: 2 },
      ]
      
      prizeConfigs.forEach(config => {
        const spans = doc.querySelectorAll(`span.${config.className}`)
        const numbers: string[] = []
        
        spans.forEach(span => {
          const text = span.textContent?.trim()
          if (text && /^\d+$/.test(text)) {
            const number = text.padStart(config.digits, '0').substring(0, config.digits)
            numbers.push(number)
            console.log(`✅ Fallback: Found ${config.tier} from span.${config.className}: ${number}`)
          }
        })
        
        if (numbers.length > 0) {
          prizes.push({
            tier: config.tier,
            numbers: numbers.slice(0, config.count)
          })
        } else {
          // No prizes found for this tier, add "-" placeholders
          prizes.push({
            tier: config.tier,
            numbers: Array(config.count).fill('-')
          })
          console.log(`⚠️ Fallback: No ${config.tier} found, using placeholder "-"`)
        }
      })
    }
    
    if (prizes.length === 0) {
      console.warn('❌ No prizes found in HTML - parsing failed')
      console.log('HTML preview (first 800 chars):', html.substring(0, 800))
      return null
    }
    
    console.log(`✅ Parsed ${prizes.length} prize tiers with ${prizes.reduce((sum, p) => sum + p.numbers.filter(n => n !== '-').length, 0)} total numbers`)
    
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
