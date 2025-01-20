// src/components/Header.tsx
export default function Header({ title }: { title: string }) {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-6 px-4">
        <h1 className="text-3xl font-bold text-gray-900">
          {title}
        </h1>
      </div>
    </header>
  );
}
