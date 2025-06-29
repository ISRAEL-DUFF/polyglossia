"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { generateStory, type GenerateStoryOutput } from '@/ai/flows/generate-story-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import StoryPlayer from './StoryPlayer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type VocabWord = {
    id: string;
    word: string;
    headWord: string;
    meanings: string[];
};

type VocabList = {
    name: string;
    count: number;
};

const GREEK_API_BASE_URL = 'https://www.eazilang.gleeze.com/api/greek';

const StoryCreatorPage: React.FC = () => {
    const { toast } = useToast();
    const [selectedNamespace, setSelectedNamespace] = useState<string>('');
    const [userPrompt, setUserPrompt] = useState<string>('A short, adventurous tale about a hero on a quest.');
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingLists, setIsFetchingLists] = useState(true);
    const [vocabLists, setVocabLists] = useState<VocabList[]>([]);
    const [story, setStory] = useState<GenerateStoryOutput | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVocabLists = async () => {
            setIsFetchingLists(true);
            try {
                const response = await fetch(`${GREEK_API_BASE_URL}/vocab/info`);
                if (!response.ok) {
                    throw new Error('Could not fetch vocabulary lists from the server.');
                }
                const data: VocabList[] = await response.json();
                setVocabLists(data);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
                toast({
                    variant: 'destructive',
                    title: 'Failed to load vocab lists',
                    description: errorMessage,
                });
            } finally {
                setIsFetchingLists(false);
            }
        };

        fetchVocabLists();
    }, [toast]);

    const handleGenerateStory = async () => {
        if (!selectedNamespace) {
            toast({
                variant: 'destructive',
                title: 'No Vocabulary List Selected',
                description: 'Please select one of your saved vocabulary lists to create a story from.',
            });
            return;
        }

        setIsLoading(true);
        setError(null);
        setStory(null);

        try {
            // NOTE: This feature currently only supports Greek namespaces as it uses the Greek API endpoint.
            const vocabRes = await fetch(`${GREEK_API_BASE_URL}/vocab/list/${selectedNamespace}`);
            if (!vocabRes.ok) throw new Error('Failed to fetch vocabulary list. Please ensure the list exists and is accessible.');
            const vocabData: { words: VocabWord[] } = await vocabRes.json();
            
            if (!vocabData.words || vocabData.words.length === 0) {
                throw new Error('The selected vocabulary list is empty.');
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
                    <div className="space-y-2">
                        <Label htmlFor="vocab-list-select">Vocabulary List</Label>
                        <Select
                            value={selectedNamespace}
                            onValueChange={setSelectedNamespace}
                            disabled={isFetchingLists || vocabLists.length === 0}
                        >
                            <SelectTrigger id="vocab-list-select">
                                <SelectValue placeholder={isFetchingLists ? "Loading lists..." : "Select a vocabulary list"} />
                            </SelectTrigger>
                            <SelectContent>
                                {vocabLists.map((list) => (
                                    <SelectItem key={list.name} value={list.name}>
                                        {list.name} ({list.count} words)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {vocabLists.length === 0 && !isFetchingLists && (
                            <p className="text-xs text-muted-foreground">No vocabulary lists found. Please create one in the <a href="/vocabulary-browser" className="underline">Vocabulary Browser</a>.</p>
                        )}
                    </div>
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
                            'Generate Story from Selected List'
                        )}
                    </Button>
                </CardContent>
            </Card>

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
