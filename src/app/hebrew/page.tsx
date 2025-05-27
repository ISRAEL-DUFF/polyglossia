
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Search, X } from 'lucide-react'; 
import './hebrew.css'; 
import { Skeleton } from '@/components/ui/skeleton';
import HebrewOccurrenceDisplay from '@/app/hebrew/HebrewOccurrenceViewer';
import { Dialog, DialogTitle, DialogContent, DialogHeader, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { logHistoryEntry } from '@/lib/utils/historyLogger';
import LookupHistoryViewer from '@/components/LookupHistoryViewer';


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
  // const [results, setResults] = useState<MorphologyData[]>([]); // Results for direct display (if needed)
  const [structuredSummary, setStructuredSummary] = useState<Record<string, any> | null>(null);
  const [lexicalEntries, setLexicalEntries] = useState<LexicalEntries | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [namespace, setNamespace] = useState<string>("default"); 
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);


  const handleSearch = async (e?: React.FormEvent, currentSearchTerm = searchTerm) => {
    if (e) e.preventDefault();
    
    if (!currentSearchTerm.trim()) {
      toast({
        variant: "destructive",
        title: "Search term is required",
        description: "Please enter a Hebrew word or Strong's number"
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setLexicalEntries(null); 
    setStructuredSummary(null); 

    try {
      const response = await fetch(`${BASE_URL}/search/?word=${encodeURIComponent(currentSearchTerm.trim())}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'Failed to fetch results');
      }

      const data: HebrewLexiconResponse = await response.json();
      
      if (!data.lexicalEntries || data.totalOccurrences === 0) {
        // setResults([]);
        setLexicalEntries(null);
        setStructuredSummary(null);
        toast({
          variant: "default", 
          title: "No results found",
          description: "Try a different search term or check your spelling."
        });
      } else {
        // setResults(data.refs || []); 
        setStructuredSummary(data.structured);
        setLexicalEntries(data.lexicalEntries);
        toast({
          title: "Results found",
          description: `Found ${data.totalOccurrences} occurrences`
        });

        // Log to history
        if (data.lexicalEntries.strongsEntry?.entry?.lemma && namespace) {
            const logResult = await logHistoryEntry({
                word: currentSearchTerm.trim(),
                lemma: data.lexicalEntries.strongsEntry.entry.lemma,
                namespace: namespace,
                language: 'hebrew'
            });
            if (logResult.success) {
                toast({ title: "Logged", description: `"${currentSearchTerm.trim()}" added to history for "${namespace}".`});
                setHistoryRefreshTrigger(prev => prev + 1);
            } else {
                toast({ variant: "destructive", title: "History Log Failed", description: logResult.message});
            }
        }
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

  const handleNamespaceChange = (value: string) => {
    setNamespace(value);
    localStorage.setItem("hebrew_namespace", value); // Use a distinct key for Hebrew
  };

  useEffect(() => {
    const savedNamespace = localStorage.getItem("hebrew_namespace");
    if (savedNamespace) {
      setNamespace(savedNamespace);
    }
  }, []);

  const handleHistoryWordSelect = (selectedWord: string, selectedLemma?: string) => {
    setSearchTerm(selectedWord); // Update the input field
    // Optionally, pre-set lemma if your tool uses it directly, 
    // for now, just trigger search with the word form
    handleSearch(undefined, selectedWord); 
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
            Search for Hebrew words or Strong's numbers (e.g., H0120). Results will include Strong's, BDB, and occurrences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-4">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Hebrew Word or Strong's Number"
              className="flex-grow text-lg hebrew" // Added hebrew class for RTL input
              dir="rtl" // Ensure RTL direction for input field
            />
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </form>
          
          <div className="mb-6">
            <Label htmlFor="namespaceInputHebrew">Vocabulary Namespace (for saving & history)</Label>
            <Input
              id="namespaceInputHebrew"
              placeholder="Enter or select namespace"
              value={namespace}
              onChange={(e) => handleNamespaceChange(e.target.value)}
              className="mt-1"
            />
            {/* Future: Could add a Select here if there's an API to list namespaces */}
          </div>
          
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
                  <div className="prose dark:prose-invert max-w-none text-sm hebrew" 
                       dangerouslySetInnerHTML={{ __html: lexicalEntries.bdbEntry.xml_entry }} />
                </CardContent>
              </Card>

              {structuredSummary && Object.keys(structuredSummary).length > 0 && (
                <div className="mt-6">
                  <Button onClick={() => setIsModalOpen(true)} variant="default" className="w-full sm:w-auto">
                    View All Occurrences ({lexicalEntries?.strongsEntry ? Object.values(structuredSummary).reduce((acc, book: any) => acc + book.count, 0) : '...'} times)
                  </Button>
                </div>
              )}
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

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-full h-full max-w-none sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl flex flex-col p-0">
          <DialogHeader className="sticky top-0 bg-background z-10 p-4 border-b flex-row justify-between items-center">
            <DialogTitle className="text-lg font-semibold truncate">
              Occurrences of <span className="hebrew hebrew-size">{lexicalEntries?.strongsEntry.entry.lemma}</span> ({lexicalEntries?.strongsEntry.entry.xlit})
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogClose>
          </DialogHeader>
          <div className="flex-grow overflow-hidden"> 
            {structuredSummary && (
              <HebrewOccurrenceDisplay data={{
                structured: structuredSummary
              }} />
            )}
          </div>
           <DialogFooter className="p-4 border-t bg-muted shrink-0 sticky bottom-0 z-10">
            <DialogClose asChild>
                <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LookupHistoryViewer 
        language="hebrew" 
        onWordSelect={handleHistoryWordSelect} 
        refreshTrigger={historyRefreshTrigger}
      />
    </div>
  );
};

export default HebrewLexiconTool;
