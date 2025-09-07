require('dotenv').config();

const { Client } = require('pg');
const client = new Client(process.env.DIRECT_DATABASE_URL);

function normalizeGreek(word) {
    return word
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{Script=Greek}]/gu, "")
      .toLowerCase();
}

let tableName = 'lookup_history';

function validateLanguage(language) {
    const validLanguages = ['greek', 'hebrew', 'latin'];
    if (!validLanguages.includes(language)) {
        throw new Error(`Invalid language: ${language}. Valid options are: ${validLanguages.join(', ')}`);
    }
}

async function fetchNamespaces(language) {
    validateLanguage(language);

    try {
        if(!client._connected) {
            await client.connect();
        }
      
      const query = `
        SELECT namespace, COUNT(*) as count FROM ${tableName}
        WHERE language = '${language}'
        GROUP BY namespace
      `;

      console.log(query)
      const res = await client.query(query);

      console.log(res.rows)

      let namespaces = [];
      let nameSpaceMap = {};
      let i = 0;

      for(const row of res.rows) {
        namespaces.push({
            namespace: row.namespace,
            count: Number(row.count)
        })
        nameSpaceMap[row.namespace] = {
            index: i,
        };
        i += 1;
      }

      // const vocabNamespaces = listAllVocabsInfo()

      // for(const vocabName of vocabNamespaces) {
      //   if(nameSpaceMap[vocabName.name]) {
      //       let d = nameSpaceMap[vocabName.name];
      //       namespaces[d.index].vocabCount = vocabName.count;
      //   }
      // }

    return namespaces;
  
    } catch (err) {
      console.error('Query failed', err);
    } finally {
      //await client.end();
      console.log('')
    }
}

async function fetchLookupHistory({ language, namespace }) {
    validateLanguage(language);

    try {
        if(!client._connected) {
            await client.connect();
        }
      
      const query = `
        SELECT * FROM ${tableName}
        WHERE language = '${language}' AND namespace = '${namespace}'
        ORDER BY created_at DESC
      `;

      console.log(query)
      const res = await client.query(query);

      return res.rows.map(row => ({
        id: row.id,
        word: row.word,
        namespace: row.namespace,
        frequency: row.frequency,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }
    catch (err) {
      console.error('Query failed', err);
    }
}

async function fetchIndexedLookupHistory({ language, namespace }) {
    validateLanguage(language);

    try {
        if(!client._connected) {
            await client.connect();
        }
      
      const query = `
        SELECT * FROM ${tableName}
        WHERE language = '${language}' AND namespace = '${namespace}'
        ORDER BY created_at DESC
      `;

      console.log(query)
      const res = await client.query(query);

      const indexList = {};
      const index = [];

      for(const row of res.rows) {
        const normWord = normalizeGreek(row.word);

        if(!indexList[normWord[0]]) {
            indexList[normWord[0]] = []
            index.push(normWord[0])
        }

        indexList[normWord[0]].push({
            id: row.id,
            word: row.word,
            namespace: row.namespace,
            frequency: row.frequency,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        })
      }

      return {
        index,
        indexList
      }
    }
    catch (err) {
      console.error('Query failed', err);
    }
}

async function fetchAllIndexedLookupHistory({ language }) {
    validateLanguage(language);

    try {
        if(!client._connected) {
            await client.connect();
        }
      
      const query = `
        SELECT DISTINCT * FROM ${tableName}
        WHERE language = '${language}'
        ORDER BY created_at DESC
      `;

      const res = await client.query(query);

      const indexList = {};
      const index = [];

      for(const row of res.rows) {
        const normWord = normalizeGreek(row.word);

        if(!indexList[normWord[0]]) {
            indexList[normWord[0]] = []
            index.push(normWord[0])
        }

        indexList[normWord[0]].push({
            id: row.id,
            word: row.word,
            namespace: row.namespace,
            frequency: row.frequency,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        })
      }

      return {
        index,
        indexList
      }
    }
    catch (err) {
      console.error('Query failed', err);
    }
}

async function getLookupEntry({language, namespace, word }) {
    validateLanguage(language);

    try {
        if(!client._connected) {
            await client.connect();
        }
      
      const query = `
        SELECT * FROM ${tableName}
        WHERE language = $1 AND namespace = $2 AND word = $3
      `;

      const values = [language, namespace, word];
      console.log(query, values);
      const res = await client.query(query, values);

    //   if (res.rows.length > 0) {
    //     return res.rows[0].frequency;
    //   } else {
    //     return 0; // No frequency found
    //   }
        return res.rows
    } catch (err) {
      console.error('Query failed', err);
    }
}

async function addLookupHistory({ language, namespace, word, lemma}) {
    validateLanguage(language);

    try {
        if(!client._connected) {
            await client.connect();
        }

        let lookupEntry = await getLookupEntry({ language, namespace, word });
        console.log({
            lookupEntry
        })

        if (lookupEntry.length > 0) {
            // If the word already exists, update its frequency
            let freq = Number(lookupEntry[0].frequency) + 1
            // const updateQuery = `
            //     UPDATE ${tableName}
            //     SET frequency = frequency + 1, updated_at = NOW()
            //     WHERE language = $1 AND namespace = $2 AND word = $3
            //     RETURNING id, created_at
            // `;
            const updateQuery = `
                UPDATE ${tableName}
                SET frequency = '${freq}', updated_at = NOW()
                WHERE language = $1 AND namespace = $2 AND word = $3
                RETURNING id, created_at
            `;

            const updateValues = [language, namespace, word];
            console.log(updateQuery, updateValues);
            const res = await client.query(updateQuery, updateValues);

            return {
                id: res.rows[0].id,
                createdAt: res.rows[0].created_at,
            };
        }

        frequency = 1; // Set frequency to 1 if the word does not exist


      // If the word does not exist, insert it
      const query = `
        INSERT INTO ${tableName} (language, namespace, word, lemma, frequency)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, created_at
      `;

      const values = [language, namespace, word, lemma, frequency];
      console.log(query, values);
      const res = await client.query(query, values);

      return {
        id: res.rows[0].id,
        createdAt: res.rows[0].created_at,
      };
    } catch (err) {
      console.error('Insert failed', err);
    }
}

async function deleteLookupHistory(language, namespace, id) {
    validateLanguage(language);

    try {
        if(!client._connected) {
            await client.connect();
        }
      
      const query = `
        DELETE FROM ${tableName}
        WHERE language = $1 AND namespace = $2 AND id = $3
        RETURNING *
      `;

      const values = [language, namespace, id];
      console.log(query, values);
      const res = await client.query(query, values);

      return res.rows.map(row => ({
        id: row.id,
        word: row.word,
        namespace: row.namespace,
        frequency: row.frequency,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (err) {
      console.error('Delete failed', err);
    } finally {
      //await client.end();
      console.log('')
    }
}
module.exports = {
    fetchNamespaces,
    fetchLookupHistory,
    fetchIndexedLookupHistory,
    fetchAllIndexedLookupHistory,
    addLookupHistory,
    deleteLookupHistory
};
// Note: Ensure that the database connection string is set in the environment variable DIRECT_DATABASE_URL