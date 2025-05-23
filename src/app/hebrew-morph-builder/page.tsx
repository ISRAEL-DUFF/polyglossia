
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { Wand2, Search, PlusCircle, Trash2 } from 'lucide-react';

interface MorphSearchResult {
  book: string;
  chapter: number;
  verse: number;
  word: string;
  morph: string;
  morphology: {
    morph: string;
  };
  strongNumber?: string;
}

interface Prefix {
  id: string;
  type: string; // e.g., 'C' for Conjunction, 'S' for Preposition
}

const morphMap = {
  noun: {
    partOfSpeech: { noun: "N" },
    nounType: { common: "c", proper: "p", gentilic: "g" },
    gender: { masculine: "m", feminine: "f", common: "c", both: "b" },
    number: { singular: "s", plural: "p", dual: "d" },
    state: { absolute: "a", construct: "c", determined: "d" },
  },
  verb: {
    partOfSpeech: { verb: "V" },
    stem: {
      qal: "q", qalpassive: "Q", niphal: "n", piel: "p", pual: "P",
      hiphil: "h", hophal: "H", hithpael: "t", polel: "o", polal: "O",
      hithpolel: "r", poel: "m", poal: "M", palel: "k", pulal: "K",
      pilpel: "l", polpal: "L", hithpalpel: "f", nithpael: "D", pealal: "j",
      pilel: "i", hothpal: "u", tiphil: "c", hishtaphel: "v", nithpalel: "w",
      nithpoel: "y", hithpoel: "z",
    },
    aspect: {
      perfect: "p", "sequential-perfect": "q", imperfect: "i", "sequential-imperfect": "w",
      imperative: "v", 
      cohortative: "h", jussive: "j",
      "infinitive-construct": "c", "infinitive-absolute": "a",
      "participle-active": "r", "participle-passive": "s",
      participle: "r", 
    },
    person: { "1": "1", "2": "2", "3": "3" },
    gender: { masculine: "m", feminine: "f", common: "c", both: "b" },
    number: { singular: "s", plural: "p" },
  },
};

const prefixOptionsList = [
  { value: 'C', label: 'Conjunction' },
  { value: 'S', label: 'Preposition' },
  { value: 'D', label: 'Article' },
  { value: 'R', label: 'Relative' },
  { value: 'T', label: 'Direct Object Marker' },
];

const HEBREW_API_BASE_URL = 'https://www.eazilang.gleeze.com/api/hebrew';

const HebrewMorphBuilderPage: React.FC = () => {
  const { toast } = useToast();

  const [partOfSpeech, setPartOfSpeech] = useState<"noun" | "verb">("noun");
  const [selectedPrefixes, setSelectedPrefixes] = useState<Prefix[]>([]);

  // Noun fields
  const [nounType, setNounType] = useState<string>("common");
  const [nounGender, setNounGender] = useState<string>("masculine");
  const [nounNumber, setNounNumber] = useState<string>("singular");
  const [nounState, setNounState] = useState<string>("absolute");

  // Verb fields
  const [verbStem, setVerbStem] = useState<string>("qal");
  const [verbAspect, setVerbAspect] = useState<string>("perfect");
  const [verbPerson, setVerbPerson] = useState<string>("3");
  const [verbGender, setVerbGender] = useState<string>("masculine");
  const [verbNumber, setVerbNumber] = useState<string>("singular");

  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [searchResults, setSearchResults] = useState<MorphSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleGenerateCode = useCallback(() => {
    let mainWordCodeParts: string[] = [];
    const mainWordLangPrefix = "HS"; // For the main word segment

    if (partOfSpeech === "noun") {
      mainWordCodeParts = [
        mainWordLangPrefix,
        morphMap.noun.partOfSpeech[partOfSpeech],
        morphMap.noun.nounType[nounType as keyof typeof morphMap.noun.nounType],
        morphMap.noun.gender[nounGender as keyof typeof morphMap.noun.gender],
        morphMap.noun.number[nounNumber as keyof typeof morphMap.noun.number],
        morphMap.noun.state[nounState as keyof typeof morphMap.noun.state],
      ];
    } else { // verb
      mainWordCodeParts = [
        mainWordLangPrefix,
        morphMap.verb.partOfSpeech[partOfSpeech],
        morphMap.verb.stem[verbStem as keyof typeof morphMap.verb.stem],
        morphMap.verb.aspect[verbAspect as keyof typeof morphMap.verb.aspect],
        morphMap.verb.person[verbPerson as keyof typeof morphMap.verb.person],
        morphMap.verb.gender[verbGender as keyof typeof morphMap.verb.gender],
        morphMap.verb.number[verbNumber as keyof typeof morphMap.verb.number],
      ];
    }
    const mainWordCode = mainWordCodeParts.filter(Boolean).join("");

    const prefixCodes = selectedPrefixes.map(p => `H${p.type}`); // Prefixes always use 'H' for language
    
    let finalCode = "";
    if (prefixCodes.length > 0) {
      finalCode = prefixCodes.join('/') + '/' + mainWordCode;
    } else {
      finalCode = mainWordCode;
    }
    
    setGeneratedCode(finalCode);
    return finalCode;
  }, [partOfSpeech, nounType, nounGender, nounNumber, nounState, verbStem, verbAspect, verbPerson, verbGender, verbNumber, selectedPrefixes]);

  const handleSearchMorph = async () => {
    const codeToSearch = generatedCode || handleGenerateCode(); 
    if (!codeToSearch) {
      toast({
        variant: "destructive",
        title: "No Code Generated",
        description: "Please generate a MorphHB code first.",
      });
      return;
    }

    setIsLoading(true);
    setSearchResults([]);
    try {
      const response = await fetch(`${HEBREW_API_BASE_URL}/search-morph?code=${encodeURIComponent(codeToSearch)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `API request failed: ${response.status}`);
      }
      const data = await response.json();
      if (data && data.results && Array.isArray(data.results)) {
        setSearchResults(data.results);
        if (data.results.length === 0) {
          toast({
            title: "No Results",
            description: `No occurrences found for MorphHB code: ${codeToSearch}`,
          });
        } else {
          toast({
            title: "Search Successful",
            description: `Found ${data.results.length} occurrences for ${codeToSearch}`,
          });
        }
      } else {
        setSearchResults([]);
         toast({
            title: "No Results",
            description: `No occurrences found or unexpected data for MorphHB code: ${codeToSearch}`,
          });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Search Failed",
        description: error.message || "An error occurred while searching.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    handleGenerateCode();
  }, [partOfSpeech, nounType, nounGender, nounNumber, nounState, verbStem, verbAspect, verbPerson, verbGender, verbNumber, selectedPrefixes, handleGenerateCode]);

  const handleAddPrefix = () => {
    setSelectedPrefixes(prev => [...prev, { id: `prefix-${Date.now()}`, type: prefixOptionsList[0].value }]);
  };

  const handleRemovePrefix = (idToRemove: string) => {
    setSelectedPrefixes(prev => prev.filter(p => p.id !== idToRemove));
  };

  const handlePrefixTypeChange = (idToUpdate: string, newType: string) => {
    setSelectedPrefixes(prev => prev.map(p => p.id === idToUpdate ? { ...p, type: newType } : p));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2 text-primary">
            <Wand2 className="h-6 w-6" />
            Hebrew Morphology Code Builder
          </CardTitle>
          <CardDescription>
            Construct a MorphHB code by selecting prefixes and main word features, then search for occurrences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Prefix Section */}
          <Card className="p-4 bg-muted/20 border-dashed">
            <CardHeader className="p-2 pt-0">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg text-accent">Prefix Morphemes</CardTitle>
                <Button onClick={handleAddPrefix} size="sm" variant="outline">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Prefix
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-2">
              {selectedPrefixes.length === 0 && <p className="text-sm text-muted-foreground">No prefixes added.</p>}
              {selectedPrefixes.map((prefix, index) => (
                <div key={prefix.id} className="flex items-center gap-2 p-2 border rounded-md bg-background">
                  <Badge variant="secondary" className="shrink-0">H (Hebrew)</Badge>
                  <Select 
                    value={prefix.type} 
                    onValueChange={(value) => handlePrefixTypeChange(prefix.id, value)}
                  >
                    <SelectTrigger className="flex-grow">
                      <SelectValue placeholder="Select prefix type" />
                    </SelectTrigger>
                    <SelectContent>
                      {prefixOptionsList.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => handleRemovePrefix(prefix.id)} variant="ghost" size="icon">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Main Word Section */}
          <Card className="p-4 bg-muted/20 border-dashed">
            <CardHeader className="p-2 pt-0"><CardTitle className="text-lg text-accent">Main Word Features</CardTitle></CardHeader>
            <CardContent className="space-y-4 p-2">
              <div>
                <Label htmlFor="partOfSpeechSelect">Part of Speech</Label>
                <Select value={partOfSpeech} onValueChange={(value) => setPartOfSpeech(value as "noun" | "verb")}>
                  <SelectTrigger id="partOfSpeechSelect">
                    <SelectValue placeholder="Select Part of Speech" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="noun">Noun</SelectItem>
                    <SelectItem value="verb">Verb</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {partOfSpeech === "noun" && (
                <div className="space-y-3 p-3 border rounded-md bg-background">
                  <Label className="text-md font-semibold">Noun Options</Label>
                  <div>
                    <Label htmlFor="nounTypeSelect">Noun Type</Label>
                    <Select value={nounType} onValueChange={setNounType}>
                      <SelectTrigger id="nounTypeSelect"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(morphMap.noun.nounType).map(([key, val]) => <SelectItem key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nounGenderSelect">Gender</Label>
                    <Select value={nounGender} onValueChange={setNounGender}>
                      <SelectTrigger id="nounGenderSelect"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(morphMap.noun.gender).map(([key, val]) => <SelectItem key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nounNumberSelect">Number</Label>
                    <Select value={nounNumber} onValueChange={setNounNumber}>
                      <SelectTrigger id="nounNumberSelect"><SelectValue /></SelectTrigger>
                      <SelectContent>
                       {Object.entries(morphMap.noun.number).map(([key, val]) => <SelectItem key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nounStateSelect">State</Label>
                    <Select value={nounState} onValueChange={setNounState}>
                      <SelectTrigger id="nounStateSelect"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(morphMap.noun.state).map(([key, val]) => <SelectItem key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {partOfSpeech === "verb" && (
                <div className="space-y-3 p-3 border rounded-md bg-background">
                  <Label className="text-md font-semibold">Verb Options</Label>
                  <div>
                    <Label htmlFor="verbStemSelect">Stem</Label>
                    <Select value={verbStem} onValueChange={setVerbStem}>
                      <SelectTrigger id="verbStemSelect"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(morphMap.verb.stem).map(([key, val]) => <SelectItem key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="verbAspectSelect">Aspect</Label>
                    <Select value={verbAspect} onValueChange={setVerbAspect}>
                      <SelectTrigger id="verbAspectSelect"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(morphMap.verb.aspect).map(([key, val]) => <SelectItem key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="verbPersonSelect">Person</Label>
                    <Select value={verbPerson} onValueChange={setVerbPerson}>
                      <SelectTrigger id="verbPersonSelect"><SelectValue /></SelectTrigger>
                      <SelectContent>
                       {Object.entries(morphMap.verb.person).map(([key, val]) => <SelectItem key={key} value={key}>{key}{key === "1" ? "st" : key === "2" ? "nd" : "rd"}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="verbGenderSelect">Gender</Label>
                    <Select value={verbGender} onValueChange={setVerbGender}>
                      <SelectTrigger id="verbGenderSelect"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(morphMap.verb.gender).map(([key, val]) => <SelectItem key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="verbNumberSelect">Number</Label>
                    <Select value={verbNumber} onValueChange={setVerbNumber}>
                      <SelectTrigger id="verbNumberSelect"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(morphMap.verb.number).map(([key, val]) => <SelectItem key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Button onClick={handleGenerateCode} variant="outline" className="w-full sm:w-auto">
              <Wand2 className="mr-2 h-4 w-4" /> Refresh Code
            </Button>
            {generatedCode && (
              <Card className="p-3 bg-primary text-primary-foreground font-mono text-lg flex-grow text-center sm:text-left break-all">
                {generatedCode}
              </Card>
            )}
          </div>
            <Button onClick={handleSearchMorph} disabled={isLoading || !generatedCode} className="w-full">
              <Search className="mr-2 h-4 w-4" />
              {isLoading ? "Searching..." : "Search Morph Code"}
            </Button>
        </CardContent>
      </Card>

      {(isLoading || searchResults.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            {searchResults.length > 0 && <CardDescription>Found {searchResults.length} occurrences for "{generatedCode}".</CardDescription>}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : searchResults.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead>C:V</TableHead>
                      <TableHead>Word</TableHead>
                      <TableHead>MorphHB</TableHead>
                      <TableHead>Parsed</TableHead>
                      <TableHead>Lemma</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.book}</TableCell>
                        <TableCell>{row.chapter}:{row.verse}</TableCell>
                        <TableCell className="hebrew hebrew-size">{row.word}</TableCell>
                        <TableCell className="font-mono">{row.morph}</TableCell>
                        <TableCell className="text-xs">{row.morphology?.morph}</TableCell>
                        <TableCell className="font-mono">{row.strongNumber}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              !isLoading && <p className="text-muted-foreground">No results to display.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HebrewMorphBuilderPage;

    