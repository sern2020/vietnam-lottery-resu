import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, MagnifyingGlass } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface DateTimePickerProps {
  onDateSelect: (date: Date) => void
  selectedDate?: Date
  disabled?: boolean
}

export function DateTimePicker({ onDateSelect, selectedDate, disabled }: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onDateSelect(date)
      setIsOpen(false)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start gap-2 text-left font-normal md:w-[280px]',
            !selectedDate && 'text-muted-foreground'
          )}
          disabled={disabled}
        >
          <CalendarIcon size={18} />
          {selectedDate ? (
            format(selectedDate, 'PPP')
          ) : (
            <span>Pick a date to search</span>
          )}
          <MagnifyingGlass size={16} className="ml-auto opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={(date) =>
            date > new Date() || date < new Date('2020-01-01')
          }
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
