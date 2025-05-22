"use client";

import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Download, Search, ChevronDown, Pencil, Trash2 } from "lucide-react";

type MorphData = {
  partOfSpeech?: string;
  case?: string;
  gender?: string;
  number?: string;
  person?: string;
  tense?: string;
  voice?: string;
  mood?: string;
  lemma?: string;
  [key: string]: any;
};

type VocabWord = {
  id: string;
  word: string;
  headWord: string;
  meanings: string[];
  morphData?: MorphData[];
};

const BASE_URL = 'https://www.eazilang.gleeze.com/api/greek'

const VocabularyBrowser: React.FC = () => {
  // State variables
  const [listName, setListName] = useState<string>('');
  const [vocabLists, setVocabLists] = useState<{ name: string; count: number }[]>([]);
  const [fullList, setFullList] = useState<VocabWord[]>([]);
  const [filteredList, setFilteredList] = useState<VocabWord[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [currentEditWord, setCurrentEditWord] = useState<VocabWord | null>(null);
  const { toast } = useToast();

  // Fetch list names on component mount
  useEffect(() => {
    fetchListNames();
  }, []);

  // Filter words when search term or full list changes
  useEffect(() => {
    filterWords();
  }, [searchTerm, fullList]);

  const fetchListNames = async () => {
    try {
      const response = await fetch(`${BASE_URL}/vocab/info`);
      const data = await response.json();
      setVocabLists(data);
    } catch (err) {
      console.error('Failed to fetch vocab lists:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch vocabulary lists."
      });
    }
  };

  const loadVocabList = async () => {
    if (!listName) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a list name or select one from the dropdown."
      });
      return;
    }

    try {
      const url = `${BASE_URL}/vocab/list/${listName}`;
      const response = await fetch(url);
      const data = await response.json();
      setFullList(data.words);
      setCurrentPage(1);
      toast({
        title: "List Loaded",
        description: `Successfully loaded ${data.words.length} vocabulary items.`
      });
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load vocabulary list."
      });
    }
  };

  const filterWords = () => {
    const keyword = searchTerm.toLowerCase();
    const filtered = fullList.filter(
      word => word.word.toLowerCase().includes(keyword) || 
              word.headWord.toLowerCase().includes(keyword)
    );
    setFilteredList(filtered);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(parseInt(value));
    setCurrentPage(1);
  };

  const downloadVocabList = () => {
    if (!fullList.length) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No data loaded to download."
      });
      return;
    }
    
    const blob = new Blob([JSON.stringify({ words: fullList }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${listName}-vocab-list.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download Started",
      description: `Downloading ${listName}-vocab-list.json`
    });
  };

  const openUpdateDialog = (word: VocabWord) => {
    setCurrentEditWord(word);
    setIsDialogOpen(true);
  };

  const handleDeleteWord = async (word: VocabWord) => {
    try {
      const response = await fetch(`${BASE_URL}/vocab/delete/${listName}`, { 
        method: 'DELETE', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: word.id }) 
      });
      
      const data = await response.json();
      
      if (data.success) {
        setFullList(fullList.filter(w => w.id !== word.id));
        toast({
          title: "Word Deleted",
          description: `Successfully deleted "${word.word}"`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Delete Failed",
          description: data.message || "Failed to delete word"
        });
      }
    } catch (err) {
      console.error('Delete failed:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete word"
      });
    }
  };

  const handleUpdateWord = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentEditWord) return;
    
    const formData = new FormData(e.target as HTMLFormElement);
    const word = formData.get('word') as string;
    const headWord = formData.get('headWord') as string;
    const meanings = (formData.get('meanings') as string)
      .split(',')
      .map(m => m.trim())
      .filter(m => m.length > 0);
    
    const updated = {
      vocabKey: listName,
      word,
      headWord,
      meanings,
      id: currentEditWord.id
    };

    try {
      const response = await fetch(`${BASE_URL}/vocab/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsDialogOpen(false);
        loadVocabList();
        toast({
          title: "Word Updated",
          description: `Successfully updated "${word}"`
        });
      } else {
        toast({
          variant: "destructive",
          title: "Update Failed",
          description: data.message || "Failed to update word"
        });
      }
    } catch (err) {
      console.error('Update failed:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update word"
      });
    }
  };

  // Helper function to highlight matched text
  const highlightMatch = (text: string, keyword: string) => {
    if (!keyword.trim()) return text;
    
    const regex = new RegExp(`(${keyword})`, 'gi');
    const parts = text.split(regex);
    
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? <span key={i} className="bg-yellow-300 text-black">{part}</span> : part
        )}
      </>
    );
  };

  // Helper function to get formatted morphological info
  const formatMorphInfo = (morph: MorphData) => {
    if (morph.partOfSpeech === 'verb' && morph.mood !== 'participle' && morph.mood !== 'infinitive') {
      return `${morph.partOfSpeech}: ${morph.person} ${morph.number}, ${morph.tense}, ${morph.voice}, ${morph.mood}`;
    } else if (morph.partOfSpeech === 'verb' && morph.mood === 'infinitive') {
      return `${morph.partOfSpeech}: ${morph.tense}, ${morph.voice}, ${morph.mood}`;
    } else if (morph.partOfSpeech === 'verb' && morph.mood === 'participle') {
      return `${morph.partOfSpeech}: ${morph.tense}, ${morph.voice}, ${morph.mood} (${morph.case}, ${morph.gender}, ${morph.number})`;
    } else if (morph.partOfSpeech === 'adverb') {
      return `${morph.partOfSpeech}`;
    } else {
      return `${morph.partOfSpeech}: ${morph.case} ${morph.number}, ${morph.gender}`;
    }
  };

  // Calculate pagination values
  const totalPages = Math.ceil(filteredList.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentPageItems = filteredList.slice(startIndex, startIndex + pageSize);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Greek Vocabulary Browser</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="listInput">Vocabulary List</Label>
              <div className="flex">
                <Input 
                  id="listInput"
                  value={listName}
                  onChange={(e) => setListName(e.target.value)}
                  placeholder="Enter list name"
                  className="rounded-r-none"
                />
                <Select onValueChange={(value) => setListName(value)}>
                  <SelectTrigger className="w-[180px] rounded-l-none border-l-0">
                    <SelectValue placeholder="Select list" />
                  </SelectTrigger>
                  <SelectContent>
                    {vocabLists.map((list) => (
                      <SelectItem key={list.name} value={list.name}>
                        {list.name} ({list.count || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-end sm:col-span-2">
              <div className="flex gap-2 flex-wrap">
                <Button onClick={loadVocabList}>Load List</Button>
                <Button variant="outline" onClick={downloadVocabList} className="gap-2">
                  <Download size={16} />
                  Download
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="searchInput">Search Words</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  id="searchInput"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter words..."
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="pageSizeSelect">Page Size</Label>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {fullList.length > 0 ? (
        <div className="space-y-4">
          {currentPageItems.length > 0 ? (
            currentPageItems.map((word) => (
              <Card key={word.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                    <div className="text-xl font-medium text-primary">
                      {highlightMatch(word.word, searchTerm)} 
                      <span className="mx-2 text-muted-foreground">→</span> 
                      {highlightMatch(word.headWord, searchTerm)}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openUpdateDialog(word)}>
                        <Pencil size={16} className="mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteWord(word)}
                      >
                        <Trash2 size={16} className="mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {word.morphData && word.morphData.length > 0 && (
                    <Collapsible className="mb-3">
                      <CollapsibleTrigger className="flex items-center justify-between p-2 w-full text-sm border rounded-md bg-muted/50 hover:bg-muted">
                        <span>Morphology Information</span>
                        <ChevronDown size={16} />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="flex gap-2 overflow-x-auto py-2 px-1 mt-2 border border-dashed rounded-md">
                          <span className="text-xs text-muted-foreground self-center whitespace-nowrap">← slide →</span>
                          {word.morphData.map((morph, idx) => (
                            <Badge key={idx} variant="outline" className="whitespace-nowrap py-1 px-2">
                              {formatMorphInfo(morph)}
                            </Badge>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                  
                  <div className="mt-2">
                    <h4 className="text-sm font-medium mb-1">Meanings:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {word.meanings.map((meaning, idx) => (
                        <li key={idx} className="text-muted-foreground">{meaning}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center p-8 border rounded-lg bg-muted/50">
              <p>No matches found for "{searchTerm}"</p>
            </div>
          )}

          {filteredList.length > pageSize && (
            <Pagination className="mt-6">
              <PaginationContent>
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  // Show first, last, current, and pages near current
                  const shouldShow = 
                    page === 1 || 
                    page === totalPages || 
                    Math.abs(page - currentPage) <= 2;
                  
                  if (!shouldShow) {
                    // Show ellipsis for skipped pages, but only once
                    if (page === 2 || page === totalPages - 1) {
                      return (
                        <PaginationItem key={`ellipsis-${page}`}>
                          <span className="px-2">...</span>
                        </PaginationItem>
                      );
                    }
                    return null;
                  }
                  
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
              </PaginationContent>
            </Pagination>
          )}
        </div>
      ) : (
        <div className="text-center p-12 border rounded-lg bg-muted/50">
          <h3 className="text-lg font-medium mb-2">No vocabulary loaded</h3>
          <p className="text-muted-foreground">Enter a vocabulary list name above and click "Load List" to begin.</p>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Vocabulary</DialogTitle>
          </DialogHeader>
          
          {currentEditWord && (
            <form onSubmit={handleUpdateWord}>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="word">Word</Label>
                  <Input 
                    id="word" 
                    name="word"
                    defaultValue={currentEditWord.word} 
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="headWord">Headword</Label>
                  <Input 
                    id="headWord" 
                    name="headWord"
                    defaultValue={currentEditWord.headWord} 
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="meanings">Meanings (comma separated)</Label>
                  <Textarea 
                    id="meanings" 
                    name="meanings"
                    defaultValue={currentEditWord.meanings.join(', ')} 
                    rows={4}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VocabularyBrowser;
