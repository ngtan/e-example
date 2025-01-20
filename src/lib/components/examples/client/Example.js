// Remote component at https://api.example.com/components/Example.js
const React = globalThis.React;

function RemoteExample({ title }) {
  return React.createElement(
    'div',
    { className: 'p-4 bg-white shadow rounded-lg' },
    React.createElement(
      'h2',
      { className: 'text-lg font-semibold' },
      title || 'Remote Example Component'
    ),
    React.createElement(
      'p',
      null,
      'This component was loaded remotely!'
    )
  );
}

export default RemoteExample;
