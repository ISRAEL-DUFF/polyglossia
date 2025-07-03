
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Book, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import './Lexicon.css'
import LookupHistoryViewer from "@/components/LookupHistoryViewer";
import { WordInput } from "@/components/WordInput";
import GreekLexiconViewer from "./GreekLexiconViewer";
import { NamespaceEntry } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prepositionData } from "@/lib/data/prepositionsData";


const BASE_URL = 'https://www.eazilang.gleeze.com/api/greek'
// const BASE_URL = 'http://localhost:3001'

const LexicaTool: React.FC = () => {
  const [word, setWord] = useState("");
  const [wordToView, setWordToView] = useState("");
  const [loading, setLoading] = useState(false);
//   const [namespace, setNamespace] = useState<string>("default");
//   const [namespaceList, setNamespaceList] = useState<{ name: string; count: number }[]>([]);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const [historyNamespace, setHistoryNamespace] = useState<string>('');
  const [historyNamespaceEntry, setHistoryNamespaceEntry] = useState<NamespaceEntry | null>(null);
  const [showLexicalModal, setShowLexicalModal] = useState(false);
  const [lastFetchedWord, setLastFetchedWord] = useState<string | null>(null);
  const [showPrepositionModal, setShowPrepositionModal] = useState(false);

  
  const { toast } = useToast();

//   useEffect(() => {
//     const savedNamespace = localStorage.getItem("namespace");
//     if (savedNamespace) {
//       setNamespace(savedNamespace);
//     }
//     fetchListNames();
//   }, []);

  function normalizeLemma(lemma: string) {
    return lemma.replace(/\d+$/, '');
  }

//   const fetchListNames = async () => {
//     try {
//       const response = await fetch(
//         `${BASE_URL}/vocab/info`
//       );
//       if (response.ok) {
//         const list = await response.json();
//         setNamespaceList(list);
//       }
//     } catch (error) {
//       console.error("Failed to fetch vocab lists:", error);
//       toast({
//         variant: "destructive",
//         title: "Error",
//         description: "Failed to fetch vocabulary lists"
//       });
//     }
//   };

//   const handleNamespaceChange = (value: string) => {
//     setNamespace(value);
//     localStorage.setItem("namespace", value);
//   };

  const handleGetLexicalData = async (lookupWord = word) => {
    if (!lookupWord.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a Greek word"
      });
      return;
    }

    console.log("Passed down:", lookupWord)

    if (lookupWord === lastFetchedWord) {
        // Same word, just open modal
        // Reset modal before setting word to force re-trigger
        setShowLexicalModal(false);
        setTimeout(() => {
            setShowLexicalModal(true);
        }, 100);
        return;
    }

    setWordToView(lookupWord);
  };

  const handleHistoryWordSelect = (selectedWord: string, selectedLemma?: string) => {
    setWord(selectedWord); // Update the input field
    handleGetLexicalData(selectedWord); // Trigger a new lookup
    // if (selectedLemma) {
    //     setCurrentLemma(selectedLemma); // Pre-set lemma if available
    // }
  };

  const handleOnResponse = (resp: string) => {
    console.log("On reponse:", {
        resp
    })
    switch(resp) {
        case 'error':
            setLoading(false);
            setLastFetchedWord(null)
            break;
        case 'ready':
            setLoading(false);
            setShowLexicalModal(true);
            setLastFetchedWord(word)
            break;
        case 'loading':
            setLoading(true)
            break;
    }
  }

  const handleHistoryNamespace = (namespace: string, entry: NamespaceEntry) => {
    setHistoryNamespace(namespace);
    setHistoryNamespaceEntry(entry);
  }


  return (
    <div className="container mx-auto space-y-4 p-1">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-primary">
            Ancient Greek Lexica Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <WordInput
              language={'greek'}
              id="greekInput"
              placeholder="Enter Greek word (e.g. λόγος)"
              value={word}
              onChange={(e) => {
                setWord(e.target.value)
              }}
              className="text-lg"
              onKeyDown={(e) => e.key === 'Enter' && handleGetLexicalData()}
            />
            <Button onClick={() => handleGetLexicalData()} disabled={loading}>
              {loading ? "Loading..." : "Check Word"}
              <Search className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="namespaceInput">Vocabulary Namespace (for saving)</Label>
              <Input
                id="namespaceInput"
                placeholder="Your namespace"
                value={namespace}
                onChange={(e) => handleNamespaceChange(e.target.value)}
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="namespaceSelect">Saved Namespaces</Label>
              <select
                id="namespaceSelect"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                onChange={(e) => handleNamespaceChange(e.target.value)}
                value={namespace}
              >
                {namespaceList.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name} ({item.count} words)
                  </option>
                ))}
              </select>
            </div>
          </div> */}
          
          <div className="flex justify-center mt-2">
            <a
              href="/vocabulary-browser"
              className="text-primary hover:text-primary/80 mr-4"
              rel="noopener noreferrer" 
            >
              Vocabulary
            </a>

            <a
              onClick={() => setShowPrepositionModal(true)}
              href="#"
              className="text-primary hover:text-primary/80"
              rel="noopener noreferrer" 
            >
              Prepositions
            </a>
          </div>

          {historyNamespaceEntry && (
            <div className="flex mt-4">
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

      <GreekLexiconViewer 
        showLexicalModal = {showLexicalModal} 
        setShowLexicalModal={setShowLexicalModal} 
        onResponse = {handleOnResponse} 
        greekWord={wordToView} historyNamespace={historyNamespace}/>

      <LookupHistoryViewer
        language="greek"
        onWordSelect={handleHistoryWordSelect}
        onNamespaceSelect={(ns, e) => handleHistoryNamespace(ns, e)}
        refreshTrigger={historyRefreshTrigger} 
      />


      {/* Prepositions Modal */}
      <Dialog open={showPrepositionModal} onOpenChange={setShowPrepositionModal}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-4 pb-2 border-b bg-muted shrink-0">
              <DialogTitle>Gree Prepositions</DialogTitle>
            </DialogHeader>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preposition</TableHead>
                    <TableHead>Case</TableHead>
                    <TableHead>Meaning(s)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prepositionData.map((entry, index) => (
                    Object.entries(entry.cases).map(([caseName, meanings], caseIndex) => (
                      <TableRow key={`${index}-${caseIndex}`}>
                        {caseIndex === 0 && <TableCell rowSpan={Object.keys(entry.cases).length} className="align-top font-semibold">{entry.preposition}</TableCell>}
                        <TableCell>{caseName}</TableCell>
                        <TableCell>{meanings.join(", ")}</TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter className="p-4 border-t bg-muted shrink-0">
                <Button variant="outline" onClick={() => setShowPrepositionModal(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LexicaTool;
