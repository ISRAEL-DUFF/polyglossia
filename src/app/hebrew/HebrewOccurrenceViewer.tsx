"use client";

import React, { useState, useRef } from "react";

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
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      // Scroll to the top of the scrollable container
      if (scrollableRef.current) {
        scrollableRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        console.log("Scrolled Next")
      }
    }
  };

  return (
    <div className="p-6 bg-white text-black min-h-screen h-full" ref={scrollableRef}>
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">Occurrences by Book and Chapter</h1>
      <div className="space-y-8">
        {paginatedBooks.map((bookKey) => {
          const book = data.structured[bookKey];
          return (
            <div key={bookKey} className="bg-gray-100 p-4 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-semibold text-blue-500 mb-4">
                {book.book_name} ({book.count} occurrences)
              </h2>
              <div className="space-y-4">
                {Object.entries(book.chapters).map(([chapterKey, chapter]) => (
                  <div key={chapterKey} className="bg-gray-50 p-4 rounded-xl">
                    <h3 className="text-xl font-medium text-blue-400 mb-2">
                      {chapterKey.replace('chapter_', 'Chapter ')} ({chapter.count})
                    </h3>
                    <ul className="space-y-3">
                      {chapter.occurrence.map((occ, index) => (
                        <li key={index} className="bg-gray-200 p-3 rounded-lg">
                          <div className="text-lg font-mono text-yellow-600">{occ.word}</div>
                          <div className="text-sm text-gray-600">
                            {occ.book} {occ.chapter}:{occ.verse}
                          </div>
                          <div
                            className="text-sm text-gray-500 mt-1"
                            dangerouslySetInnerHTML={{ __html: occ.morphology.morph }}
                          />
                          <div className="text-xs text-gray-500">Strong's: {occ.strongNumber}</div>
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
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded bg-blue-500 text-white ${
            currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
          }`}
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded bg-blue-500 text-white ${
            currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default HebrewOccurrenceDisplay;
