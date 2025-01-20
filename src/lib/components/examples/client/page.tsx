// src/app/page.tsx
'use client';

import React from 'react';
import { DynamicComponent } from '@/lib/components';

export default function Page() {
  const [components, setComponents] = React.useState([
    {
      name: 'LocalExample',
      importPath: '@/components/Example',
      props: {
        title: 'Local Component'
      }
    },
    {
      name: 'RemoteExample',
      url: 'https://api.example.com/components/Example.js',
      props: {
        title: 'Remote Component'
      }
    }
  ]);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Dynamic Components Demo</h1>
      
      {components.map((config, index) => (
        <div key={index} className="border p-4 rounded-lg">
          <DynamicComponent
            config={config}
            fallback={
              <div className="animate-pulse bg-gray-100 h-32 rounded-lg" />
            }
          />
        </div>
      ))}

      <button
        onClick={() => {
          setComponents([
            ...components,
            {
              name: `DynamicExample${components.length}`,
              importPath: '@/components/Example',
              props: {
                title: `Dynamic Component ${components.length}`
              }
            }
          ]);
        }}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Add Dynamic Component
      </button>
    </div>
  );
}
