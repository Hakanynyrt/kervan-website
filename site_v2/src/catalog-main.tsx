import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/globals.css';
import CatalogPage from './pages/CatalogPage';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CatalogPage />
  </StrictMode>,
);
