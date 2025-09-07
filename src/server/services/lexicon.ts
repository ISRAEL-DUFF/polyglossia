import axios from 'axios'
import { supabase } from '@/server/supabase'
import { DOMParser as XmldomParser } from 'xmldom'
import * as xpath from 'xpath'
import { betaCodeToGreek } from 'beta-code-js'

export interface Sense {
  id?: string
  level?: string
  glosses: string[]
  quotes: { quote?: string; bibl?: { author?: string; title?: string; passage?: string } | null }[]
  htmlText: string
}

export interface LsjRow {
  word?: string
  beta_code?: string
  normalized_word?: string
  xml_entry: string
  senses?: Sense[]
}

export function normalizeLemma(lemma: string) {
  return lemma.replace(/\d+$/, '')
}

export function normalizeGreek(lemma: string) {
  const unicode = betaCodeToGreek(lemma)
  return unicode
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{Script=Greek}]/gu, '')
    .toLowerCase()
}

export function parsePerseusResponse(response: any) {
  const body = response?.RDF?.Annotation?.Body
  if (!body) return []

  const bodyList = Array.isArray(body) ? body : [body]
  const rawOutput = bodyList.flatMap((bodyItem: any) => {
    const entry = bodyItem.rest?.entry
    const dict = entry?.dict || {}
    const infls = Array.isArray(entry?.infl) ? entry.infl : [entry?.infl].filter(Boolean)

    const base = {
      lemma: dict.hdwd?.['$'] || null,
      partOfSpeech: dict.pofs?.['$'] || null,
    }

    return infls.map((infl: any) => ({
      ...base,
      case: infl?.case?.['$'] || null,
      gender: infl?.gend?.['$'] || null,
      number: infl?.num?.['$'] || null,
      tense: infl?.tense?.['$'] || null,
      voice: infl?.voice?.['$'] || null,
      mood: infl?.mood?.['$'] || null,
      person: infl?.pers?.['$'] || null,
      stem: infl?.term?.stem?.['$'] || null,
      suffix: infl?.term?.suff?.['$'] || null,
      morph: infl?.morph?.['$'] || null,
      stemtype: infl?.stemtype?.['$'] || null,
      derivtype: infl?.derivtype?.['$'] || null,
      dialect: infl?.dial?.['$'] || null,
    }))
  })

  return rawOutput.map((o: any) => {
    const d: Record<string, any> = {}
    for (const k of Object.keys(o)) {
      if ((o as any)[k]) d[k] = (o as any)[k]
    }
    return d
  })
}

export async function getPerseusMorph(word: string) {
  if (!word) throw new Error('Word cannot be empty')
  const url = `https://services.perseids.org/bsp/morphologyservice/analysis/word?lang=grc&engine=morpheusgrc&word=${encodeURIComponent(word)}`
  const resRaw = await axios.get(url)
  return parsePerseusResponse(resRaw.data)
}

export async function fetchLemmaFromMorphData(greekWord: string) {
  const morphology = await getPerseusMorph(greekWord)
  const lemmaMap: Record<string, string> = {}
  if (!morphology?.[0]?.lemma) return []
  for (const morphEntry of morphology) {
    const lemma = normalizeLemma(morphEntry.lemma)
    lemmaMap[lemma] = morphEntry.lemma
  }
  return Object.values(lemmaMap)
}

export function extractLexiconSenses(xmlEntry: string): Sense[] {
  const doc = new XmldomParser().parseFromString(xmlEntry, 'text/xml') as any
  const senseNodes: any[] = (xpath as any).select('//sense', doc)
  const results: Sense[] = []

  const processCitation = (citation: any) => {
    const quote = ((xpath as any).select('.//quote', citation))[0]?.textContent?.trim()
    const bibl = ((xpath as any).select('.//bibl', citation))[0]
    let biblRef: { author?: string; title?: string; passage?: string } | null = null
    if (bibl) {
      biblRef = {
        author: ((xpath as any).select('.//author', bibl))[0]?.textContent?.trim() || undefined,
        title: ((xpath as any).select('.//title', bibl))[0]?.textContent?.trim() || undefined,
        passage: bibl.textContent?.trim(),
      }
    }
    return { quote, bibl: biblRef }
  }

  const processBibl = (bibliology: any) => {
    const title = ((xpath as any).select('.//title', bibliology))[0]?.textContent?.trim()
    const author = ((xpath as any).select('.//author', bibliology))[0]
    const txt = (xpath as any).select('.//text()', bibliology).join('')
    return { text: txt ?? '', title: title ?? '', author: author ?? '' }
  }

  senseNodes.forEach((sense: any) => {
    const children = (xpath as any).select('./node()', sense)
    let htmlText = '<div>'
    const glosses: string[] = []
    const citations: { quote?: string; bibl?: { author?: string; title?: string; passage?: string } | null }[] = []

    children.forEach((node: any) => {
      const ignoredTexts: string[] = []
      if (node.nodeName === 'cit') {
        const citation = processCitation(node)
        htmlText += `<span class="inline-citation">${citation.quote ?? ''}</span>`
        citations.push(citation)
      } else if (node.nodeName === '#text') {
        const text = node.textContent?.trim() || ''
        htmlText += `<span class="gloss-context">${ignoredTexts.includes(text) ? '' : text}</span>`
      } else if (node.nodeName === 'i') {
        const text = node.textContent?.trim() || ''
        glosses.push(text)
        htmlText += `<span class="gloss-sense">${text}</span>`
      } else if (node.nodeName === 'foreign') {
        const text = node.textContent?.trim() || ''
        htmlText += `<span class="foreign-text">${text}</span>`
      } else if (node.nodeName === 'bibl') {
        const bibl = processBibl(node)
        htmlText += `
          <span class="inline-bibl">
            <span class="author">${bibl.author}</span>, 
            <span class="title">${bibl.title}</span> 
            <span class="reference">${bibl.text}</span>
          </span>`
      } else {
        const text = node.textContent?.trim() || ''
        htmlText += `<span class="other-text">${text}</span>`
      }
    })

    htmlText += '</div>'

    results.push({
      id: sense.getAttribute('id') ?? undefined,
      level: sense.getAttribute('level') ?? undefined,
      htmlText,
      glosses,
      quotes: citations,
    })
  })

  return results
}

export async function fetchLexiconEntry(greekWord: string) {
  if (!supabase) throw new Error('Supabase is not configured')
  const normalized = normalizeGreek(greekWord)
  const { data, error } = await supabase
    .from('lsj_lexicon')
    .select('word, beta_code, normalized_word, xml_entry')
    .or(`normalized_word.eq.${normalized},word.eq.${greekWord}`)
    .limit(1)

  if (error) throw error
  if (!data || data.length === 0) return null

  const row = data[0] as LsjRow
  const senses = extractLexiconSenses(row.xml_entry)
  return { ...row, senses }
}

