
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Book, Search, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import './LatinLexicon.css'
import OccurrenceViewer from "@/app/greek/OccurrenceViewer";
import { logHistoryEntry } from "@/lib/utils/historyLogger";

interface LatinLexiconEntry {
  htmlText: string; // Assuming entries are provided as HTML strings
  sourceName?: string; // e.g., "Lewis & Short", "Elementary Latin Dictionary"
}

interface LexiconEntry {
  lewisAndShort: LatinLexiconEntry[],
  whitaker?: LatinLexiconEntry[];
}

interface MorphologyData {
  lemma: string;
  partOfSpeech: string | null;
  case: string | null;
  gender: string | null;
  number: string | null;
  tense: string | null;
  voice: string | null;
  mood: string | null;
  person: string | null;
  stem: string | null;
  suffix: string | null;
  morph: string | null;
  stemtype: string | null;
  derivtype: string | null;
  dialect: string | null;
}

interface LexiconResponse {
  morphology: MorphologyData[];
  lexica: {
    [key: string]: LexiconEntry;
  };
}

// const BASE_URL = 'http://localhost:3001/latin'; // For local dev
const BASE_URL = 'https://www.eazilang.gleeze.com/api/latin'; // Placeholder, adjust to your actual API


interface LSJViewerProps {
    lexiconData: { [key: string]: LexiconEntry };
    currentLemma: string;
    word: string;
}

const LSJEntryViewer: React.FC<LSJViewerProps> = ({ lexiconData, currentLemma, word }) => {
    return (
        <>
        {currentLemma && lexiconData[currentLemma] && lexiconData[currentLemma].lewisAndShort.length > 0 ? (
            <Tabs defaultValue="0" className="w-full">
            <TabsList className="mb-4 flex flex-wrap gap-2">
                {lexiconData[currentLemma].lewisAndShort.map((entry, idx) => (
                <TabsTrigger key={idx} value={String(idx)}>
                    Entry - {(entry as any).word}
                </TabsTrigger>
                ))}
            </TabsList>
            {lexiconData[currentLemma].lewisAndShort.map((lsjEntry, idx) => (
                <TabsContent key={idx} value={String(idx)} className="space-y-4">
                <div>
                    <div
                        className="prose dark:prose-invert max-w-full lexicon-html-content"
                        dangerouslySetInnerHTML={{ __html:  lsjEntry.htmlText}}
                    />
                </div>
                </TabsContent>
            ))}
            </Tabs>
        ) : (
            <p className="text-muted-foreground">
            No Lewis and Short lexicon entries available for "{currentLemma || word}".
            </p>
        )}
        </>
    )
}

interface LatinLexiconViewerProps {
    latinWord: string;
    historyNamespace: string;
    showLexicalModal: boolean;
    setShowLexicalModal: (open: boolean) => void;
    onResponse: (response: 'loading' | 'ready' | 'error') => void;
}

const LatinLexiconViewer: React.FC<LatinLexiconViewerProps> = ({ latinWord, historyNamespace, showLexicalModal, setShowLexicalModal, onResponse }) => {
  const [word, setWord] = useState('');
  const [morphologyData, setMorphologyData] = useState<MorphologyData[]>([]);
  const [lexiconData, setLexiconData] = useState<{ [key: string]: LexiconEntry }>({});
  const [currentMorphData, setCurrentMorphData] = useState<MorphologyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLogeionModal, setShowLogeionModal] = useState(false);
  const [showOccurrenceModal, setShowOccurrenceModal] = useState(false);
  const [currentLemma, setCurrentLemma] = useState("");
  const [notes, setNotes] = useState("");
  const [showNotesInput, setShowNotesInput] = useState(false);

  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  useEffect(() =>{
    if(latinWord === word) {
        console.log({
            latinWord,
            word,
            showLexicalModal,
        });
        return;
    }

    setWord(latinWord)
  }, [latinWord])


  useEffect(() => {
    let isMounted = true; // To prevent state updates if unmounted

    console.log("LEXICON VIEWER:", {
        latinWord,
        showLexicalModal,
        historyNamespace
    })

    const fetchData = async () => {
        try {
        await handleGetLexicalData()
        } catch (error) {
            console.log(error)
        if (isMounted) {
            // send error to parent
            // setError(error);
            onResponse('error')
        }
        }
    };

    fetchData();

    return () => {
        isMounted = false;
    };
  }, [word]);


  function normalizeLemma(lemma: string) {
    return lemma.replace(/\d+$/, '');
  }

  const handleGetLexicalData = async (lookupWord = word) => {
    if (!lookupWord.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a Greek word"
      });
      return;
    }

    setLoading(true);
    onResponse('loading');
    try {
      const lexiconUrl = `${BASE_URL}/lexica/?word=${encodeURIComponent(
        lookupWord.trim()
      )}`;
      const lexiconRes = await fetch(lexiconUrl);

      if (!lexiconRes.ok) {
        onResponse('error')
        throw new Error("Failed to fetch lexicon data");
      }
 
      const lexiconResponse: LexiconResponse = await lexiconRes.json();
      console.log({
        lexiconResponse
      })

      setMorphologyData(lexiconResponse.morphology);
      setLexiconData(lexiconResponse.lexica);

      let identifiedLemma = lookupWord.trim();
      if (lexiconResponse.morphology.length > 0) {
        const firstMorph = lexiconResponse.morphology[0];
        setCurrentMorphData(firstMorph);
        identifiedLemma = normalizeLemma(firstMorph.lemma || lookupWord.trim());
        setCurrentLemma(identifiedLemma);
        console.log('current Lemma:', currentLemma, identifiedLemma, lexiconData)
      } else {
        setCurrentMorphData(null);
        setCurrentLemma(lookupWord.trim()); // Fallback if no morphology
      }
      
      // Log to history
      if (identifiedLemma && historyNamespace) {
        const logResult = await logHistoryEntry({
          word: lookupWord.trim(),
          lemma: identifiedLemma,
          namespace: historyNamespace,
          language: 'greek'
        });
        if (logResult.success) {
          toast({ title: "Logged", description: `"${lookupWord.trim()}" added to history for "${historyNamespace}".` });
        //   setHistoryRefreshTrigger(prev => prev + 1); // Trigger refresh in LookupHistoryViewer
        } else {
          toast({ variant: "destructive", title: "History Log Failed", description: logResult.message });
        }
      }

      // setShowLexicalModal(true);

      onResponse('ready')

      
      toast({
        title: "Lexicon Data Loaded",
        description: `Found data for "${lookupWord.trim()}"`
      });
    } catch (error) {
      console.error("Error fetching lexical data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch lexical data. Please try again."
      });

      onResponse('error')
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWord = async () => {
    if (!currentLemma) { 
      toast({
        variant: "destructive",
        title: "Error",
        description: "No word data to save"
      });
      return;
    }

    if (!historyNamespace) { 
      toast({
        variant: "destructive",
        title: "Error",
        description: "Namespace is required in order to save a word"
      });
      return;
    }

    try {
      const lexiconEntry = lexiconData[currentLemma];
      const meanings: any[] = [] // lexiconEntry?.lsj[0]?.entry.senses.flatMap(sense => sense.glosses) || [];
      
      const response = await fetch(`${BASE_URL}/vocab/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          vocabKey: historyNamespace,
          word: word, 
          headWord: currentLemma, 
          morphData: currentMorphData ? [currentMorphData] : [], 
          lexiconData: lexiconEntry ? { ...lexiconEntry, meanings: [] } : {},
          meanings: meanings,
          notes: notes
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save to dictionary");
      }

      const result = await response.json();

      if (result.message && !result.successful) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message
        });
      } else {
        toast({
          title: "Success",
          description: "Word saved successfully"
        });
        // fetchListNames();
      }
    } catch (error) {
      console.error("Error saving word:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save word"
      });
    }
  };

  const handleMorphologyClick = (morph: MorphologyData) => {
    const lemma = normalizeLemma(morph.lemma || word)
    setCurrentMorphData(morph);
    setCurrentLemma(lemma);
  };

  const openLogeionModal = () => {
    if (!currentLemma && word) setCurrentLemma(word);
    setShowLogeionModal(true);
  };
  
  const openOccurrenceModal = () => {
    if (!currentLemma && word) setCurrentLemma(word);
    setShowOccurrenceModal(true);
  };

  return (
    <div className="container mx-auto space-y-4 p-1">
      {/* Lexical Data Modal */}
      <Dialog open={showLexicalModal} onOpenChange={setShowLexicalModal}>
        <DialogContent className="max-w-4xl max-h-[96vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Lexical Data for "{word}" (Lemma: {currentLemma || 'N/A'})</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-2 mb-4 px-2 sm:flex-row sm:px-6">
            <Button
                variant="outline"
                onClick={openLogeionModal}
                className="w-full sm:w-auto"
            >
                <Book className="mr-1 h-4 w-4" />
                Open in Logeion
            </Button>
            <Button
                variant="outline"
                onClick={openOccurrenceModal}
                className="w-full sm:w-auto"
            >
                <Book className="mr-1 h-4 w-4" />
                View Occurrences
            </Button>
          </div>

          <Tabs defaultValue="morphology" className="flex-grow flex flex-col overflow-x-hidden px-4">
            <TabsList className="mb-2 shrink-0 overflow-x-auto whitespace-nowrap flex gap-1 pl-24 sm:pl-0">
              <TabsTrigger value="morphology">Morphology</TabsTrigger>
              <TabsTrigger value="lexicon">Lewis and Short</TabsTrigger>
              <TabsTrigger value="thayer">Whitaker</TabsTrigger>
            </TabsList>

            <TabsContent value="morphology" className="flex-grow overflow-y-auto -mx-2 px-2 pt-2 sm:-mx-6 sm:px-6">
              {morphologyData.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semi bold mb-2">Morphological Forms</h4>
                  <div className="max-h-40 w-full overflow-x-auto">
                    <div className="flex flex-row gap-2 pb-2 min-w-max">
                        {morphologyData.map((morph, index) => (
                        <div
                            key={index}
                            onClick={() => handleMorphologyClick(morph)}
                            className={`p-3 rounded-md cursor-pointer flex-shrink-0 transition-colors text-sm min-w-[170px] ${
                            currentMorphData === morph
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                            }`}
                        >
                            <div className="font-semibold">Form {index + 1}</div>
                                {morph.lemma && (
                            <div>
                                <span className="text-xs text-muted-foreground/80">Lemma:</span> {morph.lemma}
                            </div>
                            )}
                                {morph.partOfSpeech && (
                            <div>
                                <span className="text-xs text-muted-foreground/80">POS:</span> {morph.partOfSpeech}
                            </div>
                            )}
                            </div>
                        ))}
                        </div>
                    </div>
                </div>
              )}
              
              {currentMorphData && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-2">Detailed Morphology</h4>
                  <Card>
                    <CardContent className="p-0">
                      <Table>
                        <TableBody>
                          {Object.entries(currentMorphData)
                            .filter(([_, value]) => value !== null && value !== undefined && value !== '')
                            .map(([key, value]) => (
                              <TableRow key={key}>
                                <TableCell className="font-medium capitalize py-2 text-sm">{key}</TableCell>
                                <TableCell className="py-2 text-sm">{String(value)}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              )}
              {!currentMorphData && morphologyData.length === 0 && <p className="text-muted-foreground">No morphological data available.</p>}
            </TabsContent>

            <TabsContent value="lexicon" className="flex-grow overflow-y-auto -mx-6 px-6 pt-2">
              <LSJEntryViewer lexiconData={lexiconData} currentLemma={currentLemma} word={word}></LSJEntryViewer>
            </TabsContent>
          </Tabs>
          
          <div className="mt-auto pt-4 border-t px-6 pb-6">
            <Collapsible open={showNotesInput} onOpenChange={setShowNotesInput}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="mb-2 w-full sm:w-auto">
                  {showNotesInput ? "Hide Notes" : "Add Notes"}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <textarea
                  className="w-full h-24 p-2 mb-4 border rounded-md bg-background"
                  placeholder="Add your notes here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </CollapsibleContent>
            </Collapsible>
            
            <Button
              onClick={handleSaveWord}
              disabled={!currentLemma}
              className="w-full sm:w-auto"
            >
              Save Word
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logeion Modal */}
      <Dialog open={showLogeionModal} onOpenChange={setShowLogeionModal}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-4 pb-2 border-b bg-muted shrink-0">
              <DialogTitle>Logeion: {currentLemma || word}</DialogTitle>
            </DialogHeader>
            <div className="flex-grow overflow-hidden">
              <iframe
                ref={iframeRef}
                src={`https://logeion.uchicago.edu/${encodeURIComponent(currentLemma || word)}`}
                className="w-full h-full border-0"
                title="Logeion"
              />
            </div>
            <DialogFooter className="p-4 border-t bg-muted shrink-0">
                <Button variant="outline" onClick={() => setShowLogeionModal(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Occurrence Modal */}
      <Dialog open={showOccurrenceModal} onOpenChange={setShowOccurrenceModal}>
        <DialogContent className="max-w-5xl w-full h-[95vh] flex flex-col p-0">
           <DialogHeader className="p-4 pb-2 border-b bg-muted shrink-0">
            <DialogTitle>Occurrences of: {currentLemma || word}</DialogTitle>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto">
            <OccurrenceViewer word={currentLemma || word} />
          </div>
          <DialogFooter className="p-4 border-t bg-muted shrink-0">
            <Button variant="outline" onClick={() => setShowOccurrenceModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LatinLexiconViewer;
