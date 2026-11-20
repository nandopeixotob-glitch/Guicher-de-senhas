import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import Tv from './pages/Tv';
import Guiche from './pages/Guiche';
import Totem from './pages/Totem';
import './styles.css';

function Shell() {
  return (
    <BrowserRouter>
      <nav className="quick-nav" aria-label="Navegação principal">
        <NavLink to="/tv">TV</NavLink>
        <NavLink to="/guiche">Guichê</NavLink>
        <NavLink to="/totem">Totem</NavLink>
      </nav>
      <Routes>
        <Route path="/" element={<Navigate to="/totem" replace />} />
        <Route path="/tv" element={<Tv />} />
        <Route path="/guiche" element={<Guiche />} />
        <Route path="/totem" element={<Totem />} />
        <Route path="*" element={<Navigate to="/totem" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Shell />
  </React.StrictMode>
);
