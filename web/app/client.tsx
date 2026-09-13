import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import Home, { type SitePageName } from './page';
import './globals.css';

const root = document.getElementById('root')!;
const requestedPage = root.dataset.page;
const page: SitePageName = requestedPage === 'circuit' || requestedPage === 'design' ? requestedPage : 'principle';

createRoot(root).render(
  <StrictMode>
    <Home page={page} />
  </StrictMode>,
);
