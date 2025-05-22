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

interface DodsonEntry {
  "Strong's"?: string;
  "Goodrick-Kohlenberger"?: string;
  "English Definition (brief)"?: string;
  "English Definition (longer)"?: string;
  "greekWord"?: string;
  "Beta Code"?: string;
  [key: string]: string | undefined;
}

interface LexiconEntry {
  senses: Sense[];
  dodson?: DodsonEntry;
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

const BASE_URL = 'https://www.eazilang.gleeze.com/api/greek'
// const BASE_URL = 'http://localhost:3001'

const LexicaTool: React.FC = () => {
  const [word, setWord] = useState("");
  const [morphologyData, setMorphologyData] = useState<MorphologyData[]>([]);
  const [lexiconData, setLexiconData] = useState<{ [key: string]: LexiconEntry }>({});
  const [currentMorphData, setCurrentMorphData] = useState<MorphologyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
      setMorphologyData(lexiconResponse.morphology);
      setLexiconData(lexiconResponse.lexica);

      if (lexiconResponse.morphology.length > 0) {
        const firstMorph = lexiconResponse.morphology[0];
        setCurrentMorphData(firstMorph);
        setCurrentLemma(firstMorph.lemma || word);
      }

      setShowModal(true);
      
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
    if (!currentMorphData || !currentLemma) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No word data to save"
      });
      return;
    }

    try {
      const lexiconResponse = lexiconData[currentLemma];
      const meanings = lexiconResponse?.senses.flatMap(sense => sense.glosses) || [];
      
      const response = await fetch(`${BASE_URL}/vocab/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          vocabKey: namespace,
          word: word,
          morphData: [currentMorphData],
          lexiconData: {
            ...lexiconResponse,
            meanings: []
          },
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
    setShowLogeionModal(true);
  };

  return (
    <div className="container mx-auto space-y-4 p-1 animate-fade-in">
      <Card className="bg-gradient-to-r from-greek-blue-light/30 to-greek-blue/10 border-greek-blue/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-greek-blue">
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
            <Button onClick={handleGetLexicalData} disabled={loading} className="bg-greek-blue hover:bg-greek-blue-dark">
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
          
          <div className="flex justify-center">
            <a
              href="./vocab"
              className="text-greek-blue hover:text-greek-blue-dark"
              rel="noopener noreferrer"
            >
              Browse Vocabulary
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Modal for Lexical Data */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-1 space-y-1">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">Lexical Data for "{word}"</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                  <X />
                </Button>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 order-2 md:order-1">
                  <Button 
                    variant="outline"
                    className="mb-4 text-greek-blue hover:bg-greek-blue/10"
                    onClick={openLogeionModal}
                  >
                    <Book className="mr-2 h-4 w-4" />
                    Open in Logeion
                  </Button>

                  <Button 
                    variant="outline"
                    className="mb-4 text-greek-blue hover:bg-greek-blue/10"
                    onClick={() => setShowOccurrenceModal(true)}
                  >
                    <Book className="mr-2 h-4 w-4" />
                    View Occurrences
                  </Button>
                  

                  {/* Dodson Entry */}
                  {currentLemma && lexiconData[currentLemma]?.dodson && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-2">Dodson Entry</h4>
                      <Card>
                        <CardContent className="p-4">
                          <Table>
                            <TableBody>
                              {Object.entries(lexiconData[currentLemma].dodson || {}).map(
                                ([key, value]) => (
                                  <TableRow key={key}>
                                    <TableCell className="font-medium">{key}</TableCell>
                                    <TableCell>{value}</TableCell>
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                  
                  {/* Morphology Data */}
                  {morphologyData.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-2">Morphological Forms</h4>
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {morphologyData.map((morph, index) => (
                          <div
                            key={index}
                            onClick={() => handleMorphologyClick(morph)}
                            className={`p-4 rounded-md cursor-pointer flex-shrink-0 transition-colors ${
                              currentMorphData === morph
                                ? "bg-greek-blue text-white"
                                : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                          >
                            <div className="font-semibold">Form {index + 1}</div>
                            {morph.lemma && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-300">Lemma:</span>{" "}
                                {morph.lemma}
                              </div>
                            )}
                            {morph.partOfSpeech && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-300">Part of Speech:</span>{" "}
                                {morph.partOfSpeech}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Selected Morphology Details */}
                  {currentMorphData && (
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold mb-2">Detailed Morphology</h4>
                      <Table>
                        <TableBody>
                          {Object.entries(currentMorphData)
                            .filter(([_, value]) => value !== null)
                            .map(([key, value]) => (
                              <TableRow key={key}>
                                <TableCell className="font-medium capitalize">{key}</TableCell>
                                <TableCell>{value}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Notes and Save */}
                  <div className="mt-6">
                    <Collapsible open={showNotesInput} onOpenChange={setShowNotesInput}>
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" className="mb-2">
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
                      className="bg-greek-blue hover:bg-greek-blue-dark"
                      onClick={handleSaveWord}
                    >
                      Save Word
                    </Button>
                  </div>
                </div>

                {/* Lexicon Entries in scrollable container */}
                <div className="flex-1 order-1 md:order-2">
                  <h4 className="text-lg font-semibold mb-2">Lexicon Entries</h4>
                  {currentLemma && lexiconData[currentLemma] && (
                    <div className="space-y-4 max-h-[50vh] overflow-y-auto p-2">
                      {lexiconData[currentLemma].senses.map((sense, index) => (
                        <Card key={index} className="p-4">
                          <div className="text-sm text-gray-500 mb-2">
                            Entry {index + 1} of {lexiconData[currentLemma].senses.length}
                          </div>
                          
                          {/* Using dangerouslySetInnerHTML for the HTML content */}
                          <div 
                            className="prose dark:prose-invert max-w-full"
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
                                    <li key={i} className="border-l-2 border-gray-300 pl-3">
                                      <div className="text-amber-600 dark:text-amber-400">{quote.quote}</div>
                                      {biblText && (
                                        <div className="text-xs text-gray-500">– {biblText}</div>
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
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logeion Modal */}
      {showLogeionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 w-full h-full md:w-11/12 md:h-5/6 md:rounded-lg overflow-hidden">
            <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700">
              <h3 className="font-semibold">
                Logeion: {currentLemma || word}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowLogeionModal(false)}>
                <X size={18} />
              </Button>
            </div>
            <iframe
              ref={iframeRef}
              src={`https://logeion.uchicago.edu/${encodeURIComponent(currentLemma || word)}`}
              className="w-full h-[calc(100%-44px)]"
              title="Logeion"
            />
          </div>
        </div>
      )}

      {/* Occurrence Modal */}
      {showOccurrenceModal && (
        // <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        //   <div className="bg-white dark:bg-gray-800 w-full h-full md:w-11/12 md:h-5/6 md:rounded-lg overflow-hidden">
        //     <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700">
        //       <h3 className="font-semibold">
        //         {currentLemma || word}
        //       </h3>
        //       <Button variant="ghost" size="sm" onClick={() => setShowOccurrenceModal(false)}>
        //         <X size={18} />
        //       </Button>
        //     </div>

        //     <OccurrenceViewer word={currentLemma || word} />
            
        //   </div>
        // </div>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 w-full h-full overflow-y-auto">
            <div className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 sticky top-0 z-10">
              <h3 className="font-semibold">
                {currentLemma || word}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowOccurrenceModal(false)}>
                <X size={18} />
              </Button>
            </div>

            <OccurrenceViewer word={currentLemma || word} />
          </div>
        </div>
      )}
    </div>
  );
};

export default LexicaTool;
