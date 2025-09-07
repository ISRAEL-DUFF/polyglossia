const { betaCodeToGreek } = require('beta-code-js');
const xpath = require("xpath");
const { DOMParser } = require("xmldom");
const { addLookupHistory } = require('./lookup.service');
const axios = require("axios")
require('dotenv').config();

const { Client } = require('pg');


const client = new Client(process.env.DIRECT_DATABASE_URL);
let connectedToDb = false;

function normalizeGreek(lemma) {
    const unicode = betaCodeToGreek(lemma);
    return unicode
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{Script=Greek}]/gu, "")
      .toLowerCase();
}

function normalizeLemma(lemma) {
  return lemma.replace(/\d+$/, '');
}


async function extractLexiconSenses3(xmlEntry) {
  const doc = new DOMParser().parseFromString(xmlEntry, "text/xml");
  const senseNodes = xpath.select("//sense", doc);
  const results = [];

  const processCitation = (citation) => {
    const quote = (xpath.select(".//quote", citation))[0]?.textContent.trim();
    const bibl = (xpath.select(".//bibl", citation))[0];
    let biblRef = null;
    if (bibl) {
        biblRef = {
        author: (xpath.select(".//author", bibl))[0]?.textContent.trim() || null,
        title: (xpath.select(".//title", bibl))[0]?.textContent.trim() || null,
        passage: bibl.textContent.trim()
        };
    }
    return { quote, bibl: biblRef };
  }
  
  const processBibl = (bibliology) => {
    const title = (xpath.select(".//title", bibliology))[0]?.textContent.trim();
    const author = (xpath.select(".//author", bibliology))[0];
	  const txt = xpath.select(".//text()", bibliology).join('')
    
    return { text: txt ?? '', title: title ?? '', author: author ?? '' };
  }
  
  senseNodes.forEach(sense => {
    const children = xpath.select('./node()', sense);
    let htmlText = '<div>';
    let glosses = [];
    let citations = [];
    children.forEach((node, i) => {
        // console.log(`[${i}] type: ${node.nodeType}, name: ${node.nodeName}, value: "${node.nodeValue || node.textContent}"`);
        // const ignoredTexts = ['.', ',', ';', 'cf.', 'etc.;']
        const ignoredTexts = []

        if(node.nodeName === 'cit') {
          const citation = processCitation(node);
          htmlText += `<span class="inline-citation">${citation.quote}</span>`;
          citations.push(citation)
        } else if(node.nodeName === '#text') {
          const text = node.textContent.trim();
          htmlText += `<span class="gloss-context">${ignoredTexts.includes(text) ? '' : text}</span>`;
        } else if(node.nodeName === 'i') {
          const text = node.textContent.trim();
          glosses.push(text)
          htmlText += `<span class="gloss-sense">${text}</span>`;
        } else if(node.nodeName === 'foreign') {
          const text = node.textContent.trim();
          htmlText += `<span class="foreign-text">${text}</span>`;
        } else if(node.nodeName === 'bibl') {
          const bibl = processBibl(node);
          htmlText += `
          <span class="inline-bibl">
            <span class="author">${bibl.author}</span>, 
            <span class="title">${bibl.title}</span> 
            <span class="reference">${bibl.text}</span>
          </span>`
        } else {
			const text = node.textContent.trim();
			htmlText += `<span class="other-text">${text}</span>`;
		}
    });

    htmlText += '</div>';

    const senseObj = {
      id: sense.getAttribute("id"),
      level: sense.getAttribute("level"),
      htmlText,
      glosses,
      quotes: citations
    }

    results.push(senseObj)
  });

  console.log(results)
  return results;
}

// TODO: This function is fetching from LSJ lexicon and should be fetched from supabase
async function fetchLexiconEntry(greekWord) {
    try {
        if(!client._connected) {
            await client.connect();
            connectedToDb = true;
        }

        const normalizedWord = normalizeGreek(greekWord)
        let columns = `word, beta_code, normalized_word, xml_entry`
        let whereCondition = `normalized_word = '${normalizedWord}' OR word = '${greekWord}'`
      
      
      // 4. Fetch random page
      const query = `
        SELECT ${columns} FROM lsj_lexicon
        WHERE ${whereCondition}
      `;

      console.log(query)
      const res = await client.query(query);
      
      for(const row of res.rows) {
        row.senses = await extractLexiconSenses3(row.xml_entry)
      }
      
      return res.rows[0]
  
    } catch (err) {
      console.error('Query failed', err);
    } finally {
      //await client.end();
      console.log('')
    }
}


// <<<< MORPHESEUS >>>>
function parsePerseusResponse(response) {
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
        let d = {}
        for(const k of Object.keys(o)) {
            if(o[k]) {
                d[k] = o[k]
            }
        }

        return d;
    })
}

async function getPerseusMorph(word) {
    if (!word) {
        throw new Error('Word cannot be empty')
    }

    try {
        const url = `https://services.perseids.org/bsp/morphologyservice/analysis/word?lang=grc&engine=morpheusgrc&word=${encodeURIComponent(word)}`;
        const resRaw = await axios.get(url);
        let response = resRaw.data;
        let parsedResp = parsePerseusResponse(response);
        
        // console.log(JSON.stringify(parsedResp))

        return parsedResp;
    } catch (error) {
        console.log(error)
    }
}

async function fetchLemmaFromMorphData(greekWord) {
  const morphology = await getPerseusMorph(greekWord)
  const lemmaMap = {}

  console.log(morphology)

  if(!morphology[0]?.lemma) {
	console.log("NO LEMMA")
	return []
  }
  
  for(const morphEntry of morphology) { 
	let lemma = normalizeLemma(morphEntry.lemma)
	lemmaMap[lemma] = morphEntry.lemma;
  }
  
  return Object.values(lemmaMap)
}


module.exports = {
  fetchLexiconEntry,
  fetchLemmaFromMorphData,
  // Expose morphology lookup so API routes can include it
  getPerseusMorph,
};


// HEBRW lexicon
// https://github.com/openscriptures/strongs/tree/master
// DBD dictionary: https://github.com/eliranwong/unabridged-BDB-Hebrew-lexicon/blob/master/DictBDB.json
// https://github.com/openscriptures/HebrewLexicon/tree/master

// Greek (Septuagint)
// https://github.com/openscriptures/GreekResources/tree/master
