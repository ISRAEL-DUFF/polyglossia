
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, AlertCircle, ChevronsUpDown, Save, Play, Pause, Library, History, Timer, Star } from 'lucide-react';
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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import TimingTool from './TimingTool';
import { localDatabase } from '@/lib/utils/storageUtil';

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
    // Full data is optional now in the list view
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
    const boldedWordsRef = useRef<Set<string>>(new Set());

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    
    const [savedStories, setSavedStories] = useState<SavedStory[]>([]);
    const [pagination, setPagination] = useState({ page: 1, pageSize: 5, total: 0, totalPages: 1 });
    const [loadingSavedStories, setLoadingSavedStories] = useState(false);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    
    const [isTimingToolOpen, setIsTimingToolOpen] = useState(false);

    useEffect(() => {
        const favs = favoritesDb.getAll();
        setFavorites(new Set(favs.map((f: any) => f.storyId)));
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
            const cleanText = generatedStory.greekText.replace(/\*\*/g, '');

            toast({ title: 'Story text ready!', description: 'Now generating audio with timings...' });
            const audioResult = await textToSpeech({ text: cleanText, language: 'Greek' });
            
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

            toast({ title: 'Story Saved', description: `"${story.title}" has been saved successfully.` });

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while saving.';
            setError(errorMessage);
            toast({ variant: 'destructive', title: 'Save Failed', description: errorMessage });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLoadSavedStory = async (storyId: string) => {
        handleReset();
        setIsLoadingStory(true);
        try {
            const response = await fetch(`${STORIES_API_URL}/get/${storyId}`);
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

    const toggleFavorite = (storyId: string) => {
        const newFavorites = new Set(favorites);
        const existingFav = favoritesDb.getAll().find((f: any) => f.storyId === storyId);

        if (existingFav) {
            favoritesDb.remove(existingFav.id);
            newFavorites.delete(storyId);
            toast({ title: 'Unfavorited', description: 'Story removed from favorites.' });
        } else {
            favoritesDb.add({ storyId });
            newFavorites.add(storyId);
            toast({ title: 'Favorited!', description: 'Story added to favorites.' });
        }
        setFavorites(newFavorites);
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
        setCurrentTime(audioRef.current.currentTime);
        if (wordTimings.length === 0) return;

        const time = audioRef.current.currentTime;
        const activeIndex = wordTimings.findIndex(timing => time >= timing.startTime && time < timing.endTime);
        if (activeIndex !== -1 && activeIndex !== currentWordIndex) {
            setCurrentWordIndex(activeIndex);
        }
    };

    const handleAudioEnd = () => {
        setCurrentWordIndex(-1);
        setIsPlaying(false);
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

    const handleWordClick = (startTime: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = startTime;
            if (audioRef.current.paused) {
                audioRef.current.play().catch(e => console.error("Audio play error:", e));
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

    return (
        <div className="container mx-auto space-y-6 p-1">
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
                                    className="hidden"
                                >
                                    Your browser does not support the audio element.
                                </audio>

                                <div className="flex items-center gap-4 p-2 border rounded-lg bg-muted/50">
                                    <Button onClick={togglePlayPause} variant="outline" size="icon">
                                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                                    </Button>
                                    <div className="font-mono text-sm text-muted-foreground w-28">
                                        {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
                                    </div>
                                    <div className="flex-grow" />
                                    <Button onClick={() => setIsTimingToolOpen(true)} variant="outline" size="sm">
                                        <Timer className="mr-2 h-4 w-4" />
                                        Edit Timings
                                    </Button>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="speed-select" className="text-sm">Speed:</Label>
                                        <Select onValueChange={handlePlaybackRateChange} defaultValue="1">
                                            <SelectTrigger id="speed-select" className="w-[80px]">
                                                <SelectValue placeholder="Speed" />
                                            </SelectTrigger>
                                            <SelectContent>
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
                                 <div className="prose dark:prose-invert max-w-none p-4 border rounded-md bg-muted/50 greek-size leading-loose">
                                     {wordTimings.length > 0 ? (
                                        wordTimings.map((timing, index) => (
                                            <span
                                                key={index}
                                                onClick={() => handleWordClick(timing.startTime)}
                                                className={cn(
                                                    'transition-colors duration-150 p-1 rounded-md cursor-pointer hover:bg-primary/10',
                                                    boldedWordsRef.current.has(timing.word) && 'font-bold text-primary',
                                                    currentWordIndex === index && 'bg-primary/20'
                                                )}
                                            >
                                                {timing.word}{' '}
                                            </span>
                                        ))
                                     ) : (
                                        <p>{renderHighlightedFallbackText(story.greekText)}</p>
                                     )}
                                </div>
                            </div>
                             <Collapsible>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <ChevronsUpDown className="h-4 w-4" />
                                        Show/Hide English Translation
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
            />

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Library className="h-5 w-5 text-primary"/>
                        Saved Stories Library
                    </CardTitle>
                    <CardDescription>
                        Review your previously generated stories for the namespace "{selectedNamespace || 'N/A'}".
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingSavedStories && (
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    )}
                    {!loadingSavedStories && savedStories.length === 0 && (
                        <p className="text-center text-muted-foreground p-4">
                            {selectedNamespace ? 'No saved stories in this namespace.' : 'Select a namespace to see saved stories.'}
                        </p>
                    )}
                    {!loadingSavedStories && savedStories.length > 0 && (
                        <ul className="space-y-2">
                            {savedStories.map(story => (
                                <li key={story.id}>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            className="flex-grow justify-start text-left h-auto py-2"
                                            onClick={() => handleLoadSavedStory(story.id)}
                                        >
                                            <div>
                                                <p className="font-medium">{story.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Saved on {new Date(story.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            onClick={() => toggleFavorite(story.id)}
                                            aria-label={favorites.has(story.id) ? 'Unfavorite' : 'Favorite'}
                                        >
                                            <Star className={cn(
                                                "h-5 w-5 text-muted-foreground transition-colors",
                                                favorites.has(story.id) ? "fill-yellow-400 text-yellow-500" : "hover:text-yellow-500"
                                            )}/>
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </CardContent>
                {pagination.totalPages > 1 && !loadingSavedStories && (
                    <CardFooter>
                         <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page - 1)} disabled={pagination.page <= 1}>
                                        Previous
                                    </Button>
                                </PaginationItem>
                                <PaginationItem>
                                    <span className="px-4 text-sm text-muted-foreground">
                                        Page {pagination.page} of {pagination.totalPages}
                                    </span>
                                </PaginationItem>
                                <PaginationItem>
                                    <Button variant="outline" size="sm" onClick={() => handlePageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}>
                                        Next
                                    </Button>
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </CardFooter>
                )}
            </Card>
            
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

