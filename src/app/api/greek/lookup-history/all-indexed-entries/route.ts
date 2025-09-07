import { NextResponse } from 'next/server'
import { fetchAllIndexedLookupHistory } from '@/server/services/lookupHistory'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const language = (searchParams.get('language') || 'greek') as any
    const data = await fetchAllIndexedLookupHistory({ language })
    return NextResponse.json(data ?? { index: [], indexList: {} })
  } catch (err) {
    console.error('all-indexed-entries handler error:', err)
    return NextResponse.json({ message: 'Failed to fetch all history' }, { status: 500 })
  }
}
