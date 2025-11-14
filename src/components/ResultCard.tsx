import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CalendarBlank, Clock } from '@phosphor-icons/react'
import { formatVietnameseDate } from '@/lib/lottery-utils'
import { PrizeDisplay } from './PrizeDisplay'
import type { LotteryResult } from '@/lib/types'
import { REGIONS } from '@/lib/types'

interface ResultCardProps {
  result: LotteryResult
  highlightNumbers?: string[]
}

export function ResultCard({ result, highlightNumbers = [] }: ResultCardProps) {
  const region = REGIONS[result.region]
  
  return (
    <Card className="overflow-hidden border-gold/20">
      <CardHeader className="border-b border-border bg-gradient-to-r from-muted/50 to-transparent pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="mb-2 text-2xl font-bold text-foreground">
              Xổ Số {region.name}
            </CardTitle>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarBlank size={16} />
                <span className="capitalize">{formatVietnameseDate(result.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>Kết quả xổ lúc {result.drawTime}</span>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-6">
        {result.prizes.map((prize, index) => (
          <PrizeDisplay
            key={prize.tier}
            prize={prize}
            index={index}
            isSpecial={index === 0}
            highlightNumbers={highlightNumbers}
          />
        ))}
      </CardContent>
    </Card>
  )
}
