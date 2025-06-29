"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import LookupHistoryViewer from '@/components/LookupHistoryViewer';
import type { NamespaceEntry } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { generateStory, type GenerateStoryOutput } from '@/ai/flows/generate-story-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import StoryPlayer from './StoryPlayer';

type VocabWord = {
    id: string;
    word: string;
    headWord: string;
    meanings: string[];
};

const StoryCreatorPage: React.FC = () => {
    const { toast } = useToast();
    const [historyNamespace, setHistoryNamespace] = useState<string>('');
    const [userPrompt, setUserPrompt] = useState<string>('A short, adventurous tale about a hero on a quest.');
    const [isLoading, setIsLoading] = useState(false);
    const [story, setStory] = useState<GenerateStoryOutput | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateStory = async () => {
        if (!historyNamespace) {
            toast({
                variant: 'destructive',
                title: 'No Namespace Selected',
                description: 'Please select a vocabulary namespace to create a story from.',
            });
            return;
        }

        setIsLoading(true);
        setError(null);
        setStory(null);

        try {
            // NOTE: This feature currently only supports Greek namespaces as it uses the Greek API endpoint.
            const vocabRes = await fetch(`/api/greek/vocab/list/${historyNamespace}`);
            if (!vocabRes.ok) throw new Error('Failed to fetch vocabulary list. Please ensure it is a Greek namespace.');
            const vocabData: { words: VocabWord[] } = await vocabRes.json();
            
            if (!vocabData.words || vocabData.words.length === 0) {
                throw new Error('The selected namespace is empty.');
            }

            const vocabForAI = vocabData.words.map(w => ({
                word: w.headWord,
                meaning: w.meanings.join(', '),
            }));

            const generatedStory = await generateStory({
                vocab: vocabForAI,
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

    const handleNamespaceSelect = (namespace: string, entry: NamespaceEntry) => {
        setHistoryNamespace(namespace);
    };
    
    const handleReset = () => {
        setStory(null);
        setError(null);
        // We don't reset the prompt or namespace to allow for easy retries/adjustments
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
                        Create a unique, narrated, and illustrated story using words from your vocabulary lists.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label htmlFor="user-prompt" className="block text-sm font-medium text-muted-foreground mb-2">
                            Story Prompt
                        </label>
                        <Textarea
                            id="user-prompt"
                            placeholder="e.g., A funny story about animals in a marketplace..."
                            value={userPrompt}
                            onChange={(e) => setUserPrompt(e.target.value)}
                            rows={3}
                            disabled={isLoading}
                        />
                    </div>
                     <Button onClick={handleGenerateStory} disabled={isLoading || !historyNamespace} className="w-full">
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
                onWordSelect={() => {}} // Not used here
                onNamespaceSelect={handleNamespaceSelect}
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
