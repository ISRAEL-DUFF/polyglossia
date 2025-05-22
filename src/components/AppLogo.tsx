import { BookOpenText } from 'lucide-react';
import React from 'react';

const AppLogo: React.FC = () => {
  return (
    <div className="flex items-center gap-2 text-lg font-semibold text-primary">
      <BookOpenText className="h-6 w-6" />
      <span className="font-serif">Polyglossia Praxis</span>
    </div>
  );
};

export default AppLogo;
