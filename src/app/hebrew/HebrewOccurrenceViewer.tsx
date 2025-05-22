
"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button"; // Added import for ShadCN Button

interface Occurrence {
  book: string;
  chapter: number;
  verse: number;
  word: string;
  morphology: {
    morph: string;
    next: string;
    segs: number;
  };
  strongNumber: string;
}

interface ChapterData {
  count: number;
  occurrence: Occurrence[];
}

interface BookData {
  book_name: string;
  count: number;
  chapters: Record<string, ChapterData>;
}

interface StructuredData {
  structured: Record<string, BookData>;
}

const HebrewOccurrenceDisplay: React.FC<{ data: StructuredData }> = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 1; // Number of books to display per page
  const scrollableRef = useRef<HTMLDivElement>(null); // Ref for the scrollable container

  // Get the keys of the structured data
  const bookKeys = Object.keys(data.structured);
  const totalPages = Math.ceil(bookKeys.length / itemsPerPage);

  // Paginated data
  const paginatedBooks = bookKeys.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle page navigation
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      if (scrollableRef.current) {
        scrollableRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      if (scrollableRef.current) {
        scrollableRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="bg-background text-foreground h-full overflow-y-auto p-4 md:p-6 space-y-6" ref={scrollableRef}>
      <h1 className="text-2xl font-bold mb-6 text-center text-primary">Occurrences by Book and Chapter</h1>
      <div className="space-y-8">
        {paginatedBooks.map((bookKey) => {
          const book = data.structured[bookKey];
          return (
            <div key={bookKey} className="bg-card border border-border p-4 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-primary mb-4">
                {book.book_name} ({book.count} occurrences)
              </h2>
              <div className="space-y-4">
                {Object.entries(book.chapters).map(([chapterKey, chapter]) => (
                  <div key={chapterKey} className="bg-muted/50 border border-border p-4 rounded-md">
                    <h3 className="text-lg font-medium text-secondary-foreground mb-2">
                      {chapterKey.replace('chapter_', 'Chapter ')} ({chapter.count})
                    </h3>
                    <ul className="space-y-1">
                      {chapter.occurrence.map((occ, index) => (
                        <li key={index} className="border-b border-border py-3 last:border-b-0">
                          <div className="text-lg font-mono text-amber-600 dark:text-amber-400">{occ.word}</div>
                          <div className="text-sm text-muted-foreground">
                            {occ.book} {occ.chapter}:{occ.verse}
                          </div>
                          <div
                            className="text-sm text-muted-foreground mt-1"
                            dangerouslySetInnerHTML={{ __html: occ.morphology.morph }}
                          />
                          <div className="text-xs text-muted-foreground">Strong's: {occ.strongNumber}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
          <Button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            variant="outline"
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default HebrewOccurrenceDisplay;
