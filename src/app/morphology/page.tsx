
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
import { analyzeMorphology, type MorphologicalAnalysisInput, type MorphologicalAnalysisOutput } from '@/ai/flows/morphological-analysis';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  language: z.custom<Language>((val) => ['Ancient Greek', 'Hebrew', 'Latin'].includes(val as string), {
    message: "Please select a language.",
  }),
  text: z.string().min(1, "Text cannot be empty."),
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
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Morphological Analyzer</h1>
        <p className="text-muted-foreground">
          Get detailed part-of-speech tagging and parsing for ancient texts.
        </p>
      </header>

      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Analyze Text</CardTitle>
              <CardDescription>Select the language and enter the text you want to analyze.</CardDescription>
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
                        placeholder="Enter text here..."
                        {...field}
                        rows={8}
                        className="min-h-[150px] font-serif"
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

      {analysisResult && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Analysis Result</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              <pre className="whitespace-pre-wrap text-sm font-mono">{analysisResult.analysis}</pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
