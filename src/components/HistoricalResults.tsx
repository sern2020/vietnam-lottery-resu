import { useState } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarBlank } from '@phosphor-icons/react'
import { format } from 'date-fns'
import type { LotteryResult } from '@/lib/types'
import { formatShortDate } from '@/lib/lottery-utils'
import { cn } from '@/lib/utils'

interface HistoricalResultsProps {
  results: LotteryResult[]
  onSelectDate: (date: Date) => void
  selectedDate?: Date
}

export function HistoricalResults({ results, onSelectDate, selectedDate }: HistoricalResultsProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onSelectDate(date)
      setOpen(false)
    }
  }

  const resultDates = results.map(r => new Date(r.date))

  return (
    <Card className="border-gold/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <CalendarBlank size={24} />
          Kết Quả Lịch Sử
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal',
                !selectedDate && 'text-muted-foreground'
              )}
            >
              <CalendarBlank className="mr-2" size={16} />
              {selectedDate ? (
                format(selectedDate, 'PPP')
              ) : (
                <span>Chọn ngày xem kết quả</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleSelect}
              disabled={(date) => date > new Date() || date < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Kết quả gần đây:</p>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {results.slice(0, 10).map((result) => (
              <button
                key={result.id}
                onClick={() => onSelectDate(new Date(result.date))}
                className={cn(
                  'w-full rounded-md border p-3 text-left transition-colors hover:bg-muted',
                  selectedDate && format(selectedDate, 'yyyy-MM-dd') === result.date
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{formatShortDate(result.date)}</span>
                  <span className="text-sm text-muted-foreground">{result.drawTime}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
