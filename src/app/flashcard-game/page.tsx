
"use client"
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent as ShadCNCardContent } from "@/components/ui/card"; // Aliased CardContent
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Settings } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { loadDataSources, loadVocabularyData, WordGroups } from "@/lib/utils/vocabLoader";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Types
interface Word {
  word: string;
  meanings?: string[];
  meaning?: string;
  partOfSpeech?: string;
  root?: string;
  frequency?: number;
  transliteration?: string;  // For Hebrew
  inflection?: string;       // For Latin
}

interface FlashcardProps {
  word: Word;
  currentLanguage: string;
}


const Flashcard: React.FC<FlashcardProps> = ({ word, currentLanguage }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    setIsFlipped(!isFlipped);
  };

  // Get word display based on language
  const getWordDisplay = () => {
    switch (currentLanguage) {
      case 'hebrew':
        return (
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-bold mb-1 text-primary">{word.word}</h2>
            <p className="text-muted-foreground text-sm sm:text-base">{word.transliteration}</p>
            <p className="text-xs sm:text-sm text-muted-foreground/80">{word.partOfSpeech}</p>
          </div>
        );
      case 'latin':
        return (
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-bold mb-1 text-primary">{word.word}</h2>
            <p className="text-muted-foreground text-sm sm:text-base">{word.inflection}</p>
            <p className="text-xs sm:text-sm text-muted-foreground/80">{word.partOfSpeech}</p>
          </div>
        );
      case 'greek':
      default:
        return (
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-bold mb-1 text-primary">{word.word}</h2>
            <p className="text-muted-foreground text-sm sm:text-base">{word.root}</p>
            <p className="text-xs sm:text-sm text-muted-foreground/80">{word.partOfSpeech}</p>
          </div>
        );
    }
  };

  // Get meaning
  const getMeaning = () => {
    if (word.meaning) {
      return word.meaning;
    } else if (word.meanings && word.meanings.length > 0) {
      return word.meanings.join(', ');
    }
    return 'No meaning available';
  };

  return (
    <div
      className={`cursor-pointer perspective-1000 w-full max-w-xs sm:max-w-md h-48 sm:h-64 my-4 sm:my-6 mx-auto ${isFlipped ? 'flashcard-flipped' : ''}`}
      onClick={handleClick}
    >
      <div className="flashcard-inner relative w-full h-full transition-transform duration-500">
        {/* Front Side */}
        <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-center items-center flashcard-front bg-card rounded-lg border border-border shadow-md">
          {getWordDisplay()}
        </div>
        {/* Back Side */}
        <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-center items-center flashcard-back bg-muted rounded-lg border border-border shadow-md [transform:rotateY(180deg)]">
          <div className="text-center">
            <h3 className="text-base sm:text-lg font-semibold mb-2">Meaning:</h3>
            <p className="text-sm sm:text-base text-foreground">{getMeaning()}</p>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">Click to flip back</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const FlashcardGame = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [words, setWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentLanguage, setCurrentLanguage] = useState<string>("greek");
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<string | null>(null);
  const [wordGroups, setWordGroups] = useState<WordGroups>({});
  const [selectedWordGroup, setSelectedWordGroup] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [wordLimit, setWordLimit] = useState<number>(10);

  useEffect(() => {
    loadVocabDataSources(currentLanguage);
  }, [currentLanguage]);
  
  useEffect(() => {
    if (selectedDataSource) {
      loadVocabData(currentLanguage, selectedDataSource);
    }
  }, [selectedDataSource, currentLanguage]);
  
  useEffect(() => {
    if (selectedWordGroup && wordGroups[selectedWordGroup]) {
      const sourceWords = wordGroups[selectedWordGroup];
      const limitedWords = [...sourceWords].slice(0, wordLimit);
      setWords(limitedWords);
      setCurrentWordIndex(0);
    } else {
      setWords([]); // Clear words if no group selected or group is empty
      setCurrentWordIndex(0);
    }
  }, [wordLimit, selectedWordGroup, wordGroups, currentLanguage]);

  const shuffleWords = () => {
    let wordsToShuffle: Word[] = [];
    if (selectedWordGroup && wordGroups[selectedWordGroup]) {
      wordsToShuffle = [...wordGroups[selectedWordGroup]];
    } else if (words.length > 0) { // Fallback to current words if no specific group (e.g. initial demo/placeholder)
      wordsToShuffle = [...words]; // This might need adjustment based on how initial words are populated
    }

    if (wordsToShuffle.length === 0) {
      toast({
        title: "No Words to Shuffle",
        description: "Please select a word group.",
        variant: "destructive"
      });
      return;
    }

    const shuffled = wordsToShuffle.sort(() => Math.random() - 0.5);
    setWords(shuffled.slice(0, wordLimit));
    setCurrentWordIndex(0);
    toast({
      title: "Words Shuffled",
      description: `The words have been shuffled and limited to ${wordLimit}.`,
    });
  };
  
  const loadVocabDataSources = async (language: string) => {
    setIsLoading(true);
    setLoadError(null);
    setSelectedDataSource(null); // Reset selections when language changes
    setSelectedWordGroup(null);
    setWordGroups({});
    
    try {
      const sources = await loadDataSources(language);
      setDataSources(sources);
      
      if (sources.length > 0) {
        // Optionally auto-select first data source, or wait for user
        // setSelectedDataSource(sources[0].value); 
      } else {
        setLoadError(`No vocabulary files found for ${language}`);
      }
    } catch (error) {
      console.error('Error loading data sources:', error);
      setLoadError(`Failed to load vocabulary data for ${language}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadVocabData = async (language: string, filename: string) => {
    setIsLoading(true);
    setLoadError(null);
    setSelectedWordGroup(null); // Reset word group when data source changes
    setWordGroups({});

    try {
      const data = await loadVocabularyData(language, filename);
      setWordGroups(data);
      
      const groupKeys = Object.keys(data);
      if (groupKeys.length > 0) {
        // Optionally auto-select first group, or wait for user
        // setSelectedWordGroup(groupKeys[0]);
      } else {
        setLoadError(`No word groups found in the selected vocabulary file`);
      }
    } catch (error) {
      console.error('Error loading vocabulary data:', error);
      setLoadError(`Failed to load vocabulary data from file`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    // Data sources will be reloaded by useEffect dependency on currentLanguage
    toast({
      title: "Language Changed",
      description: `Switched to ${language.charAt(0).toUpperCase() + language.slice(1)} vocabulary`,
    });
  };
  
  const handleDataSourceChange = (source: string) => {
    setSelectedDataSource(source);
    // Vocab data will be reloaded by useEffect dependency on selectedDataSource
    toast({
      title: "Data Source Changed",
      description: `Loaded vocabulary from ${dataSources.find(ds => ds.value === source)?.key || source}`,
    });
  };
  
  const handleWordGroupChange = (group: string) => {
    setSelectedWordGroup(group);
    // Words will be set by useEffect dependency on selectedWordGroup
    toast({
      title: "Word Group Selected",
      description: `Loaded "${group}" word group`,
    });
  };
  
  const goToPreviousWord = () => {
    setCurrentWordIndex((prevIndex) => Math.max(0, prevIndex - 1));
  };
  
  const goToNextWord = () => {
    setCurrentWordIndex((prevIndex) => Math.min(words.length - 1, prevIndex + 1));
  };

  const maxPossibleWords = selectedWordGroup && wordGroups[selectedWordGroup] 
    ? wordGroups[selectedWordGroup].length 
    : (words.length > 0 ? words.length : 100); // Fallback if no group selected yet

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-6 text-primary">
        {currentLanguage === 'greek' && "Greek"}
        {currentLanguage === 'hebrew' && "Hebrew"}
        {currentLanguage === 'latin' && "Latin"}
        {" "}Flashcard Game
      </h1>
      
      <Card className="mb-6">
        <ShadCNCardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-2">
            <Select 
              value={currentLanguage}
              onValueChange={(value) => handleLanguageChange(value)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue>
                  {currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="greek">Greek</SelectItem>
                <SelectItem value="hebrew">Hebrew</SelectItem>
                <SelectItem value="latin">Latin</SelectItem>
              </SelectContent>
            </Select>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex items-center justify-center w-full sm:w-auto">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-background overflow-y-auto p-6" side="right">
                <SheetHeader>
                  <SheetTitle>Game Settings</SheetTitle>
                  <SheetDescription>
                    Customize your flashcard game
                  </SheetDescription>
                </SheetHeader>

                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="word-limit">Word Limit</Label>
                    <Input
                      id="word-limit"
                      type="number"
                      value={wordLimit}
                      onChange={(e) => setWordLimit(Math.max(1, Math.min(Number(e.target.value), maxPossibleWords)))}
                      className="w-full"
                      placeholder="Enter number of words"
                      min="1"
                      max={maxPossibleWords > 0 ? maxPossibleWords : undefined}
                    />
                  </div>

                  <Button onClick={shuffleWords} className="w-full" variant="outline">
                    <RefreshCw className="mr-2 h-4 w-4" /> Shuffle Words
                  </Button>
            
                  {dataSources.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="data-source">Data Source</Label>
                      <Select 
                        value={selectedDataSource || ""}
                        onValueChange={handleDataSourceChange}
                      >
                        <SelectTrigger id="data-source" className="w-full">
                          <SelectValue placeholder="Select datasource" />
                        </SelectTrigger>
                        <SelectContent>
                          {dataSources.map((source) => (
                            <SelectItem key={source.key} value={source.value}>
                              {source.key}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {selectedDataSource && Object.keys(wordGroups).length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="word-group">Word Group</Label>
                      <Select 
                        value={selectedWordGroup || ""}
                        onValueChange={handleWordGroupChange}
                      >
                        <SelectTrigger id="word-group" className="w-full">
                          <SelectValue placeholder="Select word group" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(wordGroups).map(group => (
                            <SelectItem key={group} value={group}>
                              {group} ({wordGroups[group]?.length || 0} words)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </ShadCNCardContent>
      </Card>
      
      {isLoading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-muted-foreground">Loading vocabulary...</span>
        </div>
      )}
      
      {loadError && !isLoading && (
        <Alert variant="destructive" className="mx-auto max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}
      
      {words.length > 0 && !isLoading ? (
        <>
          <Flashcard word={words[currentWordIndex]} currentLanguage={currentLanguage} />
          <div className="flex justify-between items-center mt-6">
            <Button onClick={goToPreviousWord} disabled={currentWordIndex === 0} variant="outline">
              Previous
            </Button>
            <Button onClick={shuffleWords} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" /> Shuffle
            </Button>
            <Button onClick={goToNextWord} disabled={currentWordIndex === words.length - 1} variant="outline">
              Next
            </Button>
          </div>
        </>
      ) : (
        !isLoading && !loadError && (
          <div className="text-center mt-8 py-10 border border-dashed rounded-lg">
            <p className="text-muted-foreground">
              {selectedDataSource && selectedWordGroup ? "No words available in this group." : "Select a language, data source, and word group to start."}
            </p>
            {!selectedDataSource && <p className="text-sm text-muted-foreground mt-2">Use the Settings panel to configure your game.</p>}
          </div>
        )
      )}
    </div>
  );
};

export default FlashcardGame;
