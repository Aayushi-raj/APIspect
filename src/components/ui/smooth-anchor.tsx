'use client';

import React from 'react';

interface SmoothAnchorProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  targetId: string;
}

export function SmoothAnchor({ targetId, children, onClick, ...props }: SmoothAnchorProps) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;

    const target = document.getElementById(targetId);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <a href={`#${targetId}`} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
