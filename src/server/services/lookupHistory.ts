import { supabase } from '@/server/supabase'

export type HistoryLanguage = 'greek' | 'hebrew' | 'latin'

export interface HistoryEntry {
  id: string
  created_at: string
  updated_at: string | null
  language: HistoryLanguage
  namespace: string
  word: string
  lemma?: string | null
  frequency: number
}

export interface IndexedHistoryResponse {
  index: string[]
  indexList: Record<string, (Pick<HistoryEntry, 'id' | 'word' | 'namespace' | 'frequency'> & { createdAt: string; updatedAt: string | null; lemma?: string | null })[]>
}

function validateLanguage(language: string): asserts language is HistoryLanguage {
  const valid: HistoryLanguage[] = ['greek', 'hebrew', 'latin']
  if (!valid.includes(language as any)) {
    throw new Error(`Invalid language: ${language}`)
  }
}

function normalizeGreek(word: string) {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{Script=Greek}]/gu, '')
    .toLowerCase()
}

export async function fetchNamespaces(language: HistoryLanguage) {
  validateLanguage(language)
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase
    .from('lookup_history')
    .select('namespace')
    .eq('language', language)

  if (error) throw error

  const counts = new Map<string, number>()
  for (const row of data ?? []) {
    const ns = (row as any).namespace as string
    counts.set(ns, (counts.get(ns) ?? 0) + 1)
  }

  return Array.from(counts.entries()).map(([namespace, count]) => ({
    namespace,
    count: String(count),
  }))
}

export async function fetchIndexedLookupHistory(args: { language: HistoryLanguage; namespace: string }): Promise<IndexedHistoryResponse> {
  validateLanguage(args.language)
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase
    .from('lookup_history')
    .select('id, word, lemma, namespace, frequency, created_at, updated_at')
    .eq('language', args.language)
    .eq('namespace', args.namespace)
    .order('created_at', { ascending: false })

  if (error) throw error

  const indexList: IndexedHistoryResponse['indexList'] = {}
  const index: string[] = []
  for (const row of data ?? []) {
    const normFirst = normalizeGreek((row as any).word)[0]
    if (!indexList[normFirst]) {
      indexList[normFirst] = []
      index.push(normFirst)
    }
    indexList[normFirst].push({
      id: String((row as any).id),
      word: (row as any).word,
      namespace: (row as any).namespace,
      frequency: Number((row as any).frequency),
      createdAt: (row as any).created_at,
      updatedAt: (row as any).updated_at,
      lemma: (row as any).lemma,
    })
  }
  return { index, indexList }
}

export async function fetchAllIndexedLookupHistory(args: { language: HistoryLanguage }): Promise<IndexedHistoryResponse> {
  validateLanguage(args.language)
  if (!supabase) throw new Error('Supabase is not configured')

  const { data, error } = await supabase
    .from('lookup_history')
    .select('id, word, lemma, namespace, frequency, created_at, updated_at')
    .eq('language', args.language)
    .order('created_at', { ascending: false })

  if (error) throw error

  const indexList: IndexedHistoryResponse['indexList'] = {}
  const index: string[] = []
  for (const row of data ?? []) {
    const normFirst = normalizeGreek((row as any).word)[0]
    if (!indexList[normFirst]) {
      indexList[normFirst] = []
      index.push(normFirst)
    }
    indexList[normFirst].push({
      id: String((row as any).id),
      word: (row as any).word,
      namespace: (row as any).namespace,
      frequency: Number((row as any).frequency),
      createdAt: (row as any).created_at,
      updatedAt: (row as any).updated_at,
      lemma: (row as any).lemma,
    })
  }
  return { index, indexList }
}

async function getLookupEntry(args: { language: HistoryLanguage; namespace: string; word: string }) {
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('lookup_history')
    .select('id, frequency')
    .eq('language', args.language)
    .eq('namespace', args.namespace)
    .eq('word', args.word)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data as { id: string; frequency: number } | null
}

export async function addLookupHistory(args: { language: HistoryLanguage; namespace: string; word: string; lemma?: string }) {
  validateLanguage(args.language)
  if (!supabase) throw new Error('Supabase is not configured')

  const existing = await getLookupEntry({ language: args.language, namespace: args.namespace, word: args.word })
  if (existing) {
    const newFreq = Number(existing.frequency) + 1
    const { data, error } = await supabase
      .from('lookup_history')
      .update({ frequency: newFreq, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('id, created_at')
      .maybeSingle()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('lookup_history')
    .insert({
      language: args.language,
      namespace: args.namespace,
      word: args.word,
      lemma: args.lemma ?? null,
      frequency: 1,
    })
    .select('id, created_at')
    .maybeSingle()

  if (error) throw error
  return data
}

export async function deleteLookupHistory(language: HistoryLanguage, namespace: string, id: string) {
  validateLanguage(language)
  if (!supabase) throw new Error('Supabase is not configured')
  const { data, error } = await supabase
    .from('lookup_history')
    .delete()
    .eq('language', language)
    .eq('namespace', namespace)
    .eq('id', id)
    .select('id, word, namespace, frequency, created_at, updated_at')
  if (error) throw error
  return (data ?? []).map((row) => ({
    id: String((row as any).id),
    word: (row as any).word,
    namespace: (row as any).namespace,
    frequency: Number((row as any).frequency),
    createdAt: (row as any).created_at,
    updatedAt: (row as any).updated_at,
  }))
}

