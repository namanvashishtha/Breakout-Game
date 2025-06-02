# 🎮 Breakout Game

A modern, feature-rich implementation of the classic Breakout arcade game built with React, TypeScript, and Canvas API. Experience the nostalgia with modern web technologies!

![Breakout Game](https://img.shields.io/badge/Game-Breakout-blue?style=for-the-badge&logo=gamepad)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.4.1-646CFF?style=for-the-badge&logo=vite)

## 🌟 Features

### 🎯 Core Gameplay
- **Classic Breakout Mechanics**: Paddle, ball, and destructible bricks
- **Multi-Ball System**: Collect power-ups to spawn multiple balls
- **8 Challenging Levels**: Each with unique brick patterns and increasing difficulty
- **Lives System**: Start with 3 lives, earn bonus lives by completing levels
- **Progressive Difficulty**: Ball speed increases with each level

### 🎨 Visual Design
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Responsive Design**: Optimized for different screen sizes
- **Smooth Animations**: 60fps canvas rendering
- **Color-Coded Bricks**: Different colors for visual appeal
- **Game State Indicators**: Clear visual feedback for all game states
- **Particle Effects**: Dynamic particle explosions when bricks are destroyed

### 🚀 Power-ups
- **🔴 Multi-Ball**: Spawns additional balls for faster brick destruction
- **💚 Extra Life**: Grants an additional life
- **Random Distribution**: Power-ups appear randomly in bricks with configurable probability

### 🎮 Controls
- **Desktop**: Arrow keys to move paddle, Spacebar to pause/resume
- **Mobile**: Touch and drag to move paddle, double-tap to pause/resume
- **Universal**: Interactive UI buttons for all game actions

### 🏗️ Level Patterns
Each level features unique brick arrangements:
1. **Normal**: Standard rectangular grid
2. **Normal+**: Larger grid with faster ball
3. **Diamond**: Diamond-shaped pattern
4. **Checker**: Checkerboard pattern
5. **Pyramid**: Triangular pyramid formation
6. **Zigzag**: Alternating zigzag pattern
7. **Cross**: Cross and diagonal patterns
8. **Spiral**: Complex spiral formation

## 🛠️ Technology Stack

- **Frontend Framework**: React 18.3.1
- **Language**: TypeScript 5.5.3
- **Build Tool**: Vite 5.4.1
- **Styling**: Tailwind CSS 3.4.11
- **UI Components**: Radix UI + shadcn/ui
- **Icons**: Lucide React
- **Routing**: React Router DOM 6.26.2

## 📦 Installation

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd breakout-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to play the game!

## 🎮 How to Play

### Objective
Destroy all bricks on the screen by bouncing the ball off your paddle. Complete all 8 levels to win the game!

### Controls

#### Desktop
- **Left Arrow**: Move paddle left
- **Right Arrow**: Move paddle right
- **Spacebar**: Pause/Resume game

#### Mobile
- **Touch & Drag**: Move paddle by touching and dragging on the game canvas
- **Double Tap**: Pause/Resume game

#### Universal
- **Play Button**: Start a new game
- **Pause Button**: Pause/Resume current game
- **Reset Button**: Restart the current game

### Gameplay Tips
1. **Angle Shots**: Hit the ball with different parts of the paddle to control its angle
2. **Power-up Strategy**: Prioritize collecting extra life power-ups on harder levels
3. **Multi-ball Management**: Use multi-ball power-ups strategically to clear difficult brick formations
4. **Edge Play**: Use the walls to create interesting ball trajectories

### Scoring System
- **Base Points**: 10 points per brick
- **Level Multiplier**: Points are multiplied by the current level number
- **Bonus Lives**: Earn an extra life when completing each level

## 🏗️ Project Structure

```
breakout-game/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   └── BreakoutGame.tsx # Main game component
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   ├── pages/             # Route components
│   ├── App.tsx            # Main app component
│   └── main.tsx           # Entry point
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎯 Game Configuration

The game includes configurable level settings in `LEVEL_CONFIGS`:

```typescript
const LEVEL_CONFIGS = [
  { rows: 4, cols: 8, ballSpeed: 4, powerUpChance: 0.15, pattern: 'normal' },
  { rows: 5, cols: 9, ballSpeed: 4.5, powerUpChance: 0.12, pattern: 'normal' },
  // ... more levels
];
```

### Customizable Parameters
- **rows/cols**: Grid dimensions for bricks
- **ballSpeed**: Ball movement speed
- **powerUpChance**: Probability of power-up spawning (0-1)
- **pattern**: Brick arrangement pattern

## 🚀 Performance Features

- **Optimized Rendering**: Efficient canvas drawing with requestAnimationFrame
- **State Management**: Proper React state handling for smooth gameplay
- **Memory Management**: Cleanup of animation frames and event listeners
- **Responsive Design**: Adapts to different screen sizes
- **Mobile Optimization**: Touch-optimized controls with responsive canvas scaling

## ✨ Visual Effects

- **Particle System**: Dynamic particle explosions when bricks are destroyed
- **Smooth Animations**: Particles with gravity, fade-out effects, and realistic physics
- **Color-Matched Effects**: Particles inherit the color of destroyed bricks
- **Performance Optimized**: Efficient particle lifecycle management

## 🤝 Contributing

Contributions are welcome! Here are some ways you can contribute:

1. **Bug Reports**: Found a bug? Open an issue with detailed reproduction steps
2. **Feature Requests**: Have an idea for a new feature? Let's discuss it!
3. **Code Contributions**: Fork the repo, make your changes, and submit a pull request
4. **Documentation**: Help improve the documentation

### Development Guidelines
- Follow TypeScript best practices
- Maintain consistent code formatting
- Add comments for complex game logic
- Test your changes thoroughly

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🎉 Acknowledgments

- Inspired by the classic Atari Breakout game
- Built with modern web technologies
- UI components from shadcn/ui
- Icons from Lucide React

## 🐛 Known Issues

- None currently reported

## 🔮 Future Enhancements

- [ ] Sound effects and background music
- [ ] High score persistence
- [ ] Additional power-up types
- [x] Particle effects for brick destruction
- [x] Mobile touch controls optimization
- [ ] Multiplayer mode
- [ ] Custom level editor

---

**Enjoy playing Breakout! 🎮**

*Built with ❤️ using React and TypeScript*