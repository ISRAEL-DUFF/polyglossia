
"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface BookOccurrence {
  book_name: string;
  count: number;
}

interface WordOccurrence {
  word: string;
  bookName: string;
  totalOccurrences: number;
  occurrences: {
    [chapter: string]: OccurrenceDetail[];
  };
}

interface OccurrenceDetail {
  id: number;
  greek_word: string;
  lemma: string;
  morph_code: string;
  case?: string;
  number?: string;
  gender?: string;
  tense?: string;
  voice?: string;
  mood?: string;
  person?: string;
  declension?: string;
  part_of_speech?: string;
  book_name: string;
  chapter: string;
  verse: string;
}

const BASE_URL = 'https://www.eazilang.gleeze.com/api/greek'
// const BASE_URL = 'http://localhost:3001'


const OccurrenceViewerView = ({ word, corpus }: { word: string; corpus: 'lxx' | 'gnt' }) => {
  const [bookData, setBookData] = useState<BookOccurrence[]>([]);
  const [totalOccurrence, setTotalOccurrence] = useState<number>(0);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [chapterData, setChapterData] = useState<WordOccurrence | null>(null);
  const [loadingChapters, setLoadingChapters] = useState(false);


  useEffect(() => {
    if (!word) return;
    fetch(`${BASE_URL}/${corpus ?? 'gnt'}/occurrence?lemma_word=${encodeURIComponent(word)}`)
      .then((res) => res.json())
      .then((data: BookOccurrence[]) => {
        let total = 0;
        for(const d of data) {
          total += d.count
        }

        setTotalOccurrence(total);
        setBookData(data);
      })
      .catch(error => console.error(`Error fetching occurrences for ${word} in ${corpus}:`, error));
  }, [word, corpus]);

  const fetchChapters = async (bookName: string) => {
    if (!word) return;
    setLoadingChapters(true);
    try {
        const res = await fetch(`${BASE_URL}/${corpus ?? 'gnt'}/occurrence?lemma_word=${word}&book_name=${encodeURIComponent(bookName)}`);
        const data = await res.json();
        setChapterData(data);
        setSelectedBook(bookName);
    } catch (error) {
        console.error(`Error fetching chapter data for ${bookName}:`, error);
    } finally {
        setLoadingChapters(false);
    }
  };

  const morphString = (occ: OccurrenceDetail) => {
    let allowedFields = ["case", "number", "gender", "tense", "voice", "mood", "person", "declension"]
    const fn = (k: string, v?: string) => {
      if(allowedFields.includes(k) && v) {
        return `${v}, `
      } else return ''
    }

    let morphStr = '';
    for(const k in occ) {
      // Ensure k is a key of occ and not from prototype chain
      if (Object.prototype.hasOwnProperty.call(occ, k)) {
        morphStr += fn(k, occ[k as keyof OccurrenceDetail])
      }
    }
    // Remove trailing comma and space if present
    morphStr = morphStr.replace(/, $/, '');


    return `${morphStr}${occ.part_of_speech ? ` (${occ.part_of_speech})` : ''}`;
  }

  if (!word) {
    return <p className="p-4 text-muted-foreground">Please provide a word to view occurrences.</p>;
  }

  return (
    <div className="space-y-4 p-4">
      <h4 className="text-sm">The word <span className="font-semibold text-lg text-primary">{word}</span> appears <span className="font-semibold text-primary"> { totalOccurrence } </span>  times in the {corpus === 'gnt' ? 'Greek New Testament' : "LXX"}</h4>
      <ScrollArea className="h-64 border rounded p-2 bg-background">
        {bookData.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {bookData.map((book) => (
                <Card key={book.book_name} onClick={() => fetchChapters(book.book_name)} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-3">
                    <p className="font-medium text-sm text-foreground">{book.book_name}</p>
                    <p className="text-xs text-muted-foreground">{book.count} occurrences</p>
                </CardContent>
                </Card>
            ))}
            </div>
        ) : (
            <p className="text-muted-foreground">No book data available.</p>
        )}
      </ScrollArea>

      {selectedBook && chapterData && (
        <div>
          <h3 className="text-lg font-semibold text-foreground">Occurrences in {selectedBook}</h3>
          <ScrollArea className="h-64 border rounded p-2 mt-2 bg-background">
            {Object.keys(chapterData.occurrences).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                {Object.entries(chapterData.occurrences).map(([chapter, occurrences]) => (
                    <Card key={chapter}>
                    <CardContent className="p-3">
                        <h4 className="font-medium text-foreground">Chapter {chapter.replace("chapter_", "")}</h4>
                        <ul className="text-sm mt-1 space-y-1">
                        {occurrences.map((occ) => (
                            <li key={occ.id} className="border-b border-border pb-1 last:border-b-0">
                            <span className="font-semibold text-primary">{occ.greek_word}</span> – <span className="text-xs text-muted-foreground">{ morphString(occ) }</span>
                            <p className="text-xs text-muted-foreground">verse {occ.verse}</p>
                            </li>
                        ))}
                        </ul>
                    </CardContent>
                    </Card>
                ))}
                </div>
            ) : (
                <p className="text-muted-foreground">No occurrences found in this book.</p>
            )}
          </ScrollArea>
        </div>
      )}

      {loadingChapters && <p className="text-muted-foreground">Loading chapter data...</p>}
    </div>
  );
};


const OccurrenceViewer = ({ word }: { word: string; corpus?: 'lxx' | 'gnt' }) => {
  const [activeTab, setActiveTab] = useState<'gnt' | 'lxx'>('gnt');

  if (!word) {
    return <p className="p-4 text-muted-foreground text-center">No word selected for occurrence viewing.</p>;
  }

  return (
    <div className="p-1 sm:p-4 space-y-4">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'gnt' | 'lxx')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="gnt">New Testament</TabsTrigger>
          <TabsTrigger value="lxx">LXX</TabsTrigger>
        </TabsList>

        <TabsContent value="gnt">
          <OccurrenceViewerView word={word} corpus='gnt' />
        </TabsContent>

        <TabsContent value="lxx">
          <OccurrenceViewerView word={word} corpus="lxx"/>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OccurrenceViewer;

    