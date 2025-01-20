// src/components/Example.tsx
export default function Example({ title }: { title?: string }) {
  return (
    <div className="p-4 bg-white shadow rounded-lg">
      <h2 className="text-lg font-semibold">{title || 'Example Component'}</h2>
      <p>This is a dynamically loaded component</p>
    </div>
  );
}
