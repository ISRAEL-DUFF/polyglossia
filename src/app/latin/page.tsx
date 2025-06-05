
"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LookupHistoryViewer from "@/components/LookupHistoryViewer";
import { LatinInput } from "@/components/LatinInput"; // New LatinInput
import LatinLexiconViewer from "./LatinLexiconViewer"; // New LatinLexiconViewer
import type { NamespaceEntry } from "@/types";
import './LatinLexicon.css';
import { Input } from "@/components/ui/input";

const LatinLexiconTool: React.FC = () => {
  const [word, setWord] = useState("");
  const [wordToView, setWordToView] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyNamespace, setHistoryNamespace] = useState<string>('');
  const [historyNamespaceEntry, setHistoryNamespaceEntry] = useState<NamespaceEntry | null>(null);
  const [showLexicalModal, setShowLexicalModal] = useState(false);
  const [lastFetchedWord, setLastFetchedWord] = useState<string | null>(null);
  
  const { toast } = useToast();

  const handleGetLexicalData = (lookupWord = word) => {
    if (!lookupWord.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a Latin word."
      });
      return;
    }

    if (lookupWord === lastFetchedWord && showLexicalModal) {
        // If same word and modal is already conceptually open for it, just ensure it's visible
        setShowLexicalModal(true);
        return;
    }
    
    setWordToView(lookupWord);
    // The actual modal opening and data fetching is triggered by LatinLexiconViewer's useEffect
    // based on showLexicalModal and wordToView
  };

  const handleHistoryWordSelect = (selectedWord: string, lemma?: string) => {
    setWord(selectedWord); 
    handleGetLexicalData(selectedWord); 
  };

  const handleLexiconViewerResponse = (response: 'loading' | 'ready' | 'error') => {
    switch(response) {
        case 'loading':
            setLoading(true);
            break;
        case 'ready':
            setLoading(false);
            setShowLexicalModal(true); // Ensure modal is shown when data is ready
            setLastFetchedWord(wordToView);
            break;
        case 'error':
            setLoading(false);
            // Optionally, close modal or show error within it. For now, just stop loading.
            // setShowLexicalModal(false); 
            setLastFetchedWord(null);
            break;
    }
  };

  const handleHistoryNamespaceChange = (namespace: string, entry: NamespaceEntry) => {
    setHistoryNamespace(namespace);
    setHistoryNamespaceEntry(entry);
  };

  return (
    <div className="container mx-auto space-y-4 p-1">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-primary">
            Latin Lexicon Tool
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Look up Latin words and explore their meanings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2">
            {/* <Input
              id="latinInput"
              placeholder="Enter Latin word (e.g., amor)"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className="text-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleGetLexicalData()}
            /> */}
            <LatinInput
              id="latinInput"
              placeholder="Enter Latin word (e.g., amor)"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className="text-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleGetLexicalData()}
            />
            <Button onClick={() => handleGetLexicalData()} disabled={loading || !word.trim()}>
              {loading ? "Loading..." : "Check Word"}
              <Search className="ml-2 h-4 w-4" />
            </Button>
          </div>
          
          {historyNamespaceEntry && (
            <div className="flex mt-4 justify-center">
                <div className="bg-muted/40 border border-border rounded-lg px-6 py-3 flex flex-col sm:flex-row items-center gap-4 shadow-sm w-full max-w-xl">
                <div className="flex flex-col items-center sm:items-start">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Namespace</span>
                    <span className="font-semibold text-primary text-lg">{historyNamespaceEntry.namespace}</span>
                </div>
                <div className="flex flex-col items-center sm:items-start">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Looked Up Words</span>
                    <span className="font-semibold">{historyNamespaceEntry.count}</span>
                </div>
                <div className="flex flex-col items-center sm:items-start">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Saved Words</span>
                    <span className="font-semibold">{historyNamespaceEntry.vocabCount ?? 0}</span>
                </div>
                </div>
            </div>
          )}
        </CardContent>
      </Card>

      <LatinLexiconViewer 
        latinWord={wordToView} 
        historyNamespace={historyNamespace}
        showLexicalModal={showLexicalModal}
        setShowLexicalModal={setShowLexicalModal}
        onResponse={handleLexiconViewerResponse}
      />

      {/* <LookupHistoryViewer
        language="latin"
        onWordSelect={handleHistoryWordSelect}
        onNamespaceSelect={handleHistoryNamespaceChange}
        // refreshTrigger can be added if needed for external refreshes
      /> */}
    </div>
  );
};

export default LatinLexiconTool;
