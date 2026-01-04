
import React from 'react';
import { MemeTemplate } from '../types';

const TEMPLATES: MemeTemplate[] = [
  { id: '1', name: 'Distracted Boyfriend', url: 'https://picsum.photos/seed/meme1/600/400' },
  { id: '2', name: 'Two Buttons', url: 'https://picsum.photos/seed/meme2/600/400' },
  { id: '3', name: 'Change My Mind', url: 'https://picsum.photos/seed/meme3/600/400' },
  { id: '4', name: 'Drake Hotline Bling', url: 'https://picsum.photos/seed/meme4/600/400' },
  { id: '5', name: 'Woman Yelling at Cat', url: 'https://picsum.photos/seed/meme5/600/400' },
  { id: '6', name: 'This is Fine', url: 'https://picsum.photos/seed/meme6/600/400' },
];

interface Props {
  onSelect: (url: string) => void;
}

export const TemplateGallery: React.FC<Props> = ({ onSelect }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {TEMPLATES.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.url)}
          className="relative group overflow-hidden rounded-lg border-2 border-transparent hover:border-blue-500 transition-all"
        >
          <img 
            src={t.url} 
            alt={t.name} 
            className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <span className="text-xs font-bold px-2 py-1 bg-blue-600 rounded text-white">Use Template</span>
          </div>
        </button>
      ))}
    </div>
  );
};
