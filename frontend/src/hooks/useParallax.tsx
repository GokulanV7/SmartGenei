import { useEffect, useState } from 'react';

interface ParallaxOptions {
  speed?: number;
  reverse?: boolean;
  disabled?: boolean;
}

export const useParallax = ({ speed = 0.1, reverse = false, disabled = false }: ParallaxOptions = {}) => {
  const [offset, setOffset] = useState(0);
  
  useEffect(() => {
    if (disabled) return;
    
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setOffset(scrollPosition);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [disabled]);
  
  const transformValue = reverse 
    ? `translate3d(0, ${offset * speed}px, 0)`
    : `translate3d(0, ${-offset * speed}px, 0)`;
  
  return {
    transform: disabled ? 'none' : transformValue
  };
};
