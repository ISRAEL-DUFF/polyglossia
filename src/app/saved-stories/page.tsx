
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Library, Loader2, Play, Pause, ChevronsUpDown } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Types
interface WordTiming {
    word: string;
    startTime: number;
    endTime: number;
}

interface SavedStory {
    id: string;
    title: string;
    greekText: string;
    englishTranslation: string;
    audioDataUri: string;
    timings: WordTiming[]; // Timings are now part of the saved data
    language: string;
    namespace: string;
    createdAt: string;
}

// Viewer Component
const StoryViewer = ({ story }: { story: SavedStory | null }) => {
    const [currentWordIndex, setCurrentWordIndex] = useState(-1);
    const audioRef = useRef<HTMLAudioElement>(null);
    const boldedWordsRef = useRef<Set<string>>(new Set());

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    
    useEffect(() => {
        if (story) {
            // Reset state when a new story is selected
            setCurrentWordIndex(-1);
            setCurrentTime(0);
            setDuration(0);
            setIsPlaying(false);
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
            }
            // Extract bolded words from the greekText
            boldedWordsRef.current = new Set([...(story.greekText.matchAll(/\*\*(.*?)\*\*/g) || [])].map(m => m[1]));
        }
    }, [story]);
    
    const handleTimeUpdate = () => {
        if (!audioRef.current || !story) return;
        setCurrentTime(audioRef.current.currentTime);
        if (!story.timings || story.timings.length === 0) return;
        
        const time = audioRef.current.currentTime;
        const activeIndex = story.timings.findIndex(timing => time >= timing.startTime && time < timing.endTime);
        
        if (activeIndex !== -1 && activeIndex !== currentWordIndex) {
            setCurrentWordIndex(activeIndex);
        }
    };

    const handleAudioEnd = () => {
        setCurrentWordIndex(-1);
        setIsPlaying(false);
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) setDuration(audioRef.current.duration);
    };
    
    const togglePlayPause = () => {
        if (audioRef.current) {
            if (audioRef.current.paused) audioRef.current.play();
            else audioRef.current.pause();
        }
    };

    const handlePlaybackRateChange = (rate: string) => {
        const newRate = parseFloat(rate);
        setPlaybackRate(newRate);
        if (audioRef.current) audioRef.current.playbackRate = newRate;
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

    if (!story) {
        return (
            <Card className="flex-grow flex items-center justify-center bg-muted/30 border-dashed min-h-[400px]">
                <p className="text-muted-foreground">Select a story from the list to view it here.</p>
            </Card>
        );
    }

    return (
        <Card className="flex-grow animate-fadeInUp">
            <CardHeader>
                <CardTitle>{story.title}</CardTitle>
                <CardDescription>Saved on: {new Date(story.createdAt).toLocaleDateString()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <audio 
                    ref={audioRef}
                    key={story.id} // Re-mount audio element when story changes
                    src={story.audioDataUri} 
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

                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-lg mb-2">Greek Text</h3>
                         <div className="prose dark:prose-invert max-w-none p-4 border rounded-md bg-muted/50 greek-size leading-loose">
                             {(story.timings && story.timings.length > 0) ? (
                                story.timings.map((timing, index) => (
                                    <span
                                        key={index}
                                        className={cn(
                                            'transition-colors duration-150 p-1 rounded-md',
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
            </CardContent>
        </Card>
    );
};

// Main Page Component
const SavedStoriesPage = () => {
    const [stories, setStories] = useState<SavedStory[]>([]);
    const [selectedStory, setSelectedStory] = useState<SavedStory | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchStories = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch('https://www.eazilang.gleeze.com/api/stories/list');
                if (!response.ok) {
                    throw new Error('Failed to fetch saved stories.');
                }
                const data = await response.json();
                const fetchedStories = data.stories || [];
                setStories(fetchedStories);
                if (fetchedStories.length > 0) {
                  setSelectedStory(fetchedStories[0]);
                }
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'An unknown error occurred.';
                setError(msg);
                toast({ variant: 'destructive', title: 'Error', description: msg });
            } finally {
                setIsLoading(false);
            }
        };

        fetchStories();
    }, [toast]);

    return (
        <div className="container mx-auto space-y-6 p-1">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center text-primary flex items-center justify-center gap-2">
                        <Library className="h-6 w-6" />
                        Saved Stories
                    </CardTitle>
                    <CardDescription className="text-center text-muted-foreground">
                        Browse and listen to your previously generated and saved stories.
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">Story Library</CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-[60vh] overflow-y-auto">
                        {isLoading && [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full mb-2" />)}
                        {error && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                        {!isLoading && !error && stories.length === 0 && (
                            <p className="text-muted-foreground text-center p-4">You have no saved stories.</p>
                        )}
                        <ul className="space-y-2">
                            {stories.map(story => (
                                <li key={story.id}>
                                    <Button
                                        variant={selectedStory?.id === story.id ? 'secondary' : 'ghost'}
                                        className="w-full justify-start text-left h-auto py-2"
                                        onClick={() => setSelectedStory(story)}
                                    >
                                        <div className="flex flex-col">
                                            <span className="font-medium">{story.title}</span>
                                            <span className="text-xs text-muted-foreground">
                                                Saved on {new Date(story.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                <div className="md:col-span-2">
                    <StoryViewer story={selectedStory} />
                </div>
            </div>
        </div>
    );
};

export default SavedStoriesPage;
