
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
import { ScrollArea } from "@/components/ui/scroll-area";
import './Lexicon.css'
import OccurrenceViewer from "@/app/greek/OccurrenceViewer";

interface Gloss {
  tag: string;
  before?: string;
  after?: string;
}

interface Quote {
  quote?: string;
  bibl?: {
    author?: string;
    title?: string;
    passage?: string;
  };
}

interface Sense {
  id?: string;
  level?: string;
  glosses: Gloss[];
  quotes: Quote[];
  htmlText: string;
}

// interface DodsonEntry {
//   "Strong's"?: string;
//   "Goodrick-Kohlenberger"?: string;
//   "English Definition (brief)"?: string;
//   "English Definition (longer)"?: string;
//   "greekWord"?: string;
//   "Beta Code"?: string;
//   [key: string]: string | undefined;
// }

interface DodsonEntry {
  strong_number?: string;
  lemma: string;
  short_definition?: string;
  long_definition?: string;
  greek_word?: string;
  beta_code?: string;
  [key: string]: string | undefined;
}

interface StrongsEntry {
    "strongs_def":string,
    "derivation":string,
    "translit":string,
    "lemma":string,
    "kjv_def":string
}

interface LexiconEntry {
  lsj: {
    senses: Sense[];
  }[],
  dodson?: DodsonEntry;
  strongs?: StrongsEntry;
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

// const BASE_URL = 'https://www.eazilang.gleeze.com/api/greek'
const BASE_URL = 'http://localhost:3001'

const LexicaTool: React.FC = () => {
  const [word, setWord] = useState("");
  const [morphologyData, setMorphologyData] = useState<MorphologyData[]>([]);
  const [lexiconData, setLexiconData] = useState<{ [key: string]: LexiconEntry }>({});
  const [currentMorphData, setCurrentMorphData] = useState<MorphologyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLexicalModal, setShowLexicalModal] = useState(false);
  const [showLogeionModal, setShowLogeionModal] = useState(false);
  const [showOccurrenceModal, setShowOccurrenceModal] = useState(false);
  const [currentLemma, setCurrentLemma] = useState("");
  const [namespace, setNamespace] = useState<string>("default");
  const [namespaceList, setNamespaceList] = useState<{ name: string; count: number }[]>([]);
  const [notes, setNotes] = useState("");
  const [showNotesInput, setShowNotesInput] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedNamespace = localStorage.getItem("namespace");
    if (savedNamespace) {
      setNamespace(savedNamespace);
    }
    fetchListNames();
  }, []);

  const fetchListNames = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/vocab/info`
      );
      if (response.ok) {
        const list = await response.json();
        setNamespaceList(list);
      }
    } catch (error) {
      console.error("Failed to fetch vocab lists:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch vocabulary lists"
      });
    }
  };

  const handleNamespaceChange = (value: string) => {
    setNamespace(value);
    localStorage.setItem("namespace", value);
  };

  const handleGetLexicalData = async () => {
    if (!word.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a Greek word"
      });
      return;
    }

    setLoading(true);
    try {
      const lexiconUrl = `${BASE_URL}/lexica/${encodeURIComponent(
        word
      )}`;
      const lexiconRes = await fetch(lexiconUrl);

      if (!lexiconRes.ok) {
        throw new Error("Failed to fetch lexicon data");
      }
 
      const lexiconResponse: LexiconResponse = await lexiconRes.json();
      console.log({
        lexiconResponse
      })

      setMorphologyData(lexiconResponse.morphology);
      setLexiconData(lexiconResponse.lexica);

      if (lexiconResponse.morphology.length > 0) {
        const firstMorph = lexiconResponse.morphology[0];
        setCurrentMorphData(firstMorph);
        setCurrentLemma(firstMorph.lemma || word);
      } else {
        setCurrentLemma(word); // Fallback if no morphology, use input word for lemma
      }

      setShowLexicalModal(true);
      
      toast({
        title: "Lexicon Data Loaded",
        description: `Found data for "${word}"`
      });
    } catch (error) {
      console.error("Error fetching lexical data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch lexical data. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWord = async () => {
    if (!currentLemma) { // Changed to check currentLemma as primary identifier
      toast({
        variant: "destructive",
        title: "Error",
        description: "No word data to save"
      });
      return;
    }

    try {
      const lexiconEntry = lexiconData[currentLemma];
    //   const meanings = lexiconEntry?.senses.flatMap(sense => sense.glosses) || [];
      const meanings = lexiconEntry?.lsj[0]?.senses.flatMap(sense => sense.glosses) || [];
      
      const response = await fetch(`${BASE_URL}/vocab/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          vocabKey: namespace,
          word: word, // The original input word
          headWord: currentLemma, // The identified lemma
          morphData: currentMorphData ? [currentMorphData] : [], // currentMorphData can be null
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
        fetchListNames();
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
    setCurrentMorphData(morph);
    setCurrentLemma(morph.lemma || word);
  };

  const openLogeionModal = () => {
    if (!currentLemma && word) setCurrentLemma(word); // Ensure currentLemma is set
    setShowLogeionModal(true);
  };
  
  const openOccurrenceModal = () => {
    if (!currentLemma && word) setCurrentLemma(word); // Ensure currentLemma is set
    setShowOccurrenceModal(true);
  };


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
            <Input
              id="greekInput"
              placeholder="Enter Greek word (e.g. λόγος)"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              className="text-lg"
            />
            <Button onClick={handleGetLexicalData} disabled={loading}>
              {loading ? "Loading..." : "Check Word"}
              <Search className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <div className="space-y-2 flex-1">
              <Label htmlFor="namespaceInput">Your Namespace</Label>
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
          </div>
          
          <div className="flex justify-center mt-2">
            <a
              href="/vocabulary-browser"
              className="text-primary hover:text-primary/80"
              rel="noopener noreferrer" 
            >
              Browse Vocabulary
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Modal for Lexical Data */}
      <Dialog open={showLexicalModal} onOpenChange={setShowLexicalModal}>
        <DialogContent className="max-w-4xl max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Lexical Data for "{word}" (Lemma: {currentLemma || 'N/A'})</DialogTitle>
          </DialogHeader>
          
          <div className="flex gap-2 mb-4 px-6">
            <Button 
              variant="outline"
              onClick={openLogeionModal}
            >
              <Book className="mr-2 h-4 w-4" />
              Open in Logeion
            </Button>
            <Button 
              variant="outline"
              onClick={openOccurrenceModal}
            >
              <Book className="mr-2 h-4 w-4" />
              View Occurrences
            </Button>
          </div>

          <Tabs defaultValue="morphology" className="flex-grow flex flex-col overflow-hidden px-6">
            <TabsList className="mb-2 shrink-0">
              <TabsTrigger value="morphology">Morphology</TabsTrigger>
              <TabsTrigger value="lexicon">LSJ</TabsTrigger>
              <TabsTrigger value="dodson">Dodson</TabsTrigger>
              <TabsTrigger value="strongs">Strongs</TabsTrigger>
            </TabsList>

            <TabsContent value="morphology" className="flex-grow overflow-y-auto -mx-6 px-6 pt-2">
              {morphologyData.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semi bold mb-2">Morphological Forms</h4>
                  <ScrollArea className="max-h-40">
                    <div className="flex gap-2 pb-2">
                      {morphologyData.map((morph, index) => (
                        <div
                          key={index}
                          onClick={() => handleMorphologyClick(morph)}
                          className={`p-3 rounded-md cursor-pointer flex-shrink-0 transition-colors text-sm ${
                            currentMorphData === morph
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                        >
                          <div className="font-semibold">Form {index + 1}</div>
                          {morph.lemma && (
                            <div>
                              <span className="text-muted-foreground">Lemma:</span>{" "}
                              {morph.lemma}
                            </div>
                          )}
                          {morph.partOfSpeech && (
                            <div>
                              <span className="text-muted-foreground">POS:</span>{" "}
                              {morph.partOfSpeech}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
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
                                <TableCell className="font-medium capitalize py-2">{key}</TableCell>
                                <TableCell className="py-2">{String(value)}</TableCell>
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
              {currentLemma && lexiconData[currentLemma] && lexiconData[currentLemma].lsj[0].senses.length > 0 ? (
                <div className="space-y-4">
                  {lexiconData[currentLemma].lsj[0].senses.map((sense, index) => (
                    <Card key={index} className="p-4">
                      <div className="text-sm text-muted-foreground mb-2">
                        Entry {index + 1} of {lexiconData[currentLemma].lsj[0].senses.length}
                      </div>
                      <div 
                        className="prose dark:prose-invert max-w-full lexicon-html-content" // Added lexicon-html-content class
                        dangerouslySetInnerHTML={{ __html: sense.htmlText }}
                      />
                      {sense.quotes.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-semibold text-sm">Quotes:</h5>
                          <ul className="pl-5 space-y-2 mt-2">
                            {sense.quotes.map((quote, i) => {
                              if (!quote.quote) return null;
                              const biblText = quote.bibl
                                ? [quote.bibl.author, quote.bibl.title, quote.bibl.passage]
                                    .filter(Boolean)
                                    .join(" ")
                                : "";
                              return (
                                <li key={i} className="border-l-2 border-border pl-3">
                                  <div className="text-accent">{quote.quote}</div>
                                  {biblText && (
                                    <div className="text-xs text-muted-foreground">– {biblText}</div>
                                  )}
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No lexicon entries available for "{currentLemma || word}".</p>
              )}
            </TabsContent>

            <TabsContent value="dodson" className="flex-grow overflow-y-auto -mx-6 px-6 pt-2">
              {currentLemma && lexiconData[currentLemma]?.dodson ? (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableBody>
                        {Object.entries(lexiconData[currentLemma].dodson || {}).map(
                          ([key, value]) => (
                            <TableRow key={key}>
                              <TableCell className="font-medium py-2">{key.replace('_', '')}</TableCell>
                              <TableCell className="py-2">{String(value)}</TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-muted-foreground">No Dodson entry available for "{currentLemma || word}".</p>
              )}
            </TabsContent>

            <TabsContent value="strongs" className="flex-grow overflow-y-auto -mx-6 px-6 pt-2">
              {currentLemma && lexiconData[currentLemma]?.strongs ? (
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableBody>
                        {Object.entries(lexiconData[currentLemma].strongs || {}).map(
                          ([key, value]) => (
                            <TableRow key={key}>
                              <TableCell className="font-medium py-2">{key}</TableCell>
                              <TableCell className="py-2">{String(value)}</TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-muted-foreground">No Strongs entry available for "{currentLemma || word}".</p>
              )}
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

export default LexicaTool;

    