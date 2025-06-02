import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Play, Pause, RotateCcw, Trophy, Heart, Zap } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
  radius: number;
  id: number;
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  color: string;
  hasPowerUp?: boolean;
  powerUpType?: 'multiBall' | 'extraLife';
}

interface PowerUp {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'multiBall' | 'extraLife';
  dy: number;
  id: number;
}

interface Particle {
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  id: number;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 10;
const BALL_RADIUS = 8;
const BRICK_WIDTH = 70;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 5;
const POWERUP_SIZE = 20;

// Level configurations
const LEVEL_CONFIGS = [
  { rows: 4, cols: 8, ballSpeed: 4, powerUpChance: 0.15, pattern: 'normal' },
  { rows: 5, cols: 9, ballSpeed: 4.5, powerUpChance: 0.12, pattern: 'normal' },
  { rows: 6, cols: 10, ballSpeed: 5, powerUpChance: 0.18, pattern: 'diamond' },
  { rows: 6, cols: 10, ballSpeed: 5.5, powerUpChance: 0.10, pattern: 'checker' },
  { rows: 7, cols: 11, ballSpeed: 6, powerUpChance: 0.20, pattern: 'pyramid' },
  { rows: 7, cols: 11, ballSpeed: 6.5, powerUpChance: 0.08, pattern: 'zigzag' },
  { rows: 8, cols: 12, ballSpeed: 7, powerUpChance: 0.25, pattern: 'cross' },
  { rows: 8, cols: 12, ballSpeed: 7.5, powerUpChance: 0.05, pattern: 'spiral' },
];

const BreakoutGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'gameOver' | 'won' | 'nextLevel'>('menu');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const animationFrameRef = useRef<number>();
  const ballIdCounter = useRef(1);
  const powerUpIdCounter = useRef(1);
  const particleIdCounter = useRef(1);
  const isMobile = useIsMobile();

  const [paddle, setPaddle] = useState<Paddle>({
    x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    y: CANVAS_HEIGHT - 30,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT
  });

  const [balls, setBalls] = useState<Ball[]>([{
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    dx: 4,
    dy: -4,
    radius: BALL_RADIUS,
    id: 0
  }]);

  const [bricks, setBricks] = useState<Brick[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [keys, setKeys] = useState<{ [key: string]: boolean }>({});
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const lastTapRef = useRef<number>(0);

  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#a8e6cf', '#ffd93d'];

  const getBrickPattern = (row: number, col: number, rows: number, cols: number, pattern: string) => {
    switch (pattern) {
      case 'diamond': {
        const centerRow = Math.floor(rows / 2);
        const centerCol = Math.floor(cols / 2);
        const distanceFromCenter = Math.abs(row - centerRow) + Math.abs(col - centerCol);
        return distanceFromCenter <= Math.min(centerRow, centerCol);
      }
      
      case 'checker':
        return (row + col) % 2 === 0;
      
      case 'pyramid':
        return row <= col && row <= (cols - 1 - col);
      
      case 'zigzag':
        return row % 2 === 0 ? col % 3 !== 1 : col % 3 === 1;
      
      case 'cross': {
        const midRow = Math.floor(rows / 2);
        const midCol = Math.floor(cols / 2);
        return row === midRow || col === midCol || Math.abs(row - midRow) === Math.abs(col - midCol);
      }
      
      case 'spiral': {
        // Simple spiral pattern
        const spiralCenter = Math.min(rows, cols) / 2;
        const spiralDistance = Math.sqrt(Math.pow(row - rows/2, 2) + Math.pow(col - cols/2, 2));
        return Math.floor(spiralDistance + row + col) % 3 !== 0;
      }
      
      default: // normal
        return true;
    }
  };

  const initializeBricks = useCallback(() => {
    const config = LEVEL_CONFIGS[Math.min(level - 1, LEVEL_CONFIGS.length - 1)];
    const newBricks: Brick[] = [];
    const offsetTop = 60;
    const offsetLeft = (CANVAS_WIDTH - (config.cols * (BRICK_WIDTH + BRICK_PADDING) - BRICK_PADDING)) / 2;

    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        if (getBrickPattern(row, col, config.rows, config.cols, config.pattern)) {
          const hasPowerUp = Math.random() < config.powerUpChance;
          const powerUpType = Math.random() < 0.6 ? 'multiBall' : 'extraLife';
          
          newBricks.push({
            x: offsetLeft + col * (BRICK_WIDTH + BRICK_PADDING),
            y: offsetTop + row * (BRICK_HEIGHT + BRICK_PADDING),
            width: BRICK_WIDTH,
            height: BRICK_HEIGHT,
            visible: true,
            color: colors[row % colors.length],
            hasPowerUp,
            powerUpType
          });
        }
      }
    }
    setBricks(newBricks);
  }, [level]);

  const nextLevel = useCallback(() => {
    if (level < LEVEL_CONFIGS.length) {
      setLevel(prev => prev + 1);
      setLives(prev => prev + 1); // Bonus life for completing level
      
      // Reset balls with new speed
      const config = LEVEL_CONFIGS[Math.min(level, LEVEL_CONFIGS.length - 1)];
      setBalls([{
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        dx: config.ballSpeed,
        dy: -config.ballSpeed,
        radius: BALL_RADIUS,
        id: ballIdCounter.current++
      }]);
      
      setPowerUps([]);
      setParticles([]);
      ballIdCounter.current = 1;
      powerUpIdCounter.current = 1;
      particleIdCounter.current = 1;
      initializeBricks();
      setGameState('playing');
    } else {
      setGameState('won');
    }
  }, [level, initializeBricks]);

  const resetGame = useCallback(() => {
    setPaddle({
      x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
      y: CANVAS_HEIGHT - 30,
      width: PADDLE_WIDTH,
      height: PADDLE_HEIGHT
    });
    
    const config = LEVEL_CONFIGS[0];
    setBalls([{
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      dx: config.ballSpeed,
      dy: -config.ballSpeed,
      radius: BALL_RADIUS,
      id: 0
    }]);
    
    setPowerUps([]);
    setParticles([]);
    setScore(0);
    setLives(3);
    setLevel(1);
    ballIdCounter.current = 1;
    powerUpIdCounter.current = 1;
    particleIdCounter.current = 1;
    initializeBricks();
    setGameState('playing');
  }, [initializeBricks]);

  const checkCollision = (ball: Ball, rect: { x: number; y: number; width: number; height: number }) => {
    return ball.x - ball.radius < rect.x + rect.width &&
           ball.x + ball.radius > rect.x &&
           ball.y - ball.radius < rect.y + rect.height &&
           ball.y + ball.radius > rect.y;
  };

  const spawnPowerUp = (x: number, y: number, type: 'multiBall' | 'extraLife') => {
    const newPowerUp: PowerUp = {
      x: x + BRICK_WIDTH / 2 - POWERUP_SIZE / 2,
      y: y,
      width: POWERUP_SIZE,
      height: POWERUP_SIZE,
      type,
      dy: 2,
      id: powerUpIdCounter.current++
    };
    setPowerUps(prev => [...prev, newPowerUp]);
  };

  const createParticles = (x: number, y: number, color: string) => {
    const newParticles: Particle[] = [];
    const particleCount = 8 + Math.random() * 4; // 8-12 particles
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 3;
      const size = 2 + Math.random() * 3;
      const life = 30 + Math.random() * 20;
      
      newParticles.push({
        x: x + BRICK_WIDTH / 2,
        y: y + BRICK_HEIGHT / 2,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        size,
        color,
        life,
        maxLife: life,
        id: particleIdCounter.current++
      });
    }
    
    setParticles(prev => [...prev, ...newParticles]);
  };

  const activatePowerUp = (type: 'multiBall' | 'extraLife') => {
    if (type === 'multiBall') {
      setBalls(prevBalls => {
        const newBalls = [...prevBalls];
        const mainBall = prevBalls[0];
        if (mainBall) {
          // Add two more balls
          newBalls.push({
            ...mainBall,
            dx: mainBall.dx + 2,
            dy: mainBall.dy,
            id: ballIdCounter.current++
          });
          newBalls.push({
            ...mainBall,
            dx: mainBall.dx - 2,
            dy: mainBall.dy,
            id: ballIdCounter.current++
          });
        }
        return newBalls;
      });
    } else if (type === 'extraLife') {
      setLives(prev => prev + 1);
    }
  };

  const updateGame = useCallback(() => {
    if (gameState !== 'playing') return;

    const config = LEVEL_CONFIGS[Math.min(level - 1, LEVEL_CONFIGS.length - 1)];

    // Update balls
    setBalls(prevBalls => {
      return prevBalls.map(ball => {
        const newBall = { ...ball };
        
        // Move ball
        newBall.x += newBall.dx;
        newBall.y += newBall.dy;

        // Wall collisions
        if (newBall.x + newBall.radius > CANVAS_WIDTH || newBall.x - newBall.radius < 0) {
          newBall.dx = -newBall.dx;
        }
        if (newBall.y - newBall.radius < 0) {
          newBall.dy = -newBall.dy;
        }

        return newBall;
      }).filter(ball => {
        // Remove balls that fall off the bottom
        if (ball.y + ball.radius > CANVAS_HEIGHT) {
          return false;
        }
        return true;
      });
    });

    // Check if all balls are gone
    setBalls(prevBalls => {
      if (prevBalls.length === 0) {
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            setGameState('gameOver');
          } else {
            // Reset with one ball at current level speed
            setBalls([{
              x: CANVAS_WIDTH / 2,
              y: CANVAS_HEIGHT / 2,
              dx: config.ballSpeed,
              dy: -config.ballSpeed,
              radius: BALL_RADIUS,
              id: ballIdCounter.current++
            }]);
          }
          return newLives;
        });
      }
      return prevBalls;
    });

    // Move paddle
    setPaddle(prevPaddle => {
      const newPaddle = { ...prevPaddle };
      if (keys['ArrowLeft'] && newPaddle.x > 0) {
        newPaddle.x -= 8;
      }
      if (keys['ArrowRight'] && newPaddle.x < CANVAS_WIDTH - newPaddle.width) {
        newPaddle.x += 8;
      }
      return newPaddle;
    });

    // Check paddle collisions for all balls
    setBalls(prevBalls => {
      return prevBalls.map(ball => {
        const newBall = { ...ball };
        if (checkCollision(newBall, paddle)) {
          newBall.dy = -Math.abs(newBall.dy);
          // Add some angle based on where ball hits paddle
          const paddleCenter = paddle.x + paddle.width / 2;
          const hitPos = (newBall.x - paddleCenter) / (paddle.width / 2);
          newBall.dx = hitPos * 3;
        }
        return newBall;
      });
    });

    // Check brick collisions for all balls
    setBricks(prevBricks => {
      return prevBricks.map(brick => {
        if (!brick.visible) return brick;
        
        for (const ball of balls) {
          if (checkCollision(ball, brick)) {
            setBalls(prevBalls => 
              prevBalls.map(b => 
                b.id === ball.id ? { ...b, dy: -b.dy } : b
              )
            );
            setScore(prev => prev + (10 * level)); // More points for higher levels
            
            // Create particle effect
            createParticles(brick.x, brick.y, brick.color);
            
            // Spawn power-up if brick has one
            if (brick.hasPowerUp && brick.powerUpType) {
              spawnPowerUp(brick.x, brick.y, brick.powerUpType);
            }
            
            return { ...brick, visible: false };
          }
        }
        return brick;
      });
    });

    // Update power-ups
    setPowerUps(prevPowerUps => {
      return prevPowerUps.filter(powerUp => {
        const newPowerUp = { ...powerUp };
        newPowerUp.y += newPowerUp.dy;
        
        // Check collision with paddle
        if (checkCollision({ x: newPowerUp.x + newPowerUp.width/2, y: newPowerUp.y + newPowerUp.height/2, radius: newPowerUp.width/2 } as Ball, paddle)) {
          activatePowerUp(newPowerUp.type);
          return false; // Remove power-up
        }
        
        // Remove if it falls off screen
        if (newPowerUp.y > CANVAS_HEIGHT) {
          return false;
        }
        
        // Update position
        powerUp.y = newPowerUp.y;
        return true;
      });
    });

    // Update particles
    setParticles(prevParticles => {
      return prevParticles.filter(particle => {
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.dy += 0.1; // Gravity
        particle.life--;
        
        return particle.life > 0;
      });
    });

    // Check win condition
    setBricks(prevBricks => {
      const visibleBricks = prevBricks.filter(brick => brick.visible);
      if (visibleBricks.length === 0) {
        if (level < LEVEL_CONFIGS.length) {
          setGameState('nextLevel');
        } else {
          setGameState('won');
        }
      }
      return prevBricks;
    });
  }, [gameState, keys, paddle, balls, level]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (gameState === 'playing' || gameState === 'paused') {
      // Draw paddle
      ctx.fillStyle = '#4ecdc4';
      ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

      // Draw all balls
      balls.forEach(ball => {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#feca57';
        ctx.fill();
        ctx.closePath();
      });

      // Draw bricks
      bricks.forEach(brick => {
        if (brick.visible) {
          ctx.fillStyle = brick.color;
          ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
          
          // Draw power-up indicator
          if (brick.hasPowerUp) {
            ctx.fillStyle = brick.powerUpType === 'multiBall' ? '#ff6b6b' : '#4ecdc4';
            ctx.fillRect(brick.x + brick.width - 8, brick.y + 2, 6, 6);
          }
        }
      });

      // Draw power-ups
      powerUps.forEach(powerUp => {
        ctx.fillStyle = powerUp.type === 'multiBall' ? '#ff6b6b' : '#4ecdc4';
        ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        
        // Draw power-up symbol
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const symbol = powerUp.type === 'multiBall' ? '3' : '+';
        ctx.fillText(symbol, powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2 + 4);
      });

      // Draw particles
      particles.forEach(particle => {
        const alpha = particle.life / particle.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
      });
      ctx.globalAlpha = 1; // Reset alpha

      // Draw UI with level info
      ctx.fillStyle = '#ffffff';
      ctx.font = '20px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score}`, 20, 30);
      ctx.fillText(`Lives: ${lives}`, CANVAS_WIDTH - 100, 30);
      ctx.fillText(`Level: ${level}/${LEVEL_CONFIGS.length}`, CANVAS_WIDTH / 2 - 50, 30);
      ctx.fillText(`Balls: ${balls.length}`, CANVAS_WIDTH / 2 + 100, 30);
    }

    if (gameState === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      ctx.fillStyle = '#ffffff';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      ctx.textAlign = 'left';
    }
  }, [gameState, paddle, balls, bricks, powerUps, particles, score, lives, level]);

  const gameLoop = useCallback(() => {
    updateGame();
    draw();
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  }, [updateGame, draw]);

  useEffect(() => {
    if (gameState === 'playing') {
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, gameLoop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.code]: true }));
      if (e.code === 'Space') {
        e.preventDefault();
        if (gameState === 'playing') {
          setGameState('paused');
        } else if (gameState === 'paused') {
          setGameState('playing');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setKeys(prev => ({ ...prev, [e.code]: false }));
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      setTouchStart({ x: touch.clientX, y: touch.clientY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!touchStart || gameState !== 'playing') return;
      
      const touch = e.touches[0];
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const canvasX = touch.clientX - rect.left;
      const scaledX = (canvasX / rect.width) * CANVAS_WIDTH;
      
      setPaddle(prev => ({
        ...prev,
        x: Math.max(0, Math.min(CANVAS_WIDTH - prev.width, scaledX - prev.width / 2))
      }));
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      setTouchStart(null);
      
      // Double tap to pause/resume
      if (e.timeStamp - lastTapRef.current < 300) {
        if (gameState === 'playing') {
          setGameState('paused');
        } else if (gameState === 'paused') {
          setGameState('playing');
        }
      }
      lastTapRef.current = e.timeStamp;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    if (isMobile) {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
      }
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      if (isMobile) {
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.removeEventListener('touchstart', handleTouchStart);
          canvas.removeEventListener('touchmove', handleTouchMove);
          canvas.removeEventListener('touchend', handleTouchEnd);
        }
      }
    };
  }, [gameState, touchStart, isMobile]);

  useEffect(() => {
    initializeBricks();
  }, [initializeBricks]);

  const bricksDestroyed = bricks.filter(brick => !brick.visible).length;
  const totalBricks = bricks.length;
  const progressPercentage = totalBricks > 0 ? (bricksDestroyed / totalBricks) * 100 : 0;
  const currentLevelConfig = LEVEL_CONFIGS[Math.min(level - 1, LEVEL_CONFIGS.length - 1)];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center space-x-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              <div>
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-2xl font-bold text-white">{score.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border-red-500/30 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center space-x-3">
              <Heart className="w-8 h-8 text-red-400" />
              <div>
                <p className="text-sm text-muted-foreground">Lives</p>
                <p className="text-2xl font-bold text-white">{lives}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center space-x-3">
              <Zap className="w-8 h-8 text-green-400" />
              <div>
                <p className="text-sm text-muted-foreground">Balls</p>
                <p className="text-2xl font-bold text-white">{balls.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500/20 to-violet-500/20 border-purple-500/30 backdrop-blur-sm">
            <CardContent className="p-4 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-purple-400 flex items-center justify-center text-sm font-bold">
                L{level}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Level</p>
                <p className="text-2xl font-bold text-white">{level}/{LEVEL_CONFIGS.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Level Info */}
        <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">Level {level} - {currentLevelConfig.pattern.toUpperCase()} Pattern</span>
              <Badge variant="outline" className="text-cyan-400 border-cyan-400">
                Speed: {currentLevelConfig.ballSpeed}x
              </Badge>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">Progress</span>
              <span className="text-sm text-muted-foreground">{bricksDestroyed}/{totalBricks}</span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="h-2 bg-white/10"
            />
          </CardContent>
        </Card>

        {/* Main Game Card */}
        <Card className="bg-black/40 border-white/20 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                BREAKOUT
              </span>
            </CardTitle>
            {gameState === 'menu' && (
              <p className="text-muted-foreground">Break all the bricks to advance through {LEVEL_CONFIGS.length} challenging levels!</p>
            )}
          </CardHeader>
          
          <CardContent className="flex flex-col items-center space-y-6">
            {/* Game Canvas */}
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="border-2 border-white/30 rounded-lg shadow-lg bg-gradient-to-b from-slate-800 to-slate-900"
                style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}
              />
              
              {/* Overlay for game states */}
              {gameState === 'menu' && (
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <h2 className="text-3xl font-bold text-white">Ready for {LEVEL_CONFIGS.length} Levels?</h2>
                    <p className="text-muted-foreground">Each level brings new challenges and patterns</p>
                  </div>
                </div>
              )}
              
              {gameState === 'nextLevel' && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <h2 className="text-3xl font-bold text-green-400">Level {level - 1} Complete!</h2>
                    <p className="text-xl text-white">Bonus Life Earned!</p>
                    <Badge className="text-lg px-4 py-2 bg-gradient-to-r from-green-400 to-emerald-400">
                      Next: Level {level} - {LEVEL_CONFIGS[Math.min(level - 1, LEVEL_CONFIGS.length - 1)].pattern.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              )}
              
              {gameState === 'gameOver' && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <h2 className="text-4xl font-bold text-red-400">Game Over!</h2>
                    <p className="text-xl text-white">Reached Level {level}</p>
                    <p className="text-xl text-white">Final Score: {score.toLocaleString()}</p>
                    <Badge variant="destructive" className="text-lg px-4 py-2">
                      Better luck next time!
                    </Badge>
                  </div>
                </div>
              )}
              
              {gameState === 'won' && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <h2 className="text-4xl font-bold text-green-400">All Levels Complete!</h2>
                    <p className="text-xl text-white">Final Score: {score.toLocaleString()}</p>
                    <Badge className="text-lg px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-400">
                      <Trophy className="w-4 h-4 mr-2" />
                      Master Champion!
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap justify-center gap-3">
              {gameState === 'menu' && (
                <Button 
                  onClick={resetGame} 
                  size="lg" 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-8 py-3 shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Adventure
                </Button>
              )}
              
              {gameState === 'playing' && (
                <Button 
                  onClick={() => setGameState('paused')} 
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              )}
              
              {gameState === 'paused' && (
                <Button 
                  onClick={() => setGameState('playing')} 
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Resume
                </Button>
              )}
              
              {gameState === 'nextLevel' && (
                <Button 
                  onClick={nextLevel} 
                  size="lg"
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold px-8 py-3 shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Next Level
                </Button>
              )}
              
              {(gameState === 'gameOver' || gameState === 'won') && (
                <Button 
                  onClick={resetGame} 
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold px-8 py-3 shadow-lg transition-all duration-200 hover:scale-105"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Play Again
                </Button>
              )}
            </div>

            <Separator className="bg-white/20" />

            {/* Instructions */}
            <div className="text-center space-y-2 max-w-2xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {!isMobile ? (
                  <>
                    <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                      <kbd className="px-2 py-1 bg-white/10 rounded text-xs">←→</kbd>
                      <span>Move paddle</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                      <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Space</kbd>
                      <span>Pause/Resume</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                      <kbd className="px-2 py-1 bg-white/10 rounded text-xs">👆</kbd>
                      <span>Touch & drag to move paddle</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-muted-foreground">
                      <kbd className="px-2 py-1 bg-white/10 rounded text-xs">👆👆</kbd>
                      <span>Double tap to pause</span>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Badge variant="secondary" className="bg-red-500/20 text-red-300 border-red-500/30">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                  Multi-Ball Power-up
                </Badge>
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  Extra Life Power-up
                </Badge>
              </div>
              
              <p className="text-xs text-muted-foreground pt-2">
                Complete all {LEVEL_CONFIGS.length} levels with unique patterns: Normal, Diamond, Checker, Pyramid, Zigzag, Cross, and Spiral!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BreakoutGame;
