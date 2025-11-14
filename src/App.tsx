import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { ArrowClockwise, MapPin } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { ResultCard } from '@/components/ResultCard'
import { SearchBar } from '@/components/SearchBar'
import { HistoricalResults } from '@/components/HistoricalResults'
import { generateMockResult, generateHistoricalResults } from '@/lib/lottery-utils'
import type { Region, LotteryResult } from '@/lib/types'
import { REGIONS } from '@/lib/types'
import { format } from 'date-fns'

function App() {
  const [activeRegion, setActiveRegion] = useState<Region>('north')
  const [searchNumber, setSearchNumber] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const [northResults, setNorthResults] = useKV<LotteryResult[]>('lottery-north-results', [])
  const [centralResults, setCentralResults] = useKV<LotteryResult[]>('lottery-central-results', [])
  const [southResults, setSouthResults] = useKV<LotteryResult[]>('lottery-south-results', [])

  useEffect(() => {
    if (!northResults || northResults.length === 0) {
      setNorthResults(generateHistoricalResults('north', 30))
    }
    if (!centralResults || centralResults.length === 0) {
      setCentralResults(generateHistoricalResults('central', 30))
    }
    if (!southResults || southResults.length === 0) {
      setSouthResults(generateHistoricalResults('south', 30))
    }
  }, [])

  const getResultsForRegion = (region: Region): LotteryResult[] => {
    switch (region) {
      case 'north':
        return northResults || []
      case 'central':
        return centralResults || []
      case 'south':
        return southResults || []
    }
  }

  const setResultsForRegion = (region: Region, results: LotteryResult[]) => {
    switch (region) {
      case 'north':
        setNorthResults(() => results)
        break
      case 'central':
        setCentralResults(() => results)
        break
      case 'south':
        setSouthResults(() => results)
        break
    }
  }

  const currentResults = getResultsForRegion(activeRegion)
  const displayResult = selectedDate
    ? currentResults.find(r => r.date === format(selectedDate, 'yyyy-MM-dd'))
    : currentResults[0]

  const handleRefresh = async () => {
    setIsRefreshing(true)
    
    setTimeout(() => {
      const newResult = generateMockResult(activeRegion, new Date())
      const updatedResults = [newResult, ...currentResults.slice(0, 29)]
      setResultsForRegion(activeRegion, updatedResults)
      
      setIsRefreshing(false)
      toast.success('Latest results updated!')
    }, 1000)
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSearchNumber('')
  }

  const handleSearch = (value: string) => {
    setSearchNumber(value)
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <div className="container mx-auto px-4 py-8 md:px-6 md:py-12">
        <header className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Vietnam Lottery Results
          </h1>
          <p className="text-lg text-muted-foreground">
            Live Updates & Historical Results
          </p>
        </header>

        <div className="mb-6">
          <SearchBar onSearch={handleSearch} />
        </div>

        <Tabs value={activeRegion} onValueChange={(v) => {
          setActiveRegion(v as Region)
          setSelectedDate(undefined)
          setSearchNumber('')
        }}>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <TabsList className="grid w-full grid-cols-3 md:w-auto">
              <TabsTrigger value="north" className="gap-2">
                <MapPin size={16} />
                <span className="hidden sm:inline">{REGIONS.north.nameEn}</span>
                <span className="sm:hidden">North</span>
              </TabsTrigger>
              <TabsTrigger value="central" className="gap-2">
                <MapPin size={16} />
                <span className="hidden sm:inline">{REGIONS.central.nameEn}</span>
                <span className="sm:hidden">Central</span>
              </TabsTrigger>
              <TabsTrigger value="south" className="gap-2">
                <MapPin size={16} />
                <span className="hidden sm:inline">{REGIONS.south.nameEn}</span>
                <span className="sm:hidden">South</span>
              </TabsTrigger>
            </TabsList>

            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2"
            >
              <ArrowClockwise size={18} className={isRefreshing ? 'animate-spin' : ''} />
              Refresh
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TabsContent value="north" className="mt-0">
                {displayResult ? (
                  <ResultCard result={displayResult} highlightNumbers={searchNumber ? [searchNumber] : []} />
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-12 text-center">
                    <p className="text-muted-foreground">No results available for this date</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="central" className="mt-0">
                {displayResult ? (
                  <ResultCard result={displayResult} highlightNumbers={searchNumber ? [searchNumber] : []} />
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-12 text-center">
                    <p className="text-muted-foreground">No results available for this date</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="south" className="mt-0">
                {displayResult ? (
                  <ResultCard result={displayResult} highlightNumbers={searchNumber ? [searchNumber] : []} />
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-12 text-center">
                    <p className="text-muted-foreground">No results available for this date</p>
                  </div>
                )}
              </TabsContent>
            </div>

            <div className="lg:col-span-1">
              <HistoricalResults
                results={currentResults}
                onSelectDate={handleDateSelect}
                selectedDate={selectedDate}
              />
            </div>
          </div>
        </Tabs>

        <footer className="mt-12 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>Results are for reference only - Demo Application</p>
        </footer>
      </div>
    </div>
  )
}

export default App
