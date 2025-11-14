import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MagnifyingGlass, X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  onSearch: (value: string) => void
  className?: string
}

export function SearchBar({ onSearch, className }: SearchBarProps) {
  const [value, setValue] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.replace(/\D/g, '').slice(0, 6)
    setValue(newValue)
    onSearch(newValue)
  }

  const handleClear = () => {
    setValue('')
    onSearch('')
  }

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <MagnifyingGlass 
          className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" 
          size={20}
        />
        <Input
          type="text"
          inputMode="numeric"
          placeholder="Enter number to check"
          value={value}
          onChange={handleChange}
          className="lottery-number h-14 pl-12 pr-12 text-center text-xl tracking-wider"
        />
        {value && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2"
          >
            <X size={20} />
          </Button>
        )}
      </div>
      {value && (
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Searching for: <span className="lottery-number font-bold text-foreground">{value}</span>
        </p>
      )}
    </div>
  )
}
