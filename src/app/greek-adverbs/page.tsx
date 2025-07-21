
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, HelpCircle } from 'lucide-react';
import './GreekAdverbs.css';
import { cn } from '@/lib/utils';
import { greekAdverbsData, type AdverbCategory, type Adverb } from '@/lib/data/greekAdverbsData';

interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  adverb: string;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const GreekAdverbsModule: React.FC = () => {
  const { toast } = useToast();
  const [mode, setMode] = useState<'learn' | 'quiz'>('learn');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0, streak: 0 });

  const generateAllMeanings = useCallback((): string[] => {
    return Array.from(new Set(greekAdverbsData.flatMap(category => category.adverbs.map(adverb => adverb.meaning))));
  }, []);

  const generateQuestionsList = useCallback(() => {
    const allMeanings = generateAllMeanings();
    const generated: QuizQuestion[] = [];
    let questionIdCounter = 0;

    greekAdverbsData.forEach(category => {
      category.adverbs.forEach(adverb => {
        const distractors = shuffleArray(allMeanings.filter(m => m !== adverb.meaning)).slice(0, 3);
        const options = shuffleArray([adverb.meaning, ...distractors]);
        generated.push({
          id: `q-${questionIdCounter++}`,
          questionText: `What does the adverb '${adverb.adverb}' mean?`,
          options,
          correctAnswer: adverb.meaning,
          hint: adverb.notes || `This adverb belongs to the '${category.category}' category.`,
          adverb: adverb.adverb,
        });
      });
    });
    setQuestions(shuffleArray(generated));
  }, [generateAllMeanings]);

  useEffect(() => {
    generateQuestionsList();
  }, [generateQuestionsList]);

  const playSound = (soundType: 'correct' | 'wrong') => {
    try {
      const audio = new Audio(`/sounds/${soundType === 'correct' ? 'rightanswer' : 'wronganswer'}.mp3`);
      if (soundType === 'wrong') audio.volume = 0.3;
      audio.play().catch(e => console.warn("Audio play failed:", e));
    } catch (e) {
      console.warn("Could not play sound:", e);
    }
  };

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;

    setSelectedOption(option);
    setIsAnswered(true);
    setShowHint(true); 

    if (option === questions[currentQuestionIndex].correctAnswer) {
      playSound('correct');
      setStats(prev => ({ ...prev, correct: prev.correct + 1, streak: prev.streak + 1 }));
      toast({ title: "Correct!", duration: 2000 });
    } else {
      playSound('wrong');
      setStats(prev => ({ ...prev, incorrect: prev.incorrect + 1, streak: 0 }));
      toast({ title: "Incorrect", description: `Correct answer: ${questions[currentQuestionIndex].correctAnswer}`, variant: "destructive", duration: 3000 });
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setShowHint(false);
    setCurrentQuestionIndex((prevIndex) => (prevIndex + 1) % questions.length);
  };

  const handleToggleMode = () => {
    setMode(prevMode => {
      const newMode = prevMode === 'learn' ? 'quiz' : 'learn';
      if (newMode === 'quiz') {
        generateQuestionsList();
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setShowHint(false);
        setStats({ correct: 0, incorrect: 0, streak: 0 });
      }
      return newMode;
    });
  };
  
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="space-y-6 greek-adverbs-module">
      <Card className="animation-fadeInUp">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Greek Adverbs Module</CardTitle>
          <CardDescription>Learn about Greek adverbs and test your knowledge.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <Button onClick={handleToggleMode} variant="outline">
              Switch to {mode === 'learn' ? 'Quiz Mode' : 'Learn Mode'}
            </Button>
            {mode === 'quiz' && (
              <div className="flex gap-2 text-sm">
                <span className="text-green-500">Correct: {stats.correct}</span>
                <span className="text-red-500">Incorrect: {stats.incorrect}</span>
                <span>Streak: {stats.streak}</span>
              </div>
            )}
          </div>

          {mode === 'learn' && (
            <Accordion type="multiple" className="w-full space-y-2">
              {greekAdverbsData.map((category, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border bg-card rounded-lg shadow-sm">
                  <AccordionTrigger className="px-6 py-4 text-lg font-medium hover:no-underline">
                    {category.category}
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6 pt-2 space-y-4">
                    <p className="text-muted-foreground">{category.description}</p>
                    <div className="space-y-3">
                        {category.adverbs.map((adverb, advIndex) => (
                            <Card key={advIndex} className="bg-muted/30">
                                <CardContent className="p-4">
                                    <p className="font-semibold text-primary">{adverb.adverb} - <span className="font-normal text-foreground">{adverb.meaning}</span></p>
                                    {adverb.notes && <p className="text-xs text-muted-foreground italic mt-1">{adverb.notes}</p>}
                                    {adverb.examples.map((ex, exIndex) => (
                                        <div key={exIndex} className="mt-2 border-l-2 border-border pl-3">
                                            <p className="text-sm">{ex.greek}</p>
                                            <p className="text-xs text-muted-foreground">{ex.translation}</p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {mode === 'quiz' && currentQuestion && ( 
            <Card className="p-6 bg-muted/30 border-dashed">
              <CardTitle className="text-lg mb-2 text-center">What is the meaning of...</CardTitle>
              <CardDescription className="text-4xl font-bold text-primary text-center mb-6">{currentQuestion.adverb}</CardDescription>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {currentQuestion.options.map((option, index) => (
                  <Button
                    key={index}
                    onClick={() => handleOptionSelect(option)}
                    disabled={isAnswered}
                    variant="outline"
                    className={cn(
                      "h-auto py-3 text-base",
                      isAnswered && option === currentQuestion.correctAnswer && "animation-bounce correct-answer",
                      isAnswered && selectedOption === option && option !== currentQuestion.correctAnswer && "animation-shake wrong-answer"
                    )}
                  >
                    {option}
                  </Button>
                ))}
              </div>

              {showHint && (
                <div className="p-3 mb-4 text-sm border rounded-md bg-background">
                  <p className="font-semibold">
                    {selectedOption === currentQuestion.correctAnswer ? "Correct!" : "Incorrect."}
                    {selectedOption !== currentQuestion.correctAnswer && ` The answer is: ${currentQuestion.correctAnswer}`}
                  </p>
                  {currentQuestion.hint && <p className="text-xs text-muted-foreground mt-1">Hint: {currentQuestion.hint}</p>}
                </div>
              )}
              
              <div className="flex justify-center gap-4">
                <Button onClick={() => setShowHint(s => !s)} variant="ghost" size="sm" disabled={isAnswered}>
                   <HelpCircle className="mr-1 h-4 w-4" /> {showHint ? "Hide Hint" : "Show Hint"}
                </Button>
                <Button onClick={handleNextQuestion} disabled={!isAnswered}>
                  Next Question <RefreshCw className="ml-2 h-4 w-4"/>
                </Button>
              </div>
            </Card>
          )}
           {mode === 'quiz' && !currentQuestion && questions.length > 0 && (
             <p className="text-center text-muted-foreground">Loading questions or quiz finished.</p>
           )}
           {mode === 'quiz' && questions.length === 0 && (
             <p className="text-center text-muted-foreground">Generating questions...</p>
           )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GreekAdverbsModule;
