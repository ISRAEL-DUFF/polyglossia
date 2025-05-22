"use client";

import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

// Define types for the game
interface ParsingOption {
  tense?: string;
  voice?: string;
  mood?: string;
  person?: string;
  number?: string;
  case?: string;
  gender?: string;
  declension?: string;
  part_of_speech?: string;
  verb_type?: string;
  // Special properties that aren't strings
  is_mediopassive?: boolean;
  alternates?: ParsingOption[];
}

interface Question {
  form: string;
  correct: ParsingOption;
}

const BASE_URL = 'https://www.eazilang.gleeze.com/api/greek'

const ParserGame: React.FC = () => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<Record<string, Question[]>>({
    verb: [
      { form: "λύομεν", correct: { tense: "present", voice: "active", mood: "indicative", number: "plural", person: "first", verb_type: '-' } },
      { form: "ἔλυσαν", correct: { tense: "aorist", voice: "active", mood: "indicative", number: "plural", person: "third", verb_type: '-' } }
    ],
    noun: [
      { form: "λόγου", correct: { declension: "2nd", case: "genitive", number: "singular", gender: "masculine" } },
      { form: "χαράς", correct: { declension: "1st", case: "genitive", number: "singular", gender: "feminine" } }
    ],
    participle: [
      { form: "λύων", correct: { tense: "present", voice: "active", gender: "masculine", case: "nominative", number: "singular", verb_type: '-' } },
      { form: "λυθείς", correct: { tense: "aorist", voice: "passive", gender: "masculine", case: "nominative", number: "singular", verb_type: '-' } }
    ],
    adjective: [
      { form: "ἀγαθός", correct: { declension: "2nd", gender: "masculine", case: "nominative", number: "singular" } },
      { form: "καλῆς", correct: { declension: "1st", gender: "feminine", case: "genitive", number: "singular" } }
    ],
    pronoun: [
      { form: "ἐμοί", correct: { case: "dative", number: "singular", person: "first" } },
      { form: "σοῦ", correct: { case: "genitive", number: "singular", person: "second" } }
    ]
  });
  const [currentMode, setCurrentMode] = useState<string>('verb');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [correctScore, setCorrectScore] = useState<number>(0);
  const [incorrectScore, setIncorrectScore] = useState<number>(0);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [backendFilters, setBackendFilters] = useState<Record<string, string>>({
    part_of_speech: 'verb'
  });
  const [result, setResult] = useState<string>('');
  const [resultMap, setResultMap] = useState<Record<string, string>>({});
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [revealDialogOpen, setRevealDialogOpen] = useState<boolean>(false);
  const [morphoDialogOpen, setMorphoDialogOpen] = useState<boolean>(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [questionsLoaded, setQuestionsLoaded] = useState<boolean>(false);
  const [userChoice, setUserChoice] = useState<'reveal' | 'check'>('reveal');

  // All available filter options - exactly as provided in the sample
  const allFilters: Record<string, string[]> = {
    tense: ['present', 'aorist', 'imperfect', 'perfect', 'pluperfect', 'future', 'future perfect'],
    voice: ['active', 'middle', 'passive'],
    mood: ['indicative', 'subjunctive', 'optative', 'imperative'],
    person: ['first', 'second', 'third'],
    number: ['singular', 'plural', 'dual'],
    case: ['nominative', 'genitive', 'dative', 'accusative', 'vocative'],
    gender: ['masculine', 'feminine', 'neuter'],
    declension: ['1st', '2nd', '3rd', '1st & 2nd'],
    verb_type: ['w', 'mi', 'contract', 'liquid', 'irregular']
  };

  // Helper functions - matching the original HTML sample
  const shouldIgnoreKey = (key: string): boolean => {
    return key === 'is_mediopassive' || key === 'alternates' || key === 'verb_type' || key === 'part_of_speech' || key === 'declension';
  };

  const getFirstCorrect = (mode: string): ParsingOption => {
    return questions[mode]?.[0]?.correct || {};
  };

  const convertPerson = (person: string): string => {
    if (person === 'first') return '1st';
    if (person === 'second') return '2nd';
    if (person === 'third') return '3rd';
    if (person === '1st') return 'first';
    if (person === '2nd') return 'second';
    if (person === '3rd') return 'third';
    return person;
  };

  const toQueryParams = (filters: Record<string, string>): string => {
    const params = new URLSearchParams();
    for (const key in filters) {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, key === 'person' ? convertPerson(filters[key]) : filters[key]);
      }
    }
    return params.toString(); // returns string like "case=dative&number=plural"
  };

  // Handle mode change
  const handleModeChange = (value: string) => {
    setCurrentMode(value);
    setStreak(0);
    setCorrectScore(0);
    setIncorrectScore(0);
    setFilters({});
    setBackendFilters({
      part_of_speech: value
    });
    setCurrentQuestion(null);
    setCurrentIndex(0);
    setQuestionsLoaded(false);
  };

  // Handle filter change
  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      if (value === '') {
        delete newFilters[field];
      } else {
        newFilters[field] = value;
      }
      
      setBackendFilters({
        ...newFilters,
        part_of_speech: currentMode
      });
      
      return newFilters;
    });
  };

  // Fetch questions from API - exactly matching the sample HTML functionality
  const fetchMorphData = async () => {
    setIsLoading(true);
    setCurrentIndex(0);

    try {
      const queryParams = toQueryParams(backendFilters);
      const response = await fetch(`${BASE_URL}/morphology?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch morphology data');
      }
      
      const list = await response.json();
      
      const morphQuestions = list.map((item: any) => {
        // let correct: ParsingOption = {};
        let correct: any = {};

        for (const field in item) {
          if (field === 'id' || field === 'word' || field === 'part_of_speech') {
            continue;
          }

          if (!item[field]) {
            continue;
          }

          if (field === 'alternates') {
            correct[field] = item[field].map((a: any) => {
              if (a.person) {
                a.person = convertPerson(a.person);
              }
              return a;
            });
            continue;
          }

          correct[field as keyof ParsingOption] = field === 'person' ? convertPerson(item[field] as string) : item[field];
        }

        return {
          form: item.word,
          correct: correct as ParsingOption,
        };
      });

      setQuestions(prev => ({
        ...prev,
        [currentMode]: morphQuestions
      }));
      setQuestionsLoaded(true);
      
      if (morphQuestions.length > 0) {
        console.log('Current Morph:', morphQuestions[0])
        setCurrentQuestion(morphQuestions[0]);
        setUserAnswers({});
        setResult('');
        setResultMap({});
        // showQuizModal();
        setQuizDialogOpen(true);
      } else {
        toast({
          title: "No Questions Found",
          description: "No matching questions with current filters. Please adjust filters.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to fetch morphology data:', error);
      toast({
        title: "Error Fetching Questions",
        description: "There was an error loading questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check the user's answer - matching the sample HTML functionality
  const checkAnswer = () => {
    if (!currentQuestion) return;
    
    setUserChoice('check');
    
    const correct = currentQuestion.correct;
    const alternates = correct.alternates || [];
    const allCorrectOptions = [correct, ...alternates];
    const matchedCorrects: Array<{numberOfMatch: number, matchedCorrect: Record<string, boolean>}> = [];

    let isAnyMatch = false;

    for (const parsing of allCorrectOptions) {
      const matchedCorrect: Record<string, boolean> = {};
      let numberOfMatch = 0;
      let isCorrect = true;

      for (const key in parsing) {
        if (shouldIgnoreKey(key)) continue;
        
        if (userAnswers[key] !== parsing[key as keyof ParsingOption]) {
          // Special case for mediopassive
          if (key === 'voice' && parsing.is_mediopassive && 
              (userAnswers[key] === 'middle' || userAnswers[key] === 'passive')) {
            matchedCorrect[key] = true;
            numberOfMatch += 1;
            continue;
          }

          isCorrect = false;
          continue;
        }

        numberOfMatch += 1;
        matchedCorrect[key] = true;
      }

      if (isCorrect) {
        isAnyMatch = true;
      }

      matchedCorrects.push({
        numberOfMatch,
        matchedCorrect
      });
    }

    const matchedCorrect = matchedCorrects.sort((a, b) => b.numberOfMatch - a.numberOfMatch)[0].matchedCorrect;

    // Set correct/incorrect result
    if (isAnyMatch) {
      setResult('correct');
      setStreak(prev => prev + 1);
      setCorrectScore(prev => prev + 1);
      toast({
        title: "Correct!",
        description: "Great job! You parsed this word correctly.",
        variant: "default",
      });
      setTimeout(() => nextQuestion(), 2000);
    } else {
      setResult('incorrect');
      setStreak(0);
      setIncorrectScore(prev => prev + 1);
      toast({
        title: "Incorrect",
        description: "That's not quite right. Try again or reveal the answer.",
        variant: "destructive",
      });
    }

    // Mark correct/incorrect labels
    const newResultMap = {}
    for (const key in userAnswers) {
      
      if (matchedCorrect[key]) {
          newResultMap[key] = 'correct'
      } else {
          newResultMap[key] = 'incorrect'
      }
    }
    setResultMap(newResultMap)
  };

  // Reveal the correct answer - matching the sample HTML functionality
  const revealAnswer = () => {
    setUserChoice('reveal');
    setRevealDialogOpen(true);
    
    if (userChoice === 'reveal') {
      setStreak(0);
      setIncorrectScore(prev => prev + 1);
    }
  };

  // Show morphology in Logeion
  const showLogeionModal = () => {
    if (!currentQuestion) return;
    setMorphoDialogOpen(true);
  };

  // Show Quiz Dialog
  const showQuizModal = () => {
    console.log('Current question', currentQuestion)
    if (!currentQuestion) return;
    setQuizDialogOpen(true);
  };

  // Move to next question
  const nextQuestion = () => {
    const list = questions[currentMode] || [];
    
    if (currentIndex >= list.length - 1) {
      setCurrentQuestion(null);
      toast({
        title: "Game Ended",
        description: "You've completed all available questions.",
      });
      return;
    }

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setCurrentQuestion(list[nextIndex]);
    setUserAnswers({});
    setResult('');
    setResultMap({});
    setUserChoice('reveal');
  };

  // Render the filter controls based on the current mode - matching the sample HTML
  const renderFilterControls = () => {
    if (!currentMode) return null;

    const fields = Object.keys(getFirstCorrect(currentMode));
    console.log('fields', fields);

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {fields.map(field => {
          if(field === 'alternates' || field === 'is_mediopassive') {
            return null;
          }
          
          const options = allFilters[field] || [];
          
          return (
            <div key={field} className="flex flex-col space-y-2">
              <Label htmlFor={field} className="font-medium text-primary">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </Label>
              <Select
                value={filters[field] || ''}
                onValueChange={(value) => handleFilterChange(field, value)}
              >
                <SelectTrigger id={field} className="w-full">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=" ">All</SelectItem>
                  {options.map(option => (
                    <SelectItem key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>
    );
  };

  // Render the form for answering questions - matching the sample HTML functionality
  const renderAnswerForm = () => {
    if (!currentQuestion) return null;

    const correct = currentQuestion.correct;
    
    return (
      <div className="space-y-4">
        {Object.keys(correct).map(key => {
          if (shouldIgnoreKey(key)) return null;
          
          const options = allFilters[key] || [];
          const isSelected = (option: string) => userAnswers[key] === option;
          // const isCorrect = result === 'correct';
          // const isIncorrect = result === 'incorrect'; 
          const isCorrect = resultMap[key] === 'correct';
          const isIncorrect = resultMap[key] === 'incorrect'; 
          
          return (
            <Card key={key} className="border">
              <CardContent className="pt-6">
                <Label className="font-semibold mb-2 block">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Label>
                
                <div className="grid grid-cols-2 gap-2">
                  {options.map(option => (
                    <Button
                      key={option}
                      type="button"
                      variant={isSelected(option) ? "default" : "outline"}
                      className="justify-start font-normal"
                      onClick={() => setUserAnswers(prev => ({...prev, [key]: option}))}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                      {isSelected(option) && isCorrect && <span className="ml-auto text-white">✓</span>}
                      {isSelected(option) && isIncorrect && <span className="ml-auto text-white">✗</span>}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  // Render the modal for showing parsing info
  const renderParsingModal = () => {
    if (!currentQuestion) return null;
    
    const correct = currentQuestion.correct;
    const alternates = correct.alternates || [];
    
    // Add the correct answer as the first parsing
    const allParsings = [
      {
        ...correct,
        alternates: undefined
      },
      ...alternates
    ];

    return (
      <AlertDialog open={revealDialogOpen} onOpenChange={setRevealDialogOpen}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Possible Parsings</AlertDialogTitle>
            <AlertDialogDescription>
              Here are all possible ways to parse <span className="font-bold text-foreground">{currentQuestion.form}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="max-h-[60vh] overflow-y-auto py-4 space-y-4">
            {allParsings.map((parsing, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  index === 0 
                    ? 'bg-green-950/10 border border-green-500/20' 
                    : 'bg-blue-950/10 border border-blue-500/20'
                }`}
              >
                <div className="flex flex-wrap gap-2">
                  {Object.entries(parsing)
                    .filter(([key]) => !shouldIgnoreKey(key))
                    .map(([key, value]) => (
                      <Badge key={key} variant={index === 0 ? "default" : "secondary"} className="text-sm">
                        <span className="font-medium mr-1">{key}:</span> {value}
                      </Badge>
                    ))}
                </div>
              </div>
            ))}
          </div>
          
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              setRevealDialogOpen(false);
              nextQuestion();
            }}>
              Next Question
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  // Main render - matching the sample HTML design and structure
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between mb-8">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Greek Word Parser Game</h2>
          <p className="text-muted-foreground">
            Practice parsing Greek words. Select a word type and filter options, then check your answers.
          </p>
        </div>
        
        {/* <div className="flex items-center gap-2">
          <Badge variant="default" className="text-lg py-1.5 px-3">✓ {correctScore}</Badge>
          <Badge variant="destructive" className="text-lg py-1.5 px-3">✗ {incorrectScore}</Badge>
          <Badge variant="outline" className="text-lg py-1.5 px-3">Streak: {streak}</Badge>
        </div> */}
      </div>

      <div className="grid md:grid-cols-[2fr_1fr] gap-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mode" className="font-medium">Practice Mode</Label>
              <Select value={currentMode} onValueChange={handleModeChange}>
                <SelectTrigger id="mode">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="verb">Verb</SelectItem>
                  <SelectItem value="noun">Noun</SelectItem>
                  <SelectItem value="participle">Participle</SelectItem>
                  <SelectItem value="adjective">Adjective</SelectItem>
                  <SelectItem value="pronoun">Pronoun</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {renderFilterControls()}
            
            <Button 
              onClick={fetchMorphData} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Loading...' : 'Load Questions'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Parsing modal */}
      {renderParsingModal()}
      
      {/* Morphology modal */}
      <Dialog open={morphoDialogOpen} onOpenChange={setMorphoDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] h-[90vh]">
          <DialogHeader>
            <DialogTitle>Logeion Morphology</DialogTitle>
            <DialogDescription>
              Morphological analysis for {currentQuestion?.form}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 h-full min-h-[60vh]">
            {morphoDialogOpen && currentQuestion && (
              <iframe 
                src={`https://logeion.uchicago.edu/morpho/${encodeURIComponent(currentQuestion.form)}`}
                className="w-full h-full border-0 rounded-md"
                title="Logeion Morphology"
              />
            )}
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz modal */}
      <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
        <DialogContent className="w-screen h-screen p-4 sm:p-6 flex flex-col overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentQuestion && questions[currentMode].length > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {currentIndex + 1} of {questions[currentMode].length}
                  </Badge>
                </div>
              )}
            </DialogTitle>
            <div className="flex items-center gap-1">
              <span className="text-sm py-0.5 px-3">✓ {correctScore}</span>
              <span className="text-sm py-0.5 px-3">✗ {incorrectScore}</span>
              <span className="text-sm py-0.5 px-3">Streak: {streak}</span>
            </div>
          </DialogHeader>

          <Card className="flex-grow">
            <CardContent className="pt-6 space-y-6">
              {!questionsLoaded && (
                <div className="text-center py-12">
                  <h3 className="text-xl font-medium mb-2">No Questions Loaded</h3>
                  <p className="text-muted-foreground">
                    Set your filters and click "Load Questions" to start playing.
                  </p>
                </div>
              )}

              {questionsLoaded && !currentQuestion && (
                <div className="text-center py-12">
                  <h3 className="text-xl font-medium mb-2">Game Ended</h3>
                  <p className="text-muted-foreground">
                    You've completed all available questions. Change filters or mode to play more.
                  </p>
                </div>
              )}

              {currentQuestion && (
                <>
                  <div className="text-center">
                    <h3 className="text-2xl sm:text-3xl font-bold text-primary mb-2">{currentQuestion.form}</h3>
                    <p className="text-muted-foreground">Parse this Greek word</p>
                  </div>

                  <div className="h-[50vh] sm:h-[55vh] overflow-y-auto">
                    {renderAnswerForm()}
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center sm:justify-between">
                    <Button
                      onClick={checkAnswer}
                      variant="default"
                      className="flex-1 px-2 py-1 text-xs"
                    >
                      Check Answer
                    </Button>
                    <Button
                      onClick={revealAnswer}
                      variant="outline"
                      className="flex-1 px-2 py-1 text-xs"
                    >
                      Reveal Answer
                    </Button>
                    <Button
                      onClick={showLogeionModal}
                      variant="secondary"
                      className="flex-1 px-2 py-1 text-xs"
                    >
                      View in Morpho
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParserGame;
