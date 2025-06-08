
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { LatinInput } from "@/components/LatinInput";
import { Skeleton } from '@/components/ui/skeleton';
import './LatinWhitaker.css';

// const BASE_URL = 'http://localhost:3001/latin'; // For local dev
const BASE_URL = 'https://www.eazilang.gleeze.com/api/latin';

interface WhitakerResponse {
  processed: string[];
}

const LatinWhitakerTool: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resultsHtml, setResultsHtml] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a Latin word or phrase."
      });
      return;
    }

    setIsLoading(true);
    setHasSearched(true);
    setResultsHtml([]); // Clear previous results

    try {
      const response = await fetch(`${BASE_URL}/whitaker?words=${encodeURIComponent(searchTerm.trim())}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Request failed with status ${response.status}` }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }

      const data: WhitakerResponse = await response.json();

      if (data.processed && data.processed.length > 0) {
        setResultsHtml(data.processed);
        toast({
          title: "Search Complete",
          description: `Found results for "${searchTerm}".`
        });
      } else {
        toast({
          variant: "default",
          title: "No Results",
          description: `No Whitaker's Words entries found for "${searchTerm}".`
        });
      }
    } catch (error) {
      console.error("Error fetching Whitaker's Words data:", error);
      toast({
        variant: "destructive",
        title: "Search Error",
        description: (error as Error).message || "Failed to fetch data. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-1">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-primary">
            Latin Whitaker's Words Lookup
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Enter a Latin word to see its analysis from Whitaker's Words.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-6">
            <LatinInput
              id="latinWhitakerInput"
              placeholder="e.g., amo, pecunia"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-lg flex-grow"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button type="submit" disabled={isLoading || !searchTerm.trim()} className="w-full sm:w-auto">
              {isLoading ? "Searching..." : "Search"}
              <Search className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}

          {!isLoading && hasSearched && resultsHtml.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-lg">No results found for "{searchTerm}".</p>
              <p>Please check your spelling or try a different word.</p>
            </div>
          )}

          {!isLoading && resultsHtml.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-xl">Whitaker's Analysis for "{searchTerm}"</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {resultsHtml.map((htmlBlock, index) => (
                  <div
                    key={index}
                    className="p-4 border rounded-md bg-muted/20 whitaker-output-container"
                    dangerouslySetInnerHTML={{ __html: htmlBlock }}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LatinWhitakerTool;
