import React from 'react';
import ReactDOM from 'react-dom/client';
// 1. Importa BrowserRouter
import { HashRouter} from 'react-router-dom';
import App from './App';
import './index.css';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    {/* 2. Envuelve el componente <App /> con <BrowserRouter> */}
    <HashRouter >
      <App />
    </HashRouter>

  </React.StrictMode>
);