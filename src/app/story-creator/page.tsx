"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, AlertCircle, ChevronsUpDown, Save, Play, Pause, Library, History, Timer, Star, FilePlus2, Repeat, Redo2 } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import { generateStory, type GenerateStoryOutput } from '@/ai/flows/generate-story-flow';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import LookupHistoryViewer from '@/components/LookupHistoryViewer';
import type { NamespaceEntry } from '@/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import TimingTool from './TimingTool';
import { localDatabase } from '@/lib/utils/storageUtil';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";


type VocabWord = {
    word: string;
    meaning?: string;
};

interface HistoryEntry {
  id: string;
  createdAt: string;
  language: string;
  namespace: string;
  word: string;
  lemma?: string;
  frequency: number;
  updatedAt: string;
}

interface IndexedHistoryResponse {
  index: string[];
  indexList: Record<string, HistoryEntry[]>;
}

interface WordTiming {
    word: string;
    startTime: number;
    endTime: number;
}

interface SavedStory {
    id: string;
    title: string;
    language: string;
    namespace: string;
    createdAt: string;
    // Full data is optional for API list, but required for favorites
    greekText?: string;
    englishTranslation?: string;
    audioDataUri?: string;
    timings?: WordTiming[];
}

interface StoriesApiResponse {
    stories: SavedStory[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}

const favoritesDb = localDatabase('story_favorites');
const API_BASE_URL = 'https://www.eazilang.gleeze.com/api/greek';
const STORIES_API_URL = 'https://www.eazilang.gleeze.com/api/stories';
// const STORIES_API_URL = 'http://localhost:3001/stories';

const StoryCreatorPage: React.FC = () => {
    const { toast } = useToast();
    const [selectedNamespace, setSelectedNamespace] = useState<string>('');
    const [userPrompt, setUserPrompt] = useState<string>('A short, adventurous tale about a hero on a quest.');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingStory, setIsLoadingStory] = useState(false);
    const [story, setStory] = useState<GenerateStoryOutput | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [wordTimings, setWordTimings] = useState<WordTiming[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const audioRef = useRef<HTMLAudioElement>(null);
    const storyContainerRef = useRef<HTMLDivElement>(null);
    const boldedWordsRef = useRef<Set<string>>(new Set());

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    
    const [savedStories, setSavedStories] = useState<SavedStory[]>([]);
    const [pagination, setPagination] = useState({ page: 1, pageSize: 5, total: 0, totalPages: 1 });
    const [loadingSavedStories, setLoadingSavedStories] = useState(false);
    
    const [favorites, setFavorites] = useState<SavedStory[]>([]);
    const [isTimingToolOpen, setIsTimingToolOpen] = useState(false);

    const [isManualStoryModalOpen, setIsManualStoryModalOpen] = useState(false);

    // New state for looping features
    const [isLooping, setIsLooping] = useState(false); // For whole audio loop
    const [isSelectingLoop, setIsSelectingLoop] = useState(false); // To enter selection mode
    const [loopStartIndex, setLoopStartIndex] = useState<number | null>(null);
    const [loopEndIndex, setLoopEndIndex] = useState<number | null>(null);
    const [activeLoop, setActiveLoop] = useState<{ start: number; end: number } | null>(null);


    useEffect(() => {
        setFavorites(favoritesDb.getAll());
    }, []);

    const fetchSavedStories = useCallback(async (page = 1) => {
        if (!selectedNamespace) {
            setSavedStories([]);
            return;
        };
        setLoadingSavedStories(true);
        try {
            const response = await fetch(`${STORIES_API_URL}/list?language=greek&namespace=${selectedNamespace}&page=${page}&pageSize=${pagination.pageSize}`);
            if (!response.ok) {
                throw new Error('Failed to fetch saved stories.');
            }
            const data: StoriesApiResponse = await response.json();
            setSavedStories(data.stories || []);
            setPagination(data.pagination || { page: 1, pageSize: 5, total: 0, totalPages: 1 });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'An unknown error occurred.';
            toast({ variant: 'destructive', title: 'Error Fetching Stories', description: msg });
        } finally {
            setLoadingSavedStories(false);
        }
    }, [selectedNamespace, pagination.pageSize, toast]);
    
    useEffect(() => {
        fetchSavedStories(pagination.page);
    }, [selectedNamespace, pagination.page, fetchSavedStories, isSaving]);

    // Auto-scroll effect
    useEffect(() => {
        if (currentWordIndex === -1 || !storyContainerRef.current) return;

        const activeWordElement = storyContainerRef.current.querySelector<HTMLElement>(`[data-index="${currentWordIndex}"]`);

        if (activeWordElement) {
            // Check if the element is visible within the scrollable container
            const containerRect = storyContainerRef.current.getBoundingClientRect();
            const wordRect = activeWordElement.getBoundingClientRect();

            const isVisible = (
                wordRect.top >= containerRect.top &&
                wordRect.bottom <= containerRect.bottom
            );

            if (!isVisible) {
                activeWordElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                });
            }
        }
    }, [currentWordIndex]);

    const handleGenerateStory = async () => {
        if (!selectedNamespace) {
            toast({
                variant: 'destructive',
                title: 'No Namespace Selected',
                description: 'Please select one of your lookup history namespaces.',
            });
            return;
        }

        setIsLoading(true);
        handleReset();

        try {
            const vocabRes = await fetch(`${API_BASE_URL}/lookup-history/indexed-entries?language=greek&namespace=${selectedNamespace}`);
            if (!vocabRes.ok) throw new Error('Failed to fetch words from the selected namespace.');
            
            const vocabData: IndexedHistoryResponse = await vocabRes.json();
            const allEntries = Object.values(vocabData.indexList || {}).flat();

            if (allEntries.length === 0) {
                throw new Error('The selected namespace is empty. Please look up some words first.');
            }

            const vocabForAI: VocabWord[] = allEntries.map(w => ({
                word: w.lemma || w.word,
            }));
            
            const uniqueVocab = Array.from(new Map(vocabForAI.map(item => [item['word'], item])).values());
            const shuffledVocab = uniqueVocab.sort(() => 0.5 - Math.random());
            const limitedVocab = shuffledVocab.slice(0, 20);

            toast({ title: 'Generating story text...', description: 'Please wait, this may take a moment.' });
            const generatedStory = await generateStory({
                vocab: limitedVocab,
                userPrompt: userPrompt,
                language: 'Greek',
            });
            setStory(generatedStory);

            boldedWordsRef.current = new Set([...(generatedStory.greekText.matchAll(/\*\*(.*?)\*\*/g) || [])].map(m => m[1]));
            
            const cleanTextPrompt = `Using Modern Greek pronunciation rules (β=v, γ=ɣ, δ=ð, etc.; η, ι, υ, ει, οι = i; αι=e; ου=u; stress accent), please read the following Ancient Greek text: ${generatedStory.greekText.replace(/\*\*/g, '')}`

            toast({ title: 'Story text ready!', description: 'Now generating audio with timings...' });
            const audioResult = await textToSpeech({ text: cleanTextPrompt, language: 'Greek' });
            
            if (audioResult && audioResult.audioUrl) {
              setAudioUrl(audioResult.audioUrl);
              setWordTimings(audioResult.timings || []);
            } else {
              setWordTimings([]); // Fallback to no timings
            }

            toast({
                title: 'Story Generated!',
                description: `Your story "${generatedStory.title}" is ready.`,
            });

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(errorMessage);
            toast({
                variant: 'destructive',
                title: 'Generation Failed',
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setStory(null);
        setError(null);
        setAudioUrl(null);
        setWordTimings([]);
        setCurrentWordIndex(-1);
        setIsSaving(false);
        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);
        // Reset loop states
        setIsLooping(false);
        setIsSelectingLoop(false);
        setActiveLoop(null);
        setLoopStartIndex(null);
        setLoopEndIndex(null);
    }
    
    const handleSaveStory = async () => {
        if (!story || !audioUrl) {
            toast({ variant: 'destructive', title: 'Error', description: 'No story or audio available to save.' });
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                title: story.title,
                greekText: story.greekText,
                englishTranslation: story.englishTranslation,
                audioDataUri: audioUrl,
                timings: wordTimings,
                language: 'greek',
                namespace: selectedNamespace,
            };

            const response = await fetch(`${STORIES_API_URL}/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to save story.' }));
                throw new Error(errorData.message);
            }
            
            await fetchSavedStories(); // Refresh the list

            toast({ title: 'Story Saved', description: `"${story.title}" has been saved successfully.` });

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while saving.';
            setError(errorMessage);
            toast({ variant: 'destructive', title: 'Save Failed', description: errorMessage });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleLoadStory = async (storyToLoad: SavedStory, isFavorite: boolean) => {
        handleReset();

        if (isFavorite && storyToLoad.greekText) {
            // Load directly from favorite object
            setStory({
                title: storyToLoad.title,
                greekText: storyToLoad.greekText,
                englishTranslation: storyToLoad.englishTranslation || '',
            });
            setAudioUrl(storyToLoad.audioDataUri || null);
            setWordTimings(storyToLoad.timings || []);
            boldedWordsRef.current = new Set([...(storyToLoad.greekText.matchAll(/\*\*(.*?)\*\*/g) || [])].map(m => m[1]));
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        
        // Fetch from API for non-favorites or incomplete favorite objects
        setIsLoadingStory(true);
        try {
            const response = await fetch(`${STORIES_API_URL}/by-id/${storyToLoad.id}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to load the selected story.');
            }
            const fullStory: SavedStory = await response.json();
            
            setStory({
                title: fullStory.title,
                greekText: fullStory.greekText!,
                englishTranslation: fullStory.englishTranslation!,
            });
            setAudioUrl(fullStory.audioDataUri!);
            setWordTimings(fullStory.timings || []);
            boldedWordsRef.current = new Set([...(fullStory.greekText?.matchAll(/\*\*(.*?)\*\*/g) || [])].map(m => m[1]));
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (err) {
             const msg = err instanceof Error ? err.message : 'An unknown error occurred.';
             toast({ variant: 'destructive', title: 'Error Loading Story', description: msg });
        } finally {
            setIsLoadingStory(false);
        }
    };

    const toggleFavorite = async (storyToList: SavedStory) => {
        const isFavorited = favorites.some(fav => fav.id === storyToList.id);
    
        if (isFavorited) {
            favoritesDb.remove(storyToList.id);
            setFavorites(prev => prev.filter(f => f.id !== storyToList.id));
            toast({ title: 'Unfavorited', description: 'Story removed from offline favorites.' });
        } else {
            let fullStoryData = storyToList;
            // Check if we already have the full data
            if (!fullStoryData.greekText || !fullStoryData.audioDataUri) {
                const loadingToast = toast({ title: 'Favoriting...', description: 'Fetching full story to save offline.' });
                try {
                    const response = await fetch(`${STORIES_API_URL}/by-id/${storyToList.id}`);
                    if (!response.ok) throw new Error('Could not fetch story to favorite it.');
                    fullStoryData = await response.json();
                } catch (e) {
                    loadingToast.dismiss();
                    toast({ title: "Error", description: e instanceof Error ? e.message : "Could not favorite story.", variant: "destructive" });
                    return;
                }
                loadingToast.dismiss();
            }
    
            favoritesDb.add(fullStoryData);
            setFavorites(prev => [...prev, fullStoryData]);
            toast({ title: 'Favorited!', description: 'Story saved for offline access.' });
        }
    };


    const handleHistoryWordSelect = (word: string, lemma?: string) => {
        toast({
            title: "Word Selected",
            description: `You selected "${word}". Generate a story from the whole namespace.`
        });
    }
    
    const handleNamespaceSelect = (namespace: string, entry: NamespaceEntry) => {
        setSelectedNamespace(namespace);
        setPagination(prev => ({...prev, page: 1}));
    }

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const currentTime = audioRef.current.currentTime;
        setCurrentTime(currentTime);

        // Handle segment looping
        if (activeLoop && audioRef.current.currentTime >= activeLoop.end) {
            audioRef.current.currentTime = activeLoop.start;
            audioRef.current.play().catch(e => console.error("Audio playback error on loop:", e));
            return; // Don't run word highlighting logic on loop jump
        }
        
        if (wordTimings.length === 0) return;

        const activeIndex = wordTimings.findIndex(timing => currentTime >= timing.startTime && currentTime < timing.endTime);
        if (activeIndex !== -1 && activeIndex !== currentWordIndex) {
            setCurrentWordIndex(activeIndex);
        }
    };

    const handleAudioEnd = () => {
        if (!isLooping) {
            setCurrentWordIndex(-1);
            setIsPlaying(false);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };
    
    const togglePlayPause = () => {
        if (audioRef.current) {
            if (audioRef.current.paused) {
                audioRef.current.play();
            } else {
                audioRef.current.pause();
            }
        }
    };

    const handlePlaybackRateChange = (rate: string) => {
        const newRate = parseFloat(rate);
        setPlaybackRate(newRate);
        if (audioRef.current) {
            audioRef.current.playbackRate = newRate;
        }
    };
    
    const renderHighlightedFallbackText = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean);
        return parts.map((part, index) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="text-primary font-bold">{part.slice(2, -2)}</strong>;
            }
            return <React.Fragment key={index}>{part}</React.Fragment>;
        });
    };

    const handleLoopSelection = (index: number) => {
        if (loopStartIndex === null) {
            setLoopStartIndex(index);
            toast({ title: "Start Point Selected", description: "Now click the last word of the segment to loop." });
        } else {
            const startIdx = Math.min(loopStartIndex, index);
            const endIdx = Math.max(loopStartIndex, index);

            if (wordTimings[startIdx] && wordTimings[endIdx] && wordTimings[endIdx].endTime) {
                setLoopEndIndex(endIdx);
                const startTime = wordTimings[startIdx].startTime;
                const endTime = wordTimings[endIdx].endTime;
                setActiveLoop({ start: startTime, end: endTime });
                
                if (audioRef.current) {
                    audioRef.current.currentTime = startTime;
                    audioRef.current.play();
                }

                setIsSelectingLoop(false);
                // No need to reset loopStartIndex here, it's used for highlighting
            } else {
                 toast({ variant: 'destructive', title: "Timing Error", description: "Timings for the selected words are not available." });
                 setLoopStartIndex(null);
                 setIsSelectingLoop(false);
            }
        }
    };

    const handleWordClick = (startTime: number, index: number) => {
        if (isSelectingLoop) {
            handleLoopSelection(index);
            return;
        }

        if (audioRef.current) {
            audioRef.current.currentTime = startTime;
            if (audioRef.current.paused) {
                audioRef.current.play().catch(e => console.error("Audio play error:", e));
            }
        }
    };
    
    const toggleFullLoop = () => {
        const newLoopingState = !isLooping;
        setIsLooping(newLoopingState);
        if (newLoopingState) {
            setActiveLoop(null);
            setIsSelectingLoop(false);
            setLoopStartIndex(null);
            setLoopEndIndex(null);
            toast({ title: "Audio Looping Enabled" });
        } else {
            toast({ title: "Audio Looping Disabled" });
        }
    };
    
    const toggleSegmentLoop = () => {
        if (activeLoop) {
            setActiveLoop(null);
            setLoopStartIndex(null);
            setLoopEndIndex(null);
            if (audioRef.current) audioRef.current.pause();
            toast({ title: "Segment Loop Cleared" });
        } else {
            const enteringSelection = !isSelectingLoop;
            setIsSelectingLoop(enteringSelection);
            setLoopStartIndex(null);
            setLoopEndIndex(null);
            if (enteringSelection) {
                setIsLooping(false);
                toast({ title: "Select Loop Segment", description: "Click the first word of the segment." });
            } else {
                toast({ title: "Loop Selection Cancelled" });
            }
        }
    };


    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    const handleTimingsUpdate = (newTimings: WordTiming[]) => {
        setWordTimings(newTimings);
    };

    const handleManualStorySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const greekText = formData.get('greekText') as string;
        const englishTranslation = formData.get('englishTranslation') as string;
        const audioFile = formData.get('audioFile') as File;
    
        if (!title || !greekText || !englishTranslation || !audioFile || audioFile.size === 0) {
            toast({ title: "Missing Information", description: "Please fill out all fields and select an audio file.", variant: "destructive" });
            return;
        }
    
        handleReset(); // Clear any existing story
        setIsLoading(true); // Show a loading state
    
        try {
            const audioDataUri = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(audioFile);
            });

            setAudioUrl(audioDataUri);
            setWordTimings([]);
    
            // We'll wrap the manual story in a single scene to fit the new data structure
            setStory({
                title,
                // These are for type compatibility but not used directly by the player now
                greekText,
                englishTranslation
            });

            toast({ title: "Story Loaded", description: "Your manual story is ready. Use the timing tool to sync the audio." });
            setIsManualStoryModalOpen(false);
        } catch (err) {
            toast({ title: "Error Loading Audio", description: "Could not read the audio file.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderStoryList = (stories: SavedStory[], isFavoritesList: boolean) => (
       <ul className="space-y-2">
            {stories.map(storyItem => (
                <li key={storyItem.id}>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                        <Button
                            variant="ghost"
                            className="w-full sm:w-auto justify-start text-left h-auto py-2 min-w-0"
                            onClick={() => handleLoadStory(storyItem, isFavoritesList)}
                        >
                            <div className="min-w-0">
                                <p className="font-medium break-words whitespace-normal">{storyItem.title}</p>
                                <p className="text-xs text-muted-foreground">
                                    Saved on {new Date(storyItem.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="mt-2 sm:mt-0"
                            onClick={() => toggleFavorite(storyItem)}
                            aria-label={favorites.some(f => f.id === storyItem.id) ? 'Unfavorite' : 'Favorite'}
                        >
                            <Star className={cn(
                                "h-5 w-5 text-muted-foreground transition-colors",
                                favorites.some(f => f.id === storyItem.id) ? "fill-yellow-400 text-yellow-500" : "hover:text-yellow-500"
                            )}/>
                        </Button>
                    </div>
                </li>
            ))}
        </ul>
    );

    return (
        <div className="container mx-auto space-y-6 sm:p-2 lg:p-8">
             <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center text-primary flex items-center justify-center gap-2">
                        <Sparkles className="h-6 w-6" />
                        AI Story Creator
                    </CardTitle>
                    <CardDescription className="text-center text-muted-foreground">
                        Create a unique, narrated story using words from your lookup history, with synchronized text highlighting.
                    </CardDescription>
                </CardHeader>

                {!story && !isLoadingStory && (
                  <CardContent className="space-y-4">
                      <div>
                          <Label htmlFor="user-prompt" className="block text-sm font-medium text-muted-foreground mb-1">
                              Story Prompt
                          </Label>
                          <Textarea
                              id="user-prompt"
                              placeholder="e.g., A funny story about animals in a marketplace..."
                              value={userPrompt}
                              onChange={(e) => setUserPrompt(e.target.value)}
                              rows={3}
                              disabled={isLoading}
                          />
                      </div>
                      <div className="flex gap-4">
                        <Button onClick={handleGenerateStory} disabled={isLoading || !selectedNamespace} className="w-full">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                'Generate Story from Selected Namespace'
                            )}
                        </Button>
                        <Button onClick={() => setIsManualStoryModalOpen(true)} variant="outline" className="w-full">
                            <FilePlus2 className="mr-2 h-4 w-4" />
                            Add Your Own Story
                        </Button>
                      </div>
                  </CardContent>
                )}
                
                {(isLoading || isLoadingStory) && (
                 <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-3/4 mx-auto" />
                        <Skeleton className="h-6 w-1/2 mx-auto" />
                        <div className="space-y-2 pt-4">
                          <Skeleton className="h-10 w-full" />
                          <Skeleton className="h-24 w-full" />
                          <Skeleton className="h-24 w-full" />
                        </div>
                    </div>
                 </CardContent>
                )}

                {error && !isLoading && (
                     <CardContent>
                        <Alert variant="destructive" className="mt-6">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    </CardContent>
                )}

                {!isLoading && !isLoadingStory && story && (
                   <CardContent className="space-y-4 animate-fadeInUp">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-primary">{story.title}</h2>
                        </div>
                        
                        {(audioUrl) ? (
                            <>
                                <audio 
                                    ref={audioRef}
                                    src={audioUrl} 
                                    onLoadedMetadata={handleLoadedMetadata}
                                    onTimeUpdate={handleTimeUpdate}
                                    onEnded={handleAudioEnd}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    loop={isLooping && !activeLoop} // Use state for looping
                                    className="hidden"
                                >
                                    Your browser does not support the audio element.
                                </audio>

                                <div className="flex items-center gap-2 sm:gap-4 p-2 border rounded-lg bg-muted/50 flex-wrap justify-center sm:justify-start">
                                    <Button onClick={togglePlayPause} variant="outline" size="icon">
                                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                                    </Button>
                                    <div className="font-mono text-sm text-muted-foreground w-28 text-center sm:text-left">
                                        {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
                                    </div>
                                    <div className="flex-grow hidden sm:block" />
                                    
                                    <div className="flex gap-2">
                                        <Button onClick={toggleFullLoop} variant={isLooping ? "secondary" : "outline"} size="icon" title="Loop Audio">
                                            <Repeat className="h-5 w-5" />
                                        </Button>
                                        <Button onClick={toggleSegmentLoop} variant={isSelectingLoop || activeLoop ? "secondary" : "outline"} size="icon" title={activeLoop ? "Clear Loop" : "Loop Segment"}>
                                            <Redo2 className="h-5 w-5" />
                                        </Button>
                                        <Button onClick={() => setIsTimingToolOpen(true)} variant="outline" size="sm" className="h-10 px-3">
                                            <Timer className="mr-0 sm:mr-2 h-4 w-4" />
                                            <span className="hidden sm:inline">Edit Timings</span>
                                        </Button>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="speed-select" className="text-sm">Speed:</Label>
                                        <Select onValueChange={handlePlaybackRateChange} defaultValue="1">
                                            <SelectTrigger id="speed-select" className="w-[80px]">
                                                <SelectValue placeholder="Speed" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="0.25">0.25x</SelectItem>
                                                <SelectItem value="0.5">0.5x</SelectItem>
                                                <SelectItem value="0.75">0.75x</SelectItem>
                                                <SelectItem value="1">1x</SelectItem>
                                                <SelectItem value="1.25">1.25x</SelectItem>
                                                <SelectItem value="1.5">1.5x</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Loading audio...</span>
                            </div>
                        )}

                        {audioUrl && wordTimings.length === 0 && (
                           <Alert variant="default" className="mt-2">
                             <AlertCircle className="h-4 w-4" />
                             <AlertTitle>Audio Only</AlertTitle>
                             <AlertDescription>
                               Word-by-word highlighting is currently unavailable, but you can listen to the story. Use the "Edit Timings" tool to add it manually.
                             </AlertDescription>
                           </Alert>
                        )}
                        
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Greek Text</h3>
                                 <div ref={storyContainerRef} className="prose dark:prose-invert max-w-none p-4 border rounded-md bg-muted/50 greek-size leading-loose overflow-y-auto max-h-[40vh]">
                                     {wordTimings.length > 0 ? (
                                        wordTimings.map((timing, index) => {
                                            const isSegmentActive = activeLoop && loopStartIndex !== null && loopEndIndex !== null && index >= loopStartIndex && index <= loopEndIndex;
                                            return (
                                                <span
                                                    key={index}
                                                    data-index={index}
                                                    onClick={() => handleWordClick(timing.startTime, index)}
                                                    className={cn(
                                                        'transition-all duration-150 p-1 rounded-md cursor-pointer hover:bg-primary/10',
                                                        boldedWordsRef.current.has(timing.word) && 'font-bold text-primary',
                                                        currentWordIndex === index && !isSegmentActive && 'bg-yellow-400/30',
                                                        isSelectingLoop && 'hover:ring-2 hover:ring-blue-400',
                                                        loopStartIndex === index && 'ring-2 ring-blue-500',
                                                        isSegmentActive && 'bg-green-400/30'
                                                    )}
                                                >
                                                    {timing.word}{' '}
                                                </span>
                                            )
                                        })
                                     ) : (
                                        <p>{renderHighlightedFallbackText(story.greekText)}</p>
                                     )}
                                </div>
                            </div>
                             <Collapsible>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <ChevronsUpDown className="h-4 w-4" />
                                        Show/Hide Translation
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2">
                                     <div className="prose dark:prose-invert max-w-none p-4 border rounded-md bg-muted/50 text-sm">
                                        <p>{story.englishTranslation}</p>
                                    </div>
                                </CollapsibleContent>
                             </Collapsible>
                        </div>

                        <CardFooter className="px-0 pt-4 flex flex-col sm:flex-row gap-2">
                            <Button onClick={handleSaveStory} disabled={isSaving || !audioUrl} className="w-full sm:w-auto">
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                                {isSaving ? "Saving..." : "Save Story"}
                            </Button>
                            <Button onClick={handleReset} variant="outline" className="w-full sm:w-auto">
                                Create a New Story
                            </Button>
                        </CardFooter>
                   </CardContent>
                )}
            </Card>

            <LookupHistoryViewer
                language="greek"
                onWordSelect={handleHistoryWordSelect}
                onNamespaceSelect={handleNamespaceSelect}
                refreshTrigger={historyRefreshTrigger}
                listMode = {true}
            />

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Library className="h-5 w-5 text-primary"/>
                        Story Library
                    </CardTitle>
                    <CardDescription>
                        Review your previously generated and favorite stories for the namespace "{selectedNamespace || 'N/A'}".
                    </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all-stories" className="w-full">
                    <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
                      <TabsTrigger value="all-stories">All Saved Stories</TabsTrigger>
                      <TabsTrigger value="favorites">Favorites (Offline)</TabsTrigger>
                    </TabsList>
                    <TabsContent value="all-stories" className="mt-4">
                       {loadingSavedStories ? (
                            <div className="space-y-2">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                            </div>
                        ) : savedStories.length === 0 ? (
                            <p className="text-center text-muted-foreground p-4">
                                {selectedNamespace ? 'No saved stories in this namespace.' : 'Select a namespace to see saved stories.'}
                            </p>
                        ) : (
                            renderStoryList(savedStories, false)
                        )}
                        {pagination.totalPages > 1 && !loadingSavedStories && (
                            <Pagination className="mt-4">
                                <PaginationContent>
                                    <PaginationPrevious onClick={() => handlePageChange(pagination.page - 1)} className={cn(pagination.page <= 1 && "pointer-events-none opacity-50")}/>
                                    <span className="p-2 text-sm">Page {pagination.page} of {pagination.totalPages}</span>
                                    <PaginationNext onClick={() => handlePageChange(pagination.page + 1)} className={cn(pagination.page >= pagination.totalPages && "pointer-events-none opacity-50")}/>
                                </PaginationContent>
                            </Pagination>
                        )}
                    </TabsContent>
                    <TabsContent value="favorites" className="mt-4">
                         {favorites.length === 0 ? (
                            <p className="text-center text-muted-foreground p-4">
                                No favorite stories yet. Click the star icon on a story to save it here for offline access.
                            </p>
                        ) : (
                           renderStoryList(favorites, true)
                        )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
            </Card>

            <Dialog open={isManualStoryModalOpen} onOpenChange={setIsManualStoryModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Your Own Story</DialogTitle>
                        <DialogDescription>
                            Manually enter your story text, title, and upload an audio file.
                        </DialogDescription>
                    </DialogHeader>
                    <form id="manual-story-form" onSubmit={handleManualStorySubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="manual-title">Title</Label>
                                <Input id="manual-title" name="title" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="manual-greek">Greek Text</Label>
                                <Textarea id="manual-greek" name="greekText" required rows={4} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="manual-english">English Translation</Label>
                                <Textarea id="manual-english" name="englishTranslation" required rows={4} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="manual-audio">Audio File</Label>
                                <Input id="manual-audio" name="audioFile" type="file" accept="audio/*" required />
                            </div>
                        </div>
                    </form>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setIsManualStoryModalOpen(false)}>Cancel</Button>
                        <Button type="submit" form="manual-story-form" disabled={isLoading}>
                           {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Loading...</> : "Load Story"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            {story && audioUrl && (
              <TimingTool 
                isOpen={isTimingToolOpen} 
                onOpenChange={setIsTimingToolOpen}
                storyText={story.greekText}
                audioUrl={audioUrl}
                onSave={handleTimingsUpdate}
              />
            )}
        </div>
    );
};

export default StoryCreatorPage;
