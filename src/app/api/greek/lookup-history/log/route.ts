import { NextResponse } from 'next/server'
import { addLookupHistory } from '@/server/services/lookupHistory'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { word, lemma, namespace, language = 'greek' } = body || {}

    if (!word || !namespace || !language) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 })
    }

    const result = await addLookupHistory({ language, namespace, word, lemma })
    return NextResponse.json(result ?? {})
  } catch (err) {
    console.error('log handler error:', err)
    return NextResponse.json({ message: 'Failed to log history' }, { status: 500 })
  }
}
