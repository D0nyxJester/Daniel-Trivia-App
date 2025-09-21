import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Home from './Pages/Home'
import Trivia from './Pages/Trivia'
import Signin from './Pages/Signin'
import { Routes, Route } from 'react-router-dom'

function App() {
  const [user, setUser] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data && data.displayName) {
          setUser(data)
          setIsLoggedIn(true)
        } else {
          setIsLoggedIn(false)
          setUser(null)
        }
      })
      .catch(err => {
        console.error('Error fetching user:', err)
        setIsLoggedIn(false)
        setUser(null)
      })
  }, [])

  const handleLogout = () => {
    window.location.href = '/logout'
  }

  return (
    <>
      <Navbar isLoggedIn={isLoggedIn} user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/trivia" element={<Trivia />} />
        <Route path="/signin" element={<Signin />} />
      </Routes>
    </>
  )
}

export default App