
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, History, PlusIcon, Library, Search as SearchIcon, X } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { NamespaceEntry } from '@/types';
import { WordInput } from './WordInput';

type HistoryLanguage = 'greek' | 'hebrew' | 'latin';

interface HistoryEntry {
  id: string;
  createdAt: string;
  language: string;
  namespace: string;
  word: string;
  lemma?: string;
  frequency: number;
  updatedAt: string;
}

interface IndexedHistoryResponse {
  index: string[];
  indexList: Record<string, HistoryEntry[]>;
}

interface LookupHistoryViewerProps {
  language: HistoryLanguage;
  onWordSelect: (word: string, lemma?: string) => void;
  onNamespaceSelect: (namespace: string, entry: NamespaceEntry) => void;
  refreshTrigger?: number;
}

const BASE_URL = 'https://www.eazilang.gleeze.com';
// const BASE_URL = 'http://localhost:3001'; // For local development

const greekNormalization = {
  normalizeGreek: (lemma: string) =>{
    return lemma
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\p{Script=Greek}]/gu, "")
      .toLowerCase();
  },

  normalizeLemma(lemma: string) {
    return lemma.replace(/\d+$/, '');
  }
}

const LookupHistoryViewer: React.FC<LookupHistoryViewerProps> = ({ language, onWordSelect, onNamespaceSelect, refreshTrigger }) => {
  const [namespacesList, setNamespacesList] = useState<NamespaceEntry[]>([]);
  const [selectedHistoryNamespace, setSelectedHistoryNamespace] = useState<string | null>(null);
  const [indexedHistoryData, setIndexedHistoryData] = useState<IndexedHistoryResponse | null>(null);
  const [selectedIndexChar, setSelectedIndexChar] = useState<string | null>(null);
  const [isLoadingNamespaces, setIsLoadingNamespaces] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNamespace, setNewNamespace] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [isAllHistoryModalOpen, setIsAllHistoryModalOpen] = useState(false);
  const [allLanguageHistoryData, setAllLanguageHistoryData] = useState<IndexedHistoryResponse | null>(null);
  const [isLoadingAllHistory, setIsLoadingAllHistory] = useState(false);
  const [allHistorySearchTerm, setAllHistorySearchTerm] = useState("");
  const [allHistorySelectedIndexChar, setAllHistorySelectedIndexChar] = useState<string | null>(null);
  const [filteredAllLanguageHistoryData, setFilteredAllLanguageHistoryData] = useState<IndexedHistoryResponse | null>(null);
  
  const baseUrl = () => {
    switch(language) {
      case 'hebrew':
        return `${BASE_URL}/api/hebrew`;
      case 'latin':
        return `${BASE_URL}/api/latin`;
      case 'greek':
      default:
        return `${BASE_URL}/api/greek`;
    }
  }


  const fetchNamespaces = useCallback(async () => {
    setIsLoadingNamespaces(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl()}/lookup-history/namespaces?language=${language}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch namespaces. Status: ${response.status}`);
      }
      const data: NamespaceEntry[] = await response.json();
      setNamespacesList(data);
      if (data.length > 0 && !selectedHistoryNamespace) {
         const savedNs = localStorage.getItem(`${language}_history-namespace`);
         if (savedNs && data.some(ns => ns.namespace === savedNs)) {
            setSelectedHistoryNamespace(savedNs);
         } else if (data[0]?.namespace) {
            setSelectedHistoryNamespace(data[0].namespace);
         }
      } else if (data.length === 0) {
        setSelectedHistoryNamespace(null);
        setIndexedHistoryData(null);
        setSelectedIndexChar(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unknown error occurred while fetching namespaces.";
      setError(message);
      toast({ variant: "destructive", title: "Error", description: message });
      setNamespacesList([]);
    } finally {
      setIsLoadingNamespaces(false);
    }
  }, [language, toast, selectedHistoryNamespace]);

  const fetchHistoryEntries = useCallback(async (namespaceToFetch: string | null) => {
    if (!namespaceToFetch) {
      setIndexedHistoryData(null);
      setSelectedIndexChar(null);
      return;
    }
    setIsLoadingHistory(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl()}/lookup-history/indexed-entries?language=${language}&namespace=${encodeURIComponent(namespaceToFetch)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch history for namespace "${namespaceToFetch}". Status: ${response.status}`);
      }
      const data: IndexedHistoryResponse = await response.json();
      
      // Sort the index before setting state
      if (data.index) {
        data.index = language === 'greek'
          ? [...data.index].sort((a, b) => a.localeCompare(b, 'el'))
          : [...data.index].sort();
      }

      setIndexedHistoryData(data);
      if (data.index && data.index.length > 0) {
        setSelectedIndexChar(data.index[0]);
      } else {
        setSelectedIndexChar(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : `An unknown error occurred while fetching history for ${namespaceToFetch}.`;
      setError(message);
      toast({ variant: "destructive", title: "Error", description: message });
      setIndexedHistoryData(null);
      setSelectedIndexChar(null);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [language, toast]);

  useEffect(() => {
    fetchNamespaces();
  }, [fetchNamespaces, language]);

  useEffect(() => {
    if (selectedHistoryNamespace) {
      fetchHistoryEntries(selectedHistoryNamespace);
      const currentNsEntry = namespacesList.find(ns => ns.namespace === selectedHistoryNamespace);
      if (currentNsEntry) {
        onNamespaceSelect(selectedHistoryNamespace, currentNsEntry);
      }
    } else {
      setIndexedHistoryData(null);
      setSelectedIndexChar(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHistoryNamespace, refreshTrigger, namespacesList]);

  const fetchAllLanguageHistory = useCallback(async () => {
    setIsLoadingAllHistory(true);
    setError(null);
    try {
      const response = await fetch(`${baseUrl()}/lookup-history/all-indexed-entries?language=${language}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch all history for ${language}. Status: ${response.status}`);
      }
      const data: IndexedHistoryResponse = await response.json();

      // Sort the index before setting state
      if (data.index) {
        data.index = language === 'greek'
          ? [...data.index].sort((a, b) => a.localeCompare(b, 'el'))
          : [...data.index].sort();
      }

      setAllLanguageHistoryData(data);
      setFilteredAllLanguageHistoryData(data); 
      if (data.index && data.index.length > 0) {
        setAllHistorySelectedIndexChar(data.index[0]);
      } else {
        setAllHistorySelectedIndexChar(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : `An unknown error occurred while fetching all history for ${language}.`;
      setError(message); 
      toast({ variant: "destructive", title: "Error Fetching All History", description: message });
      setAllLanguageHistoryData(null);
      setFilteredAllLanguageHistoryData(null);
      setAllHistorySelectedIndexChar(null);
    } finally {
      setIsLoadingAllHistory(false);
    }
  }, [language, toast]);

  useEffect(() => {
    if (isAllHistoryModalOpen && !allLanguageHistoryData) {
      fetchAllLanguageHistory();
    }
  }, [isAllHistoryModalOpen, allLanguageHistoryData, fetchAllLanguageHistory]);

  useEffect(() => {
    if (!allLanguageHistoryData) {
      setFilteredAllLanguageHistoryData(null);
      return;
    }
    if (!allHistorySearchTerm.trim()) {
      setFilteredAllLanguageHistoryData(allLanguageHistoryData);
      if (allLanguageHistoryData.index.length > 0 && !allLanguageHistoryData.index.includes(allHistorySelectedIndexChar || '')) {
        setAllHistorySelectedIndexChar(allLanguageHistoryData.index[0] || null);
      }
      return;
    }

    const searchTermLower = allHistorySearchTerm.toLowerCase();
    const newFilteredIndexList: Record<string, HistoryEntry[]> = {};
    const newFilteredIndex: string[] = [];

    for (const char of allLanguageHistoryData.index) {
      const entries = allLanguageHistoryData.indexList[char] || [];
      const filteredEntries = entries.filter(entry => {
        switch(language) {
          case 'hebrew':
            return entry.word.toLowerCase().includes(searchTermLower) || (entry.lemma && entry.lemma.toLowerCase().includes(searchTermLower))
          case 'latin':
            return entry.word.toLowerCase().includes(searchTermLower) || (entry.lemma && entry.lemma.toLowerCase().includes(searchTermLower))
          case 'greek':
          default:
            let greekWord = entry.word
            let greekLemma = entry.lemma
            let greekSearchTerm = greekNormalization.normalizeGreek(searchTermLower)
            return greekNormalization.normalizeGreek(greekWord.toLowerCase()).includes(greekSearchTerm) || (greekLemma && greekNormalization.normalizeGreek(greekLemma.toLowerCase()).includes(greekSearchTerm))
        }
      }
      );
      if (filteredEntries.length > 0) {
        newFilteredIndexList[char] = filteredEntries;
        if (!newFilteredIndex.includes(char)) {
          newFilteredIndex.push(char);
        }
      }
    }
     const sortedNewFilteredIndex = language === 'greek'
          ? [...newFilteredIndex].sort((a, b) => a.localeCompare(b, 'el'))
          : [...newFilteredIndex].sort();

    setFilteredAllLanguageHistoryData({
      index: sortedNewFilteredIndex,
      indexList: newFilteredIndexList,
    });

    if (sortedNewFilteredIndex.length > 0 && !sortedNewFilteredIndex.includes(allHistorySelectedIndexChar || '')) {
      setAllHistorySelectedIndexChar(sortedNewFilteredIndex[0]);
    } else if (sortedNewFilteredIndex.length === 0) {
      setAllHistorySelectedIndexChar(null);
    }
  }, [allHistorySearchTerm, allLanguageHistoryData, language, allHistorySelectedIndexChar]);


  const handleRefresh = () => {
    if (selectedHistoryNamespace) {
      fetchHistoryEntries(selectedHistoryNamespace);
      toast({ title: "History Refreshed", description: `Lookup history for "${selectedHistoryNamespace}" has been reloaded.`})
    } else {
      fetchNamespaces();
      toast({ title: "Namespaces Refreshed", description: "List of available history namespaces has been reloaded."})
    }
  };

  const handleAddNamespace = async () => {
    if (!newNamespace.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Namespace cannot be empty." });
      return;
    }
    setIsAdding(true);
    try {
      const newNsTrimmed = newNamespace.trim();
      setSelectedHistoryNamespace(newNsTrimmed); 
      localStorage.setItem(`${language}_history-namespace`, newNsTrimmed);

      if (!namespacesList.find(ns => ns.namespace === newNsTrimmed)) {
        setNamespacesList(prev => [...prev, { namespace: newNsTrimmed, count: "0" }]);
      }

      toast({ title: "Namespace Set", description: `"${newNsTrimmed}" selected. It will be saved with your next lookup.` });
      setShowAddModal(false);
      setNewNamespace("");
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : "Unknown error." });
    } finally {
      setIsAdding(false);
    }
  };

  const handleSelectedNamespace = (value: string) => {
    setSelectedHistoryNamespace(value);
    localStorage.setItem(`${language}_history-namespace`, value);
    setSelectedIndexChar(null); 
  };

  const currentEntriesToList = (indexedHistoryData && selectedIndexChar && indexedHistoryData.indexList[selectedIndexChar])
    ? indexedHistoryData.indexList[selectedIndexChar]
    : [];

  const allHistoryEntriesToList = (filteredAllLanguageHistoryData && allHistorySelectedIndexChar && filteredAllLanguageHistoryData.indexList[allHistorySelectedIndexChar])
    ? filteredAllLanguageHistoryData.indexList[allHistorySelectedIndexChar]
    : [];

  const renderHistoryList = (entries: HistoryEntry[], listLanguage: HistoryLanguage) => (
    entries.length > 0 ? (
      <ul className="space-y-1">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Button
              variant="ghost"
              className="w-full justify-start text-left h-auto py-1.5 px-2 hover:bg-primary/10"
              onClick={() => {
                onWordSelect(entry.word, entry.lemma);
                if (isAllHistoryModalOpen) setIsAllHistoryModalOpen(false); 
              }}
            >
              <div className="flex flex-col">
                <span className={`font-medium ${listLanguage === 'hebrew' ? 'hebrew hebrew-size' : 'text-base'}`}>
                  {entry.word}
                </span>
                {entry.lemma && entry.lemma !== entry.word && (
                  <span className="text-xs text-muted-foreground">Lemma: {entry.lemma}</span>
                )}
                 <span className="text-xs text-muted-foreground/80">
                  (Freq: {entry.frequency}, Added: {new Date(entry.createdAt).toLocaleDateString()})
                </span>
                <span className="text-xs text-muted-foreground/80">
                  Namespace: {entry.namespace}
                </span>
              </div>
            </Button>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-center text-muted-foreground p-4">
        No history for this selection.
      </p>
    )
  );

  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <CardTitle className="text-lg flex items-center">
              <History className="mr-2 h-5 w-5 text-primary" />
              Lookup History
            </CardTitle>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
              <Button onClick={() => setIsAllHistoryModalOpen(true)} variant="outline" size="sm" className="flex-grow sm:flex-grow-0">
                <Library className="mr-2 h-4 w-4" />
                View All ({language})
              </Button>
              <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoadingNamespaces || isLoadingHistory} className="flex-grow sm:flex-grow-0">
                <RefreshCw className={`h-4 w-4 ${(isLoadingNamespaces || isLoadingHistory) ? 'animate-spin' : ''}`} />
                <span className="ml-2 hidden sm:inline">Refresh</span>
                <span className="ml-0 sm:hidden">Refresh</span>
              </Button>
            </div>
          </div>
          <CardDescription>View words you've previously looked up within a selected namespace.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
            <div className="flex-grow space-y-1">
              <Label htmlFor="history-namespace-select">Select Namespace</Label>
              {isLoadingNamespaces ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={selectedHistoryNamespace || ""}
                  onValueChange={handleSelectedNamespace}
                  disabled={namespacesList.length === 0 && !selectedHistoryNamespace}
                >
                  <SelectTrigger id="history-namespace-select" className="w-full">
                    <SelectValue placeholder={namespacesList.length > 0 || selectedHistoryNamespace ? "Select a namespace" : "No namespaces available"} />
                  </SelectTrigger>
                  <SelectContent>
                    {namespacesList.map((nsE) => (
                      <SelectItem key={nsE.namespace} value={nsE.namespace}>
                        {nsE.namespace} ({nsE.count} words)
                      </SelectItem>
                    ))}
                    {selectedHistoryNamespace && !namespacesList.some(ns => ns.namespace === selectedHistoryNamespace) && (
                      <SelectItem value={selectedHistoryNamespace}>
                        {selectedHistoryNamespace} (New)
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              variant="outline"
              className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center py-2.5"
              aria-label="Add or change namespace"
            >
              <PlusIcon className="h-4 w-4 sm:mr-2" />
              <span className="ml-2 sm:hidden">Add/Change Namespace</span>
              <span className="hidden sm:inline">Add/Change</span>
            </Button>
          </div>

          {error && <p className="text-destructive text-sm mb-2">{error}</p>}

          {isLoadingHistory && !indexedHistoryData && (
            <div className="space-y-1 p-2">
              <Skeleton className="h-6 w-1/3 mb-2" />
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          )}

          {indexedHistoryData && indexedHistoryData.index && indexedHistoryData.index.length > 0 && (
            <div className="mb-3">
              <Label className="text-sm font-medium text-muted-foreground mb-1 block">Index (Namespace: {selectedHistoryNamespace}):</Label>
              <div className="max-w-full">
                <div className="flex flex-wrap gap-1.5 p-1">
                  {indexedHistoryData.index.map((char) => (
                    <Badge
                      key={char}
                      variant={selectedIndexChar === char ? "default" : "secondary"}
                      onClick={() => setSelectedIndexChar(char)}
                      className="cursor-pointer px-2.5 py-1 text-sm shrink-0"
                    >
                      {char}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <ScrollArea className="h-60 border rounded-md p-2 bg-muted/30">
            {isLoadingHistory && indexedHistoryData && !currentEntriesToList.length && selectedIndexChar ? (
               <div className="space-y-1 p-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : renderHistoryList(currentEntriesToList, language)}
          </ScrollArea>
        </CardContent>

        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add or Select Namespace</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="new-namespace-input">Namespace Name</Label>
              <Input
                id="new-namespace-input"
                placeholder="E.g., 'John's Gospel Study'"
                value={newNamespace}
                onChange={e => setNewNamespace(e.target.value)}
                disabled={isAdding}
              />
              <p className="text-xs text-muted-foreground mt-1">
                This namespace will be used to group your lookup history. If it doesn't exist, it will be created with your next lookup.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} disabled={isAdding}>
                Cancel
              </Button>
              <Button onClick={handleAddNamespace} disabled={isAdding || !newNamespace.trim()}>
                {isAdding ? "Setting..." : "Set Namespace"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>

      <Dialog open={isAllHistoryModalOpen} onOpenChange={setIsAllHistoryModalOpen}>
        <DialogContent className="w-full h-full max-w-none sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl flex flex-col p-0">
          <DialogHeader className="sticky top-0 bg-background z-10 p-4 border-b flex flex-row justify-between items-center">
            <DialogTitle className="text-lg font-semibold">All {language.charAt(0).toUpperCase() + language.slice(1)} Lookup History</DialogTitle>
            <div className="flex items-center gap-2">
              <Button 
                onClick={fetchAllLanguageHistory} 
                variant="outline" 
                size="icon" 
                disabled={isLoadingAllHistory}
                aria-label="Refresh all history"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingAllHistory ? 'animate-spin' : ''}`} />
              </Button>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" aria-label="Close modal">
                  <X className="h-5 w-5" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>

          <div className="p-4 border-b">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <WordInput
                id="all-history-search"
                language={language}
                type="search"
                placeholder="Search all history..."
                value={allHistorySearchTerm}
                onChange={(e) => setAllHistorySearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
          </div>
          
          <div className="flex-grow flex flex-col overflow-hidden">
            {isLoadingAllHistory && !filteredAllLanguageHistoryData && (
              <div className="p-4 space-y-2">
                <Skeleton className="h-8 w-1/4 mb-2" />
                {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            )}

            {!isLoadingAllHistory && filteredAllLanguageHistoryData && (
              <>
                {filteredAllLanguageHistoryData.index.length > 0 ? (
                  <div className="p-4 border-b shrink-0">
                    <Label className="text-sm font-medium text-muted-foreground mb-1 block">Index:</Label>
                    <div className="max-w-full">
                      <div className="flex flex-wrap gap-1.5 p-1">
                        {filteredAllLanguageHistoryData.index.map((char) => (
                          <Badge
                            key={char}
                            variant={allHistorySelectedIndexChar === char ? "default" : "secondary"}
                            onClick={() => setAllHistorySelectedIndexChar(char)}
                            className="cursor-pointer px-2.5 py-1 text-sm shrink-0"
                          >
                            {char}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  allHistorySearchTerm && <p className="p-4 text-center text-muted-foreground">No results found for "{allHistorySearchTerm}".</p>
                )}
                
                <ScrollArea className="flex-grow p-4">
                  {renderHistoryList(allHistoryEntriesToList, language)}
                </ScrollArea>
              </>
            )}
            {!isLoadingAllHistory && !filteredAllLanguageHistoryData && (
               <p className="p-4 text-center text-muted-foreground">No history data available for {language}.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LookupHistoryViewer;

