
export interface AdverbExample {
    greek: string;
    translation: string;
}

export interface Adverb {
    adverb: string;
    meaning: string;
    notes?: string;
    examples: AdverbExample[];
}

export interface AdverbCategory {
    category: string;
    description: string;
    adverbs: Adverb[];
}

export const greekAdverbsData: AdverbCategory[] = [
    {
        category: "Adverbs of Time",
        description: "These adverbs answer the question 'When?' or 'How often?'.",
        adverbs: [
            { adverb: "νῦν", meaning: "now", examples: [{ greek: "νῦν ἐστιν ἡ κρίσις.", translation: "Now is the judgment." }] },
            { adverb: "τότε", meaning: "then, at that time", examples: [{ greek: "τότε ἤρξατο λέγειν.", translation: "Then he began to speak." }] },
            { adverb: "πάλιν", meaning: "again", examples: [{ greek: "ἦλθε πάλιν εἰς τὴν πόλιν.", translation: "He came again into the city." }] },
            { adverb: "ἤδη", meaning: "already", examples: [{ greek: "ἤδη ἡ ἀξίνη πρὸς τὴν ῥίζαν κεῖται.", translation: "Already the axe is laid to the root." }] },
            { adverb: "ποτε", meaning: "at some time, ever", examples: [{ greek: "εἶδες ποτε τοῦτον;", translation: "Have you ever seen this man?" }] },
            { adverb: "οὔποτε / μήποτε", meaning: "never", examples: [{ greek: "οὔποτε σε ἀφήσω.", translation: "I will never leave you." }] },
            { adverb: "ἀεί", meaning: "always", examples: [{ greek: "ὁ θεὸς ἀεὶ ὁρᾷ.", translation: "God always sees." }] },
            { adverb: "εὐθύς / εὐθέως", meaning: "immediately", examples: [{ greek: "καὶ εὐθέως ἀφέντες τὰ δίκτυα ἠκολούθησαν αὐτῷ.", translation: "And immediately leaving the nets, they followed him." }] },
            { adverb: "σήμερον", meaning: "today", examples: [{ greek: "σήμερον μετ’ ἐμοῦ ἔσῃ ἐν τῷ παραδείσῳ.", translation: "Today you will be with me in paradise." }] },
            { adverb: "αὔριον", meaning: "tomorrow", examples: [{ greek: "μὴ μεριμνήσητε εἰς τὴν αὔριον.", translation: "Do not worry about tomorrow." }] },
            { adverb: "πρώην / πρῴ", meaning: "formerly, early", examples: [{ greek: "ἦλθον πρῲ ἐπὶ τὸ μνημεῖον.", translation: "They came early to the tomb." }] },
        ],
    },
    {
        category: "Adverbs of Place",
        description: "These adverbs answer the question 'Where?'.",
        adverbs: [
            { adverb: "ὧδε", meaning: "here", examples: [{ greek: "δεῦρο, κάθου ὧδε.", translation: "Come, sit here." }] },
            { adverb: "ἐκεῖ", meaning: "there", examples: [{ greek: "ὅπου ἐστὶν ὁ θησαυρός σου, ἐκεῖ ἔσται καὶ ἡ καρδία σου.", translation: "Where your treasure is, there your heart will be also." }] },
            { adverb: "ποῦ", meaning: "where?", examples: [{ greek: "ποῦ ἐστιν ὁ βασιλεύς;", translation: "Where is the king?" }] },
            { adverb: "ὅπου", meaning: "where, wherever", examples: [{ greek: "πορεύσομαι ὅπου ἂν θέλῃς.", translation: "I will go wherever you wish." }] },
            { adverb: "ἄνω", meaning: "up, above", examples: [{ greek: "ζητεῖτε τὰ ἄνω.", translation: "Seek the things above." }] },
            { adverb: "κάτω", meaning: "down, below", examples: [{ greek: "ὁ ὄφις ἐστὶν κάτω τῆς γῆς.", translation: "The snake is below the earth." }] },
            { adverb: "ἔξω", meaning: "outside", examples: [{ greek: "ἔβαλον αὐτὸν ἔξω τῆς πόλεως.", translation: "They threw him outside the city." }] },
            { adverb: "ἔσω / εἴσω", meaning: "inside", examples: [{ greek: "εἰσῆλθεν ἔσω τοῦ οἴκου.", translation: "He went inside the house." }] },
            { adverb: "πόθεν", meaning: "from where? whence?", examples: [{ greek: "πόθεν ἔρχῃ;", translation: "From where are you coming?" }] },
            { adverb: "οἴκοι", meaning: "at home", examples: [{ greek: "οἱ δὲ μαθηταὶ ἀπῆλθον πάλιν οἴκοι.", translation: "But the disciples went away again to their homes." }] },
        ],
    },
    {
        category: "Adverbs of Manner",
        description: "These adverbs answer the question 'How?'. Many are formed from adjectives.",
        adverbs: [
            { adverb: "καλῶς", meaning: "well, beautifully", examples: [{ greek: "καλῶς ἐποίησας.", translation: "You have done well." }] },
            { adverb: "κακῶς", meaning: "badly, wrongly", examples: [{ greek: "κακῶς πάσχει ὁ ἄδικος.", translation: "The unjust man suffers badly." }] },
            { adverb: "σοφῶς", meaning: "wisely", examples: [{ greek: "σοφῶς ἐβασίλευσεν.", translation: "He ruled wisely." }] },
            { adverb: "ταχέως", meaning: "quickly", examples: [{ greek: "ἔρχου ταχέως.", translation: "Come quickly." }] },
            { adverb: "πῶς", meaning: "how?", examples: [{ greek: "πῶς δύναται ταῦτα γενέσθαι;", translation: "How can these things happen?" }] },
            { adverb: "οὕτως", meaning: "thus, so, in this way", examples: [{ greek: "οὕτως γὰρ ἠγάπησεν ὁ θεὸς τὸν κόσμον.", translation: "For God so loved the world." }] },
            { adverb: "ὥσπερ", meaning: "just as, even as", examples: [{ greek: "γίνεσθε οἰκτίρμονες, ὥσπερ ὁ πατὴρ ὑμῶν οἰκτίρμων ἐστίν.", translation: "Be merciful, just as your Father is merciful." }] },
        ],
    },
    {
        category: "Adverbs of Degree",
        description: "These adverbs modify the intensity of adjectives, verbs, or other adverbs, answering 'To what extent?'.",
        adverbs: [
            { adverb: "μάλιστα", meaning: "most, especially", examples: [{ greek: "πάντας ἐφίλει, μάλιστα δὲ τοὺς ἀγαθούς.", translation: "He loved all, but especially the good." }] },
            { adverb: "μᾶλλον", meaning: "more, rather", examples: [{ greek: "ἐδίωκον μᾶλλον ἢ ἔφευγον.", translation: "They pursued rather than fled." }] },
            { adverb: "λίαν", meaning: "very, exceedingly", examples: [{ greek: "ἦν γὰρ λίαν πλούσιος.", translation: "For he was exceedingly rich." }] },
            { adverb: "σφόδρα", meaning: "very much, strongly", examples: [{ greek: "ἐφοβοῦντο σφόδρα.", translation: "They were very much afraid." }] },
            { adverb: "πολύ", meaning: "much", examples: [{ greek: "πολὺ διαφέρει σοφὸς ἀμαθοῦς.", translation: "A wise man differs much from an ignorant one." }] },
        ],
    },
    {
        category: "Interrogative Adverbs",
        description: "Used to ask questions about time, place, manner, or cause.",
        adverbs: [
            { adverb: "ποῦ;", meaning: "where?", examples: [] },
            { adverb: "πότε;", meaning: "when?", examples: [] },
            { adverb: "πῶς;", meaning: "how?", examples: [] },
            { adverb: "πόθεν;", meaning: "from where?", examples: [] },
            { adverb: "ποῖ;", meaning: "to where?", examples: [] },
            { adverb: "διὰ τί; / ἱνατί;", meaning: "why?", examples: [] },
        ],
    },
    {
        category: "Negative Adverbs",
        description: "Used to negate a verb or clause.",
        adverbs: [
            { adverb: "οὐ / οὐκ / οὐχ", meaning: "not (factual denial, used with indicative)", examples: [{ greek: "οὐκ ἔστιν δίκαιος.", translation: "He is not righteous." }] },
            { adverb: "μή", meaning: "not (prohibitive or non-factual, used with other moods)", examples: [{ greek: "μὴ κλέψῃς.", translation: "Do not steal." }] },
        ],
    },
];
