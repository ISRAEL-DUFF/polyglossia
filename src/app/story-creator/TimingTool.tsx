
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Save, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WordTiming {
    word: string;
    startTime: number;
    endTime: number;
}

interface TimingToolProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    storyText: string;
    audioUrl: string;
    onSave: (timings: WordTiming[]) => void;
}

const TimingTool: React.FC<TimingToolProps> = ({ isOpen, onOpenChange, storyText, audioUrl, onSave }) => {
    const { toast } = useToast();
    const audioRef = useRef<HTMLAudioElement>(null);
    const wordsContainerRef = useRef<HTMLDivElement>(null);

    const [words, setWords] = useState<string[]>([]);
    const [timings, setTimings] = useState<WordTiming[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);

    useEffect(() => {
        if (isOpen) {
            const storyWords = storyText.replace(/\*\*/g, '').split(/\s+/).filter(Boolean);
            setWords(storyWords);
            setTimings(storyWords.map(word => ({ word, startTime: 0, endTime: 0 })));
            setCurrentIndex(0);
            if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.playbackRate = 1;
            }
            setPlaybackRate(1);
        }
    }, [isOpen, storyText]);

    const handleMarkTime = useCallback(() => {
        if (!audioRef.current || currentIndex >= words.length) return;

        const currentTime = audioRef.current.currentTime;
        let newTimings = [...timings];

        if (currentIndex > 0) {
            newTimings[currentIndex - 1].endTime = currentTime;
        }
        newTimings[currentIndex].startTime = currentTime;

        setTimings(newTimings);
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);

        const wordElement = wordsContainerRef.current?.querySelector(`[data-index="${nextIndex}"]`);
        wordElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    }, [currentIndex, words.length, timings]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isOpen && event.code === 'Space' && event.target === document.body) {
                event.preventDefault();
                handleMarkTime();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleMarkTime]);

    const handleSave = () => {
        if (timings.length > 0 && timings[timings.length - 1].startTime > 0 && audioRef.current) {
            let finalTimings = [...timings];
            finalTimings[finalTimings.length - 1].endTime = audioRef.current.duration;
            onSave(finalTimings);
            toast({ title: "Timings Saved", description: "The new timings have been applied to the current story." });
            onOpenChange(false);
        } else {
            toast({ variant: "destructive", title: "Incomplete", description: "Please mark the timing for all words before saving." });
        }
    };
    
    const handleReset = () => {
        setTimings(words.map(word => ({ word, startTime: 0, endTime: 0 })));
        setCurrentIndex(0);
        if (audioRef.current) audioRef.current.currentTime = 0;
        toast({ title: "Timings Reset" });
    };

    const jumpToWord = (index: number) => {
        if (audioRef.current && timings[index] && timings[index].startTime > 0) {
            audioRef.current.currentTime = timings[index].startTime;
        }
        setCurrentIndex(index);
    };

    const handlePlaybackRateChange = (rate: string) => {
        const newRate = parseFloat(rate);
        setPlaybackRate(newRate);
        if (audioRef.current) {
            audioRef.current.playbackRate = newRate;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle>Manual Audio Timing Tool</DialogTitle>
                    <DialogDescription>
                        Play the audio. As each word is spoken, click it or press the Spacebar to mark its timing.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex-grow overflow-y-hidden flex flex-col gap-4">
                    <div className="p-4 border rounded-lg bg-muted/50">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <audio 
                                ref={audioRef}
                                src={audioUrl}
                                controls 
                                className="w-full flex-grow"
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                            >
                                Your browser does not support audio.
                            </audio>
                             <div className="flex items-center gap-2 shrink-0">
                                <Label htmlFor="speed-select-timing" className="text-sm">Speed:</Label>
                                <Select onValueChange={handlePlaybackRateChange} defaultValue="1">
                                    <SelectTrigger id="speed-select-timing" className="w-[80px]">
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
                    </div>

                    <div ref={wordsContainerRef} className="flex-grow p-4 border rounded-lg overflow-y-auto">
                        <div className="flex flex-wrap gap-x-2 gap-y-3">
                            {words.map((word, index) => (
                                <button
                                    key={index}
                                    data-index={index}
                                    onClick={() => jumpToWord(index)}
                                    className={cn(
                                        "p-2 rounded-md text-lg transition-all border-2 border-transparent greek-size",
                                        currentIndex === index && "bg-primary/20 border-primary scale-110 shadow-lg",
                                        timings[index].startTime > 0 && "bg-green-500/20 text-foreground"
                                    )}
                                >
                                    {word}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row sm:justify-between items-center gap-2 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        Progress: {currentIndex} / {words.length} words timed.
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleReset}><RotateCcw className="mr-2 h-4 w-4" /> Reset</Button>
                        <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Timings</Button>
                        <DialogClose asChild>
                            <Button variant="secondary">Close</Button>
                        </DialogClose>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default TimingTool;
