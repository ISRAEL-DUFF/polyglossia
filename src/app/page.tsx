
"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Microscope, NotebookTextIcon, Gamepad, Gamepad2Icon, BookOpenText, TrendingUp, Sparkles } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  buttonText: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, href, icon: Icon, buttonText }) => {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardDescription className="pt-2 text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {/* Additional content can go here if needed */}
      </CardContent>
      <CardFooter>
        <Link href={href} passHref className="w-full">
          <Button variant="outline" className="w-full">
            {buttonText}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default function DashboardPage() {
  const features: FeatureCardProps[] = [
    {
      title: "Greek Lexicon",
      description: "Explore ancient Greek words, their morphology, and occurrences.",
      href: "/greek",
      icon: Microscope,
      buttonText: "Open Greek Tools",
    },
    {
      title: "Hebrew Lexicon",
      description: "Dive into Biblical Hebrew, with Strong's numbers and BDB entries.",
      href: "/hebrew",
      icon: Microscope,
      buttonText: "Open Hebrew Tools",
    },
    {
      title: "Vocabulary Browser",
      description: "Manage and browse your saved Greek vocabulary lists.",
      href: "/vocabulary-browser",
      icon: NotebookTextIcon,
      buttonText: "Browse Vocab",
    },
    {
      title: "Matching Game",
      description: "Test your vocabulary knowledge with a fun matching game.",
      href: "/matching-game",
      icon: Gamepad,
      buttonText: "Play Game",
    },
    {
      title: "Parser Game",
      description: "Practice your Greek morphology by parsing various word forms.",
      href: "/parser-game",
      icon: Gamepad2Icon,
      buttonText: "Play Game",
    },
  ];

  return (
    <div className="space-y-8 animate-fadeInUp">
      <Card className="shadow-lg border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <BookOpenText className="h-10 w-10 text-primary" />
            <div>
              <CardTitle className="text-3xl font-bold tracking-tight">Welcome to Polyglossia Praxis!</CardTitle>
              <CardDescription className="text-md">
                Your personal companion for mastering ancient languages.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Explore the tools below to enhance your study of Ancient Greek, Hebrew, and Latin. Happy learning!
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold tracking-tight mb-4 text-foreground">Quick Access Tools</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard key={feature.href} {...feature} />
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Study Insights (Demo)</CardTitle>
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
             <CardDescription>A quick look at your learning journey.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Words Encountered</h3>
              <p className="text-3xl font-bold">125</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Games Played</h3>
              <p className="text-3xl font-bold">15</p>
            </div>
             <div>
              <h3 className="text-sm font-medium text-muted-foreground">Current Focus</h3>
              <p className="text-lg font-semibold">Greek Aorist Verbs</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
               <CardTitle className="text-lg">Word of the Day (Demo)</CardTitle>
               <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <CardDescription>Expand your vocabulary, one word at a time.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
                <p className="text-2xl font-bold text-primary">ἀγάπη</p>
                <p className="text-sm text-muted-foreground">(agápē) - Greek</p>
            </div>
            <p className="text-md">
              <span className="font-semibold">Meaning:</span> Love, charity, affection.
            </p>
            <p className="text-xs text-muted-foreground pt-2">
              A foundational term in theological and philosophical discussions.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
