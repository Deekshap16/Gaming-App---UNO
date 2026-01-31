const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/card-game';
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Game state management
const gameRooms = new Map();
const playerSockets = new Map();

// Card types and colors
const COLORS = ['red', 'blue', 'green', 'yellow'];
const SPECIAL_CARDS = ['skip', 'reverse', 'draw2'];
const WILD_CARDS = ['wild', 'wild-draw4'];

class CardGame {
  constructor(roomId, players) {
    this.roomId = roomId;
    this.players = players.map((p, idx) => ({
      id: p.id,
      name: p.name,
      hand: [],
      position: idx
    }));
    this.deck = [];
    this.discardPile = [];
    this.currentPlayerIndex = 0;
    this.direction = 1; // 1 for clockwise, -1 for counter-clockwise
    this.currentColor = null;
    this.gameStarted = false;
    this.winner = null;
    this.initializeDeck();
  }

  initializeDeck() {
    // Number cards (0-9) for each color
    COLORS.forEach(color => {
      this.deck.push({ color, value: '0', type: 'number' });
      for (let i = 1; i <= 9; i++) {
        this.deck.push({ color, value: i.toString(), type: 'number' });
        this.deck.push({ color, value: i.toString(), type: 'number' }); // Two of each
      }
      
      // Special cards (2 of each per color)
      SPECIAL_CARDS.forEach(special => {
        this.deck.push({ color, value: special, type: 'special' });
        this.deck.push({ color, value: special, type: 'special' });
      });
    });

    // Wild cards (4 of each)
    for (let i = 0; i < 4; i++) {
      this.deck.push({ color: 'wild', value: 'wild', type: 'wild' });
      this.deck.push({ color: 'wild', value: 'wild-draw4', type: 'wild' });
    }

    this.shuffleDeck();
  }

  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  dealCards() {
    // Deal 7 cards to each player
    this.players.forEach(player => {
      for (let i = 0; i < 7; i++) {
        player.hand.push(this.deck.pop());
      }
    });

    // Put first card on discard pile (can't be wild)
    let firstCard;
    do {
      firstCard = this.deck.pop();
    } while (firstCard.type === 'wild');
    
    this.discardPile.push(firstCard);
    this.currentColor = firstCard.color;
  }

  drawCard(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return null;

    // If deck is empty, reshuffle discard pile
    if (this.deck.length === 0) {
      const topCard = this.discardPile.pop();
      this.deck = [...this.discardPile];
      this.discardPile = [topCard];
      this.shuffleDeck();
    }

    const card = this.deck.pop();
    player.hand.push(card);
    return card;
  }

  canPlayCard(card, playerId) {
    const currentPlayer = this.players[this.currentPlayerIndex];
    if (currentPlayer.id !== playerId) return false;

    const topCard = this.discardPile[this.discardPile.length - 1];
    
    // Wild cards can always be played
    if (card.type === 'wild') return true;
    
    // Check if color or value matches
    return card.color === this.currentColor || card.value === topCard.value;
  }

  playCard(playerId, cardIndex, chosenColor = null) {
    if (!this.canPlayCard(this.players.find(p => p.id === playerId).hand[cardIndex], playerId)) {
      return { success: false, message: 'Invalid card' };
    }

    const player = this.players.find(p => p.id === playerId);
    const card = player.hand.splice(cardIndex, 1)[0];
    this.discardPile.push(card);

    // Handle wild cards
    if (card.type === 'wild') {
      this.currentColor = chosenColor || COLORS[0];
    } else {
      this.currentColor = card.color;
    }

    // Check for winner
    if (player.hand.length === 0) {
      this.winner = playerId;
      return { success: true, card, winner: playerId };
    }

    // Apply card effects
    this.applyCardEffect(card);

    return { success: true, card };
  }

  applyCardEffect(card) {
    switch (card.value) {
      case 'skip':
        this.nextPlayer();
        break;
      case 'reverse':
        this.direction *= -1;
        if (this.players.length === 2) {
          this.nextPlayer(); // In 2-player, reverse acts as skip
        }
        break;
      case 'draw2':
        this.nextPlayer();
        const nextPlayer2 = this.players[this.currentPlayerIndex];
        for (let i = 0; i < 2; i++) {
          this.drawCard(nextPlayer2.id);
        }
        break;
      case 'wild-draw4':
        this.nextPlayer();
        const nextPlayer4 = this.players[this.currentPlayerIndex];
        for (let i = 0; i < 4; i++) {
          this.drawCard(nextPlayer4.id);
        }
        break;
    }

    this.nextPlayer();
  }

  nextPlayer() {
    this.currentPlayerIndex = (this.currentPlayerIndex + this.direction + this.players.length) % this.players.length;
  }

  getGameState(playerId = null) {
    return {
      roomId: this.roomId,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        cardCount: p.hand.length,
        hand: p.id === playerId ? p.hand : undefined,
        position: p.position
      })),
      topCard: this.discardPile[this.discardPile.length - 1],
      currentColor: this.currentColor,
      currentPlayerIndex: this.currentPlayerIndex,
      currentPlayerId: this.players[this.currentPlayerIndex].id,
      deckCount: this.deck.length,
      direction: this.direction,
      gameStarted: this.gameStarted,
      winner: this.winner
    };
  }
}

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-room', ({ playerName, roomId }) => {
    const room = roomId || generateRoomId();
    socket.join(room);
    playerSockets.set(socket.id, { roomId: room, name: playerName });
    
    if (!gameRooms.has(room)) {
      gameRooms.set(room, {
        players: [{ id: socket.id, name: playerName }],
        game: null
      });
    }

    socket.emit('room-created', { roomId: room, playerId: socket.id });
    io.to(room).emit('players-updated', gameRooms.get(room).players);
  });

  socket.on('join-room', ({ playerName, roomId }) => {
    if (!gameRooms.has(roomId)) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    const room = gameRooms.get(roomId);
    if (room.players.length >= 4) {
      socket.emit('error', { message: 'Room is full' });
      return;
    }

    if (room.game && room.game.gameStarted) {
      socket.emit('error', { message: 'Game already in progress' });
      return;
    }

    socket.join(roomId);
    room.players.push({ id: socket.id, name: playerName });
    playerSockets.set(socket.id, { roomId, name: playerName });

    socket.emit('room-joined', { roomId, playerId: socket.id });
    io.to(roomId).emit('players-updated', room.players);
  });

  socket.on('start-game', () => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;

    const room = gameRooms.get(playerInfo.roomId);
    if (!room || room.players.length < 2) {
      socket.emit('error', { message: 'Need at least 2 players to start' });
      return;
    }

    const game = new CardGame(playerInfo.roomId, room.players);
    game.dealCards();
    game.gameStarted = true;
    room.game = game;

    // Send game state to each player
    room.players.forEach(player => {
      io.to(player.id).emit('game-started', game.getGameState(player.id));
    });
  });

  socket.on('play-card', ({ cardIndex, chosenColor }) => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;

    const room = gameRooms.get(playerInfo.roomId);
    if (!room || !room.game) return;

    const result = room.game.playCard(socket.id, cardIndex, chosenColor);
    
    if (result.success) {
      // Broadcast game state to all players
      room.players.forEach(player => {
        io.to(player.id).emit('game-updated', room.game.getGameState(player.id));
      });

      if (result.winner) {
        io.to(playerInfo.roomId).emit('game-over', {
          winnerId: result.winner,
          winnerName: room.players.find(p => p.id === result.winner).name
        });
        saveGameResult(room);
      }
    } else {
      socket.emit('error', { message: result.message });
    }
  });

  socket.on('draw-card', () => {
    const playerInfo = playerSockets.get(socket.id);
    if (!playerInfo) return;

    const room = gameRooms.get(playerInfo.roomId);
    if (!room || !room.game) return;

    const card = room.game.drawCard(socket.id);
    room.game.nextPlayer();

    // Send updated game state
    room.players.forEach(player => {
      io.to(player.id).emit('game-updated', room.game.getGameState(player.id));
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    const playerInfo = playerSockets.get(socket.id);
    
    if (playerInfo) {
      const room = gameRooms.get(playerInfo.roomId);
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        
        if (room.players.length === 0) {
          gameRooms.delete(playerInfo.roomId);
        } else {
          io.to(playerInfo.roomId).emit('player-disconnected', {
            playerId: socket.id,
            players: room.players
          });
        }
      }
      playerSockets.delete(socket.id);
    }
  });
});

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function saveGameResult(room) {
  // This would save game results to MongoDB for learning purposes
  // Implementation depends on your data models
  try {
    const GameResult = require('./models/GameResult');
    const result = new GameResult({
      roomId: room.game.roomId,
      players: room.players.map(p => ({
        playerId: p.id,
        playerName: p.name,
        position: p.position
      })),
      winner: room.game.winner,
      totalTurns: room.game.discardPile.length,
      duration: Date.now(),
      playedCards: room.game.discardPile
    });
    await result.save();
  } catch (error) {
    console.error('Error saving game result:', error);
  }
}

// REST API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', activeRooms: gameRooms.size });
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const GameResult = require('./models/GameResult');
    const results = await GameResult.aggregate([
      { $unwind: '$players' },
      {
        $group: {
          _id: '$players.playerName',
          wins: {
            $sum: {
              $cond: [{ $eq: ['$players.playerId', '$winner'] }, 1, 0]
            }
          },
          gamesPlayed: { $sum: 1 }
        }
      },
      { $sort: { wins: -1 } },
      { $limit: 10 }
    ]);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
