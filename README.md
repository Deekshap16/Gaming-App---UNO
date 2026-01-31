# 🎴 Multiplayer Card Game (Juvo-Style)

A real-time multiplayer card game built with React, Node.js, Socket.IO, and MongoDB. Players compete to be the first to discard all their cards using strategy and special action cards.

## 🎯 Features

### Game Features
- **Real-time Multiplayer**: 2-4 players per game room
- **Juvo-style Gameplay**: Number cards, skip, reverse, draw 2, wild cards, and wild draw 4
- **Room System**: Create or join games with shareable room codes
- **Live Game State**: Instant updates for all players
- **Winner Detection**: Automatic game completion and statistics tracking

### Technical Features
- **WebSocket Communication**: Real-time bidirectional event-based communication
- **MongoDB Integration**: Persistent storage for game results and player statistics
- **Responsive Design**: Works on desktop and mobile devices
- **RESTful API**: Leaderboard and statistics endpoints
- **Game State Management**: Server-side game logic ensures fair play

## 🛠️ Tech Stack

### Frontend
- **React** - UI component library
- **Socket.IO Client** - Real-time WebSocket client
- **CSS3** - Styling with animations and transitions

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Socket.IO** - WebSocket server
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd card-game
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
echo "MONGODB_URI=mongodb://localhost:27017/card-game" > .env
echo "PORT=3001" >> .env

# Start MongoDB (if running locally)
mongod

# Start the backend server
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Create .env file (optional)
echo "REACT_APP_SOCKET_URL=http://localhost:3001" > .env

# Start the React app
npm start
```

The frontend will open at `http://localhost:3000` and connect to the backend at `http://localhost:3001`.

## 🎮 How to Play

### Starting a Game
1. **Create a Room**: Enter your name and click "Create Room"
2. **Share Room Code**: Give the 6-character code to your friends
3. **Join Room**: Friends enter the code and their names to join
4. **Start Game**: Host clicks "Start Game" when 2-4 players are ready

### Game Rules
- Each player starts with 7 cards
- Match the color or number of the top card
- **Number Cards (0-9)**: Play if color or number matches
- **Skip**: Next player loses their turn
- **Reverse**: Changes play direction
- **Draw 2**: Next player draws 2 cards and loses turn
- **Wild Card**: Play anytime, choose new color
- **Wild Draw 4**: Next player draws 4 cards, choose new color
- First player to discard all cards wins!

### Controls
- Click a card to play it (if valid)
- Click "Draw Card" if you can't play
- Choose color when playing wild cards

## 📊 API Endpoints

### GET /api/health
Check server status
```json
{
  "status": "ok",
  "activeRooms": 5
}
```

### GET /api/leaderboard
Get top 10 players by wins
```json
[
  {
    "_id": "Player1",
    "wins": 15,
    "gamesPlayed": 30
  }
]
```

## 🔌 WebSocket Events

### Client → Server
- `create-room` - Create a new game room
- `join-room` - Join an existing room
- `start-game` - Start the game (host only)
- `play-card` - Play a card from hand
- `draw-card` - Draw a card from deck

### Server → Client
- `room-created` - Room created successfully
- `room-joined` - Joined room successfully
- `players-updated` - Player list changed
- `game-started` - Game has begun
- `game-updated` - Game state changed
- `game-over` - Someone won the game
- `player-disconnected` - A player left
- `error` - Error occurred

## 📚 Learning Outcomes

### 1. Real-time Multiplayer Synchronization
- **Challenge**: Keep 2-4 players in sync with game state
- **Solution**: WebSocket events broadcast state changes instantly
- **Key Concept**: Event-driven architecture for real-time apps

### 2. WebSocket Implementation
- **Client-side**: Socket.IO client connects and listens for events
- **Server-side**: Socket.IO server manages rooms and broadcasts
- **Bidirectional**: Both client and server can initiate communication

### 3. Game Logic Architecture
- **Server Authority**: All game logic runs on server to prevent cheating
- **State Management**: Game state stored server-side, synced to clients
- **Turn-based System**: Enforce turn order and valid moves

### 4. Room/Lobby System
- **Room Creation**: Generate unique codes for game sessions
- **Player Management**: Track players joining/leaving
- **State Isolation**: Each room has independent game state

### 5. Data Persistence
- **MongoDB Integration**: Store completed games
- **Statistics Tracking**: Win rates, games played, player data
- **Leaderboards**: Aggregate queries for rankings

### 6. Frontend State Management
- **React Hooks**: useState, useEffect for component state
- **Real-time Updates**: Re-render on socket events
- **Conditional Rendering**: Show different screens (lobby, waiting, game)

### 7. Responsive UI/UX
- **CSS Grid & Flexbox**: Responsive layouts
- **Animations**: Card interactions, transitions
- **Mobile Support**: Touch-friendly controls

### 8. Error Handling
- **Network Issues**: Reconnection logic
- **Invalid Moves**: Client-side validation + server verification
- **User Feedback**: Toast messages for errors/events

## 🏗️ Project Structure

```
card-game/
├── backend/
│   ├── server.js           # Main server file with Socket.IO
│   ├── models/
│   │   └── GameResult.js   # MongoDB schemas
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.js          # Main React component
│   │   ├── App.css         # Styles
│   │   └── index.js        # Entry point
│   └── package.json
│
└── README.md
```

## 🔧 Customization Ideas

### Game Variants
- Add more card types (swap hands, skip all)
- Implement power-ups or special abilities
- Create different game modes (speed Juvo, team play)

### Features to Add
- **Chat System**: In-game messaging
- **Friend System**: Add/invite friends
- **Achievements**: Unlock badges for milestones
- **AI Players**: Play with bots when alone
- **Replays**: Watch past games
- **Custom Decks**: Create themed card designs

### Technical Improvements
- **Authentication**: User accounts with login
- **Redis**: Session management and caching
- **Docker**: Containerize for easy deployment
- **Testing**: Jest for unit tests, Cypress for E2E
- **Analytics**: Track game metrics with Mixpanel/GA

## 🐛 Troubleshooting

### Can't Connect to Server
- Check if backend is running on port 3001
- Verify REACT_APP_SOCKET_URL in frontend .env
- Check firewall/network settings

### MongoDB Connection Failed
- Ensure MongoDB is running
- Verify MONGODB_URI in backend .env
- Check MongoDB authentication credentials

### Cards Not Updating
- Check browser console for errors
- Verify WebSocket connection in Network tab
- Restart both frontend and backend

## 📈 Performance Tips

1. **Minimize Re-renders**: Use React.memo for child components
2. **Debounce Events**: Limit socket emissions frequency
3. **Optimize Images**: Compress card graphics
4. **Index Database**: Add indexes to MongoDB queries
5. **Connection Pooling**: Configure MongoDB connection pool

## 🚀 Deployment

### Backend (Heroku/Railway)
```bash
# Set environment variables
MONGODB_URI=<your-mongodb-uri>
PORT=3001

# Deploy
git push heroku main
```

### Frontend (Vercel/Netlify)
```bash
# Set environment variable
REACT_APP_SOCKET_URL=https://your-backend.herokuapp.com

# Build and deploy
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 🎓 Additional Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express Documentation](https://expressjs.com/)
- [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## 💡 Next Steps

1. **Enhance Game Logic**: Add more card types and game modes
2. **Improve UI**: Add animations, sounds, and better graphics
3. **Add Authentication**: User accounts and profiles
4. **Mobile App**: Build React Native version
5. **Machine Learning**: Implement AI players that learn from games
6. **Analytics Dashboard**: Visualize game statistics

---

**Happy Gaming! 🎮**

For questions or support, please open an issue on GitHub.
