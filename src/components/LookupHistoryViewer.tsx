
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, History, PlusIcon } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Label } from "@/components/ui/label"; // Ensured Label is imported
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type HistoryLanguage = 'greek' | 'hebrew' | 'latin';

interface NamespaceEntry {
  namespace: string;
  count: string;
}

interface HistoryEntry {
  id: number;
  createdAt: string;
  language: string;
  namespace: string;
  word: string;
  lemma: string;
  frequency: number;
  updatedAt: string;
}

interface LookupHistoryViewerProps {
  language: HistoryLanguage;
  onWordSelect: (word: string, lemma?: string) => void;
  onNamespaceSelect: (namespace: string) => void;
  // This prop can be used to trigger a refresh if the parent logs a new entry to the currently viewed namespace
  refreshTrigger?: number; 
}

const BASE_URL = 'https://www.eazilang.gleeze.com/api/greek'
// const BASE_URL = 'http://localhost:3001';

const LookupHistoryViewer: React.FC<LookupHistoryViewerProps> = ({ language, onWordSelect, onNamespaceSelect, refreshTrigger }) => {
  const [namespacesList, setNamespacesList] = useState<NamespaceEntry[]>([]);
  const [selectedHistoryNamespace, setSelectedHistoryNamespace] = useState<string | null>(null);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
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
        setSelectedHistoryNamespace(data[0].namespace); // Auto-select first namespace
      } else if (data.length === 0) {
        setSelectedHistoryNamespace(null);
        setHistoryEntries([]);
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
      setHistoryEntries([]);
      return;
    }
    setIsLoadingHistory(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/lookup-history/entries?language=${language}&namespace=${encodeURIComponent(namespaceToFetch)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch history for namespace "${namespaceToFetch}". Status: ${response.status}`);
      }
      const data: HistoryEntry[] = await response.json();
      // Sort by created_at descending (most recent first)
      data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setHistoryEntries(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : `An unknown error occurred while fetching history for ${namespaceToFetch}.`;
      setError(message);
      toast({ variant: "destructive", title: "Error", description: message });
      setHistoryEntries([]);
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
      onNamespaceSelect(selectedHistoryNamespace)
    }
  }, [selectedHistoryNamespace, fetchHistoryEntries, refreshTrigger]); // refreshTrigger can be used by parent

  const handleRefresh = () => {
    if (selectedHistoryNamespace) {
      fetchHistoryEntries(selectedHistoryNamespace);
      toast({ title: "History Refreshed", description: `Lookup history for "${selectedHistoryNamespace}" has been reloaded.`})
    } else {
      fetchNamespaces(); // If no namespace selected, refresh the list of namespaces
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
      // const response = await fetch(`${API_BASE_URL}/lookup-history/namespaces`, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ language, namespace: newNamespace.trim() }),
      // });
      // if (!response.ok) throw new Error("Failed to add namespace.");
      setSelectedHistoryNamespace(newNamespace)
      toast({ title: "Success", description: "The New Namespace will be added when you lookup!" });
      setShowAddModal(false);
      setNewNamespace("");
      fetchNamespaces();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err instanceof Error ? err.message : "Unknown error." });
    } finally {
      setIsAdding(false);
    }
  };

  const handleSelectedNamespace = (value: string) => {
    setSelectedHistoryNamespace(value);
  }

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
            <span className="ml-2">Refresh</span>
          </Button>
        </div>
        <CardDescription>View words you've previously looked up.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Label htmlFor="history-namespace-select">Select Namespace</Label>
          {isLoadingNamespaces ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select
              value={selectedHistoryNamespace || ""}
              onValueChange={(value) => handleSelectedNamespace(value)}
              disabled={namespacesList.length === 0}
            >
              <SelectTrigger id="history-namespace-select">
                <SelectValue placeholder={namespacesList.length > 0 ? "Select a namespace" : "No namespaces available"} />
              </SelectTrigger>
              <SelectContent>
                {namespacesList.map((nsE) => (
                  <SelectItem key={nsE.namespace} value={nsE.namespace}>
                    {nsE.namespace} ({nsE.count} words)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button onClick={() => setShowAddModal(true)} variant="secondary" size="icon">
            <PlusIcon />
          </Button>
        </div>

        {error && <p className="text-destructive text-sm mb-2">{error}</p>}

        <ScrollArea className="h-64 border rounded-md p-2 bg-muted/30">
          {isLoadingHistory ? (
            <div className="space-y-2 p-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : historyEntries.length > 0 ? (
            <ul className="space-y-1">
              {historyEntries.map((entry) => (
                <li key={entry.id}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-left h-auto py-1.5 px-2 hover:bg-primary/10"
                    onClick={() => onWordSelect(entry.word, entry.lemma)}
                  >
                    <div className="flex flex-col">
                      <span className={`font-medium ${language === 'hebrew' ? 'hebrew hebrew-size' : 'text-base'}`}>{entry.word}</span>
                      <span className="text-xs text-muted-foreground">Lemma: {entry.lemma} (Freq: {entry.frequency})</span>
                      <span className="text-xs text-muted-foreground/70">
                        Looked up: {new Date(entry.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-muted-foreground p-4">
              {selectedHistoryNamespace ? `No history found for "${selectedHistoryNamespace}".` : "Select a namespace to view history."}
            </p>
          )}
        </ScrollArea>
      </CardContent>

      {/* Add Namespace Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="mx-8 space-y-4 p-8 max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add New Namespace</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Enter new namespace"
            value={newNamespace}
            onChange={e => setNewNamespace(e.target.value)}
            disabled={isAdding}
          />
          <DialogFooter>
            <Button
              onClick={handleAddNamespace}
              disabled={isAdding}
            >
              {isAdding ? "Adding..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default LookupHistoryViewer;
