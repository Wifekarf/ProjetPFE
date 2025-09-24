import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import TeamScores from "./pages/TeamScores";
import { Route, Routes } from 'react-router-dom';

function App() {
  const [count, setCount] = useState(0)

  return (
    <Routes>
      <Route path="/team-scores" element={<TeamScores />} />
      {/* Add other routes as needed */}
    </Routes>
  )
}

export default App
