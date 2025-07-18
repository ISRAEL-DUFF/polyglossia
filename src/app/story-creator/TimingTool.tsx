
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Play, Pause, Save, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
    
    // New state for timing modes
    const [timingMode, setTimingMode] = useState<'word' | 'sentence'>('word');
    const [sentenceStartIndex, setSentenceStartIndex] = useState<number | null>(null);

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
            setTimingMode('word');
            setSentenceStartIndex(null);
        }
    }, [isOpen, storyText]);

    const approximateWordTimings = (
        wordsInSentence: string[], 
        sentenceStartTime: number, 
        sentenceEndTime: number
    ): WordTiming[] => {
        const totalDuration = sentenceEndTime - sentenceStartTime;
        if (totalDuration <= 0 || wordsInSentence.length === 0) return [];

        const totalChars = wordsInSentence.reduce((acc, word) => acc + word.length, 0);
        if (totalChars === 0) return wordsInSentence.map(word => ({ word, startTime: sentenceStartTime, endTime: sentenceEndTime }));

        const timePerChar = totalDuration / totalChars;
        let currentWordStartTime = sentenceStartTime;
        
        return wordsInSentence.map(word => {
            const wordDuration = word.length * timePerChar;
            const wordEndTime = currentWordStartTime + wordDuration;
            const newTiming = { word, startTime: currentWordStartTime, endTime: wordEndTime };
            currentWordStartTime = wordEndTime;
            return newTiming;
        });
    };

    const handleSentenceMark = (clickedIndex: number) => {
        if (!audioRef.current) return;
        const currentTime = audioRef.current.currentTime;

        if (sentenceStartIndex === null) {
            // This is the first click, mark the start of the sentence and play
            audioRef.current.play();
            setSentenceStartIndex(clickedIndex);
            
            // Temporarily mark the start time for the first word
            const newTimings = [...timings];
            newTimings[clickedIndex].startTime = currentTime;
            newTimings[clickedIndex].endTime = 0; // Reset end time
            setTimings(newTimings);
            toast({ title: "Sentence Start Marked", description: "Click the last word of the sentence when it finishes." });
        } else {
            // This is the second click, mark the end and process, then pause
            audioRef.current.pause();
            const startIdx = Math.min(sentenceStartIndex, clickedIndex);
            const endIdx = Math.max(sentenceStartIndex, clickedIndex);

            const sentenceWords = words.slice(startIdx, endIdx + 1);
            const sentenceStartTime = timings[startIdx].startTime; // Get the recorded start time
            const sentenceEndTime = currentTime;
            
            const approximatedTimings = approximateWordTimings(sentenceWords, sentenceStartTime, sentenceEndTime);

            const finalTimings = [...timings];
            approximatedTimings.forEach((timing, index) => {
                finalTimings[startIdx + index] = timing;
            });

            setTimings(finalTimings);
            setSentenceStartIndex(null); // Ready for the next sentence
            toast({ title: "Sentence Timed", description: `Approximated timings for ${sentenceWords.length} words. Click the first word of the next sentence to continue.` });
        }
    };


    const handleMarkTime = useCallback(() => {
        if (timingMode !== 'word' || !audioRef.current || currentIndex >= words.length) return;

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

    }, [currentIndex, words.length, timings, timingMode]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isOpen && event.code === 'Space' && event.target === document.body) {
                event.preventDefault();
                if (timingMode === 'word') {
                    handleMarkTime();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleMarkTime, timingMode]);

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
        setSentenceStartIndex(null);
        if (audioRef.current) audioRef.current.currentTime = 0;
        toast({ title: "Timings Reset" });
    };

    const jumpToWord = (index: number) => {
        if (timingMode === 'sentence') {
            handleSentenceMark(index);
            return;
        }

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
    
    const getInstructionText = () => {
        if (timingMode === 'word') {
            return "As each word is spoken, click it or press the Spacebar to mark its timing.";
        }
        if (timingMode === 'sentence') {
            return sentenceStartIndex === null 
                ? "Click the FIRST word of a sentence. Audio will play and its start time will be marked."
                : "Click the LAST word of the sentence when it ends. Audio will pause and timings will be set.";
        }
        return "";
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-4 sm:p-6">
                <DialogHeader>
                    <DialogTitle>Manual Audio Timing Tool</DialogTitle>
                    <DialogDescription>
                       {getInstructionText()}
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
                        <div className="mt-4">
                            <Label className="text-sm font-medium">Timing Mode</Label>
                             <RadioGroup defaultValue="word" value={timingMode} onValueChange={(val) => setTimingMode(val as 'word' | 'sentence')} className="flex items-center gap-4 mt-2">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="word" id="mode-word" />
                                    <Label htmlFor="mode-word">Word by Word</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="sentence" id="mode-sentence" />
                                    <Label htmlFor="mode-sentence">Sentence</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>

                    <div ref={wordsContainerRef} className="flex-grow p-4 border rounded-lg overflow-y-auto">
                        <div className="flex flex-wrap gap-x-4 gap-y-6">
                            {words.map((word, index) => (
                                <div key={index} className="flex flex-col items-center text-center">
                                    <button
                                        data-index={index}
                                        onClick={() => jumpToWord(index)}
                                        className={cn(
                                            "p-2 rounded-md text-lg transition-all border-2 border-transparent greek-size",
                                            timingMode === 'word' && currentIndex === index && "bg-primary/20 border-primary scale-110 shadow-lg",
                                            timingMode === 'sentence' && sentenceStartIndex === index && "bg-blue-500/20 border-blue-500 scale-110 shadow-lg",
                                            timings[index]?.startTime > 0 && "bg-green-500/20 text-foreground"
                                        )}
                                    >
                                        {word}
                                    </button>
                                     {timings[index]?.startTime > 0 && (
                                        <div className="text-xs text-muted-foreground mt-1 font-mono">
                                            {timings[index].startTime.toFixed(2)}s
                                            {timings[index].endTime > 0 && ` - ${timings[index].endTime.toFixed(2)}s`}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex sm:justify-between items-center gap-2 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                        Progress: {timingMode === 'word' ? `${currentIndex} / ${words.length} words timed.` : 'Ready to mark a sentence.'}
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
