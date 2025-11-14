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
    { tier: 'Special Prize', label: 'Special Prize', count: 1, digits: 5 },
    { tier: 'First Prize', label: 'First Prize', count: 1, digits: 5 },
    { tier: 'Second Prize', label: 'Second Prize', count: 2, digits: 5 },
    { tier: 'Third Prize', label: 'Third Prize', count: 6, digits: 5 },
    { tier: 'Fourth Prize', label: 'Fourth Prize', count: 4, digits: 4 },
    { tier: 'Fifth Prize', label: 'Fifth Prize', count: 6, digits: 4 },
    { tier: 'Sixth Prize', label: 'Sixth Prize', count: 3, digits: 3 },
    { tier: 'Seventh Prize', label: 'Seventh Prize', count: 4, digits: 2 },
  ],
  central: [
    { tier: 'Special Prize', label: 'Special Prize', count: 1, digits: 6 },
    { tier: 'First Prize', label: 'First Prize', count: 1, digits: 6 },
    { tier: 'Second Prize', label: 'Second Prize', count: 2, digits: 6 },
    { tier: 'Third Prize', label: 'Third Prize', count: 6, digits: 6 },
    { tier: 'Fourth Prize', label: 'Fourth Prize', count: 4, digits: 5 },
    { tier: 'Fifth Prize', label: 'Fifth Prize', count: 6, digits: 5 },
    { tier: 'Sixth Prize', label: 'Sixth Prize', count: 3, digits: 4 },
    { tier: 'Seventh Prize', label: 'Seventh Prize', count: 4, digits: 3 },
    { tier: 'Eighth Prize', label: 'Eighth Prize', count: 1, digits: 2 },
  ],
  south: [
    { tier: 'Special Prize', label: 'Special Prize', count: 1, digits: 6 },
    { tier: 'First Prize', label: 'First Prize', count: 1, digits: 5 },
    { tier: 'Second Prize', label: 'Second Prize', count: 1, digits: 5 },
    { tier: 'Third Prize', label: 'Third Prize', count: 2, digits: 5 },
    { tier: 'Fourth Prize', label: 'Fourth Prize', count: 7, digits: 4 },
    { tier: 'Fifth Prize', label: 'Fifth Prize', count: 1, digits: 4 },
    { tier: 'Sixth Prize', label: 'Sixth Prize', count: 3, digits: 3 },
    { tier: 'Seventh Prize', label: 'Seventh Prize', count: 1, digits: 2 },
    { tier: 'Eighth Prize', label: 'Eighth Prize', count: 1, digits: 2 },
  ],
}
