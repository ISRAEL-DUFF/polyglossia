
"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { greekSyntaxData, type SyntaxSection, type SyntaxSubType, type SyntaxExample, type FearClauseDetails } from '@/lib/data/greekSyntaxData';
import { ScrollArea } from '@/components/ui/scroll-area';

const ExampleDisplay: React.FC<{ example: SyntaxExample }> = ({ example }) => (
  <Card className="mb-3 shadow-sm border-border/70">
    <CardContent className="p-4">
      <p className="text-lg text-primary font-semibold mb-1 greek-size">{example.greek}</p>
      <p className="text-sm text-muted-foreground">{example.translation}</p>
      {example.example && ( // For Common Expressions under Negation
         <p className="text-xs text-muted-foreground mt-1 italic">E.g., {example.example}</p>
      )}
    </CardContent>
  </Card>
);

const SubTypeDisplay: React.FC<{ subType: SyntaxSubType }> = ({ subType }) => (
  <Card className="mb-4 bg-muted/30">
    <CardHeader className="pb-3">
      <CardTitle className="text-md font-semibold">{subType.type}</CardTitle>
      {subType.description && <CardDescription className="text-xs">{subType.description}</CardDescription>}
    </CardHeader>
    <CardContent>
      {subType.examples.map((ex, i) => (
        <ExampleDisplay key={i} example={ex} />
      ))}
    </CardContent>
  </Card>
);

const FearClauseDisplay: React.FC<{ details: FearClauseDetails }> = ({ details }) => (
  <div className="space-y-4">
    {details.examples.map((fearType, index) => (
      <SubTypeDisplay key={index} subType={fearType} />
    ))}
    {details.moods && (
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-md font-semibold">{details.moods.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {details.moods.details.map((moodDetail, i) => (
              <li key={i}>
                <span className="font-semibold text-accent">{moodDetail.mood}:</span> {moodDetail.context}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    )}
  </div>
);

const GreekSyntaxGuidePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">{greekSyntaxData.title}</CardTitle>
          <CardDescription>Explore common syntactic structures in Ancient Greek.</CardDescription>
        </CardHeader>
      </Card>

      <ScrollArea className="h-[calc(100vh-200px)] pr-4"> {/* Adjust height as needed */}
        <Accordion type="multiple" className="w-full space-y-3">
          {greekSyntaxData.sections.map((section, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <AccordionTrigger className="px-6 py-4 text-lg font-medium hover:no-underline">
                {section.mood || section.section}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6 pt-2 space-y-4">
                {section.description && <p className="text-muted-foreground mb-4">{section.description}</p>}
                
                {section.examples && section.examples.map((ex, i) => (
                  <ExampleDisplay key={i} example={ex} />
                ))}

                {section.types && (
                  <Accordion type="multiple" className="w-full space-y-2">
                    {section.types.map((subType, subIndex) => (
                       <Card key={subIndex} className="bg-background border">
                         <AccordionItem value={`subitem-${index}-${subIndex}`} className="border-b-0">
                            <AccordionTrigger className="px-4 py-3 text-md font-semibold text-accent hover:no-underline">
                              {subType.type}
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4 pt-1">
                              {subType.description && <p className="text-sm text-muted-foreground mb-3">{subType.description}</p>}
                              {subType.examples.map((ex, i) => (
                                <ExampleDisplay key={i} example={ex} />
                              ))}
                            </AccordionContent>
                          </AccordionItem>
                       </Card>
                    ))}
                  </Accordion>
                )}

                {section.details && ( // For Fear Clauses
                  <FearClauseDisplay details={section.details} />
                )}

              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  );
};

export default GreekSyntaxGuidePage;

    