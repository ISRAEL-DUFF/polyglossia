
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, Loader2, RefreshCw, Save, ChevronsUpDown } from 'lucide-react';
import type { GenerateStoryOutput } from '@/ai/flows/generate-story-flow';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import CanvasScene from './CanvasScene';

interface CharacterAsset {
    spriteUrl?: string;
    position: { x: number; y: number };
    scale: number;
    name: string;
}
export interface SceneAssets {
    backgroundUrl?: string;
    characters: Record<string, { spriteUrl?: string }>;
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
    const currentSceneAssets = assets[currentSceneIndex] || { characters: {} };
    const currentSceneIsLoading = loadingStates[currentSceneIndex];

    const loadAllSceneAssets = useCallback(async () => {
        setLoadingStates(
            story.scenes.reduce((acc, _, index) => ({ ...acc, [index]: true }), {})
        );

        for (let i = 0; i < story.scenes.length; i++) {
            const scene = story.scenes[i];
            const imagePrompts = [
                { type: 'background', prompt: scene.backgroundPrompt, name: 'background' },
                ...scene.characters.map(c => ({ type: 'character', prompt: c.spritePrompt, name: c.name }))
            ];
            
            const assetPromises = {
                audio: textToSpeech({ text: scene.greekText, language: "Greek" }),
                images: Promise.all(imagePrompts.map(p => generateImage({ prompt: p.prompt })))
            };

            const [audioResult, imagesResult] = await Promise.allSettled([assetPromises.audio, assetPromises.images]);
            
            const newSceneAssets: SceneAssets = { characters: {} };

            if (audioResult.status === 'fulfilled') {
                newSceneAssets.audioUrl = audioResult.value.audioUrl;
            } else {
                newSceneAssets.audioError = true;
                console.error(`Audio generation failed for scene ${i}:`, audioResult.reason);
            }

            if (imagesResult.status === 'fulfilled') {
                const imageUrls = imagesResult.value;
                imageUrls.forEach((urlResult, idx) => {
                    const promptInfo = imagePrompts[idx];
                    if (promptInfo.type === 'background') {
                        newSceneAssets.backgroundUrl = urlResult.imageUrl;
                    } else {
                        newSceneAssets.characters[promptInfo.name] = { spriteUrl: urlResult.imageUrl };
                    }
                });
            } else {
                newSceneAssets.imageError = true;
                console.error(`Image generation failed for scene ${i}:`, imagesResult.reason);
            }
            
            setAssets(prev => ({...prev, [i]: newSceneAssets }));
            setLoadingStates(prev => ({...prev, [i]: false }));
        }
    }, [story.scenes]);

    useEffect(() => {
        if (story.scenes.length > 0) {
            loadAllSceneAssets();
        }
    }, [story, loadAllSceneAssets]);
    
    useEffect(() => {
        if (audioRef.current && currentSceneAssets.audioUrl) {
            audioRef.current.src = currentSceneAssets.audioUrl;
            audioRef.current.load();
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Audio playback was prevented by the browser:", error);
                });
            }
        }
    }, [currentSceneAssets.audioUrl, currentSceneIndex]);


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
    
    const charactersForCanvas: CharacterAsset[] = currentScene.characters.map(char => ({
        spriteUrl: currentSceneAssets.characters[char.name]?.spriteUrl || '',
        position: char.position,
        scale: char.scale,
        name: char.name
    })).filter(c => c.spriteUrl);


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
                    {currentSceneIsLoading ? (
                        <Skeleton className="h-full w-full" />
                    ) : currentSceneAssets.imageError ? (
                        <div className="text-center text-destructive p-4">Scene assets failed to load.</div>
                    ) : currentSceneAssets.backgroundUrl ? (
                         <CanvasScene 
                            backgroundUrl={currentSceneAssets.backgroundUrl}
                            characters={charactersForCanvas}
                         />
                    ) : (
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
                            key={currentSceneAssets.audioUrl}
                            controls
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
                    <Button variant="secondary" onClick={() => onSave(story, assets)} disabled={isSaving}>
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
