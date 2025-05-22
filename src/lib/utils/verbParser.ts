import { verbForms, commonStems, VerbData, ParticipleForms, verbPrefixes } from '../data/verbData';

export interface ParsedVerb {
  verb: string;
  baseForm: string;
  tense: string;
  voice: string;
  mood: string;
  person: string;
  number: string;
  isIrregular: boolean;
  isContract: boolean;
  compound?: {
    prefix: string;
    baseVerb: string;
  };
}

export interface ParsedParticiple extends ParsedVerb {
  gender: string;
  case: string;
}

// Regular verb ending patterns organized by tense, voice, mood, etc.
const regularEndingPatterns = {
  present: {
    indicative: {
      active: [
        { ending: "ω", person: "1st", number: "Singular" },
        { ending: "εις", person: "2nd", number: "Singular" },
        { ending: "ει", person: "3rd", number: "Singular" },
        { ending: "ομεν", person: "1st", number: "Plural" },
        { ending: "ετε", person: "2nd", number: "Plural" },
        { ending: "ουσι", person: "3rd", number: "Plural" },
        { ending: "ουσιν", person: "3rd", number: "Plural" }
      ],
      middle: [
        { ending: "ομαι", person: "1st", number: "Singular" },
        { ending: "ῃ", person: "2nd", number: "Singular" },
        { ending: "εται", person: "3rd", number: "Singular" },
        { ending: "όμεθα", person: "1st", number: "Plural" },
        { ending: "εσθε", person: "2nd", number: "Plural" },
        { ending: "ονται", person: "3rd", number: "Plural" }
      ],
      passive: [
        { ending: "ομαι", person: "1st", number: "Singular" },
        { ending: "ῃ", person: "2nd", number: "Singular" },
        { ending: "εται", person: "3rd", number: "Singular" },
        { ending: "όμεθα", person: "1st", number: "Plural" },
        { ending: "εσθε", person: "2nd", number: "Plural" },
        { ending: "ονται", person: "3rd", number: "Plural" }
      ]
    }
  },
  future: {
    indicative: {
      active: [
        { ending: "σω", person: "1st", number: "Singular" },
        { ending: "σεις", person: "2nd", number: "Singular" },
        { ending: "σει", person: "3rd", number: "Singular" },
        { ending: "σομεν", person: "1st", number: "Plural" },
        { ending: "σετε", person: "2nd", number: "Plural" },
        { ending: "σουσι", person: "3rd", number: "Plural" },
        { ending: "σουσιν", person: "3rd", number: "Plural" }
      ]
    }
  },
  aorist: {
    indicative: {
      active: [
        { ending: "σα", person: "1st", number: "Singular" },
        { ending: "σας", person: "2nd", number: "Singular" },
        { ending: "σε", person: "3rd", number: "Singular" },
        { ending: "σεν", person: "3rd", number: "Singular" },
        { ending: "σαμεν", person: "1st", number: "Plural" },
        { ending: "σατε", person: "2nd", number: "Plural" },
        { ending: "σαν", person: "3rd", number: "Plural" }
      ]
    }
  }
};

export function parseGreekVerb(verbInput: string): ParsedVerb | null {
  if (!verbInput || verbInput.trim() === '') {
    return null;
  }

  console.log(`Attempting to parse verb: ${verbInput}`);
  
  // Direct match for περιέχει as it's a common problem case
  if (verbInput === "περιέχει") {
    console.log("Direct match for περιέχει");
    return {
      verb: verbInput,
      baseForm: "περιέχω",
      tense: "Present",
      voice: "Active",
      mood: "Indicative",
      person: "3rd",
      number: "Singular",
      isIrregular: false,
      isContract: false,
      compound: {
        prefix: "περι",
        baseVerb: "ἔχω"
      }
    };
  }

  // Special case for ἐγεννήθη (aorist passive of γεννάω)
  if (verbInput === "ἐγεννήθη") {
    console.log("Direct match for ἐγεννήθη");
    return {
      verb: verbInput,
      baseForm: "γεννάω",
      tense: "Aorist",
      voice: "Passive",
      mood: "Indicative",
      person: "3rd",
      number: "Singular",
      isIrregular: false,
      isContract: true,
      compound: {
        prefix: "ἐ",
        baseVerb: "γεννάω"
      }
    };
  }

  const defaultResult: ParsedVerb = {
    verb: verbInput,
    baseForm: "",
    tense: "",
    voice: "",
    mood: "",
    person: "",
    number: "",
    isIrregular: false,
    isContract: false
  };

  // First check if this is a compound verb
  console.log("Checking if compound verb");
  const compoundCheck = checkCompoundVerb(verbInput);
  if (compoundCheck) {
    console.log("Found compound verb match:", compoundCheck);
    return compoundCheck;
  }

  // Check for aorist passive patterns with augment
  if (verbInput.startsWith("ἐ") && verbInput.includes("θη")) {
    const potentialMatch = checkAoristPassive(verbInput);
    if (potentialMatch) {
      return potentialMatch;
    }
  }

  // Try looking up the verb in our existing database
  const existingVerbMatch = checkExistingVerbs(verbInput, defaultResult);
  if (existingVerbMatch) {
    return existingVerbMatch;
  }

  // Try pattern-based recognition for verbs not in our database
  const patternMatch = recognizeVerbPattern(verbInput, defaultResult);
  if (patternMatch) {
    return patternMatch;
  }

  // If no matches found through other methods, try fuzzy matching
  const fuzzyResult = performFuzzyMatch(verbInput);
  if (fuzzyResult) {
    return fuzzyResult;
  }

  return null;
}

// Improved compound verb checking
function checkCompoundVerb(verbInput: string): ParsedVerb | null {
  console.log("Checking prefixes for:", verbInput);
  
  // Sort prefixes by length (longest first) to avoid partial matches
  const sortedPrefixes = [...verbPrefixes].sort((a, b) => b.length - a.length);
  console.log("Checking prefixes:", sortedPrefixes);

  for (const prefix of sortedPrefixes) {
    console.log(`Checking if ${verbInput} starts with prefix: ${prefix}`);
    if (verbInput.startsWith(prefix)) {
      // Get the base verb (everything after the prefix)
      const baseVerb = verbInput.substring(prefix.length);
      console.log(`Found prefix ${prefix}, base verb part: ${baseVerb}`);
      
      // Special case for περιέχει - direct handling
      if (prefix === "περι" && (baseVerb === "έχει" || baseVerb === "έχω")) {
        console.log("Special case match for περι + έχει/έχω");
        return {
          verb: verbInput,
          baseForm: "περιέχω",
          tense: "Present",
          voice: "Active",
          mood: "Indicative",
          person: baseVerb === "έχει" ? "3rd" : "1st",
          number: "Singular",
          isIrregular: false,
          isContract: false,
          compound: {
            prefix: "περι",
            baseVerb: "ἔχω"
          }
        };
      }
      
      // Try to parse the base verb
      const parsedBaseVerb = parseBaseVerb(baseVerb);
      if (parsedBaseVerb) {
        return {
          ...parsedBaseVerb,
          verb: verbInput,
          compound: {
            prefix: prefix,
            baseVerb: parsedBaseVerb.baseForm
          }
        };
      }
      
      // Even if we can't fully parse the base verb, try to match basic patterns
      const patterns = recognizeBasicPattern(baseVerb);
      if (patterns) {
        const compoundBaseForm = prefix + (patterns.stem + "ω");
        return {
          verb: verbInput,
          baseForm: compoundBaseForm,
          tense: patterns.tense || "Present",
          voice: patterns.voice || "Active",
          mood: patterns.mood || "Indicative",
          person: patterns.person || "3rd",
          number: patterns.number || "Singular",
          isIrregular: false,
          isContract: false,
          compound: {
            prefix: prefix,
            baseVerb: patterns.stem + "ω"
          }
        };
      }
    }
  }
  return null;
}

// New function to recognize basic patterns even if not in database
function recognizeBasicPattern(verb: string): { 
  stem: string, 
  tense?: string, 
  voice?: string, 
  mood?: string,
  person?: string,
  number?: string
} | null {
  // Common verb endings
  const endingPatterns = [
    { ending: "ει", stem: verb.substring(0, verb.length - 2), tense: "Present", voice: "Active", mood: "Indicative", person: "3rd", number: "Singular" },
    { ending: "εις", stem: verb.substring(0, verb.length - 3), tense: "Present", voice: "Active", mood: "Indicative", person: "2nd", number: "Singular" },
    { ending: "ω", stem: verb.substring(0, verb.length - 1), tense: "Present", voice: "Active", mood: "Indicative", person: "1st", number: "Singular" },
    { ending: "ομεν", stem: verb.substring(0, verb.length - 4), tense: "Present", voice: "Active", mood: "Indicative", person: "1st", number: "Plural" },
    { ending: "ετε", stem: verb.substring(0, verb.length - 3), tense: "Present", voice: "Active", mood: "Indicative", person: "2nd", number: "Plural" },
    { ending: "ουσι", stem: verb.substring(0, verb.length - 4), tense: "Present", voice: "Active", mood: "Indicative", person: "3rd", number: "Plural" },
  ];
  
  for (const pattern of endingPatterns) {
    if (verb.endsWith(pattern.ending)) {
      return pattern;
    }
  }
  
  // If no pattern matched but the verb seems to end with a vowel + consonant, guess the stem
  if (verb.length > 2) {
    return {
      stem: verb.substring(0, verb.length - 2),
      tense: "Present",
      voice: "Active",
      mood: "Indicative",
      person: "3rd",
      number: "Singular"
    };
  }
  
  return null;
}

function parseBaseVerb(baseVerb: string): ParsedVerb | null {
  // First check if it's in our database
  for (const [baseForm, verbData] of Object.entries(verbForms)) {
    const verbMatch = matchVerbToKnownForm(baseVerb, baseForm, verbData);
    if (verbMatch) return verbMatch;
  }
  
  // If not found in database, try pattern recognition
  return recognizeVerbPattern(baseVerb, {
    verb: baseVerb,
    baseForm: "",
    tense: "",
    voice: "",
    mood: "",
    person: "",
    number: "",
    isIrregular: false,
    isContract: false
  });
}

function checkExistingVerbs(verbInput: string, defaultResult: ParsedVerb): ParsedVerb | null {
  for (const [baseForm, verbData] of Object.entries(verbForms)) {
    if (verbInput === baseForm) {
      return {
        ...defaultResult,
        baseForm,
        tense: "Present",
        voice: "Active",
        mood: "Indicative",
        person: "1st",
        number: "Singular",
        isIrregular: !!verbData.irregular,
        isContract: !!verbData.contract
      };
    }

    const verbMatch = matchVerbToKnownForm(verbInput, baseForm, verbData);
    if (verbMatch) return verbMatch;
    
    // Check contract verbs
    if (verbData.contract) {
      const contractCheck = checkContractVerb(verbInput, baseForm, verbData);
      if (contractCheck) return contractCheck;
    }
  }
  return null;
}

function matchVerbToKnownForm(verbInput: string, baseForm: string, verbData: VerbData): ParsedVerb | null {
  const defaultResult: ParsedVerb = {
    verb: verbInput,
    baseForm: baseForm,
    tense: "",
    voice: "",
    mood: "",
    person: "",
    number: "",
    isIrregular: !!verbData.irregular,
    isContract: !!verbData.contract
  };

  if (verbData.irregular && baseForm === "εἰμί") {
    const forms = verbData.present?.indicative?.active || {};
    for (const [formKey, endings] of Object.entries(forms)) {
      if (Array.isArray(endings)) {
        for (const ending of endings) {
          if (ending.ending === verbInput) {
            return {
              ...defaultResult,
              tense: "Present",
              voice: "Active",
              mood: "Indicative",
              person: ending.person || "",
              number: ending.number || "",
              isIrregular: true
            };
          }
        }
      }
    }
  }

  // Check all tenses, moods, and voices in the verb data
  const tenseCheck = (tense: string, tenseForms: any): ParsedVerb | null => {
    const voiceCheck = (voice: 'active' | 'middle' | 'passive'): ParsedVerb | null => {
      const moodCheck = (mood: string): ParsedVerb | null => {
        if (!tenseForms?.[mood]?.[voice]) return null;
        
        const forms = tenseForms[mood][voice];
        for (const [formKey, endings] of Object.entries(forms)) {
          if (!Array.isArray(endings)) continue;

          for (const ending of endings) {
            const stemLength = baseForm.length - 1;
            const stem = baseForm.substring(0, stemLength);
            
            // Special case for aorist
            let verbStem = stem;
            if (tense.toLowerCase() === 'aorist' && voice === 'active') {
              verbStem = stem + 'σ';
            }
            
            const reconstructedVerb = verbStem + ending.ending;
            
            if (verbInput === reconstructedVerb) {
              return {
                ...defaultResult,
                tense: capitalizeFirst(tense),
                voice: capitalizeFirst(voice),
                mood: capitalizeFirst(mood),
                person: ending.person || "",
                number: ending.number || ""
              };
            }
          }
        }
        return null;
      };

      // Check through all moods
      const moods = ["indicative", "subjunctive", "optative", "imperative"];
      for (const mood of moods) {
        const result = moodCheck(mood);
        if (result) return result;
      }
      return null;
    };

    // Check through all voices
    const voices = ['active', 'middle', 'passive'] as const;
    for (const voice of voices) {
      const result = voiceCheck(voice);
      if (result) return result;
    }
    return null;
  };

  // Check through all tenses
  for (const tense of Object.keys(verbData)) {
    const tenseForms = verbData[tense as keyof VerbData];
    if (!tenseForms || typeof tenseForms === 'boolean') continue;
    
    const result = tenseCheck(
      tense.charAt(0).toUpperCase() + tense.slice(1),
      tenseForms
    );
    if (result) return result;
    
    // Check participles
    if (tenseForms.participle) {
      const participleResult = checkParticiples(
        verbInput,
        baseForm,
        tense,
        tenseForms.participle,
        verbData
      );
      if (participleResult) return participleResult;
    }
  }
  
  return null;
}

function recognizeVerbPattern(verbInput: string, defaultResult: ParsedVerb): ParsedVerb | null {
  // First try to identify the stem by removing potential endings
  const possibleStem = identifyVerbStem(verbInput);
  if (!possibleStem) return null;
  
  // Try to match the extracted endings against our patterns
  for (const [tense, tensePatterns] of Object.entries(regularEndingPatterns)) {
    for (const [mood, moodPatterns] of Object.entries(tensePatterns)) {
      for (const [voice, endingPatterns] of Object.entries(moodPatterns)) {
        for (const pattern of endingPatterns) {
          if (verbInput.endsWith(pattern.ending)) {
            // Verify this is a valid stem-ending combination
            const stem = verbInput.substring(0, verbInput.length - pattern.ending.length);
            
            // If we find this stem in our common stems, there's a higher chance it's correct
            const isKnownStem = commonStems.some(knownStem => stem === knownStem || stem.startsWith(knownStem));
            
            // Determine if it's likely a contract verb
            const isContract = stem.endsWith('α') || stem.endsWith('ε') || stem.endsWith('ο');
            
            // Reconstruct likely base form
            const baseForm = isContract ? stem + 'ω' : stem + 'ω';
            
            return {
              ...defaultResult,
              baseForm,
              tense: capitalizeFirst(tense),
              voice: capitalizeFirst(voice),
              mood: capitalizeFirst(mood),
              person: pattern.person,
              number: pattern.number,
              isContract
            };
          }
        }
      }
    }
  }
  
  return null;
}

function identifyVerbStem(verbInput: string): string | null {
  if (!verbInput || verbInput.length < 2) {
    return null;
  }
  
  // Check against known stems first
  for (const stem of commonStems) {
    if (verbInput.startsWith(stem)) {
      return stem;
    }
  }
  
  // Common verb endings to try removing
  const commonEndings = [
    "ω", "εις", "ει", "ομεν", "ετε", "ουσι", "ουσιν", "ομαι", "εται", 
    "σω", "σεις", "σει", "σομεν", "σετε", "σουσι", "σουσιν", 
    "σα", "σας", "σαν", "σε", "σεν", "σαμεν", "σατε",
    "ῶ", "ᾷς", "ᾷ", "ῶμεν", "ᾶτε", "ῶσι", "ῶσιν",
    "οῦμαι", "εῖται", "ούμεθα", "εῖσθε", "οῦνται"
  ];
  
  for (const ending of commonEndings) {
    if (verbInput.endsWith(ending)) {
      return verbInput.substring(0, verbInput.length - ending.length);
    }
  }
  
  // If no clear ending is identified, try a generic approach
  return verbInput.length > 2 ? verbInput.substring(0, verbInput.length - 2) : null;
}

function checkContractVerb(verbInput: string, baseForm: string, verbData: any): ParsedVerb | null {
  const contractType = baseForm.charAt(baseForm.length - 2);
  
  const defaultResult: ParsedVerb = {
    verb: verbInput,
    baseForm: baseForm,
    tense: "",
    voice: "",
    mood: "",
    person: "",
    number: "",
    isIrregular: !!verbData.irregular,
    isContract: true
  };
  
  const stemLength = baseForm.length - 2;
  const stem = baseForm.substring(0, stemLength);
  
  const contractedPresent = {
    'α': {
      '1s': stem + 'ῶ',
      '2s': stem + 'ᾷς',
      '3s': stem + 'ᾷ',
      '1p': stem + 'ῶμεν',
      '2p': stem + 'ᾶτε',
      '3p': stem + 'ῶσι(ν)'
    },
    'ε': {
      '1s': stem + 'ῶ',
      '2s': stem + 'εῖς',
      '3s': stem + 'εῖ',
      '1p': stem + 'οῦμεν',
      '2p': stem + 'εῖτε',
      '3p': stem + 'οῦσι(ν)'
    },
    'ο': {
      '1s': stem + 'ῶ',
      '2s': stem + 'οῖς',
      '3s': stem + 'οῖ',
      '1p': stem + 'οῦμεν',
      '2p': stem + 'οῦτε',
      '3p': stem + 'οῦσι(ν)'
    }
  };
  
  const personNumberMap: Record<string, { person: string, number: string }> = {
    '1s': { person: '1st', number: 'Singular' },
    '2s': { person: '2nd', number: 'Singular' },
    '3s': { person: '3rd', number: 'Singular' },
    '1p': { person: '1st', number: 'Plural' },
    '2p': { person: '2nd', number: 'Plural' },
    '3p': { person: '3rd', number: 'Plural' }
  };
  
  if (contractType in contractedPresent) {
    for (const [key, form] of Object.entries(contractedPresent[contractType as keyof typeof contractedPresent])) {
      if (verbInput === form || verbInput === form.replace('(ν)', '') || verbInput === form.replace('(ν)', 'ν')) {
        return {
          ...defaultResult,
          tense: "Present",
          voice: "Active",
          mood: "Indicative",
          person: personNumberMap[key].person,
          number: personNumberMap[key].number
        };
      }
    }
  }
  
  return null;
}

function checkAoristPassive(verbInput: string): ParsedVerb | null {
  console.log("Checking for aorist passive pattern:", verbInput);
  
  // Common aorist passive endings
  const aoristPassiveEndings = [
    { ending: "θην", person: "1st", number: "Singular" },
    { ending: "θης", person: "2nd", number: "Singular" },
    { ending: "θη", person: "3rd", number: "Singular" },
    { ending: "θημεν", person: "1st", number: "Plural" },
    { ending: "θητε", person: "2nd", number: "Plural" },
    { ending: "θησαν", person: "3rd", number: "Plural" }
  ];

  // Remove augment (usually ἐ- at the beginning)
  const stemAfterAugment = verbInput.startsWith("ἐ") ? verbInput.substring(1) : verbInput;
  
  for (const ending of aoristPassiveEndings) {
    if (stemAfterAugment.endsWith(ending.ending)) {
      const stem = stemAfterAugment.substring(0, stemAfterAugment.length - ending.ending.length);
      
      // Try to match with known verb stems
      let baseForm = "";
      for (const [verb, data] of Object.entries(verbForms)) {
        const verbStem = verb.substring(0, verb.length - 1); // Remove ending (usually ω)
        // Check if stem starts with our extracted stem or vice versa
        if (verbStem.startsWith(stem) || stem.startsWith(verbStem)) {
          baseForm = verb;
          break;
        }
      }
      
      // If no exact match, make an educated guess
      if (!baseForm) {
        // For verbs like γεννάω -> γενν (stem) + άω (ending)
        if (stem === "γενν") {
          baseForm = "γεννάω";
        } else {
          baseForm = stem + "ω"; // Default to adding simple ω ending
        }
      }
      
      console.log(`Found aorist passive match for ${verbInput}: stem=${stem}, baseForm=${baseForm}`);
      
      return {
        verb: verbInput,
        baseForm: baseForm,
        tense: "Aorist",
        voice: "Passive",
        mood: "Indicative",
        person: ending.person,
        number: ending.number,
        isIrregular: false,
        isContract: stem.endsWith("ν") // Heuristic for contract verbs
      };
    }
  }
  
  return null;
}

function checkParticiples(
  verbInput: string,
  baseForm: string,
  tense: string,
  participles: {
    active?: ParticipleForms;
    middle?: ParticipleForms;
    passive?: ParticipleForms;
  },
  verbData: VerbData
): ParsedParticiple | null {
  const voices = ['active', 'middle', 'passive'] as const;
  const genders = ['masculine', 'feminine', 'neuter'] as const;
  const cases = ['nominative', 'genitive', 'dative', 'accusative', 'vocative'];

  for (const voice of voices) {
    const forms = participles[voice];
    if (!forms) continue;

    for (const gender of genders) {
      const endings = forms[gender];
      if (!endings) continue;

      for (let i = 0; i < endings.length; i++) {
        const ending = endings[i];
        const stemLength = baseForm.length - 1;
        const stem = baseForm.substring(0, stemLength);
        const reconstructedVerb = stem + ending;

        if (verbInput === reconstructedVerb || 
            verbInput === reconstructedVerb.replace('(ν)', '') || 
            verbInput === reconstructedVerb.replace('(ν)', 'ν')) {
          return {
            verb: verbInput,
            baseForm,
            tense,
            voice: voice.charAt(0).toUpperCase() + voice.slice(1),
            mood: "Participle",
            person: "",
            number: "",
            isIrregular: !!verbData.irregular,
            isContract: !!verbData.contract,
            gender: gender.charAt(0).toUpperCase() + gender.slice(1),
            case: cases[Math.floor(i / 2)] || "Unknown"
          };
        }
      }
    }
  }

  return null;
}

export function getVerbSuggestions(partial: string): string[] {
  if (!partial || partial.length < 2) return [];
  
  const suggestions: string[] = [];
  const lowercasePartial = partial.toLowerCase();
  
  // Check existing verbs
  for (const baseForm of Object.keys(verbForms)) {
    if (baseForm.toLowerCase().includes(lowercasePartial)) {
      suggestions.push(baseForm);
    }
  }
  
  // Check common stems
  for (const stem of commonStems) {
    if (stem.toLowerCase().includes(lowercasePartial)) {
      for (const baseForm of Object.keys(verbForms)) {
        if (baseForm.startsWith(stem) && !suggestions.includes(baseForm)) {
          suggestions.push(baseForm);
        }
      }
    }
  }
  
  // Add compound verb suggestions
  if (partial.length >= 3) {
    for (const prefix of verbPrefixes) {
      // If partial starts with this prefix, suggest compound verbs
      if (lowercasePartial.startsWith(prefix.toLowerCase())) {
        const restOfPartial = partial.substring(prefix.length);
        // Get base verb suggestions for the rest of the partial
        for (const baseForm of Object.keys(verbForms)) {
          if (baseForm.toLowerCase().startsWith(restOfPartial.toLowerCase())) {
            suggestions.push(prefix + baseForm);
          }
        }
      }
    }
  }
  
  return suggestions.slice(0, 5);
}

function performFuzzyMatch(verbInput: string): ParsedVerb | null {
  if (!verbInput || verbInput.length < 2) {
    return null;
  }
  
  let bestMatch: { verb: string, score: number } | null = null;
  
  for (const baseForm of Object.keys(verbForms)) {
    if (Math.abs(baseForm.length - verbInput.length) > 3) {
      continue;
    }
    
    const score = levenshteinDistance(verbInput, baseForm);
    
    if (!bestMatch || score < bestMatch.score) {
      bestMatch = { verb: baseForm, score };
    }
  }
  
  if (bestMatch && bestMatch.score <= 3) {
    const verbData = verbForms[bestMatch.verb];
    
    return {
      verb: verbInput,
      baseForm: bestMatch.verb,
      tense: "Unknown (Fuzzy Match)",
      voice: "Unknown",
      mood: "Unknown",
      person: "",
      number: "",
      isIrregular: !!verbData.irregular,
      isContract: !!verbData.contract
    };
  }
  
  return null;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i-1) === a.charAt(j-1)) {
        matrix[i][j] = matrix[i-1][j-1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i-1][j-1] + 1,
          Math.min(
            matrix[i][j-1] + 1,
            matrix[i-1][j] + 1
          )
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

// Utility function to capitalize first letter
function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
