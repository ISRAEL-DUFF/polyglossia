"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { generateStory, type GenerateStoryOutput } from '@/ai/flows/generate-story-flow';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import LookupHistoryViewer from '@/components/LookupHistoryViewer';
import type { NamespaceEntry } from '@/types';

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

const API_BASE_URL = 'https://www.eazilang.gleeze.com/api';

const StoryCreatorPage: React.FC = () => {
    const { toast } = useToast();
    const [selectedNamespace, setSelectedNamespace] = useState<string>('');
    const [userPrompt, setUserPrompt] = useState<string>('A short, adventurous tale about a hero on a quest.');
    const [isLoading, setIsLoading] = useState(false);
    const [story, setStory] = useState<GenerateStoryOutput | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
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
        setAudioUrl(null);

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

            toast({ title: 'Generating story text...', description: 'Please wait, this may take a moment.' });
            const generatedStory = await generateStory({
                vocab: uniqueVocab,
                userPrompt: userPrompt,
                language: 'Greek',
            });
            setStory(generatedStory);

            toast({ title: 'Story text ready!', description: 'Now generating audio...' });
            const audioResult = await textToSpeech({ text: generatedStory.greekText, language: 'Greek' });
            setAudioUrl(audioResult.audioUrl);

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

    const renderHighlightedText = (text: string) => {
        const highlightedHtml = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary">$1</strong>');
        return { __html: highlightedHtml };
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
                        Create a unique, narrated story using words from your lookup history.
                    </CardDescription>
                </CardHeader>

                {!story && (
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
                
                {isLoading && (
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

                {!isLoading && story && (
                   <CardContent className="space-y-4 animate-fadeInUp">
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-primary">{story.title}</h2>
                        </div>
                        
                        {audioUrl ? (
                            <audio controls src={audioUrl} className="w-full">
                                Your browser does not support the audio element.
                            </audio>
                        ) : (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Loading audio...</span>
                            </div>
                        )}
                        
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-lg mb-2">Greek Text</h3>
                                <div className="prose dark:prose-invert max-w-none p-4 border rounded-md bg-muted/50 greek-size" dangerouslySetInnerHTML={renderHighlightedText(story.greekText)} />
                            </div>
                             <div>
                                <h3 className="font-semibold text-lg mb-2">English Translation</h3>
                                <div className="prose dark:prose-invert max-w-none p-4 border rounded-md bg-muted/50 text-sm">
                                    <p>{story.englishTranslation}</p>
                                </div>
                            </div>
                        </div>

                        <CardFooter className="px-0 pt-4">
                            <Button onClick={handleReset} variant="outline" className="w-full">
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
        </div>
    );
};

export default StoryCreatorPage;
