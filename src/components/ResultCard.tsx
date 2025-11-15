import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CalendarBlank, Clock, Bell, Printer } from '@phosphor-icons/react'
import { formatEnglishDate } from '@/lib/lottery-utils'
import { PrizeDisplay } from './PrizeDisplay'
import type { LotteryResult } from '@/lib/types'
import { REGIONS } from '@/lib/types'
import { useRef, useEffect } from 'react'

interface ResultCardProps {
  result: LotteryResult
  highlightNumbers?: string[]
  showSpecialPrizeAlert?: boolean
}

export function ResultCard({ result, highlightNumbers = [], showSpecialPrizeAlert = false }: ResultCardProps) {
  const region = REGIONS[result.region]
  const cardRef = useRef<HTMLDivElement>(null)
  const hasShownAlert = useRef(false)
  
  const specialPrize = result.prizes.find(p => p.tier === 'Special Prize')
  const specialPrizeNumber = specialPrize?.numbers[0] || 'N/A'
  
  useEffect(() => {
    if (showSpecialPrizeAlert && specialPrize && !hasShownAlert.current) {
      hasShownAlert.current = true
      alert(`🎯 Special Prize (DB - Row 1):\n\n${specialPrizeNumber}\n\nRegion: ${region.nameEn}\nDate: ${formatEnglishDate(result.date)}`)
    }
  }, [showSpecialPrizeAlert, specialPrize, specialPrizeNumber, region.nameEn, result.date])
  
  const handlePrintHTML = () => {
    if (cardRef.current) {
      const htmlContent = cardRef.current.innerHTML
      const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${region.nameEn} Lottery Results - ${formatEnglishDate(result.date)}</title>
  <style>
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      background: #fafafa;
    }
    .print-info {
      margin-bottom: 20px;
      padding: 15px;
      background: white;
      border: 1px solid #e5e5e5;
      border-radius: 8px;
    }
    h1 { margin: 0 0 10px 0; color: #1a1a1a; }
    p { margin: 5px 0; color: #666; }
    @media print {
      body { background: white; }
    }
  </style>
</head>
<body>
  <div class="print-info">
    <h1>${region.nameEn} Region Lottery Results</h1>
    <p><strong>Date:</strong> ${formatEnglishDate(result.date)}</p>
    <p><strong>Draw Time:</strong> ${result.drawTime}</p>
    <p><strong>Special Prize (DB):</strong> ${specialPrizeNumber}</p>
    <p><strong>Printed:</strong> ${new Date().toLocaleString()}</p>
  </div>
  ${htmlContent}
</body>
</html>`
      
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(fullHTML)
        printWindow.document.close()
        printWindow.focus()
        setTimeout(() => {
          printWindow.print()
        }, 250)
      }
      
      console.log('=== HTML CONTENT ===')
      console.log(fullHTML)
      console.log('=== END HTML ===')
    }
  }
  
  const handleShowAlert = () => {
    alert(`🎯 Special Prize (DB - Row 1):\n\n${specialPrizeNumber}\n\nRegion: ${region.nameEn}\nDate: ${formatEnglishDate(result.date)}\nDraw Time: ${result.drawTime}`)
  }
  
  return (
    <Card className="overflow-hidden border-gold/20" ref={cardRef}>
      <CardHeader className="border-b border-border bg-gradient-to-r from-muted/50 to-transparent pb-4">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="mb-2 text-2xl font-bold text-foreground">
              {region.nameEn} Region
            </CardTitle>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CalendarBlank size={16} />
                <span className="capitalize">{formatEnglishDate(result.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>Draw time: {result.drawTime}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowAlert}
              className="gap-2"
            >
              <Bell size={16} />
              <span className="hidden sm:inline">Special Prize</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrintHTML}
              className="gap-2"
            >
              <Printer size={16} />
              <span className="hidden sm:inline">Print HTML</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 pt-6">
        {result.region === 'central' && result.locations && result.locations.length > 0 ? (
          // Central region: Display in table format
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Prize Tier</th>
                  {result.locations.map((location, idx) => (
                    <th key={idx} className="px-4 py-3 text-center font-semibold text-foreground">
                      {location}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.prizes.filter(p => p.tier !== 'Locations').map((prize, rowIndex) => (
                  <tr 
                    key={prize.tier} 
                    className={rowIndex % 2 === 0 ? 'bg-muted/30' : 'bg-card'}
                  >
                    <td className="border-r border-border px-4 py-3 font-medium text-foreground">
                      {prize.tier}
                    </td>
                    {result.locations!.map((location, colIndex) => {
                      // Each location might have multiple numbers for this tier
                      // Calculate which numbers belong to this location
                      const numbersPerLocation = prize.numbers.length / result.locations!.length
                      const startIdx = colIndex * Math.ceil(numbersPerLocation)
                      const endIdx = startIdx + Math.ceil(numbersPerLocation)
                      const locationNumbers = prize.numbers.slice(startIdx, endIdx).filter(n => n !== '-')
                      
                      return (
                        <td key={colIndex} className="px-4 py-3">
                          <div className="flex flex-wrap justify-center gap-2">
                            {locationNumbers.length > 0 ? locationNumbers.map((number, numIdx) => {
                              const isHighlighted = highlightNumbers.some(h => number.includes(h) || number.endsWith(h))
                              return (
                                <span 
                                  key={numIdx}
                                  className={`inline-block rounded-md px-3 py-1 text-sm font-bold ${
                                    isHighlighted 
                                      ? 'bg-accent text-accent-foreground ring-2 ring-primary' 
                                      : 'bg-muted text-foreground'
                                  }`}
                                >
                                  {number}
                                </span>
                              )
                            }) : (
                              <span className="inline-block rounded-md px-3 py-1 text-sm font-bold bg-muted/50 text-muted-foreground">
                                -
                              </span>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Northern/Southern region: Display in card format
          <>
            {result.prizes.map((prize, index) => (
              <PrizeDisplay
                key={prize.tier}
                prize={prize}
                index={index}
                isSpecial={index === 0}
                highlightNumbers={highlightNumbers}
              />
            ))}
          </>
        )}
      </CardContent>
    </Card>
  )
}
