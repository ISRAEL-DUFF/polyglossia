import { NextResponse } from 'next/server'
import { fetchNamespaces } from '@/server/services/lookupHistory'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const language = (searchParams.get('language') || 'greek') as any
    const data = await fetchNamespaces(language)
    return NextResponse.json(data ?? [])
  } catch (err) {
    console.error('namespaces handler error:', err)
    return NextResponse.json({ message: 'Failed to fetch namespaces' }, { status: 500 })
  }
}
