import { NextResponse } from 'next/server'
import { fetchIndexedLookupHistory } from '@/server/services/lookupHistory'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const language = (searchParams.get('language') || 'greek') as any
    const namespace = searchParams.get('namespace') || ''
    const data = await fetchIndexedLookupHistory({ language, namespace })
    return NextResponse.json(data ?? { index: [], indexList: {} })
  } catch (err) {
    console.error('indexed-entries handler error:', err)
    return NextResponse.json({ message: 'Failed to fetch history' }, { status: 500 })
  }
}
