
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  RefreshCw, 
  Play, 
  Redo, 
  Save,
  Settings,
  BookOpen,
  Camera,
  SaveIcon,
  ForwardIcon,
  X,
  PlusCircle,
  Trash2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { loadDataSources, loadVocabularyData, type WordGroups } from "@/lib/utils/vocabLoader";
import { localDatabase } from '@/lib/utils/storageUtil';
import { colorGenerator, getRandomWords, eventEmitter, fisherYateShuffle } from '@/lib/utils/gameUtils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import './MatchingGame.css';
import { cn } from '@/lib/utils';

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
  id?: string; // UUID for localDB
  savedId?: string; // ID if saved in difficult words
}

interface MatchingItem {
  text: string;
  value: string;
  word: Word;
  isMeaning: boolean;
  id: string;
}

interface DataSource {
  key: string;
  value: string;
}

interface DemoPlayerState {
  isPlaying: boolean;
  speedInSec: number;
  repeat: number;
  timer1?: NodeJS.Timeout;
  timer2?: NodeJS.Timeout;
}

interface SaveWordProps {
  currentWord: Word | null;
  currentLanguage: string;
  onWordSavedOrRemoved: () => void;
}

const demoWords: Record<string, Word[]> = {
  greek: [
    { word: "λόγος", meanings: ["word", "reason", "account"], partOfSpeech: "noun", id: "demo_logos" },
    { word: "γράφω", meanings: ["I write", "I record"], partOfSpeech: "verb", id: "demo_grapho" },
    { word: "δίκαιος", meanings: ["righteous", "just", "fair"], partOfSpeech: "adjective", id: "demo_dikaios" },
    { word: "θεός", meanings: ["god", "deity"], partOfSpeech: "noun", id: "demo_theos" },
    { word: "ἀγάπη", meanings: ["love", "charity"], partOfSpeech: "noun", id: "demo_agape" },
    { word: "ἔργον", meanings: ["work", "deed", "action"], partOfSpeech: "noun", id: "demo_ergon" }
  ],
  hebrew: [
    { word: "אֱלֹהִים", meanings: ["God", "gods"], partOfSpeech: "noun", transliteration: "Elohim", id: "demo_elohim" },
    { word: "בְּרֵאשִׁית", meanings: ["in the beginning"], partOfSpeech: "noun", transliteration: "B'reshit", id: "demo_bereshit" },
    { word: "תּוֹרָה", meanings: ["instruction", "law"], partOfSpeech: "noun", transliteration: "Torah", id: "demo_torah" },
    { word: "שָׁלוֹם", meanings: ["peace", "completeness"], partOfSpeech: "noun", transliteration: "Shalom", id: "demo_shalom" },
    { word: "אָהַב", meanings: ["to love"], partOfSpeech: "verb", transliteration: "Ahav", id: "demo_ahav" },
    { word: "קֹדֶשׁ", meanings: ["holiness", "sacred"], partOfSpeech: "noun", transliteration: "Kodesh", id: "demo_kodesh" }
  ],
  latin: [
    { word: "amor", meanings: ["love"], partOfSpeech: "noun", inflection: "amoris", id: "demo_amor" },
    { word: "pax", meanings: ["peace"], partOfSpeech: "noun", inflection: "pacis", id: "demo_pax" },
    { word: "vita", meanings: ["life"], partOfSpeech: "noun", inflection: "vitae", id: "demo_vita" },
    { word: "deus", meanings: ["god"], partOfSpeech: "noun", inflection: "dei", id: "demo_deus" },
    { word: "homo", meanings: ["human", "man"], partOfSpeech: "noun", inflection: "hominis", id: "demo_homo" },
    { word: "virtus", meanings: ["virtue", "courage"], partOfSpeech: "noun", inflection: "virtutis", id: "demo_virtus" }
  ]
};

function getLocalDatabases(currentLanguage: string) {
  return {
    difficultWordsDb: localDatabase(`${currentLanguage}_difficult_words`),
    snapshotsDb: localDatabase(`${currentLanguage}_snapshots`),
  };
}

const DEFAULT_WORD_COUNT_DESKTOP = 10;
const DEFAULT_WORD_COUNT_MOBILE = 5;

const SaveDifficultWord: React.FC<SaveWordProps> = ({ currentWord, currentLanguage, onWordSavedOrRemoved }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const { difficultWordsDb } = getLocalDatabases(currentLanguage);

  const isWordSaved = currentWord?.savedId && difficultWordsDb.getAll().some(w => w.id === currentWord.savedId);

  const handleSaveToggle = async () => {
    if (!currentWord) {
      toast({ title: 'Error', description: 'No word selected.', variant: 'destructive' });
      return;
    }

    try {
      if (isWordSaved) {
        difficultWordsDb.remove(currentWord.savedId!);
        toast({ title: 'Word Removed', description: `"${currentWord.word}" removed from your saved words.` });
      } else {
        difficultWordsDb.add({ ...currentWord, id: undefined, savedId: undefined }); 
        toast({ title: 'Word Saved', description: `"${currentWord.word}" saved successfully.` });
      }
      onWordSavedOrRemoved(); 
      setIsModalOpen(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Operation failed.', variant: 'destructive' });
    }
  };

  if (!currentWord) return null;

  return (
    <>
      <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => setIsModalOpen(true)}>
        {isWordSaved ? <Trash2 className="h-4 w-4" /> : <SaveIcon className="h-4 w-4" />}
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isWordSaved ? "Remove Word" : "Save Word"}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            {isWordSaved ? `Remove "${currentWord.word}" from your difficult words list?` : `Save "${currentWord.word}" to your difficult words list?`}
          </DialogDescription>
          <DialogFooter>
            <Button onClick={handleSaveToggle} variant={isWordSaved ? "destructive" : "default"}>
              {isWordSaved ? "Remove" : "Save"}
            </Button>
            <Button onClick={() => setIsModalOpen(false)} variant="outline">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const MatchingGame = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [gameWords, setGameWords] = useState<Word[]>([]);
  const [pairs, setPairs] = useState<MatchingItem[]>([]);
  const [tempWordData, setTempWordData] = useState<MatchingItem | null>(null);
  const [selectedPairElements, setSelectedPairElements] = useState<HTMLDivElement[]>([]);
  const [wordCount, setWordCount] = useState(isMobile ? DEFAULT_WORD_COUNT_MOBILE : DEFAULT_WORD_COUNT_DESKTOP);
  const [matchCounts, setMatchCounts] = useState(0);
  const [colorMap, setColorMap] = useState<Record<string, string>>({});
  
  const [snapshots, setSnapshots] = useState<{id: string, name: string, data: Word[]}[]>([]);
  const [snapshotName, setSnapshotName] = useState('');
  const [currentSnapshotId, setCurrentSnapshotId] = useState<string | null>(null);

  const [activeListType, setActiveListType] = useState<'inview' | 'snapshots' | 'groups' | 'difficult_words'>('inview');
  
  const [currentLanguage, setCurrentLanguage] = useState<string>("greek");
  const [wordGroups, setWordGroups] = useState<WordGroups>({});
  const [selectedWordGroup, setSelectedWordGroup] = useState<string | null>(null);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedDataSource, setSelectedDataSource] = useState<string | null>(null);
  
  const [demoPlayerState, setDemoPlayerState] = useState<DemoPlayerState>({
    isPlaying: false, speedInSec: 4, repeat: 1, timer1: undefined, timer2: undefined
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);

  const [showCountdownModalState, setShowCountdownModalState] = useState(false);
  const [countdownValueState, setCountdownValueState] = useState(3);
  const [countdownTextState, setCountdownTextState] = useState("");


  const audioContextRef = useRef<AudioContext | null>(null);
  const availableColors = ["#45B39D", "#227bc4", "#8d0b96", "#f48fb1", "#ffab91", "#b39ddb", "#64b5f6", "#ff8a65", "#ba68c8", "#d1058d", "#4db6ac"];
  const nextCardColorRef = useRef(colorGenerator(availableColors));


  const getDefaultWordCount = useCallback(() => {
    return isMobile ? DEFAULT_WORD_COUNT_MOBILE : DEFAULT_WORD_COUNT_DESKTOP;
  }, [isMobile]);

  const clearFlashcard = useCallback(() => {
    const flashcardContainer = document.getElementById("flashcard-container");
    if (flashcardContainer) {
      flashcardContainer.innerHTML = `<p class="text-muted-foreground">Select a word to match</p>`;
    }
    setTempWordData(null);
  }, []);

  const getWordMeaning = useCallback((entry: Word) => {
    const maxLength = isMobile ? 20 : 35;
    const meaning = (entry.meanings && entry.meanings.length > 0) ? entry.meanings[0] : entry.meaning || '';
    return meaning.length > maxLength ? meaning.slice(0, maxLength) + "..." : meaning;
  },[isMobile]);

  const generatePairs = useCallback((wordListToPair: Word[]) => {
    if (!wordListToPair || wordListToPair.length === 0) {
        setPairs([]);
        return;
    }
    let newPairs: MatchingItem[] = [];
    wordListToPair.forEach(word => {
        const wordId = word.id || word.word; 
        newPairs.push({ text: word.word, value: wordId, word, isMeaning: false, id: `${wordId}-word` });
        newPairs.push({ text: getWordMeaning(word), value: wordId, word, isMeaning: true, id: `${wordId}-meaning` });
    });
    fisherYateShuffle(newPairs);
    setPairs(newPairs);
  }, [getWordMeaning]);


  const resetGame = useCallback((wordsToProcess: Word[]) => {
    setSelectedPairElements([]);
    setMatchCounts(0);
    setColorMap({});
    clearFlashcard();
    nextCardColorRef.current = colorGenerator(availableColors);

    const matchedElements = document.querySelectorAll('.match-item.matched');
    matchedElements.forEach(el => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.backgroundColor = '';
      htmlEl.style.borderColor = '';
      htmlEl.style.color = '';
      htmlEl.classList.remove('matched');
      htmlEl.classList.remove('selected'); 
    });
    
    if (wordsToProcess && wordsToProcess.length > 0) {
        const wordsForGame = getRandomWords(wordsToProcess, wordCount);
        setGameWords(wordsForGame); 
        generatePairs(wordsForGame);
    } else {
        setGameWords([]);
        setPairs([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordCount, generatePairs, clearFlashcard]);


  const loadVocabDataSources = useCallback(async (language: string) => {
    setIsLoading(true); setLoadError(null);
    try {
      const sources = await loadDataSources(language);
      setDataSources(sources);
      if (sources.length > 0) {
        // Don't auto-select, let user choose or useEffect handle based on selections
      } else {
        setLoadError(`No vocabulary files found for ${language}.`);
        setWordGroups({}); setSelectedWordGroup(null); setSelectedDataSource(null);
      }
    } catch (error) {
      setLoadError(`Failed to load vocabulary data sources for ${language}.`);
    } finally { setIsLoading(false); }
  }, []);

  const loadVocabData = useCallback(async (language: string, filename: string) => {
    setIsLoading(true); setLoadError(null);
    try {
      const data = await loadVocabularyData(language, filename);
      setWordGroups(data);
      const groupKeys = Object.keys(data);
      if (groupKeys.length === 0) {
        setLoadError(`No word groups found in ${filename}.`);
        setSelectedWordGroup(null);
      }
      // Do not auto-select group here, let user or other logic handle it.
      setSelectedWordGroup(groupKeys[0]) // TODO: remove --- do not set if you wish
    } catch (error) {
      setLoadError(`Failed to load vocabulary data from ${filename}.`);
    } finally { setIsLoading(false); }
  }, []);

  const loadSnapshots = useCallback(() => {
    const { snapshotsDb } = getLocalDatabases(currentLanguage);
    const savedSnapshots = snapshotsDb.getAll() as {id: string, name: string, data: Word[]}[];
    setSnapshots(savedSnapshots || []);
  }, [currentLanguage]);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    initializeCountdownModalSetters(setShowCountdownModalState, setCountdownValueState, setCountdownTextState);
    
    eventEmitter.on('countdown:start', () => {});
    eventEmitter.on('countdown:end', () => {});

    const saveLang = localStorage.getItem('game_language');
    if(saveLang) {
      setCurrentLanguage(saveLang);
    }
    
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      eventEmitter.off('countdown:start');
      eventEmitter.off('countdown:end');
      if (demoPlayerState.timer1) clearInterval(demoPlayerState.timer1);
      if (demoPlayerState.timer2) clearTimeout(demoPlayerState.timer2);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => { 
    loadVocabDataSources(currentLanguage);
    loadSnapshots();
    setWordGroups({}); 
    setSelectedWordGroup(null); 
    setSelectedDataSource(null);
    setCurrentSnapshotId(null);
    setActiveListType('inview'); 
    // Initial game load happens in the next useEffect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLanguage]);


  useEffect(() => {
    let listToUseForGame: Word[] = [];

    if (activeListType === 'inview') {
        listToUseForGame = demoWords[currentLanguage] || [];
    } else if (activeListType === 'snapshots' && currentSnapshotId) {
        const snapshot = snapshots.find(s => s.id === currentSnapshotId);
        if (snapshot) listToUseForGame = snapshot.data;
    } else if (activeListType === 'groups' && selectedWordGroup && wordGroups[selectedWordGroup]) {
        listToUseForGame = wordGroups[selectedWordGroup];
    } else if (activeListType === 'difficult_words') {
        const { difficultWordsDb } = getLocalDatabases(currentLanguage);
        listToUseForGame = difficultWordsDb.getAll();
    }
    
    resetGame(listToUseForGame);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordCount, activeListType, currentSnapshotId, selectedWordGroup, snapshots, wordGroups, currentLanguage]);


  useEffect(() => { 
    setWordCount(getDefaultWordCount());
  }, [isMobile, getDefaultWordCount]);

  const refreshSavedWordsStatus = () => {
    const { difficultWordsDb } = getLocalDatabases(currentLanguage);
    const savedDifficultWords = difficultWordsDb.getAll();
    
    setGameWords(prevGameWords => prevGameWords.map(gw => {
        const savedVersion = savedDifficultWords.find(sw => sw.word === gw.word && sw.meanings.join(',') === gw.meanings.join(','));
        return { ...gw, savedId: savedVersion?.id };
    }));

    setPairs(prevPairs => prevPairs.map(p => {
        const savedVersion = savedDifficultWords.find(sw => sw.word === p.word.word && sw.meanings.join(',') === p.word.meanings.join(','));
        return { ...p, word: { ...p.word, savedId: savedVersion?.id }};
    }));

    if (tempWordData) {
        const savedVersion = savedDifficultWords.find(sw => sw.word === tempWordData.word.word && sw.meanings.join(',') === tempWordData.word.meanings.join(','));
        setTempWordData(prev => prev ? ({ ...prev, word: {...prev.word, savedId: savedVersion?.id }}) : null);
    }
  };

  const playSound = (type: 'right' | 'wrong' | 'end') => {
    if (!audioContextRef.current) return;
    const oscillator = audioContextRef.current.createOscillator();
    const gainNode = audioContextRef.current.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContextRef.current.destination);
    gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);

    switch (type) {
      case 'right':
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(660, audioContextRef.current.currentTime);
        break;
      case 'wrong':
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(220, audioContextRef.current.currentTime);
        break;
      case 'end':
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(880, audioContextRef.current.currentTime);
        oscillator.frequency.linearRampToValueAtTime(1100, audioContextRef.current.currentTime + 0.2);
        oscillator.frequency.linearRampToValueAtTime(1320, audioContextRef.current.currentTime + 0.4);
        break;
    }
    oscillator.start();
    oscillator.stop(audioContextRef.current.currentTime + (type === 'end' ? 0.6 : 0.2));
  };


  const showFlashcard = useCallback(({ type, word, color }: { type: string, word: Word, color: string }) => {
    const flashcardContainer = document.getElementById("flashcard-container");
    if (!flashcardContainer) return;

    let meaningText = (word.meanings && word.meanings.length > 0) ? word.meanings.join(' | ') : word.meaning || 'N/A';
    let displayWord = word.word;
    let details = '';

    if (currentLanguage === 'greek') {
        details = `<p class="text-xs text-muted-foreground">${word.root ? `Root: ${word.root}` : ''} ${word.partOfSpeech ? `(${word.partOfSpeech})` : ''}</p>`;
        displayWord = `<p class="font-bold text-xl mb-1 bib-lit-text greek-size text-primary">${word.word}</p>`;
    } else if (currentLanguage === 'hebrew') {
        details = `<p class="text-xs text-muted-foreground">${word.transliteration ? `(${word.transliteration})` : ''} ${word.partOfSpeech ? `(${word.partOfSpeech})` : ''}</p>`;
        displayWord = `<p class="font-bold text-xl mb-1 bib-lit-text hebrew hebrew-size text-primary">${word.word}</p>`;
    } else if (currentLanguage === 'latin') {
        details = `<p class="text-xs text-muted-foreground">${word.inflection ? `Inflection: ${word.inflection}` : ''} ${word.partOfSpeech ? `(${word.partOfSpeech})` : ''} ${word.semanticGroup ? `Group: ${word.semanticGroup}` : ''}</p>`;
        displayWord = `<p class="font-bold text-xl mb-1 bib-lit-text text-primary">${word.word}</p>`;
    }

    let content = '';
    switch (type) {
      case 'all':
        content = `<div class="flashcard-animation show">${displayWord}<p class="p-2 rounded-md font-semibold text-white" style="background-color: ${color}">${meaningText}</p>${details}</div>`;
        break;
      case 'meaning':
        content = `<div class="flashcard-animation show"><h4 class="text-lg font-semibold text-accent">${meaningText}</h4></div>`;
        break;
      case 'word':
        content = `<div class="flashcard-animation show">${displayWord}${details}</div>`;
        break;
    }
    flashcardContainer.innerHTML = content;
  }, [currentLanguage]);

  const selectMatch = useCallback((element: HTMLDivElement, itemData: MatchingItem) => {
    if (element.classList.contains("matched")) return;

    if (selectedPairElements.length === 1 && selectedPairElements[0] === element) {
      element.classList.remove("selected");
      setSelectedPairElements([]);
      clearFlashcard();
      return;
    }

    element.classList.add("selected");
    const newSelectedPair = [...selectedPairElements, element];
    setSelectedPairElements(newSelectedPair);
    
    if (newSelectedPair.length === 1) {
        setTempWordData(itemData); 
        showFlashcard({ type: itemData.isMeaning ? 'meaning' : 'word', word: itemData.word, color: 'hsl(var(--accent))' });
    }

    if (newSelectedPair.length === 2) {
      const [firstEl, secondEl] = newSelectedPair;
      const firstData = pairs.find(p => p.id === firstEl.dataset.id);
      const secondData = pairs.find(p => p.id === secondEl.dataset.id);

      if (firstData && secondData && firstData.value === secondData.value) {
        playSound('right');
        const newMatchCount = matchCounts + 1;
        setMatchCounts(newMatchCount);

        let newColorMap = { ...colorMap };
        let assignedColor = newColorMap[firstData.value!] || nextCardColorRef.current();
        newColorMap[firstData.value!] = assignedColor;
        setColorMap(newColorMap);

        [firstEl, secondEl].forEach(el => {
          el.classList.add("matched");
          el.classList.remove("selected");
          el.style.backgroundColor = assignedColor;
          el.style.borderColor = assignedColor;
          el.style.color = 'white'; 
        });
        
        showFlashcard({ type: 'all', word: firstData.word, color: assignedColor });
        setSelectedPairElements([]);

        if (newMatchCount === Math.min(wordCount, gameWords.length)) {
          playSound('end');
          toast({ title: "Great job!", description: `You matched all ${newMatchCount} pairs!` });
        }
      } else {
        playSound('wrong');
        [firstEl, secondEl].forEach(el => el.classList.add("unmatch-item"));
        setTimeout(() => {
          [firstEl, secondEl].forEach(el => el.classList.remove("selected", "unmatch-item"));
          setSelectedPairElements([]);
          clearFlashcard();
        }, 600);
      }
    }
  }, [selectedPairElements, pairs, matchCounts, colorMap, wordCount, gameWords.length, showFlashcard, clearFlashcard, toast]);

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
    localStorage.setItem('game_language', language);
    toast({ title: "Language Changed", description: `Switched to ${language}` });
  };

  const handleWordCountChange = (value: string) => {
    setWordCount(Number(value));
  };
  
  const handleDataSourceChange = async (sourceValue: string) => {
    setSelectedDataSource(sourceValue);
    setSelectedWordGroup(null); // Reset word group when source changes
    if (sourceValue) {
      await loadVocabData(currentLanguage, sourceValue); 
    } else {
      setWordGroups({}); // Clear groups if no source is selected
    }
    const source = dataSources.find(ds => ds.value === sourceValue);
    toast({ title: "Data Source Changed", description: `Loaded vocabulary from ${source?.key || sourceValue}` });
  };

  const handleWordGroupChange = (groupKey: string) => {
    setSelectedWordGroup(groupKey);
    if (groupKey && wordGroups[groupKey]) {
      setActiveListType('groups');
      toast({ title: "Word Group Selected", description: `Loaded "${groupKey}"` });
    } else if (!groupKey) {
        // If "Select group" is chosen, potentially revert to demo or clear words
        setActiveListType('inview'); // Or another default
    }
  };

  const saveSnapshot = () => {
    if (!snapshotName.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a snapshot name" });
      return;
    }
    const { snapshotsDb } = getLocalDatabases(currentLanguage);
    // Filter out demo words if they are currently in gameWords and we are in 'inview' mode
    const wordsToSave = activeListType === 'inview' 
        ? gameWords.filter(gw => !demoWords[currentLanguage]?.some(dw => dw.id === gw.id)) 
        : [...gameWords];

    if (wordsToSave.length === 0) {
        toast({ variant: "destructive", title: "Error", description: "No custom words to save in this set." });
        return;
    }

    const newSnapshot = { name: snapshotName, data: wordsToSave }; 
    const saved = snapshotsDb.add(newSnapshot) as {id: string, name: string, data: Word[]};
    
    setSnapshots(prev => [...prev, saved]);
    setCurrentSnapshotId(saved.id);
    setActiveListType('snapshots');
    setSnapshotName('');
    toast({ title: "Snapshot Saved", description: `Saved "${newSnapshot.name}"` });
  };

  const deleteCurrentSnapshot = () => {
    if (!currentSnapshotId) return;
    const { snapshotsDb } = getLocalDatabases(currentLanguage);
    const oldSnapshotName = snapshots.find(s => s.id === currentSnapshotId)?.name;
    snapshotsDb.remove(currentSnapshotId);
    const updatedSnapshots = snapshots.filter(s => s.id !== currentSnapshotId);
    setSnapshots(updatedSnapshots);
    setCurrentSnapshotId(null);
    setActiveListType('inview'); 
    toast({ title: "Snapshot Deleted", description: `Deleted "${oldSnapshotName}"` });
  };

  const handleStartGameMobile = () => {
    if (isMobile) {
      setIsGameModalOpen(true);
    }
  };

  const displayActiveListName = () => {
    if (activeListType === 'inview') return "Demo Words";
    if (activeListType === 'difficult_words') return "Your Saved Words";
    if (activeListType === 'snapshots' && currentSnapshotId) {
      return `Set: ${snapshots.find(s => s.id === currentSnapshotId)?.name || 'Unnamed Set'}`;
    }
    if (activeListType === 'groups' && selectedDataSource && selectedWordGroup) {
      const sourceName = dataSources.find(ds => ds.value === selectedDataSource)?.key || 'Source';
      return `${sourceName} - ${selectedWordGroup}`;
    }
    return "Select a list";
  };

  const playDemo = () => {
    if (demoPlayerState.isPlaying) {
      if (demoPlayerState.timer1) clearInterval(demoPlayerState.timer1);
      if (demoPlayerState.timer2) clearTimeout(demoPlayerState.timer2);
      setDemoPlayerState(prev => ({ ...prev, isPlaying: false }));
      resetGame(gameWords); 
      return;
    }

    const wordElements = Array.from(document.querySelectorAll('.lword')) as HTMLElement[];
    const meaningElements = Array.from(document.querySelectorAll('.lmeaning')) as HTMLElement[];
    
    if (wordElements.length === 0 || meaningElements.length === 0) {
        toast({title: "Demo Error", description: "No game elements found to demonstrate.", variant: "destructive"});
        return;
    }

    let wordMeaningList: { wordDiv: HTMLElement, meaningDiv: HTMLElement, wordItem: MatchingItem }[] = [];

    wordElements.forEach(wEl => {
        const wordItem = pairs.find(p => p.id === wEl.dataset.id);
        if (wordItem) {
            const correspondingMeaningEl = meaningElements.find(mEl => {
                const meaningItem = pairs.find(p => p.id === mEl.dataset.id);
                return meaningItem && meaningItem.value === wordItem.value && meaningItem.isMeaning;
            });
            if (correspondingMeaningEl) {
                wordMeaningList.push({ wordDiv: wEl, meaningDiv: correspondingMeaningEl, wordItem });
            }
        }
    });
    
    if (wordMeaningList.length === 0) {
      toast({ title: "Demo Error", description: "Could not pair words and meanings for demo.", variant: "destructive" });
      return;
    }

    fisherYateShuffle(wordMeaningList);
    resetGame(gameWords); 

    setDemoPlayerState(prev => ({ ...prev, isPlaying: true }));
    toast({ title: "Demo Mode", description: "Watch how the game works!" });

    let i = 0;
    let repeatCount = demoPlayerState.repeat;

    const performNextDemoStep = () => {
        if (i < wordMeaningList.length) {
            const item = wordMeaningList[i];
            item.wordDiv.click(); 

            const timer2 = setTimeout(() => {
                item.meaningDiv.click(); 
                i++;
                if (demoPlayerState.isPlaying) { 
                    performNextDemoStep(); 
                }
            }, demoPlayerState.speedInSec * 1000 / 2);
            setDemoPlayerState(prev => ({ ...prev, timer2 }));

        } else if (repeatCount > 1) {
            i = 0;
            repeatCount--;
            resetGame(gameWords); 
            if (demoPlayerState.isPlaying) {
                performNextDemoStep();
            }
        } else {
            if (demoPlayerState.timer1) clearInterval(demoPlayerState.timer1);
            if (demoPlayerState.timer2) clearTimeout(demoPlayerState.timer2);
            setDemoPlayerState(prev => ({ ...prev, isPlaying: false, timer1: undefined, timer2: undefined }));
            resetGame(gameWords); 
        }
    };
    
    const timer1 = setTimeout(performNextDemoStep, demoPlayerState.speedInSec * 1000 / 2);
    setDemoPlayerState(prev => ({ ...prev, timer1 }));
  };

  const shuffleWordsInSettings = () => {
    let currentFullList: Word[] = [];
    let newIndex;

    switch (activeListType) {
        case 'snapshots':
            if (snapshots.length === 0) {
                toast({ title: "No Sets", description: "No saved sets available.", variant: "default" });
                return;
            }
            const currentIndexSnap = snapshots.findIndex(s => s.id === currentSnapshotId);
            newIndex = (currentIndexSnap + 1) % snapshots.length;
            setCurrentSnapshotId(snapshots[newIndex].id);
            toast({ title: "Next Set Loaded", description: `Loaded set: ${snapshots[newIndex].name}`});
            // The main useEffect will handle resetGame
            return; 

        case 'groups':
            const groupKeys = Object.keys(wordGroups);
            if (groupKeys.length === 0 || !selectedWordGroup) {
                 toast({ title: "No Groups", description: "No word groups available or selected.", variant: "default" });
                return;
            }
            const currentIndexGroup = groupKeys.indexOf(selectedWordGroup);
            newIndex = (currentIndexGroup + 1) % groupKeys.length;
            setSelectedWordGroup(groupKeys[newIndex]);
            toast({ title: "Next Group Loaded", description: `Loaded group: ${groupKeys[newIndex]}`});
            // The main useEffect will handle resetGame
            return;

        case 'difficult_words':
            const { difficultWordsDb } = getLocalDatabases(currentLanguage);
            currentFullList = difficultWordsDb.getAll();
            if (currentFullList.length <= wordCount) {
                toast({ title: "Not Enough Words", description: "Not enough saved words for a new distinct set.", variant: "default"});
                // Still shuffle what's there
            }
            break;
            
        case 'inview':
        default:
            currentFullList = demoWords[currentLanguage] || [];
            break;
    }
    resetGame(currentFullList);
  };

  const handleNextSet = () => {
    let sourceList: Word[] = [];
    switch (activeListType) {
        case 'snapshots':
            if (currentSnapshotId) {
                const snapshot = snapshots.find(s => s.id === currentSnapshotId);
                sourceList = snapshot ? snapshot.data : [];
            }
            break;
        case 'groups':
            if (selectedWordGroup && wordGroups[selectedWordGroup]) {
                sourceList = wordGroups[selectedWordGroup];
            }
            break;
        case 'difficult_words':
            const { difficultWordsDb } = getLocalDatabases(currentLanguage);
            sourceList = difficultWordsDb.getAll();
            break;
        case 'inview':
        default:
            sourceList = demoWords[currentLanguage] || [];
            break;
    }
    if (sourceList.length === 0) {
        toast({ title: "No Words", description: "No words in the current list to shuffle.", variant: "destructive"});
        return;
    }
    resetGame(sourceList);
    toast({ title: "Words Shuffled", description: "A new set of words has been selected."});
  };


  const renderGameContent = (isMobileModal = false) => (
    <div className={`flex ${isMobileModal ? 'flex-col h-full' : 'flex-col md:flex-row'} gap-4`}>
        <Card className={isMobileModal ? 'mb-2' : 'w-full md:w-1/3'}>
          <CardHeader className="p-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base">Flashcard</CardTitle>
              {gameWords.length > 0 && tempWordData?.word && (
                 <SaveDifficultWord 
                    currentLanguage={currentLanguage} 
                    currentWord={tempWordData.word}
                    onWordSavedOrRemoved={refreshSavedWordsStatus}
                 />
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Matched: {matchCounts} / {Math.min(wordCount, gameWords.length)}
              {demoPlayerState.isPlaying && (
                <Badge variant="secondary" className="ml-2">Demo</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent id="flashcard-container" className="min-h-20 md:min-h-28 flex items-center justify-center text-center p-2 md:p-3">
            <p className="text-muted-foreground">Select a word to match</p>
          </CardContent>
        </Card>

        <div className={isMobileModal ? 'flex-grow flex flex-col' : 'flex-1'}>
          <div className={`grid gap-2 ${isMobile || isMobileModal ? 'grid-cols-2' : 'grid-cols-4'} ${isMobileModal ? 'flex-grow' : ''}`}>
            {pairs.map((item) => (
              <div 
                key={item.id}
                className={cn(
                  "match-item p-2 border-2 rounded-md flex items-center justify-center text-center",
                  "transition-all cursor-pointer hover:bg-muted/80 min-h-16 text-sm",
                  item.isMeaning ? 'lmeaning' : 'lword',
                  currentLanguage === 'greek' && !item.isMeaning && 'bib-lit-text',
                  currentLanguage === 'hebrew' && !item.isMeaning && 'bib-lit-text hebrew',
                  currentLanguage === 'latin' && !item.isMeaning && 'bib-lit-text'
                )}
                onClick={(e) => selectMatch(e.currentTarget as HTMLDivElement, item)}
                data-value={item.value}
                data-id={item.id}
              >
                {item.text}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
            <Button variant="outline" size="sm" onClick={() => !demoPlayerState.isPlaying && resetGame(gameWords)}>
              <RefreshCw className="h-4 w-4 mr-1" /> Restart
            </Button>
            <Button variant="outline" size="sm" onClick={() => !demoPlayerState.isPlaying && handleNextSet()}> 
              <ForwardIcon className="h-4 w-4 mr-1" /> Next Set
            </Button>
            <Button onClick={shuffleWordsInSettings} className="w-full" variant="outline">
              <ForwardIcon className="mr-2 h-4 w-4" /> Next Word Group
            </Button>
          </div>
        </div>
      </div>
  );

  return (
    <div className="space-y-6 p-1 md:p-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex-grow">
                <CardTitle className="text-xl md:text-2xl">
                {currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1)} Matching Game
                </CardTitle>
                <CardDescription>
                Match words with meanings. Active: <span className="font-semibold text-primary">{displayActiveListName()}</span>
                </CardDescription>
            </div>
            <Sheet open={isSettingsSheetOpen} onOpenChange={setIsSettingsSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-1" /> Settings
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto max-h-screen w-full sm:max-w-sm">
                <SheetHeader>
                  <SheetTitle>Game Settings</SheetTitle>
                  <SheetDescription>Customize your matching game.</SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="language-select">Language</Label>
                    <Select onValueChange={handleLanguageChange} defaultValue={currentLanguage}>
                      <SelectTrigger id="language-select"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="greek">Greek</SelectItem>
                        <SelectItem value="hebrew">Hebrew</SelectItem>
                        <SelectItem value="latin">Latin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="word-count">Word Pairs ({isMobile ? "Mobile Max " + DEFAULT_WORD_COUNT_MOBILE : "Desktop Max " + DEFAULT_WORD_COUNT_DESKTOP})</Label>
                    <Select onValueChange={handleWordCountChange} defaultValue={String(wordCount)}>
                      <SelectTrigger id="word-count"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[4,5,6,7,8,9,10,12,15,20].map(num => (
                            <SelectItem key={num} value={String(num)} disabled={num > (isMobile ? DEFAULT_WORD_COUNT_MOBILE : DEFAULT_WORD_COUNT_DESKTOP) && activeListType !== 'snapshots' && gameWords.length < num}>
                                {num} pairs {num > (isMobile ? DEFAULT_WORD_COUNT_MOBILE : DEFAULT_WORD_COUNT_DESKTOP) && activeListType !== 'snapshots' && gameWords.length < num ? "(Desktop Large Set)" : ""}
                            </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                   <Button onClick={shuffleWordsInSettings} className="w-full" variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" /> Shuffle & Get New Words
                    </Button>

                  <div className="space-y-2">
                    <Label htmlFor="vocab-source">Vocabulary Source (for Groups)</Label>
                    <Select onValueChange={handleDataSourceChange} value={selectedDataSource || ""} disabled={dataSources.length === 0 || isLoading}>
                      <SelectTrigger id="vocab-source">
                        <SelectValue placeholder={isLoading ? "Loading..." : "Select source"} />
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
                    <Select onValueChange={handleWordGroupChange} value={selectedWordGroup || ""} disabled={Object.keys(wordGroups).length === 0 || isLoading || !selectedDataSource}>
                      <SelectTrigger id="word-group">
                        <SelectValue placeholder={isLoading ? "Loading..." : "Select group"} />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(wordGroups).map(group => (
                          <SelectItem key={group} value={group}>{group} ({wordGroups[group]?.length || 0} words)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Card className="p-4 space-y-3 bg-muted/50">
                    <Label className="text-base font-semibold">Saved Word Sets (Snapshots)</Label>
                    <div className="space-y-2">
                      <Label htmlFor="snapshot-name">Save Current Game Words as Set</Label>
                      <div className="flex space-x-2">
                        <Input id="snapshot-name" placeholder="Enter set name" value={snapshotName} onChange={(e) => setSnapshotName(e.target.value)} />
                        <Button onClick={saveSnapshot} disabled={!snapshotName.trim() || gameWords.length === 0} size="icon"><Save className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="saved-snapshots">Load a Saved Set</Label>
                       <Select 
                        onValueChange={(id) => {
                          setCurrentSnapshotId(id);
                          setActiveListType('snapshots');
                          const snapshot = snapshots.find(s => s.id === id);
                          if (snapshot) {
                            setWordCount(snapshot.data.length); 
                          }
                        }} 
                        value={currentSnapshotId || ""}
                        disabled={snapshots.length === 0}
                       >
                        <SelectTrigger id="saved-snapshots"><SelectValue placeholder="Select a set" /></SelectTrigger>
                        <SelectContent>
                          {snapshots.map(s => <SelectItem key={s.id} value={s.id}>{s.name} ({s.data.length} words)</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {currentSnapshotId && (
                      <Button variant="destructive" onClick={deleteCurrentSnapshot} className="w-full">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Selected Set
                      </Button>
                    )}
                  </Card>

                  {loadError && (
                    <Alert variant="destructive">
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{loadError}</AlertDescription>
                    </Alert>
                  )}
                </div>
                 <Button onClick={() => setIsSettingsSheetOpen(false)} className="w-full mt-4">Apply Settings & Close</Button>
              </SheetContent>
            </Sheet>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant={activeListType === 'inview' ? 'default' : 'outline'} onClick={() => setActiveListType('inview')} className="cursor-pointer py-1.5 px-3">
              <BookOpen className="h-4 w-4 mr-1" /> Demo Words
            </Badge>
            <Badge variant={activeListType === 'difficult_words' ? 'default' : 'outline'} onClick={() => setActiveListType('difficult_words')} className="cursor-pointer py-1.5 px-3">
              <SaveIcon className="h-4 w-4 mr-1" /> Saved Words
            </Badge>
            <Badge variant={activeListType === 'snapshots' ? 'default' : 'outline'} onClick={() => setActiveListType('snapshots')} className="cursor-pointer py-1.5 px-3">
              <Camera className="h-4 w-4 mr-1" /> Word Sets
            </Badge>
             <Badge variant={activeListType === 'groups' ? 'default' : 'outline'} onClick={() => setActiveListType('groups')} className="cursor-pointer py-1.5 px-3">
              <BookOpen className="h-4 w-4 mr-1" /> Word Groups
            </Badge>

            <Button 
              variant={demoPlayerState.isPlaying ? "destructive" : "outline"}
              size="sm"
              onClick={playDemo}
            >
              <Play className="h-4 w-4 mr-1" />
              {demoPlayerState.isPlaying ? "Stop Demo" : "Demo"}
            </Button>
          </div>

          {isLoading && <p className="text-muted-foreground">Loading vocabulary...</p>}
          {!isLoading && pairs.length === 0 && activeListType !== 'inview' && (
             <Alert>
                <AlertTitle>No Words Loaded</AlertTitle>
                <AlertDescription>
                    Please select a list type with words or adjust settings. For 'Word Groups', ensure you've selected a source and group. For 'Word Sets', ensure a set is loaded. 'Saved Words' will be empty if you haven't saved any.
                </AlertDescription>
            </Alert>
          )}

          {isMobile ? (
            <Button onClick={handleStartGameMobile} className="w-full mt-4" disabled={isLoading || pairs.length === 0}>
              Start Matching Game
            </Button>
          ) : (
             pairs.length > 0 && renderGameContent()
          )}
        </CardContent>
      </Card>
      
      {isMobile && (
        <Dialog open={isGameModalOpen} onOpenChange={setIsGameModalOpen}>
          <DialogContent className="w-full h-[95vh] max-w-none p-0 flex flex-col sm:rounded-lg">
            <DialogHeader className="p-3 border-b flex flex-row justify-between items-center">
              <DialogTitle className="text-lg">{currentLanguage.charAt(0).toUpperCase() + currentLanguage.slice(1)} Matching</DialogTitle>
              {/* <DialogClose asChild>
                <Button variant="ghost" size="icon"><X className="h-5 w-5" /></Button>
              </DialogClose> */}
            </DialogHeader>
            <div className="flex-grow overflow-y-auto p-3">
              {renderGameContent(true)}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={demoPlayerState.isPlaying && showCountdownModalState} onOpenChange={(open) => !open && setShowCountdownModalState(false)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader className="items-center">
            <DialogTitle>{countdownTextState || "Starting Demo..."}</DialogTitle>
            <DialogDescription className="text-6xl font-bold text-primary">{countdownValueState}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

let countdownInterval: NodeJS.Timeout | undefined;
let _setShowCountdownModalGlob: React.Dispatch<React.SetStateAction<boolean>> = () => {};
let _setCountdownValueGlob: React.Dispatch<React.SetStateAction<number>> = () => {};
let _setCountdownTextGlob: React.Dispatch<React.SetStateAction<string>> = () => {};

export function initializeCountdownModalSetters(
    setShowModalSetter: React.Dispatch<React.SetStateAction<boolean>>,
    setCountdownValueSetter: React.Dispatch<React.SetStateAction<number>>,
    setCountdownTextSetter: React.Dispatch<React.SetStateAction<string>>
) {
    _setShowCountdownModalGlob = setShowModalSetter;
    _setCountdownValueGlob = setCountdownValueSetter;
    _setCountdownTextGlob = setCountdownTextSetter;
}

export function startCountdown(options: { countDownTime?: number, displayText?: string }) {
    const { countDownTime = 3, displayText = "" } = options;
    
    if (countdownInterval) clearInterval(countdownInterval);

    _setCountdownTextGlob(displayText);
    _setCountdownValueGlob(countDownTime);
    _setShowCountdownModalGlob(true);
    
    eventEmitter.emit('countdown:start');
    
    let timeLeft = countDownTime;
    countdownInterval = setInterval(() => {
      timeLeft--;
      _setCountdownValueGlob(timeLeft);
      
      if (timeLeft < 0) {
        if (countdownInterval) clearInterval(countdownInterval);
        _setShowCountdownModalGlob(false);
        eventEmitter.emit('countdown:end');
      }
    }, 1000);
};


export default MatchingGame;

    