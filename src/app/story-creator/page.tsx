
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, AlertCircle, Library, RefreshCw } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { generateStory, type GenerateStoryOutput } from '@/ai/flows/generate-story-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import StoryPlayer, { type SceneAssets } from './StoryPlayer';
import { Label } from '@/components/ui/label';
import LookupHistoryViewer from '@/components/LookupHistoryViewer';
import type { NamespaceEntry } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

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

// Full story object including assets, as stored in the backend
interface SavedStory extends GenerateStoryOutput {
    id: string;
    assets: Record<number, SceneAssets>;
    createdAt: string;
}


const API_BASE_URL = 'https://www.eazilang.gleeze.com/api';

const StoryCreatorPage: React.FC = () => {
    const { toast } = useToast();
    const [selectedNamespace, setSelectedNamespace] = useState<string>('');
    const [userPrompt, setUserPrompt] = useState<string>('A short, adventurous tale about a hero on a quest.');
    const [isLoading, setIsLoading] = useState(false);
    const [story, setStory] = useState<GenerateStoryOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

    // State for saved stories
    const [savedStories, setSavedStories] = useState<SavedStory[]>([]);
    const [isLoadingStories, setIsLoadingStories] = useState(true);
    const [isSavingStory, setIsSavingStory] = useState(false);
    const [loadedAssets, setLoadedAssets] = useState<Record<number, SceneAssets> | null>(null);

    const fetchSavedStories = async () => {
        setIsLoadingStories(true);
        try {
            const response = await fetch(`${API_BASE_URL}/stories/list`); // Assuming this endpoint exists
            if (!response.ok) throw new Error("Failed to fetch saved stories.");
            const data = await response.json();
            setSavedStories(data.stories || []);
        } catch (err) {
            toast({
                variant: 'destructive',
                title: 'Could not load stories',
                description: err instanceof Error ? err.message : 'An unknown error occurred.'
            });
        } finally {
            setIsLoadingStories(false);
        }
    };

    useEffect(() => {
        fetchSavedStories();
    }, []);

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
        setError(null);
        setStory(null);
        setLoadedAssets(null); // Clear any previously loaded assets

        try {
            const vocabRes = await fetch(`${API_BASE_URL}/greek/lookup-history/indexed-entries?language=greek&namespace=${selectedNamespace}`);
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

            const generatedStory = await generateStory({
                vocab: uniqueVocab,
                userPrompt: userPrompt,
                language: 'Greek',
            });

            setStory(generatedStory);
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

    const handleSaveStory = async (storyToSave: GenerateStoryOutput, assets: Record<number, SceneAssets>) => {
        setIsSavingStory(true);
        try {
            const payload = {
                ...storyToSave,
                assets: assets,
            };

            const response = await fetch(`${API_BASE_URL}/stories/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to save story: ${errorText || response.statusText}`);
            }

            toast({
                title: 'Story Saved!',
                description: `"${storyToSave.title}" has been successfully saved.`,
            });
            await fetchSavedStories(); // Refresh the list of saved stories
        } catch (err) {
             toast({
                variant: 'destructive',
                title: 'Save Failed',
                description: err instanceof Error ? err.message : 'An unknown error occurred.',
            });
        } finally {
            setIsSavingStory(false);
        }
    };

    const handleLoadStory = (storyToLoad: SavedStory) => {
        const storyData: GenerateStoryOutput = {
            title: storyToLoad.title,
            scenes: storyToLoad.scenes,
        };
        setLoadedAssets(storyToLoad.assets);
        setStory(storyData);
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    
    const handleReset = () => {
        setStory(null);
        setError(null);
        setLoadedAssets(null);
    }

    const handleHistoryWordSelect = (word: string, lemma?: string) => {
        toast({
            title: "Word Selected",
            description: `You selected "${word}". Generate a story from the whole namespace.`
        });
    }
    
    const handleNamespaceSelect = (namespace: string, entry: NamespaceEntry) => {
        setSelectedNamespace(namespace);
    }

    return (
        <div className="container mx-auto space-y-6 p-1">
             {story && !isLoading ? (
                <StoryPlayer 
                    story={story} 
                    onReset={handleReset} 
                    onSave={handleSaveStory}
                    isSaving={isSavingStory}
                    initialAssets={loadedAssets || undefined}
                />
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center text-primary flex items-center justify-center gap-2">
                            <Sparkles className="h-6 w-6" />
                            AI Story Creator
                        </CardTitle>
                        <CardDescription className="text-center text-muted-foreground">
                            Create a unique, narrated, and illustrated story using words from your lookup history.
                        </CardDescription>
                    </CardHeader>
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
                                    Generating Story...
                                </>
                            ) : (
                                'Generate Story from Selected Namespace'
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}

            {isLoading && (
                 <Card className="mt-6">
                    <CardHeader>
                         <Skeleton className="h-8 w-3/4" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </CardContent>
                </Card>
            )}

            {error && !isLoading && !story && (
                 <Alert variant="destructive" className="mt-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <LookupHistoryViewer
                language="greek"
                onWordSelect={handleHistoryWordSelect}
                onNamespaceSelect={handleNamespaceSelect}
                refreshTrigger={historyRefreshTrigger} 
            />
            
            <Card className="mt-6">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Library className="h-5 w-5 text-primary" />
                            Saved Stories
                        </CardTitle>
                        <Button variant="outline" size="sm" onClick={fetchSavedStories} disabled={isLoadingStories}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingStories ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>
                     <CardDescription>Load a previously generated story to review it.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-60 border rounded-md p-2 bg-muted/30">
                        {isLoadingStories ? (
                             <div className="space-y-2 p-2">
                                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                             </div>
                        ) : savedStories.length > 0 ? (
                            <ul className="space-y-1">
                                {savedStories.map(s => (
                                    <li key={s.id}>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start text-left h-auto py-2 px-3"
                                            onClick={() => handleLoadStory(s)}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-medium text-primary">{s.title}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    Saved on: {new Date(s.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-center text-muted-foreground p-4">No saved stories found.</p>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>

        </div>
    );
};

export default StoryCreatorPage;
