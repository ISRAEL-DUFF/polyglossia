
"use client";

import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import LanguageSelect from '@/components/LanguageSelect';
import type { Language } from '@/types';
import { analyzeMorphology, type MorphologicalAnalysisInput, type MorphologicalAnalysisOutput, type WordAnalysis } from '@/ai/flows/morphological-analysis';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  language: z.custom<Language>((val) => ['Ancient Greek', 'Hebrew', 'Latin'].includes(val as string), {
    message: "Please select a language.",
  }),
  text: z.string().min(1, "Text or word(s) cannot be empty."),
});

type FormValues = z.infer<typeof formSchema>;

export default function MorphologyPage() {
  const [analysisResult, setAnalysisResult] = useState<MorphologicalAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      language: undefined,
      text: '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    try {
      const result = await analyzeMorphology(data as MorphologicalAnalysisInput);
      setAnalysisResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred during analysis.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderWordAnalysis = (wordAnalysis: WordAnalysis) => (
    <Card key={wordAnalysis.word + Math.random()} className="shadow-md mb-4">
      <CardHeader>
        <CardTitle className="text-2xl font-serif text-primary">{wordAnalysis.word}</CardTitle>
        <CardDescription>Lemma: <span className="font-semibold">{wordAnalysis.lemma}</span> | Part of Speech: <Badge variant="secondary">{wordAnalysis.partOfSpeech}</Badge></CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-muted-foreground mb-1">Morphological Details:</h4>
            {wordAnalysis.morphology.length > 0 ? (
              <ul className="list-disc list-inside pl-2 space-y-1 text-sm">
                {wordAnalysis.morphology.map((detail, index) => (
                  <li key={index}>
                    <span className="font-medium">{detail.feature}:</span> {detail.value}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No detailed morphology provided.</p>
            )}
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold text-muted-foreground mb-1">Definitions:</h4>
            {wordAnalysis.definitions.length > 0 ? (
               <ul className="list-decimal list-inside pl-2 space-y-1 text-sm">
                {wordAnalysis.definitions.map((def, index) => (
                  <li key={index}>{def}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No definitions provided.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Morphological Analyzer</h1>
        <p className="text-muted-foreground">
          Enter a word or short text to get its lexical entries and detailed morphological data.
        </p>
      </header>

      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Analyze Text</CardTitle>
              <CardDescription>Select the language and enter the word(s) you want to analyze.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Language</FormLabel>
                    <LanguageSelect 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={isLoading}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Text to Analyze</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter word(s) here (e.g., λόγος, amo, בְּרֵאשִׁית)"
                        {...field}
                        rows={3}
                        className="min-h-[100px] font-serif text-lg"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Analyze
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {error && (
        <Card className="shadow-lg border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {analysisResult && analysisResult.analyzedWords && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              Found {analysisResult.analyzedWords.length} word(s) analyzed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analysisResult.analyzedWords.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-450px)] w-full pr-4"> {/* Adjusted height */}
                {analysisResult.analyzedWords.map(renderWordAnalysis)}
              </ScrollArea>
            ) : (
              <p className="text-muted-foreground">No analysis data found for the provided text.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

