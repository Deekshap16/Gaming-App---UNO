import React, { useState, useEffect, useCallback } from 'react';
import io from 'socket.io-client';
import './App.css';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

function App() {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [screen, setScreen] = useState('home'); // home, lobby, waiting, game
  const [players, setPlayers] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [message, setMessage] = useState('');
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('room-created', ({ roomId, playerId }) => {
      setRoomId(roomId);
      setPlayerId(playerId);
      setScreen('waiting');
      setMessage(`Room created! Share code: ${roomId}`);
    });

    newSocket.on('room-joined', ({ roomId, playerId }) => {
      setRoomId(roomId);
      setPlayerId(playerId);
      setScreen('waiting');
      setMessage('Joined room successfully!');
    });

    newSocket.on('players-updated', (playerList) => {
      setPlayers(playerList);
    });

    newSocket.on('game-started', (state) => {
      setGameState(state);
      setScreen('game');
      setMessage('Game started!');
      setTimeout(() => setMessage(''), 3000);
    });

    newSocket.on('game-updated', (state) => {
      setGameState(state);
      setSelectedCard(null);
    });

    newSocket.on('game-over', ({ winnerId, winnerName }) => {
      setMessage(`🎉 ${winnerName} wins the game!`);
      setTimeout(() => {
        setScreen('home');
        setGameState(null);
        setRoomId('');
        setPlayers([]);
      }, 5000);
    });

    newSocket.on('player-disconnected', ({ playerId: disconnectedId, players: updatedPlayers }) => {
      setPlayers(updatedPlayers);
      setMessage('A player disconnected');
      setTimeout(() => setMessage(''), 3000);
    });

    newSocket.on('error', ({ message }) => {
      setMessage(`Error: ${message}`);
      setTimeout(() => setMessage(''), 3000);
    });

    return () => newSocket.close();
  }, []);

  const createRoom = () => {
    if (!playerName.trim()) {
      setMessage('Please enter your name');
      return;
    }
    socket.emit('create-room', { playerName });
  };

  const joinRoom = () => {
    if (!playerName.trim() || !roomId.trim()) {
      setMessage('Please enter your name and room code');
      return;
    }
    socket.emit('join-room', { playerName, roomId: roomId.toUpperCase() });
  };

  const startGame = () => {
    if (players.length < 2) {
      setMessage('Need at least 2 players to start');
      return;
    }
    socket.emit('start-game');
  };

  const playCard = (cardIndex, chosenColor = null) => {
    const card = gameState.players.find(p => p.id === playerId).hand[cardIndex];
    
    if (card.type === 'wild' && !chosenColor) {
      setSelectedCard(cardIndex);
      setShowColorPicker(true);
      return;
    }

    socket.emit('play-card', { cardIndex, chosenColor });
    setShowColorPicker(false);
  };

  const drawCard = () => {
    socket.emit('draw-card');
  };

  const selectColor = (color) => {
    playCard(selectedCard, color);
    setShowColorPicker(false);
  };

  const canPlayCard = (card) => {
    if (!gameState || gameState.currentPlayerId !== playerId) return false;
    if (card.type === 'wild') return true;
    return card.color === gameState.currentColor || card.value === gameState.topCard.value;
  };

  const getCardColor = (card) => {
    const colorMap = {
      red: '#e74c3c',
      blue: '#3498db',
      green: '#2ecc71',
      yellow: '#f39c12',
      wild: '#34495e'
    };
    return colorMap[card.color] || '#95a5a6';
  };

  if (screen === 'home') {
    return (
      <div className="app">
        <div className="home-screen">
          {/* Animated background elements */}
          <div className="bg-animation">
            <div className="card-float card-float-1">🎴</div>
            <div className="card-float card-float-2">🃏</div>
            <div className="card-float card-float-3">🎴</div>
            <div className="card-float card-float-4">🃏</div>
          </div>

          <div className="home-content">
            <div className="logo-section">
              <div className="game-logo">
                <div className="logo-cards">
                  <div className="logo-card red">U</div>
                  <div className="logo-card blue">N</div>
                  <div className="logo-card green">O</div>
                </div>
              </div>
              <h1 className="game-title">CARD CLASH</h1>
              <p className="game-subtitle">The Ultimate Multiplayer Card Battle</p>
            </div>

            <div className="main-menu">
              <button 
                className="menu-btn menu-btn-primary"
                onClick={() => setScreen('lobby')}
              >
                <span className="btn-icon">🎮</span>
                <span className="btn-text">Play Now</span>
              </button>
              
              <button 
                className="menu-btn menu-btn-secondary"
                onClick={() => setShowRules(true)}
              >
                <span className="btn-icon">📖</span>
                <span className="btn-text">How to Play</span>
              </button>
            </div>

            <div className="home-stats">
              <div className="stat-item">
                <div className="stat-number">2-4</div>
                <div className="stat-label">Players</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">108</div>
                <div className="stat-label">Cards</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">∞</div>
                <div className="stat-label">Fun</div>
              </div>
            </div>
          </div>

          {/* Rules Modal */}
          {showRules && (
            <div className="modal-overlay" onClick={() => setShowRules(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={() => setShowRules(false)}>×</button>
                <h2>How to Play</h2>
                <div className="rules-content">
                  <div className="rule-section">
                    <h3>🎯 Objective</h3>
                    <p>Be the first player to discard all your cards!</p>
                  </div>
                  
                  <div className="rule-section">
                    <h3>🎴 Card Types</h3>
                    <ul>
                      <li><strong>Number Cards (0-9):</strong> Match color or number</li>
                      <li><strong>Skip:</strong> Next player loses their turn</li>
                      <li><strong>Reverse:</strong> Changes play direction</li>
                      <li><strong>Draw 2:</strong> Next player draws 2 cards</li>
                      <li><strong>Wild:</strong> Change the color</li>
                      <li><strong>Wild Draw 4:</strong> Change color + next player draws 4</li>
                    </ul>
                  </div>
                  
                  <div className="rule-section">
                    <h3>🎮 How to Play</h3>
                    <ol>
                      <li>Each player starts with 7 cards</li>
                      <li>Match the color or number of the top card</li>
                      <li>Can't play? Draw a card</li>
                      <li>First to empty their hand wins!</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (screen === 'lobby') {
    return (
      <div className="app">
        <div className="lobby">
          <button className="back-btn" onClick={() => setScreen('home')}>
            ← Back
          </button>
          
          <div className="lobby-header">
            <h1>🎴 Join the Battle</h1>
            <p>Create a room or join your friends</p>
          </div>
          
          <div className="lobby-content">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="input"
              maxLength={20}
            />
            
            <div className="lobby-actions">
              <div className="action-card">
                <h3>Create New Room</h3>
                <p>Start a new game and invite friends</p>
                <button onClick={createRoom} className="btn btn-primary">
                  Create Room
                </button>
              </div>
              
              <div className="divider">
                <span>OR</span>
              </div>
              
              <div className="action-card">
                <h3>Join Existing Room</h3>
                <p>Enter the room code to join</p>
                <div className="join-room">
                  <input
                    type="text"
                    placeholder="ROOM CODE"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    className="input input-code"
                    maxLength={6}
                  />
                  <button onClick={joinRoom} className="btn btn-secondary">
                    Join
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {message && (
            <div className="message-toast">
              {message}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (screen === 'waiting') {
    return (
      <div className="app">
        <div className="waiting-room">
          <button className="back-btn" onClick={() => {
            setScreen('home');
            setRoomId('');
            setPlayers([]);
          }}>
            ← Leave Room
          </button>

          <div className="waiting-header">
            <div className="pulsing-indicator"></div>
            <h1>Waiting for Players...</h1>
          </div>
          
          <div className="room-code-display">
            <div className="code-label">Room Code</div>
            <div className="code-value">{roomId}</div>
            <div className="code-hint">Share this code with your friends!</div>
          </div>
          
          <div className="players-grid">
            {[0, 1, 2, 3].map((slot) => {
              const player = players[slot];
              return (
                <div key={slot} className={`player-slot ${player ? 'occupied' : 'empty'}`}>
                  {player ? (
                    <>
                      <div className="player-avatar">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="player-name">
                        {player.name}
                        {player.id === playerId && <span className="you-badge">YOU</span>}
                      </div>
                      <div className="player-status ready">Ready</div>
                    </>
                  ) : (
                    <>
                      <div className="player-avatar empty-avatar">?</div>
                      <div className="player-name empty-name">Waiting...</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="waiting-actions">
            <div className="player-count">
              {players.length}/4 Players
            </div>
            <button 
              onClick={startGame} 
              className={`btn btn-start ${players.length >= 2 ? 'pulse' : ''}`}
              disabled={players.length < 2}
            >
              {players.length < 2 ? 'Need 2+ Players' : 'Start Game'}
            </button>
          </div>
          
          {message && (
            <div className="message-toast">
              {message}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (screen === 'game' && gameState) {
    const currentPlayer = gameState.players.find(p => p.id === playerId);
    const isMyTurn = gameState.currentPlayerId === playerId;

    return (
      <div className="app">
        <div className="game">
          <div className="game-header">
            <div className="game-info">
              <div className="room-code-small">Room: {roomId}</div>
              <div className="deck-count">Deck: {gameState.deckCount} cards</div>
            </div>
            <div className="turn-indicator">
              {isMyTurn ? "🎯 YOUR TURN" : `Waiting for ${gameState.players[gameState.currentPlayerIndex].name}...`}
            </div>
          </div>

          <div className="opponents">
            {gameState.players
              .filter(p => p.id !== playerId)
              .map((player) => (
                <div 
                  key={player.id} 
                  className={`opponent ${gameState.currentPlayerId === player.id ? 'active' : ''}`}
                >
                  <div className="opponent-name">{player.name}</div>
                  <div className="opponent-cards">
                    {Array(player.cardCount).fill(0).map((_, i) => (
                      <div key={i} className="opponent-card">🎴</div>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          <div className="play-area">
            <div className="discard-pile">
              <div 
                className="card top-card"
                style={{ backgroundColor: getCardColor(gameState.topCard) }}
              >
                <div className="card-value">{gameState.topCard.value}</div>
              </div>
              <div className="current-color" style={{ backgroundColor: getCardColor({ color: gameState.currentColor }) }}>
                Current: {gameState.currentColor}
              </div>
            </div>
          </div>

          <div className="player-hand">
            <h3>Your Hand:</h3>
            <div className="cards">
              {currentPlayer.hand.map((card, idx) => (
                <div
                  key={idx}
                  className={`card ${canPlayCard(card) && isMyTurn ? 'playable' : 'disabled'}`}
                  style={{ backgroundColor: getCardColor(card) }}
                  onClick={() => canPlayCard(card) && isMyTurn && playCard(idx)}
                >
                  <div className="card-value">{card.value}</div>
                </div>
              ))}
            </div>
            {isMyTurn && (
              <button onClick={drawCard} className="btn btn-secondary draw-btn">
                Draw Card
              </button>
            )}
          </div>

          {showColorPicker && (
            <div className="color-picker-overlay">
              <div className="color-picker">
                <h3>Choose a color:</h3>
                <div className="color-options">
                  {['red', 'blue', 'green', 'yellow'].map(color => (
                    <button
                      key={color}
                      className="color-btn"
                      style={{ backgroundColor: getCardColor({ color }) }}
                      onClick={() => selectColor(color)}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {message && <div className="game-message">{message}</div>}
        </div>
      </div>
    );
  }

  return <div className="app">Loading...</div>;
}

export default App;
