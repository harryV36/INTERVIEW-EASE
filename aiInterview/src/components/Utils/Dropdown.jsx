import React, { useState, useRef } from 'react'; // ⬅️ Import useRef for the timer
import { ChevronDown } from 'lucide-react';

export default function CompanyHoverMenu({ menuItems,style,name }) {
  const [isOpen, setIsOpen] = useState(false);
  // Use a ref to hold the timeout ID so we can clear it
  const timeoutRef = useRef(null); 

  // Function to open the menu on mouse entry (Clear any pending close timers)
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  // Function to close the menu on mouse exit (Add a short delay before closing)
  const handleMouseLeave = () => {
    // Set a timeout to close the menu after 200 milliseconds (adjust as needed)
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200); 
  };
 
  return (
    // The wrapper DIV is responsible for tracking the mouse position
    <div 
      className="relative inline-block text-left "
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave} 
    >
      <div>
        {/* Button code remains the same */}
        <button
          type="button"
          className={`${style} flex items-center gap-1`}
          
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {name}
          <ChevronDown className="-mr-1 h-5 w-5  text-gray-400" aria-hidden="true" />
        </button>
      </div>

      {isOpen && (
        <div
          className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg  " 
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
          tabIndex="-1"
        >
          <div className="py-1" role="none">
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-gray-700 block px-4 py-2 text-sm hover:bg-gray-100 hover:text-gray-900"
                role="menuitem"
                tabIndex="-1"
                id={`menu-item-${item.name.toLowerCase().replace(/\s/g, '-')}`}
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}