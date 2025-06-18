
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, HelpCircle, Lightbulb } from 'lucide-react';
import './GreekPrepositions.css'; // For custom animations
import { cn } from '@/lib/utils';
import { prepositionData } from '@/lib/data/prepositionsData';

interface QuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctAnswer: string;
  hint: string;
  preposition: string;
  caseName: string;
}


const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const GreekPrepositionsModule: React.FC = () => {
  const { toast } = useToast();
  const [mode, setMode] = useState<'learn' | 'quiz'>('learn');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0, streak: 0 });

  const generateAllMeanings = useCallback((): string[] => {
    return Array.from(new Set(prepositionData.flatMap(entry => Object.values(entry.cases).flat())));
  }, []);

  const generateQuestionsList = useCallback(() => {
    const allMeanings = generateAllMeanings();
    const generated: QuizQuestion[] = [];
    let questionIdCounter = 0;

    prepositionData.forEach(entry => {
      Object.entries(entry.cases).forEach(([caseName, meanings]) => {
        meanings.forEach(correctMeaning => {
          const distractors = shuffleArray(allMeanings.filter(o => o !== correctMeaning)).slice(0, 3);
          const options = shuffleArray([correctMeaning, ...distractors]);
          generated.push({
            id: `q-${questionIdCounter++}`,
            questionText: `What does '${entry.preposition}' mean with the ${caseName} case?`,
            options,
            correctAnswer: correctMeaning,
            hint: entry.notes || "No specific hint for this preposition/case.",
            preposition: entry.preposition,
            caseName: caseName
          });
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
    setShowHint(true); // Show hint/answer after selection

    if (option === questions[currentQuestionIndex].correctAnswer) {
      playSound('correct');
      setStats(prev => ({ ...prev, correct: prev.correct + 1, streak: prev.streak + 1 }));
      toast({ title: "Correct!", duration: 2000 });
    } else {
      playSound('wrong');
      setStats(prev => ({ ...prev, incorrect: prev.incorrect + 1, streak: 0 }));
      toast({ title: "Incorrect", description: `Correct: ${questions[currentQuestionIndex].correctAnswer}`, variant: "destructive", duration: 3000 });
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setShowHint(false);
    setCurrentQuestionIndex((prevIndex) => (prevIndex + 1) % questions.length);
  };

  const handleToggleMode = () => {
    setMode(prevMode => (prevMode === 'learn' ? 'quiz' : 'learn'));
    if (mode === 'learn') { // Switching to quiz
      generateQuestionsList(); // Ensure questions are fresh
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setIsAnswered(false);
      setShowHint(false);
      setStats({ correct: 0, incorrect: 0, streak: 0 });
    }
  };
  
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="space-y-6 greek-prepositions-module">
      <Card className="animation-fadeInUp">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Greek Prepositions Module</CardTitle>
          <CardDescription>Learn about Greek prepositions and test your knowledge.</CardDescription>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preposition</TableHead>
                    <TableHead>Case</TableHead>
                    <TableHead>Meaning(s)</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prepositionData.map((entry, index) => (
                    Object.entries(entry.cases).map(([caseName, meanings], caseIndex) => (
                      <TableRow key={`${index}-${caseIndex}`}>
                        {caseIndex === 0 && <TableCell rowSpan={Object.keys(entry.cases).length} className="align-top font-semibold">{entry.preposition}</TableCell>}
                        <TableCell>{caseName}</TableCell>
                        <TableCell>{meanings.join(", ")}</TableCell>
                        {caseIndex === 0 && <TableCell rowSpan={Object.keys(entry.cases).length} className="align-top text-xs text-muted-foreground">{entry.notes}</TableCell>}
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {mode === 'quiz' && currentQuestion && ( 
            <Card className="p-6 bg-muted/30 border-dashed">
              <CardTitle className="text-lg mb-2 text-center">{currentQuestion.preposition} <span className="text-base text-muted-foreground">({currentQuestion.caseName})</span></CardTitle>
              <CardDescription className="text-center mb-6">{currentQuestion.questionText}</CardDescription>
              
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

export default GreekPrepositionsModule;
    