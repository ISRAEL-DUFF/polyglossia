
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const DeprecatedPage: React.FC = () => {
    return (
        <div className="container mx-auto space-y-6 p-1">
            <Card>
                <CardHeader>
                    <CardTitle>Page Moved</CardTitle>
                    <CardDescription>This page's functionality has been moved for a better experience.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Alert variant="default">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Functionality Merged</AlertTitle>
                        <AlertDescription>
                            The Saved Stories library has been merged into the AI Story Creator page. Please navigate there to find your stories.
                        </AlertDescription>
                    </Alert>
                    <Link href="/story-creator" passHref>
                        <Button className="w-full">
                            Go to AI Story Creator
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
};

export default DeprecatedPage;
