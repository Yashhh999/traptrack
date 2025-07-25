"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Skull, ArrowLeft, Pause, Bomb, AlertTriangle } from "lucide-react"

interface TrapType {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  effect: (player: Player) => Partial<Player>
  color: string
  rarity: "common" | "rare" | "legendary"
  funnyMessages: string[]
}

interface Player {
  id: number
  name: string
  position: number
  color: string
  skipTurns: number
  frozen: boolean
  trapsHit: number
  luckyEscapes: number
}

interface GameTile {
  id: number
  trap?: TrapType
  isRevealed?: boolean
  hasBeenStepped?: boolean
}

const EPIC_TRAPS: TrapType[] = [
  {
    id: "banana_peel",
    name: "🍌 Banana Peel",
    description: "Classic slip! Back 3 steps",
    icon: <ArrowLeft className="w-4 h-4" />,
    effect: (player) => ({ position: Math.max(0, player.position - 3) }),
    color: "bg-yellow-600",
    rarity: "common",
    funnyMessages: [
      "Whoops! Should've watched where you were going!",
      "Mario Kart flashbacks intensify...",
      "The banana strikes again! 🍌",
    ],
  },
  {
    id: "quicksand_doom",
    name: "🏜️ Quicksand of Doom",
    description: "You're stuck! Skip next turn",
    icon: <Pause className="w-4 h-4" />,
    effect: (player) => ({ skipTurns: player.skipTurns + 1 }),
    color: "bg-orange-500",
    rarity: "common",
    funnyMessages: [
      "Don't panic! Wait, actually, panic a little...",
      "Time to practice your patience!",
      "Quicksand: 1, You: 0",
    ],
  },
  {
    id: "ice_age",
    name: "🧊 Ice Age Trap",
    description: "Frozen solid! Skip 2 turns",
    icon: <Skull className="w-4 h-4" />,
    effect: (player) => ({ frozen: true, skipTurns: player.skipTurns + 2 }),
    color: "bg-blue-600",
    rarity: "rare",
    funnyMessages: [
      "Brrr! Time to chill out... literally",
      "Frozen like a popsicle! 🧊",
      "Ice to meet you... get it? ICE to meet you!",
    ],
  },
  {
    id: "mega_pitfall",
    name: "🕳️ The Mega Pitfall",
    description: "OUCH! Back 8 steps",
    icon: <ArrowLeft className="w-4 h-4" />,
    effect: (player) => ({ position: Math.max(0, player.position - 8) }),
    color: "bg-red-700",
    rarity: "rare",
    funnyMessages: [
      "That's gonna leave a mark!",
      "Gravity: still working perfectly!",
      "Hope you enjoyed the scenic route back!",
    ],
  },
  {
    id: "time_warp",
    name: "⏰ Time Warp Trap",
    description: "Lost in time! Skip 3 turns",
    icon: <Pause className="w-4 h-4" />,
    effect: (player) => ({ skipTurns: player.skipTurns + 3 }),
    color: "bg-purple-600",
    rarity: "rare",
    funnyMessages: [
      "Welcome to the time-out dimension!",
      "Time is a flat circle... and you're stuck in it",
      "See you in a few turns! ⏰",
    ],
  },
  {
    id: "black_hole",
    name: "🌑 Black Hole",
    description: "LEGENDARY! Back to start!",
    icon: <Bomb className="w-4 h-4" />,
    effect: (player) => ({ position: 0 }),
    color: "bg-black",
    rarity: "legendary",
    funnyMessages: [
      "YIKES! Back to square one!",
      "The universe has spoken... and it said 'NOPE!'",
      "Achievement Unlocked: Ultimate Failure! 🏆",
    ],
  },
]

const DICE_FACES = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6]

const SAFE_LANDING_MESSAGES = [
  "Phew! Safe and sound!",
  "Lucky you! No traps here!",
  "Smooth sailing! ⛵",
  "Your guardian angel is working overtime!",
  "Plot armor activated!",
  "The trap gods smile upon you today!",
]

const PLAYER_REACTIONS = {
  hit_trap: ["😱", "😵", "🤕", "😭", "💀"],
  safe_landing: ["😅", "😌", "🙂", "😊", "🥳"],
  winning: ["🎉", "🏆", "👑", "🥇", "🎊"],
}

export default function TrapTrackGame() {
  const [players, setPlayers] = useState<Player[]>([
    {
      id: 1,
      name: "Player 1",
      position: 0,
      color: "bg-red-400",
      skipTurns: 0,
      frozen: false,
      trapsHit: 0,
      luckyEscapes: 0,
    },
    {
      id: 2,
      name: "Player 2",
      position: 0,
      color: "bg-blue-400",
      skipTurns: 0,
      frozen: false,
      trapsHit: 0,
      luckyEscapes: 0,
    },
    {
      id: 3,
      name: "Player 3",
      position: 0,
      color: "bg-green-400",
      skipTurns: 0,
      frozen: false,
      trapsHit: 0,
      luckyEscapes: 0,
    },
    {
      id: 4,
      name: "Player 4",
      position: 0,
      color: "bg-yellow-400",
      skipTurns: 0,
      frozen: false,
      trapsHit: 0,
      luckyEscapes: 0,
    },
  ])

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
  const [diceValue, setDiceValue] = useState(1)
  const [gameBoard, setGameBoard] = useState<GameTile[]>([])
  const [gameMessage, setGameMessage] = useState("🎮 Let's play! Player 1, roll that dice!")
  const [isDiceRolling, setIsDiceRolling] = useState(false)
  const [winner, setWinner] = useState<Player | null>(null)
  const [isPlayerMoving, setIsPlayerMoving] = useState(false)
  const [currentlyMovingPlayer, setCurrentlyMovingPlayer] = useState<number | null>(null)
  const [showDiceAnimation, setShowDiceAnimation] = useState(false)
  const [gameStats, setGameStats] = useState({ totalTrapsHit: 0, totalRolls: 0, gameNumber: 1 })
  const [showNewGameConfirm, setShowNewGameConfirm] = useState(false)
  const [isOnCooldown, setIsOnCooldown] = useState(false)

  useEffect(() => {
    setupNewGame()
  }, [])

  const setupNewGame = () => {
    console.log("Setting up a fresh game!")

    const freshBoard: GameTile[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      hasBeenStepped: false,
    }))

    const trapPositions = new Set<number>()

    const midGameTraps = [15, 22, 28, 35, 41]
    midGameTraps.forEach((pos) => {
      if (Math.random() > 0.3) trapPositions.add(pos)
    })

    while (trapPositions.size < 10) {
      const pos = Math.floor(Math.random() * 46) + 3
      if (pos !== 49) trapPositions.add(pos)
    }

    trapPositions.forEach((position) => {
      let selectedTrap: TrapType
      const roll = Math.random()

      if (roll < 0.6) {
        selectedTrap = EPIC_TRAPS.filter((t) => t.rarity === "common")[Math.floor(Math.random() * 2)]
      } else if (roll < 0.9) {
        selectedTrap = EPIC_TRAPS.filter((t) => t.rarity === "rare")[Math.floor(Math.random() * 3)]
      } else {
        selectedTrap = EPIC_TRAPS.find((t) => t.rarity === "legendary")!
      }

      freshBoard[position].trap = selectedTrap
    })

    setGameBoard(freshBoard)
  }

  const rollTheDice = () => {
    if (isDiceRolling || isPlayerMoving) return

    setIsDiceRolling(true)
    setShowDiceAnimation(true)
    setGameStats((prev) => ({ ...prev, totalRolls: prev.totalRolls + 1 }))

    let spinCount = 0
    const diceSpinInterval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1)
      spinCount++

      if (spinCount >= 10) {
        clearInterval(diceSpinInterval)
        const finalRoll = Math.floor(Math.random() * 6) + 1
        setDiceValue(finalRoll)
        setShowDiceAnimation(false)

        setTimeout(() => {
          setIsDiceRolling(false)
          handlePlayerMovement(finalRoll)
        }, 400)
      }
    }, 80)
  }

  const handlePlayerMovement = (steps: number) => {
    const currentPlayer = players[currentPlayerIndex]

    if (currentPlayer.skipTurns > 0) {
      const remainingSkips = currentPlayer.skipTurns - 1
      setPlayers((prev) => prev.map((p) => (p.id === currentPlayer.id ? { ...p, skipTurns: remainingSkips } : p)))

      const skipMessage =
        remainingSkips > 0
          ? `${currentPlayer.name} is still stuck! ${remainingSkips} more turn${remainingSkips > 1 ? "s" : ""} to go...`
          : `${currentPlayer.name} breaks free! Next turn you can move again!`

      setGameMessage(skipMessage)
      setTimeout(() => switchToNextPlayer(), 2500)
      return
    }

    setIsPlayerMoving(true)
    setCurrentlyMovingPlayer(currentPlayer.id)
    setGameMessage(`${currentPlayer.name} rolled a ${steps}! Moving...`)

    let currentStep = 0
    const movementInterval = setInterval(() => {
      currentStep++
      const newPos = Math.min(49, currentPlayer.position + currentStep)

      setPlayers((prev) => prev.map((p) => (p.id === currentPlayer.id ? { ...p, position: newPos } : p)))
      setGameBoard((prev) => prev.map((tile) => (tile.id === newPos ? { ...tile, hasBeenStepped: true } : tile)))

      if (currentStep >= steps || newPos >= 49) {
        clearInterval(movementInterval)
        setIsPlayerMoving(false)
        setCurrentlyMovingPlayer(null)

        if (newPos >= 49) {
          handleVictory(currentPlayer)
          return
        }

        setTimeout(() => checkLandingSpot(newPos, currentPlayer), 600)
      }
    }, 350)
  }

  const checkLandingSpot = (position: number, player: Player) => {
    const landedTile = gameBoard[position]

    if (landedTile.trap && !landedTile.isRevealed) {
      handleTrapActivation(landedTile.trap, player, position)
    } else {
      const reaction = PLAYER_REACTIONS.safe_landing[Math.floor(Math.random() * PLAYER_REACTIONS.safe_landing.length)]
      const safeMessage = SAFE_LANDING_MESSAGES[Math.floor(Math.random() * SAFE_LANDING_MESSAGES.length)]

      setGameMessage(`${reaction} ${player.name}: "${safeMessage}"`)

      const nearbyTraps = [position - 1, position + 1].filter(
        (pos) => pos >= 0 && pos < 50 && gameBoard[pos]?.trap && !gameBoard[pos]?.isRevealed,
      )

      if (nearbyTraps.length > 0) {
        setPlayers((prev) => prev.map((p) => (p.id === player.id ? { ...p, luckyEscapes: p.luckyEscapes + 1 } : p)))
        setTimeout(() => {
          setGameMessage(`${player.name} just barely avoided a trap! Lucky! 🍀`)
        }, 1500)
      }

      setTimeout(() => switchToNextPlayer(), 2000)
    }
  }

  const handleTrapActivation = (trap: TrapType, player: Player, position: number) => {
    setGameBoard((prev) => prev.map((tile) => (tile.id === position ? { ...tile, isRevealed: true } : tile)))

    const trapEffect = trap.effect(player)
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === player.id
          ? {
              ...p,
              ...trapEffect,
              trapsHit: p.trapsHit + 1,
            }
          : p,
      ),
    )

    setGameStats((prev) => ({ ...prev, totalTrapsHit: prev.totalTrapsHit + 1 }))

    const reaction = PLAYER_REACTIONS.hit_trap[Math.floor(Math.random() * PLAYER_REACTIONS.hit_trap.length)]
    const funnyMsg = trap.funnyMessages[Math.floor(Math.random() * trap.funnyMessages.length)]

    setGameMessage(`${reaction} ${player.name} hit ${trap.name}! ${funnyMsg}`)

    setTimeout(() => switchToNextPlayer(), 3500)
  }

  const handleVictory = (winningPlayer: Player) => {
    setWinner(winningPlayer)
    const reaction = PLAYER_REACTIONS.winning[Math.floor(Math.random() * PLAYER_REACTIONS.winning.length)]
    setGameMessage(`${reaction} ${winningPlayer.name} WINS! What a legend!`)

    console.log(`Game ${gameStats.gameNumber} complete! Winner: ${winningPlayer.name}`)
  }

  const switchToNextPlayer = () => {
    const nextIndex = (currentPlayerIndex + 1) % players.length
    setCurrentPlayerIndex(nextIndex)
    setGameMessage(`${players[nextIndex].name}'s turn! Roll for glory! 🎲`)
    
    setIsOnCooldown(true)
    setTimeout(() => {
      setIsOnCooldown(false)
    }, 5000)
  }

  const handleNewGameClick = () => {
    const gameInProgress = players.some((p) => p.position > 0) || gameStats.totalRolls > 0

    if (gameInProgress && !winner) {
      setShowNewGameConfirm(true)
    } else {
      confirmNewGame()
    }
  }

  const confirmNewGame = () => {
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        position: 0,
        skipTurns: 0,
        frozen: false,
        trapsHit: 0,
        luckyEscapes: 0,
      })),
    )

    setCurrentPlayerIndex(0)
    setWinner(null)
    setGameMessage("🎮 Fresh start! Player 1, show us what you've got!")
    setGameStats((prev) => ({ ...prev, gameNumber: prev.gameNumber + 1 }))
    setShowNewGameConfirm(false)
    setIsOnCooldown(false) 

    setupNewGame()
  }

  const cancelNewGame = () => {
    setShowNewGameConfirm(false)
  }

  const CurrentDiceIcon = DICE_FACES[diceValue - 1]

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <CardHeader>
          <CardTitle className="text-center text-4xl font-bold">🎮 TRAP TRACK ULTIMATE 🎮</CardTitle>
          <p className="text-center text-lg opacity-90">
            Roll the dice, dodge the traps, claim the victory!
            <br />
            <span className="text-sm">
              Game #{gameStats.gameNumber} • {gameStats.totalRolls} rolls • {gameStats.totalTrapsHit} traps triggered
            </span>
          </p>
        </CardHeader>
      </Card>

      {showNewGameConfirm && (
        <Card className="border-4 border-red-400 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <AlertTriangle className="w-12 h-12 text-red-500" />
              </div>
              <div className="text-xl font-bold text-red-700">Hold up! 🛑</div>
              <div className="text-gray-700">
                Are you sure you want to start a new game? This will reset all progress and you'll lose the current
                game!
              </div>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={confirmNewGame}
                  variant="destructive"
                  className="px-6 py-2 font-bold hover:scale-105 transition-transform"
                >
                  ✅ Yes, New Game!
                </Button>
                <Button
                  onClick={cancelNewGame}
                  variant="outline"
                  className="px-6 py-2 font-bold hover:scale-105 transition-transform bg-transparent"
                >
                  ❌ Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-lg font-semibold">{gameMessage}</div>
            <Button
              onClick={handleNewGameClick}
              variant="outline"
              className="hover:scale-105 transition-transform bg-transparent"
              disabled={isDiceRolling || isPlayerMoving}
            >
              🔄 New Game
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {players.map((player, index) => (
              <div
                key={player.id}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  index === currentPlayerIndex
                    ? "border-yellow-400 bg-yellow-50 shadow-lg scale-105 animate-pulse"
                    : "border-gray-200"
                } ${currentlyMovingPlayer === player.id ? "bg-green-50 border-green-400" : ""}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-5 h-5 rounded-full ${player.color} ${
                      currentlyMovingPlayer === player.id ? "animate-bounce" : ""
                    } border-2 border-white shadow-md`}
                  />
                  <span className="font-bold">{player.name}</span>
                  {index === currentPlayerIndex && !isPlayerMoving && (
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
                  )}
                </div>

                <div className="text-sm space-y-1">
                  <div>📍 Position: {player.position + 1}/50</div>
                  <div className="flex gap-2 flex-wrap">
                    {player.skipTurns > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        ⏸️ Skip {player.skipTurns}
                      </Badge>
                    )}
                    {player.trapsHit > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        🪤 {player.trapsHit} traps
                      </Badge>
                    )}
                    {player.luckyEscapes > 0 && (
                      <Badge variant="outline" className="text-xs">
                        🍀 {player.luckyEscapes} lucky
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center mb-6">
            {!winner && (
              <div className="flex flex-col items-center gap-3">
                <Button
                  onClick={rollTheDice}
                  disabled={isDiceRolling || isPlayerMoving || isOnCooldown}
                  size="lg"
                  className={`flex items-center gap-3 text-lg px-8 py-4 transition-all duration-300 ${
                    showDiceAnimation ? "scale-110 rotate-12" : ""
                  } hover:scale-105 active:scale-95`}
                >
                  <CurrentDiceIcon className={`w-8 h-8 ${isDiceRolling || showDiceAnimation ? "animate-spin" : ""}`} />
                  {isDiceRolling ? "🎲 Rolling..." : isPlayerMoving ? "🏃 Moving..." : isOnCooldown ? "⏳ Wait..." : "🎲 ROLL DICE!"}
                </Button>

                {!isDiceRolling && !isPlayerMoving && !isOnCooldown && (
                  <div className="text-center">
                    <div className="text-sm text-gray-600 animate-pulse">
                      {players[currentPlayerIndex].name}'s moment of truth!
                    </div>
                  </div>
                )}
                
                {isOnCooldown && (
                  <div className="text-center">
                    <div className="text-sm text-orange-600 animate-pulse">
                      ⏳ Please wait 5 seconds before next roll...
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-center bg-gray-100 rounded-lg p-3">
            <div className="text-sm font-medium">
              🕵️ Hidden Traps: {gameBoard.filter((tile) => tile.trap && !tile.isRevealed).length} • 💥 Discovered:{" "}
              {gameBoard.filter((tile) => tile.trap && tile.isRevealed).length} • 🎯 Total Tiles: 50
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-10 gap-1 max-w-5xl mx-auto">
            {gameBoard.map((tile, index) => {
              const playersHere = players.filter((p) => p.position === index)
              const isCurrentPlayerHere = players[currentPlayerIndex]?.position === index
              const hasHiddenTrap = tile.trap && !tile.isRevealed
              const hasRevealedTrap = tile.trap && tile.isRevealed
              const hasBeenVisited = tile.hasBeenStepped

              return (
                <div
                  key={tile.id}
                  className={`
                    aspect-square border-2 rounded-lg flex flex-col items-center justify-center text-xs font-medium 
                    transition-all duration-300 relative overflow-hidden
                    ${isCurrentPlayerHere ? "border-yellow-400 bg-yellow-100 shadow-lg ring-2 ring-yellow-300" : "border-gray-300"}
                    ${hasHiddenTrap ? "bg-gray-200 hover:bg-gray-300" : ""}
                    ${hasRevealedTrap && tile.trap?.rarity === "legendary" ? "bg-black text-white animate-pulse" : ""}
                    ${hasRevealedTrap && tile.trap?.rarity === "rare" ? "bg-red-200 border-red-400" : ""}
                    ${hasRevealedTrap && tile.trap?.rarity === "common" ? "bg-orange-100 border-orange-300" : ""}
                    ${hasBeenVisited && !hasRevealedTrap ? "bg-blue-50" : ""}
                    ${index === 0 ? "bg-green-200 border-green-400 ring-2 ring-green-300" : ""}
                    ${index === 49 ? "bg-yellow-200 border-yellow-400 ring-2 ring-yellow-300" : ""}
                  `}
                >
                  <div className="text-xs text-gray-500 mb-1 font-bold">{index + 1}</div>

                  <div className="flex flex-wrap gap-1 justify-center mb-1">
                    {playersHere.map((player) => (
                      <div
                        key={player.id}
                        className={`w-4 h-4 rounded-full ${player.color} border-2 border-white shadow-lg transition-all duration-300 ${
                          currentlyMovingPlayer === player.id ? "animate-bounce scale-125" : ""
                        } ${
                          player.id === players[currentPlayerIndex]?.id && !isPlayerMoving
                            ? "ring-2 ring-blue-400 ring-offset-1"
                            : ""
                        }`}
                      />
                    ))}
                  </div>

                  {hasRevealedTrap && tile.trap && (
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-5 h-5 rounded-full ${tile.trap.color} flex items-center justify-center text-white shadow-md`}
                      >
                        {tile.trap.icon}
                      </div>
                      {tile.trap.rarity === "legendary" && <div className="text-xs text-yellow-300 font-bold">★</div>}
                    </div>
                  )}

                  {hasHiddenTrap && <div className="w-2 h-2 bg-gray-500 rounded-full opacity-60" />}

                  {index === 0 && <div className="text-xs font-bold text-green-700">START</div>}
                  {index === 49 && <div className="text-xs font-bold text-yellow-700">🏁 WIN!</div>}

                  {hasBeenVisited && !hasRevealedTrap && !hasHiddenTrap && index !== 0 && index !== 49 && (
                    <div className="absolute bottom-1 right-1 text-xs opacity-30">👣</div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {winner && (
        <Card className="border-4 border-yellow-400 bg-gradient-to-r from-yellow-100 to-orange-100">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4 animate-bounce">🏆</div>
            <div className="text-3xl font-bold mb-2 text-yellow-800">{winner.name} IS THE CHAMPION!</div>
            <div className="text-lg text-gray-700 mb-4">
              🎯 Final Position: {winner.position + 1}/50 • 🪤 Traps Hit: {winner.trapsHit} • 🍀 Lucky Escapes:{" "}
              {winner.luckyEscapes}
            </div>
            <div className="space-y-2 mb-4">
              <div className="text-sm text-gray-600">
                "Victory belongs to the most persevering!" - Napoleon (probably)
              </div>
            </div>
            <Button
              onClick={confirmNewGame}
              size="lg"
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-8 py-3 hover:scale-105 transition-transform"
            >
              🎮 PLAY AGAIN! 🎮
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
