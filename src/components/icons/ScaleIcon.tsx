import React from 'react';

export const ScaleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    {...props}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.036.243c-2.132 0-4.14-.818-5.62-2.247m0 0a5.988 5.988 0 01-5.62 2.247c-.804 0-1.58-.11-2.308-.322a1.125 1.125 0 01-.614-1.18L5.25 5.491m0 0A48.416 48.416 0 0112 4.5c2.291 0 4.545.16 6.75.47M5.25 5.491c-1.01.143-2.01.317-3 .52m3-.52l-.622-2.541a1.125 1.125 0 011.125-1.328l1.903.321z"
    />
  </svg>
);