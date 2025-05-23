
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
import { Wand2, Search, PlusCircle, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  // PaginationLink, // Not used directly for simple prev/next
  // PaginationPrevious, // Replaced with Button
  // PaginationNext, // Replaced with Button
  // PaginationEllipsis, // Not used for simple prev/next
} from "@/components/ui/pagination";

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
  type: string; 
}

const morphMap = {
  noun: {
    partOfSpeech: { noun: "N" },
    nounType: { none: "--", common: "c", proper: "p", gentilic: "g" },
    gender: { none: "--", masculine: "m", feminine: "f", common: "c", both: "b" },
    number: { none: "--", singular: "s", plural: "p", dual: "d" },
    state: { none: "--", absolute: "a", construct: "c", determined: "d" },
  },
  suffix: {
    partOfSpeech: { noun: "S" }, // Note: 'S' typically denotes a suffix in MorphHB, not a noun.
    suffixType: { none: "--", "directional he": "d", "paragogic he": "h", "paragogic nun": "n", "pronominal": "p" },
    gender: { none: "--", masculine: "m", feminine: "f", common: "c", both: "b" },
    number: { none: "--", singular: "s", plural: "p", dual: "d" },
    state: { none: "--", absolute: "a", construct: "c", determined: "d" }, // State is less common for pronominal suffixes
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
    aspect: { // Aspect is often used for verbs, 'type' might be more appropriate for some categories
      perfect: "p", "sequential-perfect": "q", imperfect: "i", "sequential-imperfect": "w",
      imperative: "v", 
      cohortative: "h", jussive: "j",
      "infinitive-construct": "c", "infinitive-absolute": "a",
      "participle-active": "r", "participle-passive": "s",
      participle: "r", // General participle if active/passive distinction isn't made
    },
    person: { "1": "1", "2": "2", "3": "3", none: "--" }, // Added 'none'
    gender: { none: "--", masculine: "m", feminine: "f", common: "c", both: "b" },
    number: { none: "--", singular: "s", plural: "p" }, // Dual might be relevant for some verbs, but often just singular/plural
  },
  // Added a general 'none' option for fields that might not apply
  generalNone: { none: "--" }
};

const prefixOptionsList = [
  { value: 'C', label: 'Conjunction' },
  { value: 'S', label: 'Preposition' },
  { value: 'D', label: 'Article' },
  { value: 'R', label: 'Relative' },
  // { value: 'T', label: 'Direct Object Marker' }, // Assuming 'T' for direct object might be an oversimplification for MorphHB construction
];

type HebrewPartOfSpeech = "noun" | "verb" | "adjective" | "conjunction" | "adverb" | "pronoun" | "preposition" | "particle" | "suffix";


const HEBREW_API_BASE_URL = 'https://www.eazilang.gleeze.com/api/hebrew';

const HebrewMorphBuilderPage: React.FC = () => {
  const { toast } = useToast();

  const [partOfSpeech, setPartOfSpeech] = useState<HebrewPartOfSpeech>("noun");
  const [selectedPrefixes, setSelectedPrefixes] = useState<Prefix[]>([]);
  const [suffixed, setSuffixed] = useState<string>("none");


  // Noun fields
  const [nounType, setNounType] = useState<string>("none");
  const [nounGender, setNounGender] = useState<string>("none");
  const [nounNumber, setNounNumber] = useState<string>("none");
  const [nounState, setNounState] = useState<string>("none");

  // Suffix fields
  const [suffixType, setSuffixType] = useState<string>("none");
  const [suffixPerson, setSuffixPerson] = useState<string>("none");
  const [suffixGender, setSuffixGender] = useState<string>("none");
  const [suffixNumber, setSuffixNumber] = useState<string>("none");
  const [suffixState, setSuffixState] = useState<string>("none"); // Usually not applicable for suffixes in MorphHB

  // Verb fields
  const [verbStem, setVerbStem] = useState<string>("qal");
  const [verbAspect, setVerbAspect] = useState<string>("perfect");
  const [verbPerson, setVerbPerson] = useState<string>("3");
  const [verbGender, setVerbGender] = useState<string>("masculine");
  const [verbNumber, setVerbNumber] = useState<string>("singular");

  const [generatedCode, setGeneratedCode] = useState<string>("");
  const [searchResults, setSearchResults] = useState<MorphSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [isResultsModalOpen, setIsResultsModalOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);


  const handleGenerateCode = useCallback(() => {
    let mainWordCodeParts: string[] = [];
    let suffixWordCodeParts: string[] = [];
    const mainWordLangPrefix = "H"; 

    if (partOfSpeech === "noun") {
      mainWordCodeParts = [
        morphMap.noun.partOfSpeech[partOfSpeech as keyof typeof morphMap.noun.partOfSpeech] || morphMap.generalNone.none,
        morphMap.noun.nounType[nounType as keyof typeof morphMap.noun.nounType] || morphMap.generalNone.none,
        morphMap.noun.gender[nounGender as keyof typeof morphMap.noun.gender] || morphMap.generalNone.none,
        morphMap.noun.number[nounNumber as keyof typeof morphMap.noun.number] || morphMap.generalNone.none,
        morphMap.noun.state[nounState as keyof typeof morphMap.noun.state] || morphMap.generalNone.none,
      ];
    } else if (partOfSpeech === "verb") { 
      mainWordCodeParts = [
        morphMap.verb.partOfSpeech[partOfSpeech as keyof typeof morphMap.verb.partOfSpeech] || morphMap.generalNone.none,
        morphMap.verb.stem[verbStem as keyof typeof morphMap.verb.stem] || morphMap.generalNone.none,
        morphMap.verb.aspect[verbAspect as keyof typeof morphMap.verb.aspect] || morphMap.generalNone.none,
        morphMap.verb.person[verbPerson as keyof typeof morphMap.verb.person] || morphMap.generalNone.none,
        morphMap.verb.gender[verbGender as keyof typeof morphMap.verb.gender] || morphMap.generalNone.none,
        morphMap.verb.number[verbNumber as keyof typeof morphMap.verb.number] || morphMap.generalNone.none,
      ];
    }
    // Add more POS conditions here if needed

    if (suffixed === "suffix") {
      suffixWordCodeParts = [
        morphMap.suffix.suffixType[suffixType as keyof typeof morphMap.suffix.suffixType] || morphMap.generalNone.none,
        morphMap.verb.person[suffixPerson as keyof typeof morphMap.verb.person] || morphMap.generalNone.none, // Suffix person often aligns with verb persons
        morphMap.suffix.gender[suffixGender as keyof typeof morphMap.suffix.gender] || morphMap.generalNone.none,
        morphMap.suffix.number[suffixNumber as keyof typeof morphMap.suffix.number] || morphMap.generalNone.none,
        // morphMap.suffix.state[suffixState as keyof typeof morphMap.suffix.state] || morphMap.generalNone.none, // State is usually not for suffixes
      ];
    }

    const mainWordCode = mainWordCodeParts.filter((v) => v !== '--').join("");
    const suffixWordCode = suffixWordCodeParts.filter((v) => v !== '--').join("");
    
    const prefixCodes = selectedPrefixes.map(p => `H${p.type}`); 
    
    let finalCode = "";
    if (prefixCodes.length > 0) {
      finalCode = prefixCodes.join('/') + '/' + mainWordLangPrefix + mainWordCode;
    } else {
      finalCode = mainWordLangPrefix + mainWordCode;
    }

    if(suffixWordCode) {
      // Suffixes in MorphHB are typically prefixed with 'S' (for suffix)
      finalCode = `${finalCode}/S${suffixWordCode}`;
    }
    
    setGeneratedCode(finalCode);
    return finalCode;
  }, [
    partOfSpeech, nounType, nounGender, nounNumber, nounState, 
    verbStem, verbAspect, verbPerson, verbGender, verbNumber, 
    selectedPrefixes,
    suffixType, suffixPerson, suffixGender, suffixNumber, /*suffixState,*/ suffixed
  ]);

  const handleSearchMorph = async () => {
    const codeToSearch = generatedCode || handleGenerateCode(); 
    if (!codeToSearch || codeToSearch === "H" || codeToSearch.endsWith("H--")) { // Avoid empty/minimal codes
      toast({
        variant: "destructive",
        title: "Incomplete Code",
        description: "Please select more features to generate a valid MorphHB code.",
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
          setIsResultsModalOpen(false);
        } else {
          toast({
            title: "Search Successful",
            description: `Found ${data.results.length} occurrences for ${codeToSearch}`,
          });
          setCurrentPage(1);
          setIsResultsModalOpen(true);
        }
      } else {
        setSearchResults([]);
        setIsResultsModalOpen(false);
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
      setIsResultsModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    handleGenerateCode();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partOfSpeech, nounType, nounGender, nounNumber, nounState, verbStem, verbAspect, verbPerson, verbGender, verbNumber, selectedPrefixes, suffixType, suffixPerson, suffixGender, suffixNumber, suffixed]);

  const handleAddPrefix = () => {
    setSelectedPrefixes(prev => [...prev, { id: `prefix-${Date.now()}`, type: prefixOptionsList[0].value }]);
  };

  const handleAddSuffix = () => {
    if(suffixed === 'none')
      setSuffixed('suffix')
    else setSuffixed('none')
  };

  const handleRemovePrefix = (idToRemove: string) => {
    setSelectedPrefixes(prev => prev.filter(p => p.id !== idToRemove));
  };

  const handlePrefixTypeChange = (idToUpdate: string, newType: string) => {
    setSelectedPrefixes(prev => prev.map(p => p.id === idToUpdate ? { ...p, type: newType } : p));
  };

  // Pagination logic
  const totalResults = searchResults.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage);
  const paginatedResults = searchResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <CardTitle className="text-lg text-accent">Prefix Morphemes</CardTitle>
                <Button onClick={handleAddPrefix} size="sm" variant="outline" className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Prefix
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-2">
              {selectedPrefixes.length === 0 && <p className="text-sm text-muted-foreground">No prefixes added.</p>}
              {selectedPrefixes.map((prefix) => (
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

          {/* Suffix Section */}
          <Card className="p-4 bg-muted/20 border-dashed">
            <CardHeader className="p-2 pt-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <CardTitle className="text-lg text-accent">Suffix Morphemes</CardTitle>
                <Button onClick={handleAddSuffix} size="sm" variant="outline" className="w-full sm:w-auto">
                  { suffixed === 'none' ? <PlusCircle className="mr-2 h-4 w-4" /> : <Trash2 className="mr-2 h-4 w-4 text-destructive" />}
                  {suffixed === 'none' ? 'Add Suffix' : 'Remove Suffix'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 p-2">
              {suffixed === 'none' && <p className="text-sm text-muted-foreground">No suffix added.</p>}
              {suffixed === 'suffix' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 p-3 border rounded-md bg-background">
                    <Label className="text-md font-semibold sm:col-span-2">Suffix Options</Label>
                    <div>
                        <Label htmlFor="suffixTypeSelect">Suffix Type</Label>
                        <Select value={suffixType} onValueChange={setSuffixType}>
                        <SelectTrigger id="suffixTypeSelect"><SelectValue placeholder="Select Suffix Type"/></SelectTrigger>
                        <SelectContent>
                            {Object.entries(morphMap.suffix.suffixType).map(([key, val]) => <SelectItem key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</SelectItem>)}
                        </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="suffixPersonSelect">Person</Label>
                        <Select value={suffixPerson} onValueChange={setSuffixPerson}>
                        <SelectTrigger id="suffixPersonSelect"><SelectValue placeholder="Select Person"/></SelectTrigger>
                        <SelectContent>
                            {Object.entries(morphMap.verb.person).map(([key, val]) => <SelectItem key={key} value={key}>{key === "none" ? "None" : (key + (key === "1" ? "st" : key === "2" ? "nd" : key === "3" ? "rd" : ""))}</SelectItem>)}
                        </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="suffixGenderSelect">Gender</Label>
                        <Select value={suffixGender} onValueChange={setSuffixGender}>
                        <SelectTrigger id="suffixGenderSelect"><SelectValue placeholder="Select Gender"/></SelectTrigger>
                        <SelectContent>
                            {Object.entries(morphMap.suffix.gender).map(([key, val]) => <SelectItem key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</SelectItem>)}
                        </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="suffixNumberSelect">Number</Label>
                        <Select value={suffixNumber} onValueChange={setSuffixNumber}>
                        <SelectTrigger id="suffixNumberSelect"><SelectValue placeholder="Select Number"/></SelectTrigger>
                        <SelectContent>
                        {Object.entries(morphMap.suffix.number).map(([key, val]) => <SelectItem key={key} value={key}>{key.charAt(0).toUpperCase() + key.slice(1)}</SelectItem>)}
                        </SelectContent>
                        </Select>
                    </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Main Word Section */}
          <Card className="p-4 bg-muted/20 border-dashed">
            <CardHeader className="p-2 pt-0"><CardTitle className="text-lg text-accent">Main Word Features</CardTitle></CardHeader>
            <CardContent className="space-y-4 p-2">
              <div>
                <Label htmlFor="partOfSpeechSelect">Part of Speech</Label>
                <Select value={partOfSpeech} onValueChange={(value) => setPartOfSpeech(value as HebrewPartOfSpeech)}>
                  <SelectTrigger id="partOfSpeechSelect">
                    <SelectValue placeholder="Select Part of Speech" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="noun">Noun</SelectItem>
                    <SelectItem value="verb">Verb</SelectItem>
                    {/* Add other POS options here if needed */}
                  </SelectContent>
                </Select>
              </div>

              {partOfSpeech === "noun" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 p-3 border rounded-md bg-background">
                  <Label className="text-md font-semibold sm:col-span-2">Noun Options</Label>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 p-3 border rounded-md bg-background">
                  <Label className="text-md font-semibold sm:col-span-2">Verb Options</Label>
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
                       {Object.entries(morphMap.verb.person).map(([key, val]) => <SelectItem key={key} value={key}>{key === "none" ? "None" : (key + (key === "1" ? "st" : key === "2" ? "nd" : key === "3" ? "rd" : ""))}</SelectItem>)}
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
              <Card className="p-3 bg-primary text-primary-foreground font-mono text-base sm:text-lg flex-grow text-center sm:text-left break-all">
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

      <Dialog open={isResultsModalOpen} onOpenChange={setIsResultsModalOpen}>
        <DialogContent className="w-full h-full max-w-none sm:max-w-4xl md:max-w-5xl lg:max-w-6xl flex flex-col p-0">
          <DialogHeader className="sticky top-0 bg-background z-10 p-4 border-b flex flex-row justify-between items-center">
            <DialogTitle className="text-lg font-semibold truncate">
              Results for "{generatedCode}" ({totalResults} occurrences)
            </DialogTitle>
            <DialogClose asChild>
              <Button variant="ghost" size="icon"><X className="h-5 w-5" /> <span className="sr-only">Close</span></Button>
            </DialogClose>
          </DialogHeader>
          
          <div className="flex-grow overflow-y-auto p-4">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(itemsPerPage)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : paginatedResults.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead>C:V</TableHead>
                      <TableHead>Word</TableHead>
                      <TableHead>MorphHB</TableHead>
                      <TableHead>Parsed</TableHead>
                      <TableHead>Lemma (Strongs)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedResults.map((row, index) => (
                      <TableRow key={`${row.book}-${row.chapter}-${row.verse}-${index}`}>
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
               <p className="text-muted-foreground text-center py-10">No results to display for the current page or filter.</p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t bg-background sticky bottom-0 z-10">
              <Pagination>
                <PaginationContent className="justify-center">
                  <PaginationItem>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)} 
                      disabled={currentPage === 1}
                      className="w-full sm:w-auto"
                    >
                      Previous
                    </Button>
                  </PaginationItem>
                  
                  <PaginationItem>
                    <span className="px-2 sm:px-4 text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                  </PaginationItem>

                  <PaginationItem>
                     <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)} 
                      disabled={currentPage === totalPages}
                      className="w-full sm:w-auto"
                    >
                      Next
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HebrewMorphBuilderPage;

