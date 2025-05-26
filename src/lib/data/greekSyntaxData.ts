
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
              type: "οὐ...οὐδέ", // Using type here as per your original example for this subsection
              translation: "not...nor",
              greek: "οὐ λέγει οὐδὲ γράφει." // Example provided in `greek` to match structure
            },
            {
              type: "μήτε...μήτε",
              translation: "neither...nor",
              greek: "βούλεται μήτε λέγειν μήτε γράφειν."
            },
            {
              type: "μηδείς/μηδεμία/μηδέν",
              translation: "no one, nothing",
              greek: "μηδὲν λέγε."
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
    }
  ]
};

    