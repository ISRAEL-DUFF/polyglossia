export interface MorphologyResult {
  form: string;
  lemma: string;
  pos: string; // Part of speech
  morphology: string;
  analysis: {
    person?: string;
    number?: string;
    tense?: string;
    mood?: string;
    voice?: string;
    gender?: string;
    case?: string;
  };
  translation?: string;
}

const MORPHEUS_API_URL = "https://services.perseids.org/bsp/morphologyservice/analysis/word";

/**
 * Analyze Greek word morphology using the Morpheus API
 * Documentation: https://github.com/perseids-tools/morpheus-api
 */
export async function analyzeMorphology(word: string): Promise<MorphologyResult[]> {
  console.log(`Analyzing morphology for: ${word} via Morpheus API`);
  
  try {
    const params = new URLSearchParams({
      word,
      lang: "grc", // Ancient Greek
      engine: "morpheusgrc" // Specify the Greek morphology engine
    });
    
    const response = await fetch(`${MORPHEUS_API_URL}?${params}`);
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Morpheus API response:", JSON.stringify(data, null, 2));
    
    // Parse the response using the new function
    const parsedResults = parsePerseusResponse(data);
    console.log("Parsed results:", parsedResults);
    
    // If no results were found
    if (!parsedResults || parsedResults.length === 0) {
      console.log("No analysis data found in response");
      return [{
        form: word,
        lemma: "unknown",
        pos: "unknown",
        morphology: "Could not analyze this form",
        analysis: {},
        translation: "Unknown form"
      }];
    }
    
    // Map the parsed results to our interface
    const results: MorphologyResult[] = parsedResults.map(result => ({
      form: word,
      lemma: result.lemma || "unknown",
      pos: mapPartOfSpeech(result.partOfSpeech),
      morphology: formatMorphologyFromParsed(result),
      analysis: {
        person: result.person,
        number: expandNumber(result.number),
        tense: expandTense(result.tense),
        mood: expandMood(result.mood),
        voice: expandVoice(result.voice),
        gender: expandGender(result.gender),
        case: expandCase(result.case)
      },
      translation: result.lemma || "No definition available"
    }));
    
    console.log("Final results:", results);
    return results;
    
  } catch (error) {
    console.error("Error analyzing morphology:", error);
    
    // Return fallback result on error
    return [{
      form: word,
      lemma: "error",
      pos: "unknown",
      morphology: "Error analyzing this form",
      analysis: {},
      translation: "An error occurred during analysis"
    }];
  }
}

// New parser function for the Perseids/Morpheus API response
function parsePerseusResponse(response: any) {
  const body = response?.RDF?.Annotation?.Body;
  if (!body) return [];

  const bodyList = Array.isArray(body) ? body : [body];
  const rawOutput = bodyList.flatMap(bodyItem => {
    const entry = bodyItem.rest?.entry;
    const dict = entry?.dict || {};
    const infls = Array.isArray(entry?.infl) ? entry.infl : [entry?.infl].filter(Boolean);

    const base = {
      lemma: dict.hdwd?.["$"] || null,
      partOfSpeech: dict.pofs?.["$"] || null
    };

    return infls.map(infl => ({
      ...base,
      case: infl?.case?.["$"] || null,
      gender: infl?.gend?.["$"] || null,
      number: infl?.num?.["$"] || null,
      tense: infl?.tense?.["$"] || null,
      voice: infl?.voice?.["$"] || null,
      mood: infl?.mood?.["$"] || null,
      person: infl?.pers?.["$"] || null,
      stem: infl?.term?.stem?.["$"] || null,
      suffix: infl?.term?.suff?.["$"] || null,
      morph: infl?.morph?.["$"] || null,
      stemtype: infl?.stemtype?.["$"] || null,
      derivtype: infl?.derivtype?.["$"] || null,
      dialect: infl?.dial?.["$"] || null
    }));
  });

  // remove null fields
  return rawOutput.map((o) => {
    let d: Record<string, any> = {};
    for(const k of Object.keys(o)) {
      if(o[k]) {
        d[k] = o[k];
      }
    }
    return d;
  });
}

// Helper functions to format and map values
function mapPartOfSpeech(pofs: string | undefined): string {
  if (!pofs) return "unknown";
  
  const mapping: Record<string, string> = {
    "verb": "verb",
    "noun": "noun",
    "adj": "adjective",
    "adv": "adverb",
    "conj": "conjunction",
    "prep": "preposition",
    "part": "particle",
    "pron": "pronoun",
    "exclam": "exclamation",
    "numeral": "numeral",
    "article": "article"
  };
  
  return mapping[pofs] || pofs;
}

function expandNumber(num: string | undefined): string | undefined {
  if (!num) return undefined;
  
  const numberMap: Record<string, string> = {
    "sg": "singular",
    "pl": "plural",
    "dual": "dual"
  };
  
  return numberMap[num] || num;
}

function expandTense(tense: string | undefined): string | undefined {
  if (!tense) return undefined;
  
  const tenseMap: Record<string, string> = {
    "pres": "present",
    "imperf": "imperfect",
    "fut": "future",
    "aor": "aorist",
    "perf": "perfect",
    "plup": "pluperfect",
    "futperf": "future perfect"
  };
  
  return tenseMap[tense] || tense;
}

function expandMood(mood: string | undefined): string | undefined {
  if (!mood) return undefined;
  
  const moodMap: Record<string, string> = {
    "ind": "indicative",
    "subj": "subjunctive",
    "opt": "optative",
    "imperat": "imperative",
    "inf": "infinitive",
    "part": "participle"
  };
  
  return moodMap[mood] || mood;
}

function expandVoice(voice: string | undefined): string | undefined {
  if (!voice) return undefined;
  
  const voiceMap: Record<string, string> = {
    "act": "active",
    "mid": "middle",
    "pass": "passive",
    "mp": "middle-passive"
  };
  
  return voiceMap[voice] || voice;
}

function expandGender(gender: string | undefined): string | undefined {
  if (!gender) return undefined;
  
  const genderMap: Record<string, string> = {
    "masc": "masculine",
    "fem": "feminine",
    "neut": "neuter"
  };
  
  return genderMap[gender] || gender;
}

function expandCase(grammaticalCase: string | undefined): string | undefined {
  if (!grammaticalCase) return undefined;
  
  const caseMap: Record<string, string> = {
    "nom": "nominative",
    "gen": "genitive",
    "dat": "dative",
    "acc": "accusative",
    "voc": "vocative",
    "abl": "ablative",
    "loc": "locative",
    "ins": "instrumental"
  };
  
  return caseMap[grammaticalCase] || grammaticalCase;
}

function formatMorphologyFromParsed(result: any): string {
  if (!result) return "Unknown form";
  
  const parts: string[] = [];
  
  if (result.tense) parts.push(expandTense(result.tense)!);
  if (result.voice) parts.push(expandVoice(result.voice)!);
  if (result.mood) parts.push(expandMood(result.mood)!);
  if (result.person) parts.push(`${result.person} person`);
  if (result.number) parts.push(expandNumber(result.number)!);
  if (result.gender) parts.push(expandGender(result.gender)!);
  if (result.case) parts.push(expandCase(result.case)!);
  
  return parts.join(' ') || "Incomplete morphological information";
}

// Keeping the old formatMorphology function for compatibility
function formatMorphology(result: any): string {
  if (!result || !result.morphology) return "Unknown form";
  
  // If the API returns a pre-formatted morphology string, use it
  if (typeof result.morphology === 'string') {
    return result.morphology;
  }
  
  const parts: string[] = [];
  
  const tense = extractTense(result);
  if (tense) parts.push(tense);
  
  const voice = extractVoice(result);
  if (voice) parts.push(voice);
  
  const mood = extractMood(result);
  if (mood) parts.push(mood);
  
  const person = extractPerson(result);
  if (person) parts.push(person);
  
  const number = extractNumber(result);
  if (number) parts.push(number);
  
  const gender = extractGender(result);
  if (gender) parts.push(gender);
  
  const grammaticalCase = extractCase(result);
  if (grammaticalCase) parts.push(grammaticalCase);
  
  return parts.join(' ') || "Incomplete morphological information";
}

// Keeping these functions for backwards compatibility
function extractPerson(result: any): string | undefined {
  if (!result.features) return undefined;
  
  const personMap: Record<string, string> = {
    "1st": "1st",
    "2nd": "2nd",
    "3rd": "3rd"
  };
  
  return personMap[result.features.pers] || result.features.pers;
}

function extractNumber(result: any): string | undefined {
  if (!result.features) return undefined;
  
  const numberMap: Record<string, string> = {
    "sg": "singular",
    "pl": "plural",
    "dual": "dual"
  };
  
  return numberMap[result.features.num] || result.features.num;
}

function extractTense(result: any): string | undefined {
  if (!result.features) return undefined;
  
  const tenseMap: Record<string, string> = {
    "pres": "present",
    "imperf": "imperfect",
    "fut": "future",
    "aor": "aorist",
    "perf": "perfect",
    "plup": "pluperfect",
    "futperf": "future perfect"
  };
  
  return tenseMap[result.features.tense] || result.features.tense;
}

function extractMood(result: any): string | undefined {
  if (!result.features) return undefined;
  
  const moodMap: Record<string, string> = {
    "ind": "indicative",
    "subj": "subjunctive",
    "opt": "optative",
    "imperat": "imperative",
    "inf": "infinitive",
    "part": "participle"
  };
  
  return moodMap[result.features.mood] || result.features.mood;
}

function extractVoice(result: any): string | undefined {
  if (!result.features) return undefined;
  
  const voiceMap: Record<string, string> = {
    "act": "active",
    "mid": "middle",
    "pass": "passive",
    "mp": "middle-passive"
  };
  
  return voiceMap[result.features.voice] || result.features.voice;
}

function extractGender(result: any): string | undefined {
  if (!result.features) return undefined;
  
  const genderMap: Record<string, string> = {
    "masc": "masculine",
    "fem": "feminine",
    "neut": "neuter"
  };
  
  return genderMap[result.features.gend] || result.features.gend;
}

function extractCase(result: any): string | undefined {
  if (!result.features) return undefined;
  
  const caseMap: Record<string, string> = {
    "nom": "nominative",
    "gen": "genitive",
    "dat": "dative",
    "acc": "accusative",
    "voc": "vocative",
    "abl": "ablative",
    "loc": "locative",
    "ins": "instrumental"
  };
  
  return caseMap[result.features.case] || result.features.case;
}
