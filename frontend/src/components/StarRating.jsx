import React from 'react';
import { Star } from 'lucide-react';

export default function StarRating({ rating = 0, max = 5, size = 'sm', interactive = false, onChange }) {
  const sizes = { sm: 'w-3.5 h-3.5', md: 'w-4 h-4', lg: 'w-5 h-5' };
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <button key={i} type="button" disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}>
            <Star className={`${sizes[size]} ${filled || half ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`} />
          </button>
        );
      })}
    </div>
  );
}
