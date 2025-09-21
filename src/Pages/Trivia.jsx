import React, { useState, useEffect } from 'react'

function Trivia() {
  const [user, setUser] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [triviaResults, setTriviaResults] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [answerOptions, setAnswerOptions] = useState([])
  const [showResult, setShowResult] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [formData, setFormData] = useState({
    category: '9',
    difficulty: 'any',
    type: 'any'
  })

  useEffect(() => {
    // Check if user is logged in
    fetch('/api/user')
      .then(res => res.json())
      .then(data => {
        if (data && data.displayName) {
          setUser(data)
          setIsLoggedIn(true)
          fetch('/api/my-trivia-results')
            .then(res => res.json())
            .then(results => setTriviaResults(results))
            .catch(err => console.error('Error fetching trivia results:', err))
        } else {
          setIsLoggedIn(false)
          setUser(null)
          setTriviaResults([])
        }
      })
      .catch(err => {
        console.error('Error fetching user:', err)
        setIsLoggedIn(false)
        setUser(null)
        setTriviaResults([])
      })
  }, [])

  const fetchTriviaResults = () => {
    fetch('/api/my-trivia-results')
      .then(res => res.json())
      .then(results => setTriviaResults(results))
      .catch(err => console.error('Error fetching trivia results:', err))
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const decodeHtml = (html) => {
    const txt = document.createElement('textarea')
    txt.innerHTML = html
    return txt.value
  }

  const shuffleArray = (array) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const params = new URLSearchParams({
      amount: 1,
      ...formData
    })
    
    try {
      const res = await fetch('/get-trivia?' + params.toString())
      const data = await res.json()
      
      if (data.results && data.results.length > 0) {
        const question = data.results[0]
        setCurrentQuestion({
          ...question,
          question: decodeHtml(question.question),
          correct_answer: decodeHtml(question.correct_answer),
          incorrect_answers: question.incorrect_answers.map(ans => decodeHtml(ans))
        })
        
        if (question.type === 'multiple') {
          const allAnswers = [
            decodeHtml(question.correct_answer),
            ...question.incorrect_answers.map(ans => decodeHtml(ans))
          ]
          setAnswerOptions(shuffleArray(allAnswers))
        } else {
          setAnswerOptions(['True', 'False'])
        }
        
        setUserAnswer('')
        setShowResult(false)
      }
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const handleAnswerSubmit = async (selectedAnswer) => {
    const correct = selectedAnswer === currentQuestion.correct_answer
    setIsCorrect(correct)
    setUserAnswer(selectedAnswer)
    setShowResult(true)

    if (isLoggedIn && currentQuestion) {
      try {
        await fetch('/save-trivia-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question_difficulty: currentQuestion.difficulty,
            question_category: currentQuestion.category,
            question: currentQuestion.question,
            correct_answer: currentQuestion.correct_answer,
            user_answer: selectedAnswer,
            is_correct: correct
          })
        })
        
        setTimeout(() => {
          fetchTriviaResults()
        }, 1000)
      } catch (err) {
        console.error('Error saving answer:', err)
      }
    }
  }

  const deleteResult = async (resultId) => {
    if (!window.confirm('Are you sure you want to delete this trivia result?')) {
      return;
    }

    try {
      const response = await fetch(`/api/my-trivia-results/${resultId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchTriviaResults();
      } else {
        const errorData = await response.json();
        console.error('Error deleting result:', errorData.error);
        alert('Failed to delete result: ' + errorData.error);
      }
    } catch (err) {
      console.error('Error deleting result:', err);
      alert('Failed to delete result. Please try again.');
    }
  };

  const handleNextQuestion = () => {
    setCurrentQuestion(null)
    setShowResult(false)
    setUserAnswer('')
    setAnswerOptions([])
  }

  return (
    <div>
      <div className="container">
        <h1 className="trivia-title" title="Get Random Trivia Question">
          Get a Random Trivia Question
        </h1>
        
        <form onSubmit={handleSubmit}>
          <label htmlFor="category">Category:</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
          >
            <option value="9">General Knowledge</option>
            <option value="10">Entertainment: Books</option>
            <option value="11">Entertainment: Film</option>
            <option value="12">Entertainment: Music</option>
            <option value="13">Entertainment: Musicals &amp; Theatres</option>
            <option value="14">Entertainment: Television</option>
            <option value="15">Entertainment: Video Games</option>
            <option value="16">Entertainment: Board Games</option>
            <option value="17">Science &amp; Nature</option>
            <option value="18">Science: Computers</option>
            <option value="19">Science: Mathematics</option>
            <option value="20">Mythology</option>
            <option value="21">Sports</option>
            <option value="22">Geography</option>
            <option value="23">History</option>
            <option value="24">Politics</option>
            <option value="25">Art</option>
            <option value="26">Celebrities</option>
            <option value="27">Animals</option>
            <option value="28">Vehicles</option>
            <option value="29">Entertainment: Comics</option>
            <option value="30">Science: Gadgets</option>
            <option value="31">Entertainment: Japanese Anime &amp; Manga</option>
            <option value="32">Entertainment: Cartoon &amp; Animations</option>
          </select>
          
          <label htmlFor="difficulty">Difficulty:</label>
          <select
            id="difficulty"
            name="difficulty"
            value={formData.difficulty}
            onChange={handleInputChange}
          >
            <option value="any">Any Difficulty</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          
          <label htmlFor="type">Type:</label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
          >
            <option value="any">Any Type</option>
            <option value="multiple">Multiple Choice</option>
            <option value="boolean">True / False</option>
          </select>
          
          <button type="submit">Get Trivia Question</button>
        </form>

        {!isLoggedIn && currentQuestion && (
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px', fontSize: '14px' }}>
            Sign in to save your trivia results and view them later!
          </div>
        )}
      </div>

      {/* Interactive Trivia Question Section */}
      {currentQuestion && (
        <div className="container" style={{ marginTop: '20px' }}>
          <h2>Trivia Question</h2>
          <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', color: '#2c3e50' }}>
              {currentQuestion.question}
            </p>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              <strong>Category:</strong> {currentQuestion.category} | 
              <strong> Difficulty:</strong> {currentQuestion.difficulty}
            </p>
            
            {!showResult ? (
              <div>
                {answerOptions.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSubmit(option)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '12px',
                      margin: '8px 0',
                      backgroundColor: '#fff',
                      border: '2px solid #ddd',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      textAlign: 'left',
                      color: '#333'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#e9ecef'
                      e.target.style.color = '#000'
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = '#fff'
                      e.target.style.color = '#333'
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <div style={{
                  padding: '15px',
                  borderRadius: '6px',
                  marginBottom: '15px',
                  backgroundColor: isCorrect ? '#d4edda' : '#f8d7da',
                  border: `1px solid ${isCorrect ? '#c3e6cb' : '#f5c6cb'}`,
                  color: isCorrect ? '#155724' : '#721c24'
                }}>
                  <h3>{isCorrect ? '🎉 Correct!' : '❌ Incorrect!'}</h3>
                  <p><strong>Your answer:</strong> {userAnswer}</p>
                  <p><strong>Correct answer:</strong> {currentQuestion.correct_answer}</p>
                </div>
                
                <button
                  onClick={handleNextQuestion}
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    padding: '10px 20px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                >
                  Get Another Question
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Only show trivia results section if logged in */}
      {isLoggedIn && (
        <div className="results-container">
          <h2>Your Trivia Results ({triviaResults.length} saved)</h2>
          <div id="mytriviaResults" className="table-wrapper">
            {triviaResults.length === 0 ? (
              <p>No trivia results saved yet. Complete some trivia questions to see them here!</p>
            ) : (
              <table className="compact-table">
                <thead>
                  <tr>
                    <th>Question Difficulty</th>
                    <th>Question Category</th>
                    <th>Question</th>
                    <th>Correct Answer</th>
                    <th>Your Answer</th>
                    <th>Result</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {triviaResults.map((r, index) => (
                    <tr key={r.id || index}>
                      <td>{r.question_difficulty || ''}</td>
                      <td>{r.question_category || ''}</td>
                      <td>{r.question || ''}</td>
                      <td>{r.correct_answer || ''}</td>
                      <td>{r.user_answer || ''}</td>
                      <td style={{ color: r.is_correct ? 'green' : 'red' }}>
                        {r.is_correct ? '✓' : '✗'}
                      </td>
                      <td>{new Date(r.created_at).toLocaleString()}</td>
                      <td>
                        <button
                          onClick={() => deleteResult(r.id)}
                          style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px'
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = '#c82333'}
                          onMouseOut={(e) => e.target.style.backgroundColor = '#dc3545'}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Trivia;