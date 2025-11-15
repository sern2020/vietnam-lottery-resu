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
  
  return await fetchLotteryData(baseUrl, targetDate, 'north', 'table-result')
}

export async function fetchCentralResults(date?: Date): Promise<LotteryResult | null> {
  const targetDate = date || new Date()
  const formattedDate = format(targetDate, 'dd-MM-yyyy')
  const baseUrl = `https://xoso.com.vn/xsmt-${formattedDate}.html`
  
  console.log(`🎯 Fetching Central lottery results for ${formattedDate}`)
  console.log(`🔗 Base URL: ${baseUrl}`)
  
  toast.info('Fetching from source', {
    description: baseUrl,
    duration: 4000,
  })
  
  return await fetchLotteryData(baseUrl, targetDate, 'central', 'table-result table-xsmn')
}

async function fetchLotteryData(
  baseUrl: string, 
  targetDate: Date, 
  region: Region,
  tableClass: string
): Promise<LotteryResult | null> {
  
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
      const result = parseHTML(html, targetDate, region, tableClass)
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
      
      const result = parseHTML(html, targetDate, region, tableClass)
      
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

function parseHTML(html: string, date: Date, region: Region, tableClass: string): LotteryResult | null {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    const prizes: Array<{ tier: string; numbers: string[] }> = []
    
    // Look for table with the specified class
    const table = doc.querySelector(`table.${tableClass.split(' ').join('.')}`)
    
    console.log(`🔍 Looking for table.${tableClass}`)
    
    if (table) {
      console.log(`✅ Found table.${tableClass}`)
      
      // Store the table HTML with pretty formatting
      lastTableHTML = formatHTML(table.outerHTML)
      
      // For Central region (table-result table-xsmn), parse from thead and tbody
      if (region === 'central' && tableClass.includes('table-xsmn')) {
        console.log('🔍 Parsing Central lottery from table structure (thead/tbody)')
        
        // First, read location/province names from <thead>
        const thead = table.querySelector('thead')
        const locations: string[] = []
        
        if (thead) {
          const headerRow = thead.querySelector('tr')
          if (headerRow) {
            const headerCells = headerRow.querySelectorAll('th')
            headerCells.forEach((th, index) => {
              const headerText = th.textContent?.trim() || ''
              if (headerText && index > 0) { // Skip first column (empty or "Giải")
                locations.push(headerText)
                console.log(`  📋 Location Column ${index}: ${headerText}`)
              }
            })
          }
        }
        
        // Initialize prize structure for each location
        const locationPrizes: { [location: string]: { tier: string; numbers: string[] }[] } = {}
        locations.forEach(loc => {
          locationPrizes[loc] = []
        })
        
        const tbody = table.querySelector('tbody')
        if (tbody) {
          const rows = tbody.querySelectorAll('tr')
          console.log(`✅ Found ${rows.length} rows in tbody`)
          
          rows.forEach((row, rowIndex) => {
            // Get prize tier name from <th> element in the row
            const thElement = row.querySelector('th')
            const tierName = thElement ? thElement.textContent?.trim() || '' : ''
            
            if (!tierName) {
              console.log(`  ⚠️ No tier name found in row ${rowIndex}`)
              return
            }
            
            console.log(`  ✅ Processing tier: ${tierName}`)
            
            // Get all <td> cells - each corresponds to a location
            const cells = row.querySelectorAll('td')
            
            cells.forEach((cell, cellIndex) => {
              if (cellIndex >= locations.length) return
              
              const location = locations[cellIndex]
              const numbers: string[] = []
              
              // Try to find span elements with prize classes
              const prizeSpans = cell.querySelectorAll('span[class*="xs_prize"]')
              if (prizeSpans.length > 0) {
                prizeSpans.forEach(span => {
                  const spanText = span.textContent?.trim()
                  if (spanText && /^\d+$/.test(spanText)) {
                    numbers.push(spanText)
                    console.log(`  ✅ Found number in <td>[${cellIndex}] span.${span.className}: ${spanText}`)
                  }
                })
              } else {
                // Fallback: extract directly from cell text
                const cellText = cell.textContent?.trim()
                if (cellText && /^\d+$/.test(cellText)) {
                  numbers.push(cellText)
                  console.log(`  ✅ Found number in <td>[${cellIndex}]: ${cellText}`)
                }
              }
              
              // If we found numbers for this location and tier, add them
              if (numbers.length > 0) {
                // Find or create the tier entry for this location
                let tierEntry = locationPrizes[location].find(p => p.tier === tierName)
                if (!tierEntry) {
                  tierEntry = { tier: tierName, numbers: [] }
                  locationPrizes[location].push(tierEntry)
                }
                tierEntry.numbers.push(...numbers)
                console.log(`    📍 ${location} - ${tierName}: ${numbers.join(', ')}`)
              }
            })
          })
          
          // Return all locations data in a structured format
          if (locations.length > 0) {
            // Convert the locationPrizes structure to a table-like format
            // Get all unique tier names in order
            const allTiers: string[] = []
            Object.values(locationPrizes).forEach(prizes => {
              prizes.forEach(p => {
                if (!allTiers.includes(p.tier)) {
                  allTiers.push(p.tier)
                }
              })
            })
            
            // Check if we have any actual prize data
            const hasAnyPrizes = Object.values(locationPrizes).some(prizes => prizes.length > 0)
            
            if (!hasAnyPrizes || allTiers.length === 0) {
              console.warn('⚠️ No prize data found for any location in Central region')
              return null
            }
            
            // Create prizes array with location-based organization
            const tableData: Array<{ tier: string; numbers: string[] }> = []
            
            // Add a header row with location names
            tableData.push({
              tier: 'Locations',
              numbers: locations
            })
            
            // For each tier, create a row with numbers from each location
            allTiers.forEach(tierName => {
              const tierNumbers: string[] = []
              locations.forEach(location => {
                const locationPrize = locationPrizes[location].find(p => p.tier === tierName)
                if (locationPrize && locationPrize.numbers.length > 0) {
                  tierNumbers.push(...locationPrize.numbers)
                } else {
                  tierNumbers.push('-')
                }
              })
              
              tableData.push({
                tier: tierName,
                numbers: tierNumbers
              })
            })
            
            const totalNumbers = tableData.reduce((sum, p) => sum + p.numbers.filter(n => n !== '-' && n !== 'Locations').length, 0)
            
            // Final check: if all numbers are placeholders, return null
            if (totalNumbers === 0) {
              console.warn('⚠️ All prize numbers are placeholders - no valid data found')
              return null
            }
            
            console.log(`✅ Parsed ${allTiers.length} prize tiers across ${locations.length} locations with ${totalNumbers} total numbers`)
            
            return {
              id: `${region}-${format(date, 'yyyy-MM-dd')}`,
              region: region,
              date: format(date, 'yyyy-MM-dd'),
              drawTime: '18:15',
              prizes: tableData,
              locations: locations, // Add locations metadata
            }
          }
        } else {
          console.log('⚠️ tbody not found in table, trying span-based parsing...')
        }
      }
      
      // For Northern region or fallback, extract prizes from specific span elements
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
          id: `${region}-${format(date, 'yyyy-MM-dd')}`,
          region: region,
          date: format(date, 'yyyy-MM-dd'),
          drawTime: '18:15',
          prizes,
        }
      }
    } else {
      console.log(`⚠️ table.${tableClass} not found, trying fallback parsing...`)
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
      id: `${region}-${format(date, 'yyyy-MM-dd')}`,
      region: region,
      date: format(date, 'yyyy-MM-dd'),
      drawTime: '18:15',
      prizes,
    }
  } catch (error) {
    console.error(`❌ Error parsing ${region} lottery HTML:`, error)
    return null
  }
}

export async function fetchLotteryResults(region: Region, date?: Date): Promise<LotteryResult | null> {
  if (region === 'north') {
    return await fetchNorthernResults(date)
  }
  
  if (region === 'central') {
    return await fetchCentralResults(date)
  }
  
  return null
}
