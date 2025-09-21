import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function Signin() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if already logged in, redirect to home
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data && data.displayName) {
          setUser(data)
          navigate('/') // Redirect to home if already logged in
        }
      })
      .catch(err => {
        console.error('Error fetching user:', err)
      })
  }, [navigate])

  const handleGoogleLogin = () => {
    window.location.href = '/auth/google'
  }

  const handleGitHubLogin = () => {
    window.location.href = '/auth/github'
  }

  return (
    <div className="container">
      <div style={{ 
        maxWidth: '400px', 
        margin: '50px auto', 
        textAlign: 'center',
        padding: '40px',
        backgroundColor: '#f8f9fa',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ marginBottom: '30px', color: '#2c3e50' }}>
          Sign In to Daniel App
        </h1>
        
        <p style={{ marginBottom: '30px', color: '#666' }}>
          Choose your preferred sign-in method to access trivia features and save your results.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button 
            onClick={handleGoogleLogin}
            style={{
              backgroundColor: '#0eda2dff',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#09971eff'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#0eda2dff'}
          >
            Sign in with Google
          </button>

          <button 
            onClick={handleGitHubLogin}
            style={{
              backgroundColor: '#333',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#24292e'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#333'}
          >
                Sign in with GitHub
          </button>
        </div>

        <div style={{ 
          marginTop: '30px', 
          padding: '20px',
          backgroundColor: '#e9ecef',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#666'
        }}>
          <p><strong>Why sign in?</strong></p>
          <ul style={{ textAlign: 'left', margin: '10px 0' }}>
            <li>Save your trivia results</li>
            <li>Track your progress over time</li>
            <li>View your answer history</li>
            <li>Delete unwanted results</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Signin