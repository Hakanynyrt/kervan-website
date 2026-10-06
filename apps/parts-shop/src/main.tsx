import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './styles/globals.css';
import App from './App';
import { readPageProps } from './lib/page-props';

const rootEl = document.getElementById('root')!;
const props = readPageProps(document);

if (props) {
  // Prerendered page: hydrate exactly what the build rendered (no motion in M1a).
  hydrateRoot(
    rootEl,
    <StrictMode>
      <App {...props} />
    </StrictMode>,
  );
} else if (import.meta.env.DEV) {
  // `vite` dev server: no prerendered HTML, render the DEMO catalog for this URL.
  void import('./dev-props').then(({ devProps }) => {
    createRoot(rootEl).render(
      <StrictMode>
        <App {...devProps(window.location.pathname)} />
      </StrictMode>,
    );
  });
}
