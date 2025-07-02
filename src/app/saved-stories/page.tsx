
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const DeprecatedPage: React.FC = () => {
    return (
        <div className="container mx-auto space-y-6 p-1">
            <Card>
                <CardHeader>
                    <CardTitle>Page Moved</CardTitle>
                    <CardDescription>This page is no longer in use.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Functionality Merged</AlertTitle>
                        <AlertDescription>
                            The Saved Stories library has been merged into the AI Story Creator page for a better user experience. Please navigate there to find your stories.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    );
};

export default DeprecatedPage;
