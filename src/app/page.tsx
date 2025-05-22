
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import LanguageSelect from '@/components/LanguageSelect';
import type { Language } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function TextViewerPage() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | undefined>(undefined);
  const [text, setText] = useState<string>('');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Text Viewer</h1>
        <p className="text-muted-foreground">
          View and interact with texts in Ancient Greek, Hebrew, and Latin.
        </p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Enter Your Text</CardTitle>
          <CardDescription>Select a language and paste or type your text below.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <LanguageSelect
            value={selectedLanguage}
            onValueChange={(lang) => setSelectedLanguage(lang as Language)}
          />
          <Textarea
            placeholder={selectedLanguage ? `Enter ${selectedLanguage} text here...` : "Select a language first..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="min-h-[200px] text-base md:text-lg leading-relaxed font-serif"
            disabled={!selectedLanguage}
          />
        </CardContent>
      </Card>

      {text && selectedLanguage && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Formatted Text ({selectedLanguage})</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              <div className="whitespace-pre-wrap text-base md:text-lg leading-relaxed font-serif">
                {text}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
