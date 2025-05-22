import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LANGUAGES } from '@/types';
import { Mic2 } from 'lucide-react';

export default function PronunciationPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Pronunciation Guides</h1>
        <p className="text-muted-foreground">
          Listen to audio pronunciations for Ancient Greek, Hebrew, and Latin.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {LANGUAGES.map((lang) => (
          <Card key={lang} className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-medium">{lang}</CardTitle>
              <Mic2 className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Audio pronunciation guides for {lang} are coming soon. Check back later for updates!
              </p>
              {/* Placeholder for audio player if needed in future
              <div className="mt-4 flex items-center justify-center h-20 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">Audio Player Placeholder</p>
              </div>
              */}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
