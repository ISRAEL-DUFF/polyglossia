
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, Loader2, RefreshCw, Speaker, ChevronsUpDown } from 'lucide-react';
import type { GenerateStoryOutput } from '@/ai/flows/generate-story-flow';
import { generateImage } from '@/ai/flows/generate-image-flow';
import { textToSpeech } from '@/ai/flows/text-to-speech-flow';
import Image from 'next/image';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";


interface StoryPlayerProps {
    story: GenerateStoryOutput;
    onReset: () => void;
}

interface SceneAssets {
    imageUrl?: string;
    audioUrl?: string;
    imageError?: boolean;
    audioError?: boolean;
}

const StoryPlayer: React.FC<StoryPlayerProps> = ({ story, onReset }) => {
    const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
    const [assets, setAssets] = useState<Record<number, SceneAssets>>({});
    const [isLoadingAssets, setIsLoadingAssets] = useState(true);
    const audioRef = useRef<HTMLAudioElement>(null);

    const currentScene = story.scenes[currentSceneIndex];

    const loadSceneAssets = useCallback(async (index: number) => {
        if (assets[index]) {
            setIsLoadingAssets(false);
            return;
        }
        
        setIsLoadingAssets(true);
        const scene = story.scenes[index];
        let newAssets: SceneAssets = {};

        try {
            const [imageResult, audioResult] = await Promise.allSettled([
                generateImage({ prompt: scene.imagePrompt }),
                textToSpeech({ text: scene.greekText, language: "Greek" })
            ]);

            if (imageResult.status === 'fulfilled') {
                newAssets.imageUrl = imageResult.value.imageUrl;
            } else {
                console.error("Image generation failed:", imageResult.reason);
                newAssets.imageError = true;
            }

            if (audioResult.status === 'fulfilled') {
                newAssets.audioUrl = audioResult.value.audioUrl;
            } else {
                console.error("Audio generation failed:", audioResult.reason);
                newAssets.audioError = true;
            }

            setAssets(prev => ({ ...prev, [index]: newAssets }));
        } catch (error) {
            console.error("Error loading scene assets:", error);
            setAssets(prev => ({ ...prev, [index]: { imageError: true, audioError: true } }));
        } finally {
            setIsLoadingAssets(false);
        }
    }, [assets, story.scenes]);

    useEffect(() => {
        loadSceneAssets(currentSceneIndex);
    }, [currentSceneIndex, loadSceneAssets]);
    
    useEffect(() => {
        if (assets[currentSceneIndex]?.audioUrl && audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio autoplay was prevented.", e));
        }
    }, [assets, currentSceneIndex]);

    const goToNextScene = () => {
        if (currentSceneIndex < story.scenes.length - 1) {
            setCurrentSceneIndex(prev => prev + 1);
        }
    };

    const goToPrevScene = () => {
        if (currentSceneIndex > 0) {
            setCurrentSceneIndex(prev => prev + 1);
        }
    };
    
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
                    {isLoadingAssets && <Skeleton className="h-full w-full" />}
                    {!isLoadingAssets && currentSceneAssets.imageUrl && (
                         <Image 
                            src={currentSceneAssets.imageUrl} 
                            alt={currentScene.imagePrompt}
                            width={1280}
                            height={720}
                            className="object-cover w-full h-full"
                         />
                    )}
                    {!isLoadingAssets && currentSceneAssets.imageError && (
                        <div className="text-center text-destructive p-4">Image failed to load.</div>
                    )}
                </div>
                
                <div className="prose dark:prose-invert max-w-none text-lg greek-size">
                    <p>{currentScene.greekText}</p>
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
                    {isLoadingAssets && <Loader2 className="h-5 w-5 animate-spin" />}
                    {!isLoadingAssets && currentSceneAssets.audioUrl && (
                        <audio
                            ref={audioRef}
                            controls
                            src={currentSceneAssets.audioUrl}
                            className="w-full"
                        >
                            Your browser does not support the audio element.
                        </audio>
                    )}
                    {!isLoadingAssets && currentSceneAssets.audioError && (
                        <span className="text-sm text-destructive">Audio failed to load.</span>
                    )}
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={goToPrevScene} disabled={currentSceneIndex === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <Button variant="outline" onClick={onReset}>
                     <RefreshCw className="mr-2 h-4 w-4" /> New Story
                </Button>
                <Button onClick={goToNextScene} disabled={currentSceneIndex === story.scenes.length - 1}>
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardFooter>
        </Card>
    );
};

export default StoryPlayer;
