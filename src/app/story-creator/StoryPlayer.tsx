
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, Loader2, RefreshCw, Save, ChevronsUpDown } from 'lucide-react';
import type { GenerateStoryOutput } from '@/ai/flows/generate-story-flow';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';
import Image from 'next/image';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface SceneAssets {
    imageUrl?: string;
    audioUrl?: string;
    imageError?: boolean;
    audioError?: boolean;
}

interface StoryPlayerProps {
    story: GenerateStoryOutput;
    onReset: () => void;
    onSave: (story: GenerateStoryOutput, assets: Record<number, SceneAssets>) => void;
    isSaving?: boolean;
}

const StoryPlayer: React.FC<StoryPlayerProps> = ({ story, onReset, onSave, isSaving }) => {
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
    const [assets, setAssets] = useState<Record<number, SceneAssets>>({});
    const [loadingStates, setLoadingStates] = useState<Record<number, boolean>>({});
    const audioRef = useRef<HTMLAudioElement>(null);

    const currentScene = story.scenes[currentSceneIndex];

    const loadAllSceneAssets = useCallback(async () => {
        setLoadingStates(
            story.scenes.reduce((acc, _, index) => ({ ...acc, [index]: true }), {})
        );

        const assetPromises = story.scenes.map((scene, index) => {
            // Check if assets are already provided (e.g., from a saved story)
            // The generated story from the flow won't have these.
            const existingImageUrl = (scene as any).imageUrl;
            const existingAudioUrl = (scene as any).audioUrl;

            if (existingImageUrl && existingAudioUrl) {
                return Promise.resolve({
                    index,
                    assets: { imageUrl: existingImageUrl, audioUrl: existingAudioUrl }
                });
            }

            // Otherwise, generate new assets
            return Promise.allSettled([
                generateImage({ prompt: scene.imagePrompt }),
                textToSpeech({ text: scene.greekText, language: "Greek" })
            ]).then(results => {
                const newAssets: SceneAssets = {};
                if (results[0].status === 'fulfilled') {
                    newAssets.imageUrl = results[0].value.imageUrl;
                } else {
                    console.error(`Image generation failed for scene ${index}:`, results[0].reason);
                    newAssets.imageError = true;
                }
                if (results[1].status === 'fulfilled') {
                    newAssets.audioUrl = results[1].value.audioUrl;
                } else {
                    console.error(`Audio generation failed for scene ${index}:`, results[1].reason);
                    newAssets.audioError = true;
                }
                return { index, assets: newAssets };
            });
        });

        for (const promise of assetPromises) {
            const result = await promise;
            if (result) {
                setAssets(prev => ({ ...prev, [result.index]: result.assets }));
                setLoadingStates(prev => ({ ...prev, [result.index]: false }));
            }
        }
    }, [story.scenes]);

    useEffect(() => {
        if (story.scenes.length > 0) {
            loadAllSceneAssets();
        }
    }, [story, loadAllSceneAssets]);
    
    useEffect(() => {
        // When the current scene changes, programmatically load and play the new audio
        // This is more reliable than relying on the `autoPlay` attribute.
        if (audioRef.current) {
            audioRef.current.pause(); // Stop any currently playing audio
            audioRef.current.load();  // Force the browser to load the new src
            const playPromise = audioRef.current.play(); // Play the new audio
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Audio playback failed:", error);
                    // This is expected if the browser blocks autoplay.
                    // The user can still press play manually using the controls.
                });
            }
        }
    }, [currentSceneIndex]);


    const goToNextScene = () => {
        if (currentSceneIndex < story.scenes.length - 1) {
            setCurrentSceneIndex(prev => prev + 1);
        }
    };

    const goToPrevScene = () => {
        if (currentSceneIndex > 0) {
            setCurrentSceneIndex(prev => prev - 1);
        }
    };

    const renderHighlightedText = (text: string) => {
        const highlightedHtml = text.replace(/\*\*(.*?)\*\*/g, '<strong class="text-primary">$1</strong>');
        return { __html: highlightedHtml };
    };

    const allAssetsLoaded = Object.values(loadingStates).every(isLoading => !isLoading);
    const currentSceneIsLoading = loadingStates[currentSceneIndex];
    const currentSceneAssets = assets[currentSceneIndex] || {};

    return (
        <Card className="mt-6 animate-fadeInUp w-full">
            <CardHeader>
                <CardTitle className="text-xl text-primary">{story.title}</CardTitle>
                <CardDescription>
                    Scene {currentSceneIndex + 1} of {story.scenes.length}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {currentSceneIsLoading && <Skeleton className="h-full w-full" />}
                    {!currentSceneIsLoading && currentSceneAssets.imageUrl && (
                         <Image 
                            src={currentSceneAssets.imageUrl} 
                            alt={currentScene.imagePrompt}
                            width={1280}
                            height={720}
                            className="object-cover w-full h-full"
                         />
                    )}
                    {!currentSceneIsLoading && currentSceneAssets.imageError && (
                        <div className="text-center text-destructive p-4">Image failed to load.</div>
                    )}
                </div>
                
                <div className="prose dark:prose-invert max-w-none text-lg greek-size">
                     <p dangerouslySetInnerHTML={renderHighlightedText(currentScene.greekText)} />
                </div>

                <Collapsible>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ChevronsUpDown className="h-4 w-4" />
                            Show/Hide English Translation
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 text-sm text-muted-foreground p-4 border rounded-md bg-muted/50">
                        <p>{currentScene.englishTranslation}</p>
                    </CollapsibleContent>
                </Collapsible>
                
                <div className="flex items-center gap-2">
                    {currentSceneIsLoading && <Loader2 className="h-5 w-5 animate-spin" />}
                    {!currentSceneIsLoading && currentSceneAssets.audioUrl && (
                        <audio
                            ref={audioRef}
                            key={currentSceneIndex}
                            controls
                            src={currentSceneAssets.audioUrl}
                            className="w-full"
                        >
                            Your browser does not support the audio element.
                        </audio>
                    )}
                    {!currentSceneIsLoading && currentSceneAssets.audioError && (
                        <span className="text-sm text-destructive">Audio failed to load.</span>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex flex-wrap justify-between gap-2">
                <Button variant="outline" onClick={goToPrevScene} disabled={currentSceneIndex === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>

                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => onSave(story, assets)} disabled={!allAssetsLoaded || isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Saving...' : 'Save Story'}
                    </Button>
                    <Button variant="outline" onClick={onReset}>
                        <RefreshCw className="mr-2 h-4 w-4" /> New Story
                    </Button>
                </div>

                <Button onClick={goToNextScene} disabled={currentSceneIndex === story.scenes.length - 1}>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
};

export default StoryPlayer;
