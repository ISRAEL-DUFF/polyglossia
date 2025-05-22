"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  RefreshCw, 
  Play, 
  BarChart, 
  Redo, 
  Save,
  Globe,
  AlertCircle,
  Settings,
  BookOpen,
  GroupIcon,
  Camera,
  SaveIcon,
  ForwardIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { loadDataSources, loadVocabularyData, WordGroups } from "@/lib/utils/vocabLoader";
import { localDatabase } from '@/lib/utils/storageUtil';
import { colorGenerator, getRandomWords, eventEmitter, fisherYateShuffle } from '@/lib/utils/gameUtils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import './MatchingGame.css'

// Types
interface Word {
  word: string;
  meanings: string[];
  meaning?: string;
  partOfSpeech?: string;
  root?: string;
  transliteration?: string; // For Hebrew
  inflection?: string; // For Latin
  semanticGroup?: string; // For Latin
  frequency?: number;
  id?: string;
}

interface MatchingItem {
  text: string;
  value: string;
  word: Word;
  isMeaning: boolean;
}

interface DataSource {
  key: string;
  value: string;
}

// Demo Player State interface
interface DemoPlayerState {
  isPlaying: boolean;
  speedInSec: number;
  repeat: number;
  timer1?: any;
  timer2?: any;
}

interface SaveWordProps {
  currentWord: Word | null; // Pass the current word as a prop
  currentLanguage: string;
}

// Mock word data for different languages as fallback
const demoWords: Record<string, Word[]> = {
  greek: [
    { word: "λόγος", meanings: ["word", "reason", "account"], partOfSpeech: "noun" },
    { word: "γράφω", meanings: ["I write", "I record"], partOfSpeech: "verb" },
    { word: "δίκαιος", meanings: ["righteous", "just", "fair"], partOfSpeech: "adjective" },
    { word: "θεός", meanings: ["god", "deity"], partOfSpeech: "noun" },
    { word: "ἀγάπη", meanings: ["love", "charity"], partOfSpeech: "noun" },
    { word: "ἔργον", meanings: ["work", "deed", "action"], partOfSpeech: "noun" }
  ],
  hebrew: [
    { word: "אֱלֹהִים", meanings: ["God", "gods"], partOfSpeech: "noun", transliteration: "Elohim" },
    { word: "בְּרֵאשִׁית", meanings: ["in the beginning"], partOfSpeech: "noun", transliteration: "B'reshit" },
    { word: "תּוֹרָה", meanings: ["instruction", "law"], partOfSpeech: "noun", transliteration: "Torah" },
    { word: "שָׁלוֹם", meanings: ["peace", "completeness"], partOfSpeech: "noun", transliteration: "Shalom" },
    { word: "אָהַב", meanings: ["to love"], partOfSpeech: "verb", transliteration: "Ahav" },
    { word: "קֹדֶשׁ", meanings: ["holiness", "sacred"], partOfSpeech: "noun", transliteration: "Kodesh" }
  ],
  latin: [
    { word: "amor", meanings: ["love"], partOfSpeech: "noun", inflection: "amoris" },
    { word: "pax", meanings: ["peace"], partOfSpeech: "noun", inflection: "pacis" },
    { word: "vita", meanings: ["life"], partOfSpeech: "noun", inflection: "vitae" },
    { word: "deus", meanings: ["god"], partOfSpeech: "noun", inflection: "dei" },
    { word: "homo", meanings: ["human", "man"], partOfSpeech: "noun", inflection: "hominis" },
    { word: "virtus", meanings: ["virtue", "courage"], partOfSpeech: "noun", inflection: "virtutis" }
  ]
};

function localDatabases(currentLanguage: string) {
  let database = localDatabase(`${currentLanguage}_difficult_words`)
  let databaseSnapshot = localDatabase(`${currentLanguage}_snapshots`)
  let savedWords = `${currentLanguage}_difficult_words`; // TODO: change for each language

  return {
    difficultWordsDb: database,
    databaseSnapshot,
    savedWords
  }
}

const DEFAULT_WORD_COUNT_DESKTOP = 10;
const DEFAULT_WORD_COUNT_MOBILE = 6;


const SaveDifficultWord: React.FC<SaveWordProps> = ({ currentWord, currentLanguage }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasId, setHasId] = useState(currentWord?.id ? true : false);
  const { toast } = useToast();

  const handleSaveWord = async () => {
    try {
      if (!currentWord) {
        throw new Error('No word selected to save.');
      }

      // Simulate saving the word (replace this with actual save logic)
      // await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate async save

      const { difficultWordsDb } = localDatabases(currentLanguage);
      if (hasId) {
        // Remove the word from the database
        difficultWordsDb.remove(currentWord.id);
        toast({
          title: 'Word Removed',
          description: `The word "${currentWord.word}" has been removed from your saved words.`,
          variant: 'destructive',
        });
      } else {
        // Add the word to the database
        difficultWordsDb.add({
          ...currentWord,
          id: currentWord.word // Use the word as the ID
        });
        toast({
          title: 'Word Saved',
          description: `The word "${currentWord.word}" has been saved successfully.`,
          variant: 'default',
        });
      }
      // Update the state to reflect the change

      // Close the modal
      setIsModalOpen(false);
    } catch (error) {
      // Show error toast
      toast({
        title: 'Error',
        description: error.message || 'Failed to save the word.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      {/* Save Button */}
      {/* <Button  variant="default" className="flex items-center px-1 py-1">
        <SaveIcon className="h-4 w-4 mr-1" onClick={() => setIsModalOpen(true)}/>
      </Button> */}
      <SaveIcon className="h-4 w-4 mr-1 float-right" onClick={() => setIsModalOpen(true)}/>


      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{ hasId ? "Remove Word" : "Save Word"}</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <p>{hasId ? "Do you want to delete the current word?" : "Do you want to save the current word?"}</p>
            {currentWord && (
              <p className="mt-2 text-sm text-gray-500">
                Word: <strong>{currentWord.word}</strong>
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSaveWord} variant={hasId ? "destructive" : "default"}>
              {hasId ? "Delete" : "Save"}
            </Button>
            <Button onClick={() => setIsModalOpen(false)} variant="outline">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const MatchingGame = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [words, setWords] = useState<Word[]>([]);
  const [pairs, setPairs] = useState<MatchingItem[]>([]);
  const [tempWordData, setTempWordData] = useState<MatchingItem | null>(null);
  const [selectedPair, setSelectedPair] = useState<HTMLDivElement[]>([]);
  const [wordCount, setWordCount] = useState(isMobile ? DEFAULT_WORD_COUNT_MOBILE : DEFAULT_WORD_COUNT_DESKTOP);
  const [matchCounts, setMatchCounts] = useState(0);
  const [colorMap, setColorMap] = useState<Record<string, string>>({});
  const [showPopup, setShowPopup] = useState(false);
  const [snapshots, setSnapshots] = useState<{id?: string, name: string, data: Word[]}[]>([]);
  const [snapshotName, setSnapshotName] = useState('');
  const [currentSnapshot, setCurrentSnapshot] = useState<{id?: string, name: string, data: Word[]} | null>(null);
  const [isSnapshot, setIsSnapshot] = useState(false);
  const [matchingList, setMatchingList] = useState('difficult_words');
  const [currentLanguage, setCurrentLanguage] = useState<string>("greek");
  const [wordGroups, setWordGroups] = useState<WordGroups>({});
  const [selectedWordGroup, setSelectedWordGroup] = useState<string | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<string | null>(null);
  const [demoPlayerState, setDemoPlayerState] = useState<DemoPlayerState>({
    isPlaying: false,
    speedInSec: 6,
    repeat: 2
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);

  
  // Countdown modal state
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdownValue, setCountdownValue] = useState(3);
  const [countdownText, setCountdownText] = useState("");

const handleSettingsSheetOpenChange = (open: boolean) => {
  if (open && demoPlayerState.isPlaying) {
    // Code to run before the Sheet opens
    console.log("Sheet is about to open and demo is ongoing...");
    // Add any logic here, e.g., fetching data or setting state
    return;
  }
  setIsSettingsSheetOpen(open); // Update the state
};
  
  // Colors for matching cards
  const availableColors = [
    "#45B39D", "#227bc4", "#8d0b96", "#f48fb1", 
    "#ffab91", "#b39ddb", "#64b5f6", "#ff8a65", 
    "#ba68c8", "#d1058d", "#4db6ac"
  ];
  const nextCardColor = colorGenerator(availableColors);

  const getDefaultWordCount = () => {
    if (isMobile) {
      return DEFAULT_WORD_COUNT_MOBILE
    } else {
      return DEFAULT_WORD_COUNT_DESKTOP
    }
  }

  // Display matching list names
  const displayMatchingListName = () => {
    if(matchingList === 'difficult_words') {
      return "New Words"
    }

    if(matchingList === 'word_groups') {
      for(const key in dataSources) {
        if(dataSources[key].value === selectedDataSource) {
          const sourceName = dataSources[key].key;
          return `${sourceName} - ${selectedWordGroup}`
        }
      }
    }

    if(matchingList === 'snapshots') {
      return currentSnapshot ? `Snapshot - ${currentSnapshot.name}` : ""
    }
  }
  
  // Sound effects using Web Audio API
  const audioContext = useRef<AudioContext | null>(null);
  
  useEffect(() => {
    // Initialize audio context
    audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Load saved snapshots from localStorage
    loadSnapshots();
    
    // Load demo words based on current language
    const initialWords = demoWords[currentLanguage] || [];
    setWords(initialWords);
    
    // Generate initial matching game
    generateMatchingGame(initialWords);
    
    // Load data sources for the current language
    loadVocabDataSources(currentLanguage);
    
    // Setup event listeners for countdown
    eventEmitter.on('countdown:start', () => {
      console.log('Countdown started');
    });
    
    eventEmitter.on('countdown:end', () => {
      console.log('Countdown ended');
    });
    
    return () => {
      // Cleanup
      if (audioContext.current && audioContext.current.state !== 'closed') {
        audioContext.current.close();
      }
      
      // Cleanup event listeners
      eventEmitter.off('countdown:start');
      eventEmitter.off('countdown:end');
      
      // Clear any running timers
      if (demoPlayerState.timer1) clearInterval(demoPlayerState.timer1);
      if (demoPlayerState.timer2) clearTimeout(demoPlayerState.timer2);
    };
  }, []);
  
  // Effect to update the game when language changes
  useEffect(() => {
    // Load words for the selected language
    const languageWords = demoWords[currentLanguage] || [];
    setWords(languageWords);
    
    // Reset game state
    setSelectedPair([]);
    setMatchCounts(0);
    setColorMap({});
    clearFlashcard();
    
    // Reset selected data source and word group
    setSelectedDataSource(null);
    setSelectedWordGroup(null);
    setWordGroups({});
    
    // Load data sources for the new language
    loadVocabDataSources(currentLanguage);
    
    // Generate new matching game
    generateMatchingGame(languageWords);
  }, [currentLanguage]);
  
  // Effect to update the game when word count changes
  useEffect(() => {
    generateMatchingGame(words);
  }, [wordCount]);

  // Effect to update the game when words change
  useEffect(() => {
    generateMatchingGame(words);
  }, [words]);

  // Effect to update wordCount based on screen size
  useEffect(() => {
    setWordCount(getDefaultWordCount());
  }, [isMobile]);

  useEffect(() => {
    if (matchingList === 'difficult_words') {
      const { difficultWordsDb } = localDatabases(currentLanguage);
      const savedWords = difficultWordsDb.getAll();
      if (savedWords) {
        setWords(savedWords);
        generateMatchingGame(savedWords);
      }
    } else if (matchingList === 'snapshots') {
      // Load saved snapshots
      if(currentSnapshot) {
        const snapshotWords = getRandomWords(currentSnapshot.data, wordCount)
        setWords(snapshotWords);
        generateMatchingGame(snapshotWords);
      } else {
        // setWords([]);
        // setPairs([]);
        // setSelectedPair([]);
        // setMatchCounts(0);
        // setColorMap({});
        // clearFlashcard();

        loadSnapshots();
        if (snapshots.length > 0) {
          const firstSnapshot = snapshots[0];
          setCurrentSnapshot(firstSnapshot);
          setIsSnapshot(true);
          generateMatchingGame(getRandomWords(firstSnapshot.data, wordCount));
        }
      }
    } else if(matchingList === 'word_groups') {
      // Load words from the selected word group
      if (selectedWordGroup && wordGroups[selectedWordGroup]) {
        const groupWords = getRandomWords(wordGroups[selectedWordGroup], wordCount);
        setWords(groupWords);
        generateMatchingGame(groupWords);
      } else {
        setWords([]);
        setPairs([]);
        setSelectedPair([]);
        setMatchCounts(0);
        setColorMap({});
        clearFlashcard();
        setLoadError(`No words found in the selected word group`);
      }
    }
  }, [matchingList]);
  
  const loadVocabDataSources = async (language: string) => {
    setIsLoading(true);
    setLoadError(null);
    
    try {
      const sources = await loadDataSources(language);
      console.log("sources:", sources)
      setDataSources(sources);
      
      if (sources.length > 0) {
        // Auto-select the first data source
        setSelectedDataSource(sources[0].value);
        await loadVocabData(language, sources[0].value);
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
      console.log('Loaded data:', data);
      setWordGroups(data);
      
      // Auto-select the first word group
      const groupKeys = Object.keys(data);
      if (groupKeys.length > 0) {
        const firstGroup = groupKeys[0];
        setSelectedWordGroup(firstGroup);
        
        // Load words from the first group
        const groupWords = getRandomWords(data[firstGroup], wordCount) // data[firstGroup].slice(0, wordCount);
        setWords(groupWords);
        generateMatchingGame(groupWords);
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
  
  const loadSnapshots = () => {
    const { databaseSnapshot } = localDatabases(currentLanguage);
    const savedSnapshots = databaseSnapshot.getAll();
    // console.log('savedSnapshots:', savedSnapshots);
    
    if (savedSnapshots) {
      try {
        setSnapshots(savedSnapshots);
      } catch (e) {
        console.error('Error loading snapshots:', e);
        setSnapshots([]);
      }
    } else {
      setSnapshots([]);
    }
  };

  // Countdown modal function
  const startCountdown = (options: { countDownTime?: number, displayText?: string }) => {
    const { countDownTime = 3, displayText = "" } = options;
    
    setCountdownText(displayText);
    setCountdownValue(countDownTime);
    setShowCountdown(true);
    
    eventEmitter.emit('countdown:start');
    
    let timeLeft = countDownTime;
    const countdownInterval = setInterval(() => {
      timeLeft--;
      setCountdownValue(timeLeft);
      
      if (timeLeft < 0) {
        clearInterval(countdownInterval);
        setShowCountdown(false);
        eventEmitter.emit('countdown:end');
      }
    }, 1000);
  };

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    
    // Reset game state
    setSelectedPair([]);
    setMatchCounts(0);
    setColorMap({});
    setIsSnapshot(false);
    setCurrentSnapshot(null);
    
    // Load saved snapshots for this language
    const snapshotKey = `${language}_snapshots`;
    const savedSnapshots = localStorage.getItem(snapshotKey);
    if (savedSnapshots) {
      try {
        setSnapshots(JSON.parse(savedSnapshots));
      } catch (e) {
        console.error('Error loading snapshots:', e);
        setSnapshots([]);
      }
    } else {
      setSnapshots([]);
    }
    
    toast({
      title: "Language Changed",
      description: `Switched to ${language.charAt(0).toUpperCase() + language.slice(1)} vocabulary`,
    });
  };
  
  const saveSnapshot = () => {
    if (!snapshotName) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a snapshot name",
      });
      return;
    }
    
    // Create new snapshot
    const newSnapshot = {
      name: snapshotName,
      data: [...words]
    };
    
    // Set as current snapshot
    setCurrentSnapshot(newSnapshot);
    setIsSnapshot(true);
    
    // Save to localStorage
    const { databaseSnapshot } = localDatabases(currentLanguage);
    databaseSnapshot.add(newSnapshot);
    const updatedSnapshots = databaseSnapshot.getAll();
    setSnapshots(updatedSnapshots);
    
    // Clear input
    setSnapshotName('');
    
    toast({
      title: "Snapshot Saved",
      description: `Saved "${snapshotName}" with ${words.length} words`,
    });
  };
  
  const deleteSnapshot = () => {
    if (!currentSnapshot) return;
    
    // Remove from snapshots list
    const { databaseSnapshot } = localDatabases(currentLanguage);
    const updatedSnapshots = databaseSnapshot.remove(currentSnapshot.id);
    setSnapshots(updatedSnapshots);
    
    // Clear current snapshot
    setCurrentSnapshot(null);
    setIsSnapshot(false);
    
    // Reset to default words
    const languageWords = demoWords[currentLanguage] || [];
    setWords(languageWords);
    generateMatchingGame(languageWords);
    
    toast({
      title: "Snapshot Deleted",
      description: `Deleted "${currentSnapshot.name}" snapshot`,
    });
  };
  
  const handleDataSourceChange = async (source: string) => {
    setSelectedDataSource(source);
    
    try {
      await loadVocabData(currentLanguage, source);
      
      toast({
        title: "Data Source Changed",
        description: `Loaded vocabulary from ${dataSources.find(ds => ds.value === source)?.key || source}`,
      });
    } catch (error) {
      console.error('Error changing data source:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load vocabulary data`,
      });
    }
  };
  
  const handleWordGroupChange = (group: string) => { 
    setSelectedWordGroup(group);
    
    if (wordGroups[group]) {
      const groupWords = getRandomWords(wordGroups[group], wordCount) //wordGroups[group].slice(0, wordCount);
      setWords(groupWords);
      generateMatchingGame(groupWords);
      
      toast({
        title: "Word Group Selected",
        description: `Loaded "${group}" word group`,
      });
    }
  };
  
  const getWordMeaning = (entry: Word) => {
    const maxLength = isMobile ? 25 : 40;
    if (entry.meanings && entry.meanings.length > 0) {
      const randomMeaning = entry.meanings[Math.floor(Math.random() * entry.meanings.length)];
      return randomMeaning.length > maxLength ? randomMeaning.slice(0, maxLength) + "..." : randomMeaning;
    } else if (entry.meaning) {
      return entry.meaning.length > maxLength ? entry.meaning.slice(0, maxLength) + "..." : entry.meaning;
    }
    return '';
  };

  const generateMatchingGame = (wordList: Word[]) => {
    // Reset state
    setSelectedPair([]);
    setMatchCounts(0);
    setColorMap({});
    clearFlashcard();
    
    // Create shuffled pairs
    let shuffledWords = wordList.slice(0, wordCount);
    
    // Create the pairs (word + meaning)
    let newPairs: MatchingItem[] = [];
    shuffledWords.forEach(word => {
      newPairs.push({ text: word.word, value: word.word, word, isMeaning: false });
      newPairs.push({ text: getWordMeaning(word), value: word.word, word, isMeaning: true });
    });
    
    // Shuffle the pairs
    newPairs.sort(() => Math.random() - 0.5);
    
    setPairs(newPairs);
  };

  // Play sound based on type
  const playSound = (type: 'right' | 'wrong' | 'end') => {
    if (!audioContext.current) return;
    
    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    
    switch (type) {
      case 'right':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(660, audioContext.current.currentTime);
        gainNode.gain.setValueAtTime(0.5, audioContext.current.currentTime);
        oscillator.start();
        oscillator.stop(audioContext.current.currentTime + 0.2);
        break;
      case 'wrong':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(220, audioContext.current.currentTime);
        gainNode.gain.setValueAtTime(0.3, audioContext.current.currentTime);
        oscillator.start();
        oscillator.stop(audioContext.current.currentTime + 0.3);
        break;
      case 'end':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.current.currentTime);
        gainNode.gain.setValueAtTime(0.5, audioContext.current.currentTime);
        oscillator.start();
        
        // Create a small melody
        oscillator.frequency.setValueAtTime(880, audioContext.current.currentTime);
        oscillator.frequency.setValueAtTime(990, audioContext.current.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(1100, audioContext.current.currentTime + 0.4);
        
        oscillator.stop(audioContext.current.currentTime + 0.6);
        break;
    }
  };

  const selectMatch = (element: HTMLDivElement, wordData: MatchingItem) => {
    // If clicking the same item, deselect it
    if (selectedPair.length === 1 && selectedPair[0] === element) {
      element.classList.remove("selected");
      setSelectedPair([]);
      return;
    }

    if(selectedPair.length === 0) {
      setTempWordData(wordData);
    }
    
    // If we have less than 2 items selected
    if (selectedPair.length < 2) {
      element.classList.add("selected");
      
      const newSelectedPair = [...selectedPair, element];
      setSelectedPair(newSelectedPair);
      
      // Show flashcard for the selected item
      showFlashcard({
        type: wordData.isMeaning ? 'meaning' : 'word',
        word: wordData.word,
        color: 'white'
      });
      
      // If we now have 2 items selected
      if (newSelectedPair.length === 2) {
        const [first, second] = newSelectedPair;
        
        // Check if they match
        if (first.dataset.value === second.dataset.value) {
          playSound('right');
          
          const newMatchCount = matchCounts + 1;
          setMatchCounts(newMatchCount);
          
          let newColorMap = { ...colorMap };
          let assignedColor = newColorMap[first.dataset.value!];
          
          if (!assignedColor) {
            // Assign a color from our palette 
            assignedColor = nextCardColor() // availableColors[matchCounts % availableColors.length];
            newColorMap[first.dataset.value!] = assignedColor;
            setColorMap(newColorMap);
          }
          
          first.classList.add("matched");
          second.classList.add("matched");
          
          first.style.backgroundColor = assignedColor;
          first.style.borderColor = assignedColor;
          second.style.backgroundColor = assignedColor;
          second.style.borderColor = assignedColor;
          
          showFlashcard({
            type: 'all',
            word: wordData.word,
            color: assignedColor
          });
          
          if (newMatchCount === Math.min(wordCount, words.length)) {
            // Game over - all words matched
            playSound('end');
            toast({
              title: "Great job!",
              description: `You matched all ${Math.min(wordCount, words.length)} word pairs!`
            });
          }
        } else {
          // No match
          playSound('wrong');
          
          first.classList.add("unmatch-item");
          second.classList.add("unmatch-item");
          
          // Remove classes after animation
          setTimeout(() => {
            first.classList.remove("selected", "unmatch-item");
            second.classList.remove("selected", "unmatch-item");
            clearFlashcard();
            setSelectedPair([]);
            setTempWordData(null);
          }, 500);
        }
        
        // Reset selection after handling match/no match
        if (first.dataset.value === second.dataset.value) {
          setSelectedPair([]);
        }
      }
    }
  };
  
  const showFlashcard = ({ type, word, color }: { type: string, word: Word, color: string }) => {
    const flashcardContainer = document.getElementById("flashcard-container");
    if (!flashcardContainer) return;
    
    let meaning = '';
    let defaultMeaningColor = 'blue';
    
    if (word.meaning) {
      meaning = word.meaning;
    } else if (word.meanings && word.meanings.length > 0) {
      meaning = word.meanings.join(' | ');
    }

    // Different content based on language and type
    let content = '';
    
    if (currentLanguage === 'greek') {
      switch (type) {
        case 'all':
          content = `
            <div class="flashcard-animation show">
              <p class="text-blue-400 font-bold text-xl mb-2 bib-lit-text greek-size">${word.word}</p>
              <p class="text-amber-500">${word.root ? "root: " + word.root : ''}</p>
              <p class="p-2 rounded-md font-bold text-white" style="background-color: ${color}">${meaning}</p>
            </div>
          `;
          break;
        case 'meaning':
          content = `
            <div class="flashcard-animation show">
              <!-- <h4 class="text-xl font-semibold" style="color: ${color}">${meaning}</h4> -->
              <h4 class="text-l font-semibold" style="color: ${defaultMeaningColor}">${meaning}</h4>
            </div>
          `;
          break;
        case 'word':
          content = `
            <div class="flashcard-animation show">
              <p class="text-blue-400 font-bold text-xl mb-2 bib-lit-text greek-size">${word.word}</p>
              <p class="text-amber-500 bib-lit-text">${word.root ? "root: " + word.root : ''}</p>
              <p class="text-blue-400">${word.partOfSpeech ? "Part of Speech: " + word.partOfSpeech : ''}</p>
            </div>
          `;
          break;
      }
    } else if (currentLanguage === 'hebrew') {
      switch (type) {
        case 'all':
          content = `
            <div class="flashcard-animation show">
              <p class="text-blue-400 font-bold text-xl mb-2 bib-lit-text hebrew hebrew-size">${word.word}</p>
              <p class="text-amber-500">${word.transliteration ? "(" + word.transliteration + ")" : ''}</p>
              <p class="p-2 rounded-md font-bold text-white" style="background-color: ${color}">${meaning}</p>
              <p class="text-blue-400">${word.partOfSpeech || ''}</p>
            </div>
          `;
          break;
        case 'meaning':
          content = `
            <div class="flashcard-animation show">
              <h4 class="text-l font-semibold" style="color: ${defaultMeaningColor}">${meaning}</h4>
            </div>
          `;
          break;
        case 'word':
          content = `
            <div class="flashcard-animation show">
              <p class="text-blue-400 font-bold mb-2 bib-lit-text hebrew hebrew-size">${word.word}</p>
              <p class="text-amber-500">${word.transliteration ? "(" + word.transliteration + ")" : ''}</p>
              <p class="text-blue-400">${word.partOfSpeech ? "Part of Speech: " + word.partOfSpeech : ''}</p>
            </div>
          `;
          break;
      }
    } else if (currentLanguage === 'latin') {
      switch (type) {
        case 'all':
          content = `
            <div class="flashcard-animation show">
              <p class="text-blue-400 font-bold text-xl mb-2 bib-lit-text">${word.word} | ${word.inflection || ''}</p>
              <p class="p-2 rounded-md font-bold text-white" style="background-color: ${color}">${meaning}</p>
              <p class="text-blue-400">${word.partOfSpeech || ''}</p>
              <p class="text-amber-500">${word.semanticGroup ? "Semantic Group: " + word.semanticGroup : ''}</p>
            </div>
          `;
          break;
        case 'meaning':
          content = `
            <div class="flashcard-animation show">
              <h4 class="text-l font-semibold" style="color: ${defaultMeaningColor}">${meaning}</h4>
            </div>
          `;
          break;
        case 'word':
          content = `
            <div class="flashcard-animation show">
              <p class="text-blue-400 font-bold text-xl mb-2 bib-lit-text">${word.word}</p>
              <p class="text-amber-500">${word.inflection ? "Inflection: " + word.inflection : ''}</p>
              <p class="text-blue-400">${word.partOfSpeech ? "Part of Speech: " + word.partOfSpeech : ''}</p>
              <p class="text-amber-500">${word.semanticGroup ? "Semantic Group: " + word.semanticGroup : ''}</p>
            </div>
          `;
          break;
      }
    }
    
    flashcardContainer.innerHTML = content;
  };
  
  const clearFlashcard = () => {
    const flashcardContainer = document.getElementById("flashcard-container");
    if (flashcardContainer) {
      flashcardContainer.innerHTML = `
        <p>Select a word to match</p>
      `;
    }
  };
  
  // Helper function to clear the animated flashcard (for demo mode)
  const clearAnimatedFlashcard = () => {
    clearFlashcard();
  };
  
  const resetGame = () => {
    generateMatchingGame(words);
    
    // Reset UI elements by removing all classes and styles from match items
    const matchItems = document.querySelectorAll('.match-item');
    matchItems.forEach(item => {
      const element = item as HTMLElement;
      element.classList.remove('selected', 'matched', 'unmatch-item');
      element.style.backgroundColor = '';
      element.style.borderColor = '';
    });
    
    // Reset color map
    setColorMap({});
    
    clearFlashcard();
  };
  
  const shuffleGame = () => {
    if (matchingList === 'snapshots' && currentSnapshot) {
      setWords(getRandomWords(currentSnapshot.data, wordCount));
    } else if(matchingList === 'word_groups' && selectedWordGroup && wordGroups[selectedWordGroup]) {
      const groupWords = getRandomWords(wordGroups[selectedWordGroup], wordCount);
      setWords(groupWords);
    } else if(matchingList === 'difficult_words') {
      const { difficultWordsDb } = localDatabases(currentLanguage);
      const savedWords = difficultWordsDb.getAll();
      if (savedWords) {
        setWords(savedWords);
      }
    } else {
      const shuffledWords = words.slice(0, wordCount);
    }

    resetGame();
  };
  
  // Enhanced demo play implementation
  const playDemo = () => {
    // If already playing, stop the demo
    if (demoPlayerState.isPlaying) {
      // Stop the demo
      if (demoPlayerState.timer1) clearInterval(demoPlayerState.timer1);
      if (demoPlayerState.timer2) clearTimeout(demoPlayerState.timer2);
      
      setDemoPlayerState({
        ...demoPlayerState,
        isPlaying: false
      });
      resetGame();
      return;
    }
    
    // Start the demo
    const words = document.getElementsByClassName('lword');
    const meanings = document.getElementsByClassName('lmeaning');
    
    // Create wordMeaningList and wordList
    let wordMeaningList: Record<string, any> = {};
    let wordList: any[] = [];
    
    Array.from(words).forEach((w) => {
      const element = w as HTMLElement;
      wordMeaningList[element.dataset.value!] = {
        wordDiv: element,
        word: element.dataset.value
      };
    });
    
    Array.from(meanings).forEach((m) => {
      const element = m as HTMLElement;
      const w = wordMeaningList[element.dataset.value!];
      if (w) {
        w.meaningDiv = element;
        w.meaning = element.textContent;
        wordList.push(w);
      }
    });
    
    // Shuffle the word list
    fisherYateShuffle(wordList);
    
    // Helper function to reset rhythm
    function resetRhythm(divElement: HTMLElement) {
      divElement.classList.remove("matched");
      divElement.classList.remove("selected");
      divElement.style.backgroundColor = '';
      divElement.style.borderColor = '';
    }
    
    // Helper function to reset demo
    function resetDemo() {
      wordList.forEach((w) => {
        resetRhythm(w.wordDiv);
        resetRhythm(w.meaningDiv);
      });
      clearAnimatedFlashcard();
      setColorMap({});
    }
    
    // Helper function to end demo
    function endDemo(quit = false) {
      if (demoPlayerState.timer1) clearInterval(demoPlayerState.timer1);
      if (demoPlayerState.timer2) clearTimeout(demoPlayerState.timer2);
      resetDemo();
      setMatchCounts(0);
      setSelectedPair([]);
      
      if (quit) {
        setDemoPlayerState((state) => ({
          ...state,
          isPlaying: false
        }));
      }
    }
    
    // Set demo as playing
    setDemoPlayerState((state) => ({
      ...state,
      isPlaying: true
    }));
    
    toast({
      title: "Demo Mode",
      description: "Watch how the matching game works!"
    });
    
    // Demo player function
    function demoPlayer(wordList: any[], repeat = 2) {
      let i = 0;
      let meaningChoosed = true;
      
      eventEmitter.once('countdown:start', () => {
        meaningChoosed = false;
      });
      
      eventEmitter.once('countdown:end', () => {
        meaningChoosed = true;
      });
      
      demoPlayerState.timer1 = setInterval(() => {
        if (!meaningChoosed) {
          return;
        }
        
        if (i < wordList.length && repeat > 0) {
          const item = wordList[i];
          item.wordDiv.click();
          meaningChoosed = false;
          
          demoPlayerState.timer2 = setTimeout(() => {
            item.meaningDiv.click();
            i += 1;
            meaningChoosed = true;
          }, demoPlayerState.speedInSec * 1000);
        } else if (repeat > 0) {
          i = 0;
          repeat -= 1;
          resetDemo();
          
          if (repeat > 0) {
            eventEmitter.once('countdown:start', () => {
              meaningChoosed = false;
            });
            eventEmitter.once('countdown:end', () => {
              meaningChoosed = true;
            });
            startCountdown({
              countDownTime: Math.floor(demoPlayerState.speedInSec) - 1,
              displayText: `Ready for next ...`
            });
          } else {
            endDemo(true);
          }
        } else {
          endDemo(true);
        }
      }, demoPlayerState.speedInSec * 1000);
      
      startCountdown({
        countDownTime: Math.floor(demoPlayerState.speedInSec) - 1,
        displayText: `Demo in ...`
      });
    }
    
    demoPlayer(wordList, demoPlayerState.repeat);
  };


  return (
    <div className="matching-game">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">{currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1)} Matching Game</CardTitle>
            <div className="flex items-center space-x-2">
              <Sheet open={isSettingsSheetOpen} onOpenChange={handleSettingsSheetOpenChange}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Settings
                  </Button>
                </SheetTrigger>
                <SheetContent className="overflow-y-auto max-h-screen">
                  <SheetHeader>
                    <SheetTitle>Game Settings</SheetTitle>
                    <SheetDescription>
                      Customize your matching game experience
                    </SheetDescription>
                  </SheetHeader>
                  
                  <div className="py-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="language-select">Language</Label>
                      <Select onValueChange={handleLanguageChange} defaultValue={currentLanguage}>
                        <SelectTrigger id="language-select">
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="greek">Greek</SelectItem>
                          <SelectItem value="hebrew">Hebrew</SelectItem>
                          <SelectItem value="latin">Latin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="word-count">Word Pairs</Label>
                      <Select 
                        onValueChange={(value) => setWordCount(Number(value))} 
                        defaultValue={String(wordCount)}
                      >
                        <SelectTrigger id="word-count">
                          <SelectValue placeholder="Select number of word pairs" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4">4 pairs</SelectItem>
                          <SelectItem value="5">5 pairs</SelectItem>
                          <SelectItem value="6">6 pairs</SelectItem>
                          <SelectItem value="7">7 pairs</SelectItem>
                          <SelectItem value="8">8 pairs</SelectItem>
                          <SelectItem value="9">9 pairs</SelectItem>
                          <SelectItem value="10">10 pairs</SelectItem>
                          <SelectItem value="12">12 pairs (challenging)</SelectItem>
                          <SelectItem value="15">15 pairs (challenging)</SelectItem>
                          <SelectItem value="12">20 pairs (challenging)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="vocab-source">Vocabulary Source</Label>
                      <Select 
                        onValueChange={handleDataSourceChange} 
                        value={selectedDataSource || undefined}
                        disabled={dataSources.length === 0 || isLoading}
                      >
                        <SelectTrigger id="vocab-source">
                          <SelectValue placeholder={isLoading ? "Loading..." : "Select vocabulary source"} />
                        </SelectTrigger>
                        <SelectContent>
                          {dataSources.map(source => (
                            <SelectItem key={source.value} value={source.value}>{source.key}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="word-group">Word Group</Label>
                      <Select 
                        onValueChange={handleWordGroupChange} 
                        value={selectedWordGroup || undefined}
                        disabled={Object.keys(wordGroups).length === 0 || isLoading}
                      >
                        <SelectTrigger id="word-group">
                          <SelectValue placeholder={isLoading ? "Loading..." : "Select word group"} />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(wordGroups).map(group => (
                            <SelectItem key={group} value={group}>{group}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="snapshot-name">Save Current Set</Label>
                      <div className="flex space-x-2">
                        <Input 
                          id="snapshot-name" 
                          placeholder="Enter name for snapshot" 
                          value={snapshotName} 
                          onChange={(e) => setSnapshotName(e.target.value)} 
                        />
                        <Button onClick={saveSnapshot} disabled={!snapshotName}>
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="saved-snapshots">Saved Sets</Label>
                      <Select 
                        onValueChange={(id) => {
                          const snapshot = snapshots.find(s => s.id === id);
                          if (snapshot) {
                            setCurrentSnapshot(snapshot);
                            setIsSnapshot(true);
                            setWords(snapshot.data);
                            generateMatchingGame(snapshot.data);
                          }
                        }}
                        value={currentSnapshot?.id}
                      >
                        <SelectTrigger id="saved-snapshots">
                          <SelectValue placeholder="Select a saved set" />
                        </SelectTrigger>
                        <SelectContent>
                          {snapshots.map(snapshot => (
                            <SelectItem key={snapshot.id} value={snapshot.id || ''}>{snapshot.name} ({snapshot.data.length} words)</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {isSnapshot && currentSnapshot && (
                      <Button variant="destructive" onClick={deleteSnapshot}>
                        Delete Current Set
                      </Button>
                    )}
                    
                    {loadError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{loadError}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
          <CardDescription>
            Match each word with its correct meaning by clicking on pairs.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Flashcard */}
            <div className="w-full md:w-1/3 p-4 border rounded-md bg-gray-50">
              <div className="text-center mb-2 font-medium">Flashcard</div>
              <div id="flashcard-container" className="min-h-28 flex items-center justify-center text-center p-4">
                <p>Select a word to match</p>
              </div>
              <div className="text-xs text-gray-500 text-center mt-4">
                Matched: {matchCounts} / {Math.min(wordCount, words.length)}
              </div>

              {/* Display active word list */}
              <div className="text-xs text-gray-500 text-left">
                <div>
                  {( displayMatchingListName() )}
                  {demoPlayerState.isPlaying && (
                    <Badge variant="secondary">Demo Mode</Badge>
                  )}
                </div>
                <div>
                  {
                    (tempWordData && tempWordData.word) ? (
                      <SaveDifficultWord currentLanguage={currentLanguage} currentWord={tempWordData?.word}/>
                    ) : (
                      <div></div>
                    )
                  }
                </div>
              </div>
            </div>

            {/* Matching Game Area */}
            <div className="flex-1">
              <div className="flex justify-between mb-4">
                <div>
                <Badge
                  variant={matchingList === 'difficult_words' ? 'default' : 'outline'}
                  className={`mr-2 cursor-pointer ${matchingList === 'difficult_words' ? 'bg-blue-500 text-white' : ''}`}
                  onClick={() => setMatchingList('difficult_words')}
                >
                  {"Inview"}
                  <BookOpen className="h-3 w-3 ml-1" />
                </Badge>
                  {demoPlayerState.isPlaying && (
                    <Badge variant="secondary">Demo Mode</Badge>
                  )}
                </div>
                <div>
                  <Badge variant={matchingList === 'snapshots' ? 'default' : 'outline'} className={`mr-2 cursor-pointer ${matchingList === 'snapshots' ? 'bg-blue-500 text-white' : ''}`} onClick = {() => setMatchingList('snapshots')}>
                    {"Snapshots"}
                    <Camera className="h-3 w-3 ml-1" />
                  </Badge>
                  {demoPlayerState.isPlaying && (
                    <Badge variant="secondary">Demo Mode</Badge>
                  )}
                </div>
                <div>
                  <Badge variant={matchingList === 'word_groups' ? 'default' : 'outline'} className={`mr-2 cursor-pointer ${matchingList === 'word_groups' ? 'bg-blue-500 text-white' : ''}`} onClick = {() => setMatchingList('word_groups')}>
                    {"Groups"}
                    <GroupIcon className="h-3 w-3 ml-1" />
                  </Badge>
                  {demoPlayerState.isPlaying && (
                    <Badge variant="secondary">Demo Mode</Badge>
                  )}
                </div>
              </div>
              
              {/* Game grid */}
              <div className={`grid gap-2 ${isMobile ? 'grid-cols-2' : 'grid-cols-4'}`}>
                {pairs.map((item, index) => (
                  <div 
                    key={index}
                    className={`match-item p-2 border-2 rounded-md flex items-center justify-center text-center 
                      transition-all cursor-pointer hover:bg-gray-50 min-h-16
                      ${item.isMeaning ? 'lmeaning' : 'lword'} ${currentLanguage === 'greek' && !item.isMeaning ? 'bib-lit-text' : ''} ${currentLanguage === 'hebrew' && !item.isMeaning? 'bib-lit-text hebrew' : ''} ${currentLanguage === 'latin' && !item.isMeaning? 'bib-lit-text' : ''}`}
                    onClick={(e) => selectMatch(e.currentTarget, item)}
                    data-value={item.value}
                  >
                    {item.text}
                  </div>
                ))}
              </div>

              <div className="flex justify-between mb-4 mt-2">
                <div className="space-x-1">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if(!demoPlayerState.isPlaying) resetGame()
                    }}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Restart
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if(!demoPlayerState.isPlaying) shuffleGame()
                    }}
                  >
                    <ForwardIcon className="h-3 w-3 " />
                    Next
                  </Button>
                  <Button 
                    variant={demoPlayerState.isPlaying ? "destructive" : "outline"}
                    size="sm"
                    onClick={playDemo}
                  >
                    <Play className="h-3 w-3" />
                    {demoPlayerState.isPlaying ? "Stop Demo" : "Demo"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Countdown Modal */}
      <Dialog open={showCountdown} onOpenChange={setShowCountdown}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">{countdownText}</DialogTitle>
            <DialogDescription className="text-center text-5xl font-bold">{countdownValue}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MatchingGame;
