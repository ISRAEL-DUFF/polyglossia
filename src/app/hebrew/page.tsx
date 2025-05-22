
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, X } from 'lucide-react'; // Added X for close button
import './hebrew.css'; // For Hebrew font support
import { Skeleton } from '@/components/ui/skeleton';
import HebrewOccurrenceDisplay from '@/app/hebrew/HebrewOccurrenceViewer';
import { Dialog, DialogTitle, DialogContent, DialogHeader, DialogClose } from '@/components/ui/dialog'; // Added DialogClose


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

const BASE_URL = 'https://www.eazilang.gleeze.com/api/hebrew'; 

const HebrewLexiconTool = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<MorphologyData[]>([]);
  const [structuredSummary, setStructuredSummary] = useState<Record<string, any> | null>(null);
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
    setLexicalEntries(null); // Clear previous results
    setStructuredSummary(null); // Clear previous summary

    try {
      const response = await fetch(`${BASE_URL}/search/?word=${encodeURIComponent(searchTerm.trim())}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'Failed to fetch results');
      }

      const data: HebrewLexiconResponse = await response.json();
      
      if (!data.lexicalEntries || data.totalOccurrences === 0) {
        setResults([]);
        setLexicalEntries(null);
        setStructuredSummary(null);
        toast({
          variant: "default", // Changed to default as it's not an error, just no results
          title: "No results found",
          description: "Try a different search term or check your spelling."
        });
      } else {
        // setResults(data.refs || []); // Assuming refs might be used later or can be removed if not
        setStructuredSummary(data.structured);
        setLexicalEntries(data.lexicalEntries);
        toast({
          title: "Results found",
          description: `Found ${data.totalOccurrences} occurrences`
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast({
        variant: "destructive",
        title: "Search failed",
        description: `Connection to lexicon server failed or an error occurred. Please try again.`
      });
      setStructuredSummary(null);
      setLexicalEntries(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2 text-primary">
            <Search className="h-6 w-6" />
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
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          )}

          {!isLoading && lexicalEntries && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Strong's Lexical Entry</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm">
                  <p><strong>Strong's Number:</strong> {lexicalEntries.strongsEntry.strong_number}</p>
                  <p><strong>Lemma:</strong> <span className="hebrew hebrew-size">{lexicalEntries.strongsEntry.entry.lemma}</span></p>
                  <p><strong>Transliteration:</strong> {lexicalEntries.strongsEntry.entry.xlit}</p>
                  <p><strong>Pronunciation:</strong> {lexicalEntries.strongsEntry.entry.pron}</p>
                  <p><strong>Derivation:</strong> <span dangerouslySetInnerHTML={{ __html: lexicalEntries.strongsEntry.entry.derivation || '' }}/></p>
                  <p><strong>Strong's Definition:</strong> {lexicalEntries.strongsEntry.entry.strongs_def}</p>
                  <p><strong>KJV Definition:</strong> {lexicalEntries.strongsEntry.entry.kjv_def}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">BDB Lexical Entry</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: lexicalEntries.bdbEntry.xml_entry }} />
                </CardContent>
              </Card>

              {structuredSummary && Object.keys(structuredSummary).length > 0 && (
                <div className="mt-6">
                  <Button onClick={() => setIsModalOpen(true)} variant="default" className="w-full sm:w-auto">
                    View All Occurrences
                  </Button>
                </div>
              )}
              
              {/* Results table - consider if this is still needed if all occurrences are in the modal */}
              {/* 
              {results.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-xl">Sample Occurrences</CardTitle>
                  </CardHeader>
                  <CardContent>
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
                          {results.slice(0, 5).map((row, index) => ( // Display first 5 as sample
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
                  </CardContent>
                </Card>
              )}
              */}
            </div>
          )}

          {!isLoading && hasSearched && !lexicalEntries && (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No results found for "{searchTerm}".</p>
              <p>Please try a different search term or check your spelling.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full-Page Modal for Occurrences */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-full h-full max-w-none sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl flex flex-col p-0">
          <DialogHeader className="sticky top-0 bg-background z-10 p-4 border-b flex-row justify-between items-center">
            <DialogTitle className="text-lg font-semibold">
              Occurrences of <span className="hebrew hebrew-size">{lexicalEntries?.strongsEntry.entry.lemma}</span> ({lexicalEntries?.strongsEntry.entry.xlit})
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </DialogHeader>
          <div className="flex-grow overflow-hidden"> {/* This div ensures HebrewOccurrenceDisplay can be h-full */}
            {structuredSummary && (
              <HebrewOccurrenceDisplay data={{
                structured: structuredSummary
              }} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HebrewLexiconTool;

