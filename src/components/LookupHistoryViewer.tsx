
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, History, PlusIcon } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge"; // Added for index characters

type HistoryLanguage = 'greek' | 'hebrew' | 'latin';

interface NamespaceEntry {
  namespace: string;
  count: string; // Assuming count is still a string based on previous structure
}

interface HistoryEntry {
  id: string; // Changed from number to string based on new data
  createdAt: string;
  language: string;
  namespace: string;
  word: string;
  lemma?: string; // Lemma might be associated during onWordSelect, not directly in this list
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
  onNamespaceSelect: (namespace: string) => void;
  refreshTrigger?: number;
}

const BASE_URL = 'https://www.eazilang.gleeze.com/api/greek';
// const BASE_URL = 'http://localhost:3001';

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

  const fetchNamespaces = useCallback(async () => {
    setIsLoadingNamespaces(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/lookup-history/namespaces?language=${language}`);
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
      const response = await fetch(`${BASE_URL}/lookup-history/entries?language=${language}&namespace=${encodeURIComponent(namespaceToFetch)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch history for namespace "${namespaceToFetch}". Status: ${response.status}`);
      }
      const data: IndexedHistoryResponse = await response.json();
      setIndexedHistoryData(data);
      if (data.index && data.index.length > 0) {
        // Sort Greek letters if applicable, otherwise simple sort
        const sortedIndex = language === 'greek'
          ? [...data.index].sort((a, b) => a.localeCompare(b, 'el'))
          : [...data.index].sort();
        setSelectedIndexChar(sortedIndex[0]);
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
    // Initial namespace selection is handled within fetchNamespaces
  }, [fetchNamespaces, language]);

  useEffect(() => {
    if (selectedHistoryNamespace) {
      fetchHistoryEntries(selectedHistoryNamespace);
      onNamespaceSelect(selectedHistoryNamespace);
    } else {
      // Clear history if no namespace is selected
      setIndexedHistoryData(null);
      setSelectedIndexChar(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHistoryNamespace, refreshTrigger]);

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

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <History className="mr-2 h-5 w-5 text-primary" />
            Lookup History
          </CardTitle>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isLoadingNamespaces || isLoadingHistory}>
            <RefreshCw className={`h-4 w-4 ${(isLoadingNamespaces || isLoadingHistory) ? 'animate-spin' : ''}`} />
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
        </div>
        <CardDescription>View words you've previously looked up, organized by initial character.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex items-end gap-2">
          <div className="flex-grow">
            <Label htmlFor="history-namespace-select">Select Namespace</Label>
            {isLoadingNamespaces ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedHistoryNamespace || ""}
                onValueChange={handleSelectedNamespace}
                disabled={namespacesList.length === 0 && !selectedHistoryNamespace}
              >
                <SelectTrigger id="history-namespace-select">
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
          <Button onClick={() => setShowAddModal(true)} variant="outline" size="icon" aria-label="Add new namespace">
            <PlusIcon className="h-4 w-4" />
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
            <Label className="text-xs text-muted-foreground">Index:</Label>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-1.5 p-1">
                {(language === 'greek' ? [...indexedHistoryData.index].sort((a,b) => a.localeCompare(b, 'el')) : [...indexedHistoryData.index].sort()).map((char) => (
                  <Badge
                    key={char}
                    variant={selectedIndexChar === char ? "default" : "secondary"}
                    onClick={() => setSelectedIndexChar(char)}
                    className="cursor-pointer px-2.5 py-1 text-sm"
                  >
                    {char}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <ScrollArea className="h-60 border rounded-md p-2 bg-muted/30">
          {isLoadingHistory && indexedHistoryData && !currentEntriesToList.length && selectedIndexChar ? ( 
             <div className="space-y-1 p-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : currentEntriesToList.length > 0 ? (
            <ul className="space-y-1">
              {currentEntriesToList.map((entry) => (
                <li key={entry.id}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left h-auto py-1.5 px-2 hover:bg-primary/10"
                    onClick={() => onWordSelect(entry.word, entry.lemma)}
                  >
                    <div className="flex flex-col">
                      <span className={`font-medium ${language === 'hebrew' ? 'hebrew hebrew-size' : 'text-base'}`}>
                        {entry.word}
                      </span>
                      {entry.lemma && entry.lemma !== entry.word && (
                        <span className="text-xs text-muted-foreground">Lemma: {entry.lemma}</span>
                      )}
                       <span className="text-xs text-muted-foreground/80">
                        (Freq: {entry.frequency}, Added: {new Date(entry.createdAt).toLocaleDateString()})
                      </span>
                    </div>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted-foreground p-4">
              {selectedHistoryNamespace && selectedIndexChar ? `No history for "${selectedIndexChar}" in "${selectedHistoryNamespace}".` 
               : selectedHistoryNamespace ? "Select an index character above."
               : "Select a namespace to view history."}
            </p>
          )}
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
  );
};

export default LookupHistoryViewer;
        
    