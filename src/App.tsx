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
import { fetchLotteryResults } from '@/lib/lottery-api'
import type { Region, LotteryResult } from '@/lib/types'
import { REGIONS } from '@/lib/types'
import { format } from 'date-fns'

function App() {
  const [activeRegion, setActiveRegion] = useState<Region>('north')
  const [searchNumber, setSearchNumber] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  
  const [northResults, setNorthResults] = useKV<LotteryResult[]>('lottery-north-results', [])
  const [centralResults, setCentralResults] = useKV<LotteryResult[]>('lottery-central-results', [])
  const [southResults, setSouthResults] = useKV<LotteryResult[]>('lottery-south-results', [])

  useEffect(() => {
    const initializeResults = async () => {
      setIsInitialLoading(true)
      
      if (!northResults || northResults.length === 0) {
        console.log('🔄 Attempting to fetch live lottery data...')
        toast.loading('Loading latest lottery results...', { id: 'initial-load' })
        
        try {
          const todayResult = await fetchLotteryResults('north', new Date())
          toast.dismiss('initial-load')
          
          if (todayResult) {
            const historicalData = generateHistoricalResults('north', 29)
            setNorthResults([todayResult, ...historicalData])
            toast.success('✅ Live Northern lottery results loaded!', { duration: 4000 })
          } else {
            console.log('⚠️ Live data unavailable, loading demo data')
            setNorthResults(generateHistoricalResults('north', 30))
            toast.warning('Live data temporarily unavailable', { 
              duration: 6000,
              description: 'Free CORS proxies are rate-limited. Click "Fetch Live Results" to retry or use demo data.'
            })
          }
        } catch (error) {
          console.error('❌ Error initializing Northern results:', error)
          toast.dismiss('initial-load')
          setNorthResults(generateHistoricalResults('north', 30))
          toast.error('Network error occurred', {
            duration: 4000,
            description: 'Check your internet connection. Showing demo data.'
          })
        }
      }
      if (!centralResults || centralResults.length === 0) {
        setCentralResults(generateHistoricalResults('central', 30))
      }
      if (!southResults || southResults.length === 0) {
        setSouthResults(generateHistoricalResults('south', 30))
      }
      
      setIsInitialLoading(false)
    }
    
    initializeResults()
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
    
    try {
      if (activeRegion !== 'north') {
        toast.info('ℹ️ Live data only available for Northern region', {
          description: 'Central and Southern regions use demo data'
        })
        const newResult = generateMockResult(activeRegion, new Date())
        const existingIndex = currentResults.findIndex(r => r.date === newResult.date)
        let updatedResults: LotteryResult[]
        
        if (existingIndex >= 0) {
          updatedResults = [...currentResults]
          updatedResults[existingIndex] = newResult
        } else {
          updatedResults = [newResult, ...currentResults.slice(0, 29)]
        }
        
        setResultsForRegion(activeRegion, updatedResults)
        setIsRefreshing(false)
        return
      }
      
      console.log('🔄 Fetching live lottery results...')
      toast.loading('Fetching live results...', { id: 'fetch-loading' })
      
      const result = await fetchLotteryResults(activeRegion, new Date())
      
      toast.dismiss('fetch-loading')
      
      if (result) {
        const existingIndex = currentResults.findIndex(r => r.date === result.date)
        let updatedResults: LotteryResult[]
        
        if (existingIndex >= 0) {
          updatedResults = [...currentResults]
          updatedResults[existingIndex] = result
        } else {
          updatedResults = [result, ...currentResults.slice(0, 29)]
        }
        
        setResultsForRegion(activeRegion, updatedResults)
        toast.success('✅ Live results fetched successfully!', {
          description: `Updated results for ${format(new Date(), 'MMM dd, yyyy')}`
        })
      } else {
        toast.warning('⚠️ Could not fetch live data - all proxies failed', {
          duration: 6000,
          description: 'CORS proxies are rate-limited or blocked. Try again in a few moments, or use demo data.'
        })
        const newResult = generateMockResult(activeRegion, new Date())
        const existingIndex = currentResults.findIndex(r => r.date === newResult.date)
        let updatedResults: LotteryResult[]
        
        if (existingIndex >= 0) {
          updatedResults = [...currentResults]
          updatedResults[existingIndex] = newResult
        } else {
          updatedResults = [newResult, ...currentResults.slice(0, 29)]
        }
        
        setResultsForRegion(activeRegion, updatedResults)
      }
    } catch (error) {
      console.error('❌ Error refreshing results:', error)
      toast.dismiss('fetch-loading')
      toast.error('Network error occurred', {
        description: 'Check your connection. Showing demo data instead.'
      })
      const newResult = generateMockResult(activeRegion, new Date())
      const existingIndex = currentResults.findIndex(r => r.date === newResult.date)
      let updatedResults: LotteryResult[]
      
      if (existingIndex >= 0) {
        updatedResults = [...currentResults]
        updatedResults[existingIndex] = newResult
      } else {
        updatedResults = [newResult, ...currentResults.slice(0, 29)]
      }
      
      setResultsForRegion(activeRegion, updatedResults)
    } finally {
      setIsRefreshing(false)
    }
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
              {activeRegion === 'north' ? 'Fetch Live Results' : 'Refresh'}
            </Button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TabsContent value="north" className="mt-0">
                {isInitialLoading ? (
                  <div className="rounded-lg border border-border p-12 text-center">
                    <div className="mb-4 flex justify-center">
                      <ArrowClockwise size={32} className="animate-spin text-primary" />
                    </div>
                    <p className="text-muted-foreground">Loading latest lottery results...</p>
                  </div>
                ) : displayResult ? (
                  <ResultCard result={displayResult} highlightNumbers={searchNumber ? [searchNumber] : []} />
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-12 text-center">
                    <p className="text-muted-foreground">No results available for this date</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="central" className="mt-0">
                {isInitialLoading ? (
                  <div className="rounded-lg border border-border p-12 text-center">
                    <div className="mb-4 flex justify-center">
                      <ArrowClockwise size={32} className="animate-spin text-primary" />
                    </div>
                    <p className="text-muted-foreground">Loading latest lottery results...</p>
                  </div>
                ) : displayResult ? (
                  <ResultCard result={displayResult} highlightNumbers={searchNumber ? [searchNumber] : []} />
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-12 text-center">
                    <p className="text-muted-foreground">No results available for this date</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="south" className="mt-0">
                {isInitialLoading ? (
                  <div className="rounded-lg border border-border p-12 text-center">
                    <div className="mb-4 flex justify-center">
                      <ArrowClockwise size={32} className="animate-spin text-primary" />
                    </div>
                    <p className="text-muted-foreground">Loading latest lottery results...</p>
                  </div>
                ) : displayResult ? (
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
          <p className="font-medium">Northern results attempt live data via multiple CORS proxies</p>
          <p className="mt-2 text-xs">⚠️ Free CORS proxies may be rate-limited or blocked - demo data shown as fallback</p>
          <p className="mt-1 text-xs">💡 If live fetch fails, wait a few minutes and try again</p>
          <p className="mt-2 text-xs">Central & Southern regions currently use demo data only</p>
          <p className="mt-2 text-xs opacity-75">Results are for reference only • Not affiliated with official lottery organizations</p>
        </footer>
      </div>
    </div>
  )
}

export default App
