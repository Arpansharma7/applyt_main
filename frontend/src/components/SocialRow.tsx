import { Share2, Mail } from 'lucide-react';

export const SocialRow = () => {
  return (
    <div className="flex gap-4">
      <a 
        className="w-12 h-12 flex items-center justify-center rounded-full border border-outline-variant hover:border-secondary hover:text-secondary transition-all duration-300 group" 
        href="#"
        aria-label="Share"
      >
        <Share2 className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
      </a>
      <a 
        className="w-12 h-12 flex items-center justify-center rounded-full border border-outline-variant hover:border-secondary hover:text-secondary transition-all duration-300 group" 
        href="#"
        aria-label="Contact Email"
      >
        <Mail className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
      </a>
    </div>
  );
};
