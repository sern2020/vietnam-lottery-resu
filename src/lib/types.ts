export type Region = 'north' | 'central' | 'south'

export interface Prize {
  tier: string
  numbers: string[]
  amount?: number
}

export interface LotteryResult {
  id: string
  region: Region
  date: string
  drawTime: string
  prizes: Prize[]
}

export const REGIONS = {
  north: {
    id: 'north' as Region,
    name: 'Miền Bắc',
    nameEn: 'Northern',
  },
  central: {
    id: 'central' as Region,
    name: 'Miền Trung',
    nameEn: 'Central',
  },
  south: {
    id: 'south' as Region,
    name: 'Miền Nam',
    nameEn: 'Southern',
  },
}

export const PRIZE_TIERS = {
  north: [
    { tier: 'Giải Đặc Biệt', label: 'Special Prize', count: 1, digits: 5 },
    { tier: 'Giải Nhất', label: 'First Prize', count: 1, digits: 5 },
    { tier: 'Giải Nhì', label: 'Second Prize', count: 2, digits: 5 },
    { tier: 'Giải Ba', label: 'Third Prize', count: 6, digits: 5 },
    { tier: 'Giải Tư', label: 'Fourth Prize', count: 4, digits: 4 },
    { tier: 'Giải Năm', label: 'Fifth Prize', count: 6, digits: 4 },
    { tier: 'Giải Sáu', label: 'Sixth Prize', count: 3, digits: 3 },
    { tier: 'Giải Bảy', label: 'Seventh Prize', count: 4, digits: 2 },
  ],
  central: [
    { tier: 'Giải Đặc Biệt', label: 'Special Prize', count: 1, digits: 6 },
    { tier: 'Giải Nhất', label: 'First Prize', count: 1, digits: 6 },
    { tier: 'Giải Nhì', label: 'Second Prize', count: 2, digits: 6 },
    { tier: 'Giải Ba', label: 'Third Prize', count: 6, digits: 6 },
    { tier: 'Giải Tư', label: 'Fourth Prize', count: 4, digits: 5 },
    { tier: 'Giải Năm', label: 'Fifth Prize', count: 6, digits: 5 },
    { tier: 'Giải Sáu', label: 'Sixth Prize', count: 3, digits: 4 },
    { tier: 'Giải Bảy', label: 'Seventh Prize', count: 4, digits: 3 },
    { tier: 'Giải Tám', label: 'Eighth Prize', count: 1, digits: 2 },
  ],
  south: [
    { tier: 'Giải Đặc Biệt', label: 'Special Prize', count: 1, digits: 6 },
    { tier: 'Giải Nhất', label: 'First Prize', count: 1, digits: 5 },
    { tier: 'Giải Nhì', label: 'Second Prize', count: 1, digits: 5 },
    { tier: 'Giải Ba', label: 'Third Prize', count: 2, digits: 5 },
    { tier: 'Giải Tư', label: 'Fourth Prize', count: 7, digits: 4 },
    { tier: 'Giải Năm', label: 'Fifth Prize', count: 1, digits: 4 },
    { tier: 'Giải Sáu', label: 'Sixth Prize', count: 3, digits: 3 },
    { tier: 'Giải Bảy', label: 'Seventh Prize', count: 1, digits: 2 },
    { tier: 'Giải Tám', label: 'Eighth Prize', count: 1, digits: 2 },
  ],
}
