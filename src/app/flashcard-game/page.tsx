"use client"
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
            <h2 className="text-lg sm:text-xl font-bold mb-1">{word.word}</h2>
            <p className="text-gray-500 text-sm sm:text-base">{word.transliteration}</p>
            <p className="text-xs sm:text-sm text-gray-400">{word.partOfSpeech}</p>
          </div>
        );
      case 'latin':
        return (
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{word.word}</h2>
            <p className="text-gray-500 text-sm sm:text-base">{word.inflection}</p>
            <p className="text-xs sm:text-sm text-gray-400">{word.partOfSpeech}</p>
          </div>
        );
      case 'greek':
      default:
        return (
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-bold mb-1">{word.word}</h2>
            <p className="text-gray-500 text-sm sm:text-base">{word.root}</p>
            <p className="text-xs sm:text-sm text-gray-400">{word.partOfSpeech}</p>
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
      <Card className="flashcard-inner relative w-full h-full transition-transform duration-500">
        {/* Front Side */}
        <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-center items-center flashcard-front bg-white rounded-lg border border-gray-200 shadow-md">
          {getWordDisplay()}
        </div>
        {/* Back Side */}
        <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-center items-center flashcard-back bg-gray-100 rounded-lg border border-gray-200 shadow-md [transform:rotateY(180deg)]">
          <div className="text-center">
            <h3 className="text-base sm:text-lg font-semibold mb-2">Meaning:</h3>
            <p className="text-sm sm:text-base">{getMeaning()}</p>
            <p className="mt-2 text-xs sm:text-sm text-gray-500">Click to flip back</p>
          </div>
        </div>
      </Card>
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
  const [wordLimit, setWordLimit] = useState<number>(10); // New state for word limit

  
  useEffect(() => {
    // Load data sources for the current language
    loadVocabDataSources(currentLanguage);
  }, [currentLanguage]);
  
  useEffect(() => {
    if (selectedDataSource) {
      loadVocabData(currentLanguage, selectedDataSource);
    }
  }, [selectedDataSource, currentLanguage]);
  
  useEffect(() => {
    if (selectedWordGroup && wordGroups[selectedWordGroup]) {
      setWords(wordGroups[selectedWordGroup]);
      setCurrentWordIndex(0);
    }
  }, [wordLimit, selectedWordGroup, wordGroups]);

  const shuffleWords = () => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
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
    
    try {
      const sources = await loadDataSources(language);
      setDataSources(sources);
      
      if (sources.length > 0) {
        setSelectedDataSource(sources[0].value);
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
    
    try {
      const data = await loadVocabularyData(language, filename);
      setWordGroups(data);
      
      const groupKeys = Object.keys(data);
      if (groupKeys.length > 0) {
        setSelectedWordGroup(groupKeys[0]);
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
    setSelectedDataSource(null);
    setSelectedWordGroup(null);
    setWordGroups({});
    setWords([]);
    setCurrentWordIndex(0);
    
    toast({
      title: "Language Changed",
      description: `Switched to ${language.charAt(0).toUpperCase() + language.slice(1)} vocabulary`,
    });
  };
  
  const handleDataSourceChange = (source: string) => {
    setSelectedDataSource(source);
    
    toast({
      title: "Data Source Changed",
      description: `Loaded vocabulary from ${dataSources.find(ds => ds.value === source)?.key || source}`,
    });
  };
  
  const handleWordGroupChange = (group: string) => {
    setSelectedWordGroup(group);
    
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold text-center mb-4">
        {currentLanguage === 'greek' && "Greek"}
        {currentLanguage === 'hebrew' && "Hebrew"}
        {currentLanguage === 'latin' && "Latin"}
        {" "}Flashcard Game
      </h1>
      
      {/* Language and Data Source Selectors */}
      <div className="flex flex-col sm:flex-row justify-center mt-4 space-y-2 sm:space-y-0 sm:space-x-2 px-2">
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
        
        {/* Settings Button - Added Sheet component from shadcn/ui */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex items-center justify-center">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-white overflow-y-auto" side="right">
            <SheetHeader>
              <SheetTitle>Game Settings</SheetTitle>
              <SheetDescription>
                Customize your flashcard game
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 py-4">
              {/* Word Limit Input */}
              <div className="space-y-2">
                <Label>Word Limit</Label>
                <Input
                  type="number"
                  value={wordLimit}
                  onChange={(e) => setWordLimit(Math.max(1, Math.min(Number(e.target.value), words.length)))}
                  className="w-full"
                  placeholder="Enter number of words"
                />
              </div>

              {/* Shuffle Button */}
              <Button onClick={shuffleWords} className="w-full">
                Shuffle Words
              </Button>
            </div>
            
            <div className="space-y-6 py-4">
              {/* Data Source Selector */}
              {dataSources.length > 0 && (
                <div className="space-y-2">
                  <Label>Data Source</Label>
                  <Select 
                    value={selectedDataSource || ""}
                    onValueChange={handleDataSourceChange}
                  >
                    <SelectTrigger className="w-full">
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
              
              {/* Word Group Selector */}
              {selectedDataSource && Object.keys(wordGroups).length > 0 && (
                <div className="space-y-2">
                  <Label>Word Group</Label>
                  <Select 
                    value={selectedWordGroup || ""}
                    onValueChange={handleWordGroupChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select word group" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(wordGroups).map(group => (
                        <SelectItem key={group} value={group}>
                          {group}
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
      
      {/* Loading State or Error */}
      {isLoading && (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading vocabulary...</span>
        </div>
      )}
      
      {loadError && (
        <Alert variant="destructive" className="mx-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      )}
      
      {words.length > 0 ? (
        <>
          <Flashcard word={words[currentWordIndex]} currentLanguage={currentLanguage} />
          <div className="flex justify-between">
            <Button onClick={goToPreviousWord} disabled={currentWordIndex === 0}>
              Previous
            </Button>
            {/* Shuffle Button */}
            <Button onClick={shuffleWords}>
              Shuffle Words
            </Button>

            <Button onClick={goToNextWord} disabled={currentWordIndex === words.length - 1}>
              Next
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center mt-4">
          {selectedWordGroup ? (
            <p>No words available in this group.</p>
          ) : (
            <p>Select a language and data source to start.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default FlashcardGame;
