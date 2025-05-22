"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'; // Example from a UI library

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
  // const [bookCorpus, setBookCorpus] = useState(corpus ?? 'gnt');
  // const [activeTab, setActiveTab] = useState<'gnt' | 'lxx'>('gnt'); // Default to 'gnt'


  useEffect(() => {
    fetch(`${BASE_URL}/${corpus ?? 'gnt'}/occurrence?lemma_word=${encodeURIComponent(word)}`)
      .then((res) => res.json())
      .then((data: BookOccurrence[]) => {
        let total = 0;
        for(const d of data) {
          total += d.count
        }

        setTotalOccurrence(total);
        setBookData(data);
      });
  }, [word]);

  const fetchChapters = async (bookName: string) => {
    setLoadingChapters(true);
    const res = await fetch(`${BASE_URL}/${corpus ?? 'gnt'}/occurrence?lemma_word=${word}&book_name=${encodeURIComponent(bookName)}`);
    const data = await res.json();
    setChapterData(data);
    setSelectedBook(bookName);
    setLoadingChapters(false);
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
      morphStr += fn(k, occ[k])
    }

    return morphStr + `(${occ.part_of_speech})`;
  }

  return (
    <div className="space-y-4">
      <h4 className="text-sm">The word <span className="font-semibold text-l">{word}</span> appears <span className="font-semibold"> { totalOccurrence } </span>  times in the {corpus === 'gnt' ? 'Greek New Testament' : "LXX"}</h4>
      <ScrollArea className="h-64 border rounded p-2">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {bookData.map((book) => (
            <Card key={book.book_name} onClick={() => fetchChapters(book.book_name)} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
              <CardContent className="p-3">
                <p className="font-medium text-sm">{book.book_name}</p>
                <p className="text-sm text-muted-foreground">{book.count} occurrences</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {selectedBook && chapterData && (
        <div>
          <h3 className="text-lg font-semibold">Occurrences in {selectedBook}</h3>
          <ScrollArea className="h-64 border rounded p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {Object.entries(chapterData.occurrences).map(([chapter, occurrences]) => (
                <Card key={chapter}>
                  <CardContent className="p-3">
                    <h4 className="font-medium">Chapter {chapter.replace("chapter_", "")}</h4>
                    <ul className="text-sm mt-1 space-y-1">
                      {occurrences.map((occ) => (
                        <li key={occ.id} className="border-b pb-1">
                          {/* <span className="font-semibold">{occ.greek_word}</span> – {occ.case}, {occ.number}, {occ.gender} ({occ.part_of_speech}) */}
                          <span className="font-semibold">{occ.greek_word}</span> – { morphString(occ) }

                          <p className="text-sm text-muted-foreground">verse {occ.verse}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {loadingChapters && <p>Loading chapter data...</p>}
    </div>
  );
};


const OccurrenceViewer = ({ word }: { word: string; corpus?: 'lxx' | 'gnt' }) => {
  const [activeTab, setActiveTab] = useState<'gnt' | 'lxx'>('gnt'); // Default to 'gnt'

  return (
    <div className="p-4 space-y-4">

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="flex space-x-2">
          <TabsTrigger value="gnt">New Testament</TabsTrigger>
          <TabsTrigger value="lxx">LXX</TabsTrigger>
        </TabsList>

        {/* Greek New Testament Tab */}
        <TabsContent value="gnt">
          <OccurrenceViewerView word={ word} corpus='gnt' />
        </TabsContent>

        {/* LXX Tab */}
        <TabsContent value="lxx">
          <OccurrenceViewerView word={ word } corpus="lxx"/>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OccurrenceViewer;
