
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { generateStory, type GenerateStoryOutput } from '@/ai/flows/generate-story-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import StoryPlayer from './StoryPlayer';
import { Label } from '@/components/ui/label';
import LookupHistoryViewer from '@/components/LookupHistoryViewer';
import type { NamespaceEntry } from '@/types';

type VocabWord = {
    word: string;
    meaning?: string;
};

// This needs to be defined for the history entries
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


const GREEK_API_BASE_URL = 'https://www.eazilang.gleeze.com/api/greek';

const StoryCreatorPage: React.FC = () => {
    const { toast } = useToast();
    const [selectedNamespace, setSelectedNamespace] = useState<string>('');
    const [userPrompt, setUserPrompt] = useState<string>('A short, adventurous tale about a hero on a quest.');
    const [isLoading, setIsLoading] = useState(false);
    const [story, setStory] = useState<GenerateStoryOutput | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

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

        try {
            // Fetch words from the selected lookup history namespace
            const vocabRes = await fetch(`${GREEK_API_BASE_URL}/lookup-history/indexed-entries?language=greek&namespace=${selectedNamespace}`);
            if (!vocabRes.ok) throw new Error('Failed to fetch words from the selected namespace.');
            
            const vocabData: IndexedHistoryResponse = await vocabRes.json();
            const allEntries = Object.values(vocabData.indexList || {}).flat();

            if (allEntries.length === 0) {
                throw new Error('The selected namespace is empty. Please look up some words first.');
            }

            // The AI flow is updated to not require meanings.
            const vocabForAI: VocabWord[] = allEntries.map(w => ({
                word: w.lemma || w.word,
            }));
            
            // Remove duplicates
            const uniqueVocab = Array.from(new Map(vocabForAI.map(item => [item['word'], item])).values());


            const generatedStory = await generateStory({
                vocab: uniqueVocab,
                userPrompt: userPrompt,
                language: 'Greek', // This feature currently supports Greek
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
    
    const handleReset = () => {
        setStory(null);
        setError(null);
        // We don't reset the prompt or namespace to allow for easy retries/adjustments
    }

    const handleHistoryWordSelect = (word: string, lemma?: string) => {
        // This function is required by LookupHistoryViewer, but not used here.
        // Could be used in the future to add a word to the prompt.
        toast({
            title: "Word Selected",
            description: `You selected "${word}". This doesn't do anything here, but you can generate a story from the whole namespace.`
        });
    }
    
    const handleNamespaceSelect = (namespace: string, entry: NamespaceEntry) => {
        setSelectedNamespace(namespace);
    }

    return (
        <div className="container mx-auto space-y-6 p-1">
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

            <LookupHistoryViewer
                language="greek"
                onWordSelect={handleHistoryWordSelect}
                onNamespaceSelect={handleNamespaceSelect}
                refreshTrigger={historyRefreshTrigger} 
            />

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

            {error && !isLoading && (
                 <Alert variant="destructive" className="mt-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {story && !isLoading && (
                <StoryPlayer story={story} onReset={handleReset} />
            )}
        </div>
    );
};

export default StoryCreatorPage;
