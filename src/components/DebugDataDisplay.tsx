import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Check } from '@phosphor-icons/react'
import { useState } from 'react'
import { toast } from 'sonner'

interface DebugDataDisplayProps {
  data: string
  title?: string
  className?: string
}

export function DebugDataDisplay({ data, title = 'Retrieved HTML Data', className }: DebugDataDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data)
      setCopied(true)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  if (!data) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="h-8 gap-2"
        >
          {copied ? (
            <>
              <Check size={16} className="text-green-500" />
              Copied
            </>
          ) : (
            <>
              <Copy size={16} />
              Copy
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">
            Length: {data.length} characters
          </div>
          <Textarea
            value={data}
            readOnly
            className="font-mono text-xs h-[400px] resize-none"
            placeholder="No data retrieved yet"
          />
        </div>
      </CardContent>
    </Card>
  )
}
