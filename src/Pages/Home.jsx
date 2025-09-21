import React, { useState, useEffect } from 'react'

function Home() {
  const [user, setUser] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
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

  return (
    <div className="container">
      {isLoggedIn ? (
        <div>
          <h1>Hello {user?.displayName}, welcome to your profile!</h1>
          <p>This is the home page of Daniel's Trivia App.</p>
          <p>Navigate to the Trivia page to start playing!</p>
        </div>
      ) : (
        <div>
          <h1>Welcome to Daniel App</h1>
          <p>This is a trivia application where you can test your knowledge!</p>
        <p>Please sign in to access trivia features and save your results.</p>
        </div>
      )}
    </div>
  )
}

export default Home