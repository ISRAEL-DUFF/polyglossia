
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { logHistoryEntry } from "@/lib/utils/historyLogger";
import { Book, ExternalLink } from "lucide-react";
import './LatinLexicon.css'; // Ensure this CSS file is created

// Define a generic structure for Latin lexicon entries
interface LatinLexiconEntry {
  htmlText: string; // Assuming entries are provided as HTML strings
  sourceName?: string; // e.g., "Lewis & Short", "Elementary Latin Dictionary"
}

interface LatinLexiconResponse {
  morphology?: any[]; // Placeholder for morphology if available from API
  lexica: {
    [key: string]: LatinLexiconEntry; // e.g., { "lewisShort": { htmlText: "..." } }
  };
}

const BASE_URL = 'http://localhost:3001/latin'; // For local dev
// const BASE_URL = 'https://www.eazilang.gleeze.com/api/latin'; // Placeholder, adjust to your actual API

interface LatinLexiconViewerProps {
    latinWord: string;
    historyNamespace: string;
    showLexicalModal: boolean;
    setShowLexicalModal: (open: boolean) => void;
    onResponse: (response: 'loading' | 'ready' | 'error') => void;
}

const LatinLexiconViewer: React.FC<LatinLexiconViewerProps> = ({
  latinWord,
  historyNamespace,
  showLexicalModal,
  setShowLexicalModal,
  onResponse
}) => {
  const [wordToFetch, setWordToFetch] = useState('');
  const [lexicalData, setLexicalData] = useState<LatinLexiconResponse['lexica'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPerseusModal, setShowPerseusModal] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log("CCC", {
      latinWord,
      wordToFetch
    })

    if (latinWord === wordToFetch) {
      return;
    }

    console.log('Setting word to fetch:', latinWord)
    setWordToFetch(latinWord);
  }, [latinWord]);

  useEffect(() => {
    let isMounted = true; // To prevent state updates if unmounted

    const fetchData = async () => {
      // if (!wordToFetch || !showLexicalModal) {
      //   if (!wordToFetch && showLexicalModal) onResponse('error'); // Word cleared while modal was open
      //   return;
      // }

      if (!wordToFetch.trim()) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Please enter a Latin word"
        });
        return;
     }

      setLoading(true);
      onResponse('loading');
      setLexicalData(null);

      try {
        console.log('url to fetch:', `${BASE_URL}/lexica/${encodeURIComponent(wordToFetch.trim())}`)
        const lexiconUrl = `${BASE_URL}/lexica?word=${encodeURIComponent(wordToFetch.trim())}`;
        const lexiconRes = await fetch(lexiconUrl);

        if (!lexiconRes.ok) {
          throw new Error(`Failed to fetch lexicon data (${lexiconRes.status})`);
        }

        const lexiconResponse = await lexiconRes.json();

        console.log({
          response: lexiconResponse
        })

        const responseData: LatinLexiconResponse = lexiconResponse;
        setLexicalData(responseData.lexica);

        if (historyNamespace) {
          await logHistoryEntry({
            word: wordToFetch.trim(),
            lemma: wordToFetch.trim(), // Using input word as lemma for now, API might provide better
            namespace: historyNamespace,
            language: 'latin'
          });
          // toast({ title: "Logged", description: `"${wordToFetch.trim()}" added to Latin history.` });
        }
        onResponse('ready');
      } catch (error) {
        console.error("Error fetching Latin lexical data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: (error as Error).message || "Failed to fetch lexical data."
        });
        if(isMounted) {
          onResponse('error');
        }
      } finally {
        setLoading(false);
      }
    };

    // if (showLexicalModal) {
    //     fetchData();
    // }

    console.log('CHECK')

    fetchData();

    return () => {
        isMounted = false;
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordToFetch]);

  const openPerseusModal = () => {
    setShowPerseusModal(true);
  };
  
  const lexiconKeys = lexicalData ? Object.keys(lexicalData) : [];

  return (
    <Dialog open={showLexicalModal} onOpenChange={setShowLexicalModal}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Lexical Data for "{wordToFetch}"</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4 px-6">
            <Button
                variant="outline"
                onClick={openPerseusModal}
                disabled={!wordToFetch}
            >
                <ExternalLink className="mr-2 h-4 w-4" />
                View in Perseus (Logeion)
            </Button>
        </div>
        
        <div className="flex-grow overflow-y-auto px-6 pb-6">
          {loading && <p className="text-muted-foreground text-center py-8">Loading lexical data...</p>}
          {!loading && !lexicalData && wordToFetch &&
            <p className="text-muted-foreground text-center py-8">No lexical data found for "{wordToFetch}".</p>
          }
          {!loading && lexicalData && lexiconKeys.length === 0 &&
            <p className="text-muted-foreground text-center py-8">Lexicon data is empty for "{wordToFetch}".</p>
          }

          {!loading && lexicalData && lexiconKeys.length > 0 && (
            <Tabs defaultValue={lexiconKeys[0]} className="w-full">
              <TabsList className="mb-4">
                {lexiconKeys.map(key => (
                  <TabsTrigger key={key} value={key}>
                    {lexicalData[key]?.sourceName || key.replace(/([A-Z])/g, ' $1').trim()}
                  </TabsTrigger>
                ))}
              </TabsList>
              {lexiconKeys.map(key => (
                <TabsContent key={key} value={key}>
                  <Card>
                    <CardContent className="p-4 lexicon-html-content prose dark:prose-invert max-w-full">
                      <div dangerouslySetInnerHTML={{ __html: lexicalData[key]?.htmlText || "<p>No content available for this entry.</p>" }} />
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </DialogContent>

      <Dialog open={showPerseusModal} onOpenChange={setShowPerseusModal}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-4 pb-2 border-b bg-muted shrink-0">
              <DialogTitle>Perseus Digital Library (via Logeion): {wordToFetch}</DialogTitle>
            </DialogHeader>
            <div className="flex-grow overflow-hidden">
              <iframe
                ref={iframeRef}
                src={`https://logeion.uchicago.edu/${encodeURIComponent(wordToFetch)}`}
                className="w-full h-full border-0"
                title="Perseus via Logeion"
              />
            </div>
            <DialogFooter className="p-4 border-t bg-muted shrink-0">
                <Button variant="outline" onClick={() => setShowPerseusModal(false)}>Close</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};

export default LatinLexiconViewer;
