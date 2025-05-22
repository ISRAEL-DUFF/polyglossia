import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LANGUAGES, type Language } from '@/types';

interface LanguageSelectProps {
  value: Language | undefined;
  onValueChange: (value: Language) => void;
  disabled?: boolean;
}

const LanguageSelect: React.FC<LanguageSelectProps> = ({ value, onValueChange, disabled }) => {
  return (
    <Select onValueChange={onValueChange} value={value} disabled={disabled}>
      <SelectTrigger className="w-full md:w-[180px]">
        <SelectValue placeholder="Select Language" />
      </SelectTrigger>
      <SelectContent>
        {LANGUAGES.map((lang) => (
          <SelectItem key={lang} value={lang}>
            {lang}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelect;
