
export interface SyntaxExample {
  greek: string;
  translation: string;
  example?: string; // For common expressions in negation
}

export interface SyntaxSubType {
  type: string;
  description?: string;
  examples: SyntaxExample[];
}

export interface FearClauseMoodDetail {
  mood: string;
  context: string;
}

export interface FearClauseDetails {
  examples: Array<{
    type: string;
    examples: SyntaxExample[];
  }>;
  moods: {
    title: string;
    details: FearClauseMoodDetail[];
  };
}

export interface SyntaxSection {
  mood?: string; // For mood-based sections
  section?: string; // For topic-based sections like "Conditional Clauses"
  description?: string;
  examples?: SyntaxExample[];
  types?: SyntaxSubType[];
  details?: FearClauseDetails; // Specifically for Fear Clauses structure
}

export interface SyntaxData {
  title: string;
  sections: SyntaxSection[];
}

export const greekSyntaxData: SyntaxData = {
  title: "Ancient Greek Syntax Guide",
  sections: [
    {
      mood: "Indicative Mood",
      description: "Declarative Clauses: State facts or ask questions.",
      examples: [
        {
          greek: "ὁ ἀνήρ ἔγραψεν ἐπιστολήν.",
          translation: "The man wrote a letter."
        },
        {
          greek: "ἡ κόρη παίζει ἐν τῷ κήπῳ.",
          translation: "The girl is playing in the garden."
        },
        {
          greek: "οἱ στρατιῶται ἐφοβήθησαν τὸν ἐχθρόν.",
          translation: "The soldiers feared the enemy."
        }
      ]
    },
    {
      mood: "Subjunctive Mood",
      description: "Hortatory Subjunctive: 1st person plural urging an action.",
      examples: [
        {
          greek: "ἴωμεν εἰς τὴν ἀγοράν.",
          translation: "Let us go to the marketplace."
        },
        {
          greek: "φεύγωμεν ἐκ τοῦ κινδύνου.",
          translation: "Let us flee from the danger."
        },
        {
          greek: "παύσωμεν τὸν πόλεμον.",
          translation: "Let us stop the war."
        }
      ]
    },
    {
      mood: "Optative Mood",
      description: "Wish Clauses: Express a wish.",
      examples: [
        {
          greek: "εἴθε γενοίμην σοφός.",
          translation: "Would that I were wise."
        },
        {
          greek: "εἴθε ζοίη ὁ φίλος.",
          translation: "Would that the friend were alive."
        },
        {
          greek: "εἴθε μὴ ἔλαθεν.",
          translation: "If only he had not escaped notice."
        }
      ]
    },
    {
      mood: "Imperative Mood",
      description: "Commands: Direct orders or prohibitions.",
      examples: [
        {
          greek: "γράφε τὴν ἐπιστολήν.",
          translation: "Write the letter."
        },
        {
          greek: "λαβὲ τὸ ξίφος.",
          translation: "Take the sword."
        },
        {
          greek: "μή φεύγε!",
          translation: "Do not flee!"
        }
      ]
    },
    {
      section: "Conditional Clauses",
      types: [
        {
          type: "Simple Conditions (Present/Past Reality)",
          examples: [
            {
              greek: "εἰ τοῦτο λέγεις, οὐκ ἀληθές ἐστιν.",
              translation: "If you say this, it is not true."
            },
            {
              greek: "εἰ ἦλθεν, ἐθεάθη.",
              translation: "If he came, he was seen."
            },
            {
              greek: "εἰ ἐσθίει τὸν ἄρτον, οὐ πεινᾷ.",
              translation: "If he eats the bread, he is not hungry."
            }
          ]
        },
        {
          type: "Future More Vivid",
          examples: [
            {
              greek: "εἰ ταῦτα ποιήσεις, ἐπαινεθήσῃ.",
              translation: "If you do this, you will be praised."
            },
            {
              greek: "εἰ ἐλεύσεται, χαροῦνται.",
              translation: "If he comes, they will rejoice."
            },
            {
              greek: "εἰ νικήσεις, στεφθήσῃ.",
              translation: "If you win, you will be crowned."
            }
          ]
        },
        {
          type: "Future Less Vivid",
          examples: [
            {
              greek: "εἰ ταῦτα ποιοίης, ἐπαινεθείης ἄν.",
              translation: "If you were to do this, you would be praised."
            },
            {
              greek: "εἰ λέγοις, ἤκουον ἄν.",
              translation: "If you were speaking, they would listen."
            },
            {
              greek: "εἰ τυγχάνοις παρὼν, ἔχαιρον ἄν.",
              translation: "If you happened to be present, they would rejoice."
            }
          ]
        },
        {
          type: "Contrary to Fact (Present)",
          examples: [
            {
              greek: "εἰ ταῦτα ἐποίεις, ἐπαινεῖτο ἄν.",
              translation: "If you were doing this, he would be praised."
            },
            {
              greek: "εἰ εἶχεν πλοῖον, ἔπλει ἄν.",
              translation: "If he had a ship, he would be sailing."
            },
            {
              greek: "εἰ ἦσαν ἐνταῦθα, ἐβοήθουν ἄν.",
              translation: "If they were here, they would help."
            }
          ]
        },
        {
          type: "Contrary to Fact (Past)",
          examples: [
            {
              greek: "εἰ ταῦτα ἐποίησας, ἐπῃνέθη ἄν.",
              translation: "If you had done this, he would have been praised."
            },
            {
              greek: "εἰ ἔδραμεν, ἐκράτησεν ἄν.",
              translation: "If he had run, he would have won."
            },
            {
              greek: "εἰ εἶδον τὸν κίνδυνον, ἐσώθησαν ἄν.",
              translation: "If they had seen the danger, they would have been saved."
            }
          ]
        }
      ]
    },
    {
      section: "Negation",
      types: [
        {
          type: "οὐ",
          description: "Used with the indicative and infinitive for factual denial",
          examples: [
            {
              greek: "οὐ γράφει.",
              translation: "He does not write."
            },
            {
              greek: "οὐ λέγει τἀληθῆ.",
              translation: "He does not speak the truth."
            },
            {
              greek: "οὐκ ἔστι θεός.",
              translation: "There is no god."
            }
          ]
        },
        {
          type: "μή",
          description: "Used with subjunctive, optative, imperative, infinitive (non-factual or prohibitive contexts)",
          examples: [
            {
              greek: "μὴ γράφῃς.",
              translation: "Do not write."
            },
            {
              greek: "βούλομαι μὴ ἀκούειν.",
              translation: "I wish not to listen."
            },
            {
              greek: "λέγει μὴ γράφειν.",
              translation: "He says not to write."
            }
          ]
        },
        {
          type: "In purpose clauses",
          examples: [
            {
              greek: "ἵνα μὴ ἀποθάνῃ.",
              translation: "So that he may not die."
            },
            {
              greek: "ἦλθεν ἵνα μὴ ὁρῶμεν.",
              translation: "He came so that we might not see."
            },
            {
              greek: "ἔλαβεν αὐτόν, ἵνα μὴ φύγῃ.",
              translation: "He seized him so that he might not flee."
            }
          ]
        },
        {
          type: "In fear clauses",
          examples: [
            {
              greek: "φοβεῖται μή ἔλθῃ.",
              translation: "He fears that he may come."
            },
            {
              greek: "δεδιῶ μή ληφθῇ.",
              translation: "I fear that he may be captured."
            },
            {
              greek: "τρέμει μή τι πάθῃ.",
              translation: "He trembles lest he suffer something."
            }
          ]
        },
        {
          type: "Double Negatives",
          examples: [
            {
              greek: "οὐδεὶς οὐκ ἦλθεν.",
              translation: "No one failed to come."
            },
            {
              greek: "οὐδείς οὐ λέγει.",
              translation: "No one does not speak."
            },
            {
              greek: "οὐδεμία μὴ εἴπῃ.",
              translation: "No woman would fail to speak."
            }
          ]
        },
        {
          type: "Common Expressions",
          examples: [
            {
              greek: "οὐ...οὐδέ", // Using type here as per your original example for this subsection
              translation: "not...nor",
              example: "οὐ λέγει οὐδὲ γράφει." // Example provided in `greek` to match structure
            },
            {
              greek: "μήτε...μήτε",
              translation: "neither...nor",
              example: "βούλεται μήτε λέγειν μήτε γράφειν."
            },
            {
              greek: "μηδείς/μηδεμία/μηδέν",
              translation: "no one, nothing",
              example: "μηδὲν λέγε."
            }
          ]
        },
        {
          type: "Negated Indirect Statements",
          examples: [
            {
              greek: "λέγει μὴ γράφειν.",
              translation: "He says not to write."
            },
            {
              greek: "εἶπεν μὴ γράφοιεν.",
              translation: "He said they should not write."
            },
            {
              greek: "οὐ φησὶν αὐτὸν εἶναι σοφόν.",
              translation: "He says that he is not wise."
            }
          ]
        }
      ]
    },
    {
      section: "Fear Clauses",
      description: "Express fear that something may or may not happen.",
      details: {
        examples: [
          {
            type: "Introduced by μή",
            examples: [
              {
                greek: "φοβεῖται μή ἔλθῃ.",
                translation: "He fears that he may come."
              },
              {
                greek: "δεδιῶ μή ληφθῇ.",
                translation: "I fear that he may be captured."
              },
              {
                greek: "τρέμει μή τι πάθῃ.",
                translation: "He trembles lest he suffer something."
              }
            ]
          },
          {
            type: "μή οὐ",
            examples: [
              {
                greek: "φοβοῦμαι μή οὐ νικήσωμεν.",
                translation: "I fear that we may not win."
              },
              {
                greek: "δείδω μή οὐ φθάσωμεν.",
                translation: "I fear that we may not arrive in time."
              },
              {
                greek: "ἡ μήτηρ δείδω μή οὐ ζήσῃ τὸ τέκνον.",
                translation: "The mother fears that the child may not survive."
              }
            ]
          }
        ],
        moods: {
          title: "Mood of the verb in the fear clause",
          details: [
            {
              mood: "Subjunctive",
              context: "in primary sequence (present/future main verb)"
            },
            {
              mood: "Optative",
              context: "in secondary sequence (past main verb)"
            },
            {
              mood: "Indicative",
              context: "sometimes used for fear of actual events (esp. perfect/pluperfect)"
            }
          ]
        }
      }
    },
    {
      section: "Uses of Participles",
      description: "Participles are verbal adjectives that can function in various ways within a sentence, agreeing with a noun or pronoun in gender, number, and case.",
      types: [
        {
          type: "Attributive Participle",
          description: "Acts like an adjective, directly modifying a noun or pronoun. It often includes the definite article. Translated using a relative clause ('who/which/that ...s/ed') or an English participle.",
          examples: [
            { greek: "ὁ λέγων ἀνήρ σοφός ἐστιν.", translation: "The man who is speaking (or 'the speaking man') is wise." },
            { greek: "εἶδον τὴν γραφομένην ἐπιστολήν.", translation: "I saw the letter which was being written (or 'the letter being written')." },
            { greek: "οἱ πεσόντες στρατιῶται ἀνδρεῖοι ἦσαν.", translation: "The soldiers who fell (or 'the fallen soldiers') were brave." },
            { greek: "ἡ πόλις ἡ οἰκουμένη μεγάλη ἐστίν.", translation: "The inhabited city is large." },
            { greek: "τὸ παιδίον τὸ παίζον χαίρει.", translation: "The child who is playing (or 'the playing child') is happy." },
            { greek: "οἱ νικήσαντες ἔλαβον τὰ γέρα.", translation: "Those who conquered (or 'the conquering ones') received the prizes." }
          ]
        },
        {
          type: "Circumstantial Participle: Temporal (Time)",
          description: "Indicates the time of the main verb's action. The tense of the participle is relative to the main verb (present: contemporaneous; aorist: antecedent; future: subsequent).",
          examples: [
            { greek: "ταῦτα λέγων ἀπῆλθεν.", translation: "While saying these things (or 'After saying these things'), he departed." },
            { greek: "ἀκούσας ταῦτα, ἐφοβήθη.", translation: "Having heard these things (or 'When he heard these things'), he was afraid." },
            { greek: "πορευόμενοι ἐν τῇ ὁδῷ, εἶδον λύκον.", translation: "While they were traveling on the road, they saw a wolf." },
            { greek: "μαθὼν τὴν ἀλήθειαν, μετενόησεν.", translation: "Having learned the truth, he repented." },
            { greek: "ἐλθόντος τοῦ βασιλέως, πάντες ἐσίγησαν.", translation: "When the king arrived (Genitive Absolute example), everyone fell silent." },
            { greek: "μέλλων ἀποθνῄσκειν, εἶπε τάδε.", translation: "When he was about to die, he said these things." },
            { greek: "ταῦτα ποιήσας, ἀναπαύσεται.", translation: "After doing these things (Aorist part.), he will rest (Future main verb)." }
          ]
        },
        {
          type: "Circumstantial Participle: Causal (Cause/Reason)",
          description: "Indicates the cause or reason for the main verb's action. Often translated with 'because', 'since', or 'as'.",
          examples: [
            { greek: "πιστεύων γὰρ τῷ θεῷ, οὐκ ἐφοβεῖτο.", translation: "For, because he trusted in God, he was not afraid." },
            { greek: "νοσῶν οὐκ ἦλθεν εἰς τὴν ἐκκλησίαν.", translation: "Because he was sick, he did not come to the assembly." },
            { greek: "ταῦτα εἰδὼς, σιωπᾷ.", translation: "Since he knows these things, he is silent." },
            { greek: "μὴ βουλόμενος μάχεσθαι, ἔφυγεν.", translation: "Because he did not want to fight, he fled." },
            { greek: "κλαίων ὁ παῖς τὴν μητέρα ἐζήτει.", translation: "Crying (Because he was crying), the child was searching for his mother." },
            { greek: "πολλὰ ἔχων χρήματα, πάντας εὐεργέτει.", translation: "Since he had much money, he benefited everyone." }
          ]
        },
        {
          type: "Circumstantial Participle: Concessive (Concession)",
          description: "Indicates a circumstance despite which the main action occurs. Often translated with 'although', 'even though'. Often used with καίπερ.",
          examples: [
            { greek: "καίπερ πλούσιος ὤν, οὐκ εὐδαίμων ἐστίν.", translation: "Although he is wealthy, he is not happy." },
            { greek: "πολλὰ παθών, οὐκ ἀπελείπετο τῆς ἀρετῆς.", translation: "Although he suffered many things, he did not abandon virtue." },
            { greek: "μὴ θέλων, ὅμως ἐποίησεν.", translation: "Although not wanting to, nevertheless he did it." },
            { greek: "ἀσθενὴς ὤν, εἰς τὴν μάχην ἐπορεύθη.", translation: "Although he was weak, he went into battle." },
            { greek: "καίπερ γέρων ὤν, ἔτι ἐμάχετο.", translation: "Although he was an old man, he still fought." },
            { greek: "οὐκ ἔχων συμμάχους, μόνος ἐνίκα.", translation: "Although he had no allies (Despite not having allies), he alone was victorious." }
          ]
        },
        {
          type: "Circumstantial Participle: Conditional (Condition)",
          description: "Indicates the condition under which the main verb's action occurs. Often translated with 'if'.",
          examples: [
            { greek: "ταῦτα ποιῶν, καλῶς πράξεις.", translation: "If you do these things, you will fare well." },
            { greek: "μὴ πιστεύσας, ἀπολεῖται.", translation: "If he does not believe, he will perish." },
            { greek: "οὕτω πράξαντες, σωθησόμεθα.", translation: "If we act thus, we shall be saved." },
            { greek: "μὴ ἀμυνόμενοι, κακῶς πείσονται.", translation: "If they do not defend themselves, they will suffer badly." },
            { greek: "τολμῶντες πάντα, μεγάλων τευξόμεθα.", translation: "If we dare all things, we will obtain great things." },
            { greek: "εἰρηκὼς τἀληθῆ, οὐδὲν πείσεται.", translation: "If he has spoken the truth, he will suffer nothing." }
          ]
        },
        {
          type: "Circumstantial Participle: Manner/Means",
          description: "Indicates the manner or means by which the main verb's action is performed. Often translated with 'by ...ing' or an adverb.",
          examples: [
            { greek: "τρέχων ἦλθεν.", translation: "He came running (or 'by running')." },
            { greek: "λιμώττων ἀπέθανεν.", translation: "He died from starving (by starving)." },
            { greek: "λαθὼν εἰσῆλθεν.", translation: "He entered secretly (lit. 'having escaped notice')." },
            { greek: "κλέπτων τὰ χρήματα, πλούσιος ἐγένετο.", translation: "By stealing money, he became rich." },
            { greek: "σιγῶντες ἠκολούθουν.", translation: "They followed silently (being silent)." },
            { greek: "διδάσκων τοὺς μαθητὰς, αὐτὸς ἐμάνθανεν.", translation: "By teaching the students, he himself was learning." }
          ]
        },
        {
          type: "Circumstantial Participle: Purpose (Intention)",
          description: "Indicates the purpose of the main verb's action, typically using a future participle. Often translated with 'in order to...', 'with the intention of...'. ὡς + participle can also express intended or alleged purpose.",
          examples: [
            { greek: "ἦλθε λυσόμενος τοὺς αἰχμαλώτους.", translation: "He came to ransom (intending to ransom) the prisoners." },
            { greek: "πέμπει ἄγγελον ἐροῦντα τὰ γενόμενα.", translation: "He sends a messenger to tell (who will tell) what happened." },
            { greek: "στρατεύονται ὡς πολεμήσοντες.", translation: "They are marching as if intending to make war." },
            { greek: "παρεσκευάζοντο ἀμυνούμενοι.", translation: "They were preparing to defend themselves." },
            { greek: "ἔπλευσαν ἐμπορευσόμενοι.", translation: "They sailed in order to trade." },
            { greek: "ἀπέστειλεν αὐτοὺς κηρύξοντας τὸ εὐαγγέλιον.", translation: "He sent them to preach the gospel." }
          ]
        },
        {
          type: "Supplementary Participle",
          description: "Completes the idea of certain verbs, such as verbs of perception (seeing, hearing), knowing, showing, beginning, continuing, ceasing, feeling, or being (e.g., τυγχάνω, λανθάνω, φθάνω).",
          examples: [
            { greek: "ἤκουσα αὐτοῦ λέγοντος.", translation: "I heard him speaking." },
            { greek: "οἶδα τοῦτον σοφὸν ὄντα.", translation: "I know that this man is wise (lit. 'I know this man being wise')." },
            { greek: "ἔπαυσε τοὺς στρατιώτας μαχομένους.", translation: "He stopped the soldiers from fighting (lit. '...the soldiers fighting')." },
            { greek: "φαίνεται ἀγαθὸς ὤν.", translation: "He appears to be good." },
            { greek: "τυγχάνω παρών.", translation: "I happen to be present." },
            { greek: "λανθάνεις σεαυτὸν κακὰ ποιῶν.", translation: "You are unknowingly doing evil to yourself (lit. 'you escape your own notice doing evil')." },
            { greek: "ἄρχομαι λέγειν.", translation: "I begin to speak (or 'I begin speaking')." }
          ]
        },
        {
          type: "Genitive Absolute",
          description: "A participial phrase in the genitive case, grammatically independent of the main clause. It typically consists of a noun/pronoun in the genitive and a participle in the genitive agreeing with it. It often indicates time, cause, or concession.",
          examples: [
            { greek: "τοῦ ἡλίου δύναντος, οἱ στρατιῶται ἀπῆλθον.", translation: "When the sun set (lit. 'the sun setting'), the soldiers departed." },
            { greek: "τοῦ στρατηγοῦ κελεύσαντος, οἱ στρατιῶται ἐμάχοντο.", translation: "Since the general ordered it (lit. 'the general having ordered'), the soldiers fought." },
            { greek: "τούτων λεγομένων, ὁ πόλεμος ἐπαύσατο.", translation: "While these things were being said, the war stopped." },
            { greek: "θεοῦ διδόντος, οὐδὲν ἰσχύει φθόνος.", translation: "When God gives, envy has no power." },
            { greek: "πολλῶν παρόντων, εἶπε ταῦτα.", translation: "Although many were present (or 'With many being present'), he said these things." },
            { greek: "σιγῆς γενομένης, ὁ κῆρυξ ἐφώνησεν.", translation: "When silence fell, the herald made an announcement." },
            { greek: "Κύρου βασιλεύοντος, εἰρήνη ἦν.", translation: "While Cyrus was reigning, there was peace." }
          ]
        }
      ]
    },
    {
      section: "Uses of Infinitives",
      description: "The infinitive is a verbal noun that can function in various ways, often expressing an action or state without specifying person or number.",
      types: [
        {
          type: "Complementary Infinitive",
          description: "Completes the meaning of verbs that require another action to make sense (e.g., verbs of wishing, being able, commanding, trying, learning, choosing, beginning, ceasing).",
          examples: [
            { greek: "βούλομαι γράφειν.", translation: "I wish to write." },
            { greek: "δύναται τοῦτο ποιεῖν.", translation: "He is able to do this." },
            { greek: "ἐκέλευσεν αὐτοὺς μάχεσθαι.", translation: "He commanded them to fight." },
            { greek: "πειρᾶται φεύγειν.", translation: "He tries to flee." },
            { greek: "μανθάνω λέγειν.", translation: "I am learning to speak." },
            { greek: "ᾑροῦντο μένειν μᾶλλον ἢ ἀπιέναι.", translation: "They chose to remain rather than to depart." },
            { greek: "ἤρξατο διδάσκειν.", translation: "He began to teach." }
          ]
        },
        {
          type: "Articular Infinitive: As Subject",
          description: "The infinitive with the neuter definite article (τό) acts as a verbal noun and can serve as the subject of a sentence.",
          examples: [
            { greek: "τὸ λαλεῖν ἀργὸν ἀνδρὸς ἀργοῦ.", translation: "To speak idly is characteristic of an idle man." },
            { greek: "χαλεπὸν ἐστι τὸ μὴ φιλεῖν.", translation: "It is difficult not to love." },
            { greek: "τὸ νικᾶν ἡδύ ἐστιν.", translation: "To conquer is sweet." },
            { greek: "τὸ σιγᾶν πολλάκις ἐστὶ σοφώτατον.", translation: "To be silent is often wisest." },
            { greek: "τὸ πείθεσθαι τοῖς νόμοις καλόν.", translation: "To obey the laws is good." },
            { greek: "οὐ ῥᾴδιον ἐστι τὸ καλῶς ἄρχειν.", translation: "It is not easy to rule well." }
          ]
        },
        {
          type: "Articular Infinitive: As Object",
          description: "The articular infinitive (τό + infinitive) can also serve as the direct object of a verb.",
          examples: [
            { greek: "φοβεῖται τὸ ἀποθανεῖν.", translation: "He fears dying (lit. 'to die')." },
            { greek: "ἐμισοῦμεν τὸ δουλεύειν.", translation: "We hated being enslaved (lit. 'to be a slave')." },
            { greek: "ἐπεθύμει τοῦ πιεῖν.", translation: "He desired to drink (genitive with article after verb of desire)." },
            { greek: "ἔμαθον τὸ σιωπᾶν.", translation: "They learned to be silent." },
            { greek: "παραιτοῦμαι τὸ λέγειν.", translation: "I decline to speak." },
            { greek: "οὐκ ᾐσχύνετο τὸ κλαίειν.", translation: "He was not ashamed to weep." }
          ]
        },
        {
          type: "Articular Infinitive: With Prepositions",
          description: "The articular infinitive can be governed by prepositions, forming adverbial phrases of time, cause, purpose, etc. The case of the article changes according to the preposition.",
          examples: [
            { greek: "διὰ τὸ λέγειν ταῦτα, ἐτιμωρήθη.", translation: "Because he said these things (lit. 'through the to say these things'), he was punished." },
            { greek: "πρὸς τῷ μηδὲν ἐξεργάσασθαι ἔτι καὶ πορθεῖται τὰ ἡμέτερα.", translation: "In addition to accomplishing nothing, our property is also being ravaged." },
            { greek: "μετὰ τὸ δεῖπνον ἀπῆλθον.", translation: "After dinner (lit. 'after the to dine'), they departed." },
            { greek: "ἀντὶ τοῦ μάχεσθαι, ἔφυγον.", translation: "Instead of fighting, they fled." },
            { greek: "ἕνεκα τοῦ σωθῆναι πάντα ἐποίησαν.", translation: "For the sake of being saved, they did everything." },
            { greek: "ἐν τῷ βαδίζειν πολλὰ εἶδον.", translation: "While walking (lit. 'in the to walk'), I saw many things." },
            { greek: "εἰς τὸ νικῆσαι πάντα ὑπέμειναν.", translation: "With a view to conquering, they endured all things." }
          ]
        },
        {
          type: "Infinitive in Indirect Statement (Accusative and Infinitive)",
          description: "Used after verbs of saying, thinking, believing, knowing, perceiving, etc., to report a statement or thought. The subject of the infinitive is in the accusative case. If the subject is the same as the main verb, it's often omitted.",
          examples: [
            { greek: "νομίζω σε σοφὸν εἶναι.", translation: "I think that you are wise (lit. 'I think you to be wise')." },
            { greek: "ἔφη τὸν παῖδα παίζειν.", translation: "He said that the boy was playing." },
            { greek: "οἴεται δεῖν τοῦτο ποιεῖν.", translation: "He thinks it is necessary to do this (subject of infinitive 'it' implied)." },
            { greek: "ἤγγειλαν τοὺς πολεμίους προσιέναι.", translation: "They announced that the enemy were approaching." },
            { greek: "ἐλπίζομεν αὐτοὺς νικήσειν.", translation: "We hope that they will win (future infinitive)." },
            { greek: "ἔλεγον τοὺς θεοὺς πάντα εἰδέναι.", translation: "They used to say that the gods know all things." },
            { greek: "δοκῶ τοῦτο ἀληθὲς εἶναι.", translation: "I seem (or 'think') this to be true (subject of infinitive same as main verb, nominative case)." }
          ]
        },
        {
          type: "Infinitive of Result (Epexegetic or with ὥστε)",
          description: "Explains or specifies the result. Can follow adjectives (e.g., 'able to X', 'worthy to X') or be introduced by ὥστε ('so as to', 'so that'). With ὥστε, infinitive often indicates natural/intended result, indicative an actual result.",
          examples: [
            { greek: "δεινὸς λέγειν.", translation: "Skilled in speaking (lit. 'skilled to speak')." },
            { greek: "ἄξιός ἐστι τοῦτο λαβεῖν.", translation: "He is worthy to receive this." },
            { greek: "οὕτως ἐπολέμουν ὥστε πάντες αὐτοὺς ἐθαύμαζον.", translation: "They fought so bravely that everyone admired them (ὥστε + indicative = actual result)." },
            { greek: "νεός ἐστιν ὥστε ταῦτα μὴ γιγνώσκειν.", translation: "He is too young to know these things (ὥστε + infinitive = natural result)." },
            { greek: "δύσκολος εὑρεῖν.", translation: "Difficult to find." },
            { greek: "τὸ ὕδωρ ψυχρόν ἐστι πιεῖν.", translation: "The water is cold to drink." },
            { greek: "οὐδεὶς οὕτω σοφός ἐστιν ὥστε πάντα εἰδέναι.", translation: "No one is so wise as to know everything." }
          ]
        },
        {
          type: "Infinitive of Purpose",
          description: "Expresses the purpose of an action. Often used after verbs of motion, giving, choosing, sending, or preparing where ἵνα + subjunctive might also be used.",
          examples: [
            { greek: "ἦλθον μαθεῖν.", translation: "I came to learn (for the purpose of learning)." },
            { greek: "ἔδωκεν αὐτοῖς φαγεῖν.", translation: "He gave them (something) to eat." },
            { greek: "πέμπει τινὰς ἐρευνῆσαι τὴν χώραν.", translation: "He sends some men to scout the land." },
            { greek: "οἱ στρατιῶται παρεσκευάζοντο μάχεσθαι.", translation: "The soldiers were preparing to fight." },
            { greek: "ἀπέστειλε πρέσβεις περὶ εἰρήνης λέγειν.", translation: "He sent ambassadors to speak about peace." },
            { greek: "παρακαλῶ ὑμᾶς βοηθῆσαι.", translation: "I urge you to help (purpose of urging)." },
            { greek: "εἵλοντο ἀποθανεῖν μᾶλλον ἢ δουλεύειν.", translation: "They chose to die rather than to be slaves (purpose of choice)." }
          ]
        }
      ]
    }
  ]
};
