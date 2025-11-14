import { format } from 'date-fns'
import type { LotteryResult, Region } from './types'
import { PRIZE_TIERS } from './types'

export function generateLotteryNumber(digits: number): string {
  const num = Math.floor(Math.random() * Math.pow(10, digits))
  return num.toString().padStart(digits, '0')
}

export function generateMockResult(region: Region, date: Date): LotteryResult {
  const tiers = PRIZE_TIERS[region]
  const prizes = tiers.map(tier => ({
    tier: tier.tier,
    numbers: Array.from({ length: tier.count }, () => generateLotteryNumber(tier.digits)),
  }))

  return {
    id: `${region}-${format(date, 'yyyy-MM-dd')}`,
    region,
    date: format(date, 'yyyy-MM-dd'),
    drawTime: region === 'north' ? '18:15' : '16:30',
    prizes,
  }
}

export function generateHistoricalResults(region: Region, days: number = 30): LotteryResult[] {
  const results: LotteryResult[] = []
  const today = new Date()
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    results.push(generateMockResult(region, date))
  }
  
  return results
}

export function formatVietnameseDate(dateStr: string): string {
  const date = new Date(dateStr)
  const weekdays = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
  const day = date.getDate()
  const month = date.getMonth() + 1
  const year = date.getFullYear()
  const weekday = weekdays[date.getDay()]
  
  return `${weekday}, ngày ${day} tháng ${month} năm ${year}`
}

export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr)
  return format(date, 'dd/MM/yyyy')
}

export function searchNumberInResult(result: LotteryResult, searchNumber: string): Array<{ tier: string; number: string }> {
  const matches: Array<{ tier: string; number: string }> = []
  
  result.prizes.forEach(prize => {
    prize.numbers.forEach(num => {
      if (num.includes(searchNumber) || num.endsWith(searchNumber)) {
        matches.push({ tier: prize.tier, number: num })
      }
    })
  })
  
  return matches
}

export function isWinningNumber(result: LotteryResult, ticketNumber: string): boolean {
  return result.prizes.some(prize =>
    prize.numbers.some(num => num === ticketNumber || num.endsWith(ticketNumber))
  )
}
