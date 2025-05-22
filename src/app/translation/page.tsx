
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
import { getTranslation, type TranslationAssistanceInput, type TranslationAssistanceOutput } from '@/ai/flows/translation-assistance';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  language: z.custom<Language>((val) => ['Ancient Greek', 'Hebrew', 'Latin'].includes(val as string), {
    message: "Please select a language.",
  }),
  text: z.string().min(1, "Text cannot be empty."),
});

type FormValues = z.infer<typeof formSchema>;

export default function TranslationPage() {
  const [translationResult, setTranslationResult] = useState<TranslationAssistanceOutput | null>(null);
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
    setTranslationResult(null);
    try {
      const result = await getTranslation(data as TranslationAssistanceInput);
      setTranslationResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Translation Assistant</h1>
        <p className="text-muted-foreground">
          Translate passages into modern English with AI-powered suggestions.
        </p>
      </header>

      <Card className="shadow-lg">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Translate Text</CardTitle>
              <CardDescription>Select the language and enter the text you want to translate.</CardDescription>
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
                    <FormLabel>Text to Translate</FormLabel>
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
                Translate
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

      {translationResult && (
        <div className="space-y-4">
          <Alert variant="default" className="border-accent">
            <AlertTriangle className="h-4 w-4 text-accent" />
            <AlertTitle className="text-accent">Disclaimer</AlertTitle>
            <AlertDescription>
              {translationResult.disclaimer}
            </AlertDescription>
          </Alert>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Translation Result</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] w-full rounded-md border p-4">
                <p className="whitespace-pre-wrap text-base leading-relaxed">{translationResult.translation}</p>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
