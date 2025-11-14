import { motion } from 'framer-motion'
import { Star, Trophy } from '@phosphor-icons/react'
import type { Prize } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PrizeDisplayProps {
  prize: Prize
  index: number
  isSpecial?: boolean
  highlightNumbers?: string[]
}

export function PrizeDisplay({ prize, index, isSpecial, highlightNumbers = [] }: PrizeDisplayProps) {
  const isHighlighted = (num: string) => highlightNumbers.some(h => num.includes(h) || num.endsWith(h))
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        'rounded-lg border p-4',
        isSpecial
          ? 'border-primary/30 bg-gradient-to-br from-primary/5 to-accent/10'
          : 'border-border bg-card'
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        {isSpecial && <Trophy className="text-primary" weight="fill" />}
        <h3 className={cn(
          'font-semibold',
          isSpecial ? 'text-lg text-primary' : 'text-base text-foreground'
        )}>
          {prize.tier}
        </h3>
        {isSpecial && <Star className="text-accent" weight="fill" size={16} />}
      </div>
      
      <div className="flex flex-wrap gap-3">
        {prize.numbers.map((number, idx) => (
          <motion.div
            key={idx}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 + idx * 0.02, duration: 0.2 }}
            className={cn(
              'lottery-number rounded-md px-4 py-2 text-center text-2xl font-bold tracking-wider',
              isHighlighted(number)
                ? 'bg-accent text-accent-foreground ring-2 ring-primary'
                : isSpecial
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-foreground'
            )}
          >
            {number}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
