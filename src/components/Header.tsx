
import React from 'react';

/**
 * Application header component with title
 */
export default function Header() {
  return (
    <header className="h-[50px] bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
      <h1 className="text-2xl font-bold text-white">
        Switchable Algorithmic Order Generator
      </h1>
    </header>
  );
}
