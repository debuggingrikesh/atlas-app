'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingSelectorProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  disabled?: boolean;
}

export function RatingSelector({ rating, onRatingChange, disabled }: RatingSelectorProps) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex flex-col items-center space-y-4">
      <p className="text-lg font-medium">How was your experience with us?</p>
      <div 
        className={cn(
          "flex items-center space-x-2",
          disabled && "pointer-events-none opacity-50"
        )}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className="group focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            onClick={() => onRatingChange(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            disabled={disabled}
          >
            <Star
              className={cn(
                "h-10 w-10 transition-colors duration-200",
                (hoverRating ? star <= hoverRating : star <= rating)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-transparent text-muted-foreground group-hover:text-amber-400/50"
              )}
            />
            <span className="sr-only">Rate {star} stars</span>
          </button>
        ))}
      </div>
    </div>
  );
}
