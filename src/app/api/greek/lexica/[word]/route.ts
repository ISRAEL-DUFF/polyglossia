import { NextResponse } from 'next/server'
import { fetchLexiconEntry, fetchLemmaFromMorphData, getPerseusMorph, normalizeLemma } from '@/server/services/lexicon'

export async function GET(
  _req: Request,
  ctx: { params: { word: string } }
) {
  try {
    const { word } = ctx.params

    // Resolve lemma candidates via morphology; if none, fallback to the input word
    let lemmas: string[] = []
    try {
      lemmas = await fetchLemmaFromMorphData(word)
    } catch {
      lemmas = []
    }
    if (!lemmas || lemmas.length === 0) {
      lemmas = [word]
    }

    // Unique + normalized
    const lemmaSet = new Set<string>(lemmas.map((l) => normalizeLemma(l)))

    const lexica: Record<string, any> = {}
    for (const lemma of Array.from(lemmaSet)) {
      try {
        const row = await fetchLexiconEntry(lemma)
        if (row) {
          // Build LSJ entry shape expected by the UI
          const headerHtml = `<div class="lsj-header"><strong>${row.word ?? lemma}</strong></div>`
          const senses = Array.isArray(row.senses) ? row.senses : []
          lexica[lemma] = {
            lsj: [
              {
                // retained for tab labels in UI
                word: row.word ?? lemma,
                entry: {
                  headerHtml,
                  senses,
                },
              },
            ],
          }
        }
      } catch (e) {
        // swallow per-lemma errors; continue
      }
    }

    // Fetch morphology for the original surface form
    let morphology: any[] = []
    try {
      morphology = await getPerseusMorph(word)
    } catch {
      morphology = []
    }

    return NextResponse.json({ morphology, lexica })
  } catch (err) {
    console.error('lexica handler error:', err)
    return NextResponse.json({ message: 'Failed to fetch lexicon data' }, { status: 500 })
  }
}
