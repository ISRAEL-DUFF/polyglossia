"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { Languages, History, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import './HebrewVowelReconstruction.css';
import { HebrewInput } from '@/components/HebrewInput';
import { reconstructHebrewVowel, type ReconstructHebrewOutput } from '@/ai/flows/reconstruct-hebrew-vowel-flow';

const HebrewVowelReconstructionTool: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("שָׁלוֹם");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ReconstructHebrewOutput | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a Hebrew word."
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setResults(null);

    try {
      const data = await reconstructHebrewVowel({ word: searchTerm.trim() });
      
      if (data && data.reconstructedForm) {
        setResults(data);
        toast({
          title: "Reconstruction Complete",
          description: `Analysis for "${searchTerm}" is ready.`
        });
      } else {
        throw new Error("AI failed to return a valid reconstruction.");
      }
    } catch (error) {
      console.error("Error fetching reconstruction data:", error);
      toast({
        variant: "destructive",
        title: "Reconstruction Error",
        description: (error as Error).message || "Failed to get reconstruction. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-1">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-primary flex items-center justify-center gap-2">
            <Languages className="h-6 w-6" />
            Historical Hebrew Vowel Reconstruction
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Enter a Biblical Hebrew word to see its historical reconstruction and the vowel shifts involved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-6">
            <HebrewInput
              id="hebrewReconstructionInput"
              placeholder="e.g., שָׁלוֹם"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-lg flex-grow"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button type="submit" disabled={isLoading || !searchTerm.trim()} className="w-full sm:w-auto">
              {isLoading ? "Reconstructing..." : "Reconstruct"}
              <History className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {isLoading && (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {!isLoading && hasSearched && !results && (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-lg">Could not generate a reconstruction for "{searchTerm}".</p>
              <p>Please check the word or try again.</p>
            </div>
          )}

          {!isLoading && results && (
            <div className="space-y-6 mt-6 animate-fadeInUp">
              <Card className="bg-muted/30 border-dashed">
                <CardHeader>
                  <CardTitle className="text-xl">Reconstruction Summary</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
                  <div className="p-4 rounded-md">
                    <p className="text-sm text-muted-foreground">Biblical Hebrew</p>
                    <p className="text-2xl font-bold hebrew hebrew-size">{results.originalWord}</p>
                  </div>
                  <ArrowRight className="h-8 w-8 text-primary shrink-0" />
                   <div className="p-4 rounded-md">
                    <p className="text-sm text-muted-foreground">Proto-Semitic (Reconstructed)</p>
                    {results.reconstructedInHebrew && (
                      <p className="text-2xl font-bold hebrew hebrew-size">{results.reconstructedInHebrew}</p>
                    )}
                    {results.reconstructedForm && (
                      <p className="text-muted-foreground">({results.reconstructedForm})</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Transformation Steps</CardTitle>
                  <CardDescription>From Proto-Semitic to Biblical Hebrew</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {results.steps.map((step, index) => (
                      <AccordionItem key={index} value={`item-${index}`}>
                        <AccordionTrigger className="text-md font-semibold text-accent hover:no-underline">
                          {index + 1}. {step.stage}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground pl-2 border-l-2 border-border ml-2">
                          {step.explanation}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HebrewVowelReconstructionTool;
