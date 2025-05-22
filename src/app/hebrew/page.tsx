
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search } from 'lucide-react';
import './hebrew.css'; // For Hebrew font support
import { Skeleton } from '@/components/ui/skeleton';
import HebrewOccurrenceDisplay from '@/app/hebrew/HebrewOccurrenceViewer';
import { Dialog, DialogTitle, DialogContent, DialogHeader } from '@/components/ui/dialog';

interface MorphologyData {
  word: string;
  strongNumber: string;
  morphology: {
    morph: string;
  };
  book: string;
  chapter: number;
  verse: number;
}

interface StrongsEntry {
  strong_number: string;
  entry: {
    lemma: string;
    xlit: string;
    pron: string;
    derivation: string;
    strongs_def: string;
    kjv_def: string;
  };
}

interface LexicalEntries {
  strongsEntry: StrongsEntry;
  bdbEntry: {
    xml_entry: string;
  };
}

interface HebrewLexiconResponse {
  refs: MorphologyData[];
  lexicalEntries: LexicalEntries;
  totalOccurrences: number,
  structured: Record<string, any>
}

// const BASE_URL = 'http://localhost:3000'; // Update this to your server URL
// const BASE_URL = 'http://68.168.222.218:3000'; // vps3057233	
const BASE_URL = 'https://www.eazilang.gleeze.com/api/hebrew'; // 

const HebrewLexiconTool = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<MorphologyData[]>([]);
  const [structuredSummary, setStructuredSummary] = useState<Record<string, any>>({});
  const [lexicalEntries, setLexicalEntries] = useState<LexicalEntries | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) {
      toast({
        variant: "destructive",
        title: "Search term is required",
        description: "Please enter a Hebrew word or Strong's number"
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      // const response = await fetch(`${BASE_URL}/search-2`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ word: searchTerm.trim() })
      // });

      const response = await fetch(`${BASE_URL}/search/?word=${encodeURIComponent(searchTerm.trim())}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'Failed to fetch results');
      }

      const data: HebrewLexiconResponse = await response.json();
      
      if (!data.lexicalEntries) {
        setResults([]);
        setLexicalEntries(null);
        toast({
          variant: "destructive",
          title: "No results found",
          description: "Try a different search term"
        });
      } else {
        // setResults(data.refs || []);
        console.log(data)
        setStructuredSummary(data.structured);
        setLexicalEntries(data.lexicalEntries);
        toast({
          title: "Results found",
          // description: `Found ${data.refs.length} occurrences`
          description: `Found ${data.totalOccurrences} occurrences`
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        variant: "destructive",
        title: "Search failed",
        description: `Connection to lexicon server failed. Make sure the server is running at ${BASE_URL}`
      });
      // setResults([]);
      setStructuredSummary(null);
      setLexicalEntries(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Search className="h-6 w-6 text-slate-600" />
            Hebrew Lexicon Lookup
          </CardTitle>
          <CardDescription>
            Search for Hebrew words or Strong's numbers (e.g., H0120)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Hebrew Word or Strong's Number"
              className="flex-grow"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </form>
          
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-36 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}

          {!isLoading && lexicalEntries && structuredSummary && (
            <>
              {/* <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium mb-3">Morphology</h3>
                <div className="space-y-2">
                  <p><strong>Word:</strong> <span className="hebrew hebrew-size">{results[0].word}</span></p>
                  <p><strong>Strong's Number:</strong> {results[0].strongNumber}</p>
                  <p><strong>Morphology:</strong> {results[0].morphology.morph}</p>
                  <p><strong>Reference:</strong> {results[0].book} {results[0].chapter}:{results[0].verse}</p>
                </div>
              </div> */}

              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium mb-3">Strong's Lexical Entry</h3>
                <div className="space-y-2">
                  <p><strong>Strong's Number:</strong> {lexicalEntries.strongsEntry.strong_number}</p>
                  <p><strong>Lemma:</strong> <span className="hebrew hebrew-size">{lexicalEntries.strongsEntry.entry.lemma}</span></p>
                  <p><strong>Transliteration:</strong> {lexicalEntries.strongsEntry.entry.xlit}</p>
                  <p><strong>Pronunciation:</strong> {lexicalEntries.strongsEntry.entry.pron}</p>
                  <p><strong>Derivation:</strong> {lexicalEntries.strongsEntry.entry.derivation}</p>
                  <p><strong>Strong's Definition:</strong> {lexicalEntries.strongsEntry.entry.strongs_def}</p>
                  <p><strong>KJV Definition:</strong> {lexicalEntries.strongsEntry.entry.kjv_def}</p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium mb-3">BDB Lexical Entry</h3>
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: lexicalEntries.bdbEntry.xml_entry }} />
              </div>

              <h3 className="text-lg font-medium mt-8 mb-3">Occurrences</h3>

              {/* <HebrewOccurrenceDisplay data={structuredData}/> */}

              <div>
                {/* Trigger Button */}
                <Button onClick={() => setIsModalOpen(true)} variant="default">
                  View Occurrences
                </Button>

                {/* Full-Page Modal */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogContent className="w-full h-full p-0">
                    <DialogHeader className="sticky top-0 bg-white z-10 p-4 border-b">
                      <DialogTitle className="text-lg font-semibold">Occurrences</DialogTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsModalOpen(false)}
                        className="absolute top-4 right-4"
                      >
                        Close
                      </Button>
                    </DialogHeader>
                    <div className="h-full">
                      <HebrewOccurrenceDisplay data={{
                        structured: structuredSummary
                      }} />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Word</TableHead>
                      <TableHead className="text-center">Strong's Number</TableHead>
                      <TableHead className="text-center">Morphology</TableHead>
                      <TableHead className="text-center">Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-center hebrew hebrew-size">{row.word}</TableCell>
                        <TableCell className="text-center">{row.strongNumber}</TableCell>
                        <TableCell className="text-center">{row.morphology.morph}</TableCell>
                        <TableCell className="text-center">{row.book} {row.chapter}:{row.verse}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}

          {!isLoading && hasSearched && (!lexicalEntries || !structuredSummary) && (
            <div className="text-center py-12 text-gray-500">
              <p>No results found. Try a different search term.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HebrewLexiconTool;
