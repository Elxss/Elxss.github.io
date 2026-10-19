import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './nano.css'
import { installLagometer } from './perf.js'

installLagometer()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
