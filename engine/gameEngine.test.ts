import {
  createNewRoom,
  startHand,
  playerAction,
  advanceStreet,
  selectWinner,
  selectMultipleWinners,
  distributePots,
  validateAction
} from './gameEngine';
import { GameState, RoomOptions } from './types';

describe('Game Engine Unit Tests', () => {
  let roomOptions: RoomOptions;
  let gameState: GameState;

  beforeEach(() => {
    roomOptions = {
      tableName: 'Test Table',
      playerNames: ['Alice', 'Bob', 'Charlie'],
      initialChips: 1000,
      smallBlind: 5,
      bigBlind: 10,
      rakePercentage: 0.05
    };
    gameState = createNewRoom(roomOptions);
  });

  describe('createNewRoom', () => {
    test('creates a valid game state', () => {
      expect(gameState.roomId).toBeDefined();
      expect(gameState.players).toHaveLength(3);
      expect(gameState.players[0].chips).toBe(1000);
      expect(gameState.smallBlind).toBe(5);
      expect(gameState.bigBlind).toBe(10);
      expect(gameState.blindLevel).toBe(1);
    });
  });

  describe('startHand', () => {
    test('starts a hand correctly', () => {
      const newState = startHand(gameState);
      expect(newState.handActive).toBe(true);
      expect(newState.deck).toHaveLength(52 - 6); // 3 players * 2 cards
      expect(newState.players[0].holeCards).toHaveLength(2);
      expect(newState.pot).toBe(15); // 5 + 10
    });

    test('throws error with less than 2 players', () => {
      const singlePlayerOptions: RoomOptions = {
        tableName: 'Test',
        playerNames: ['Alice'],
        initialChips: 1000,
        smallBlind: 5,
        bigBlind: 10
      };
      const singlePlayerState = createNewRoom(singlePlayerOptions);
      expect(() => startHand(singlePlayerState)).toThrow('Need at least 2 players');
    });
  });

  describe('playerAction', () => {
    beforeEach(() => {
      gameState = startHand(gameState);
    });

    test('fold action works', () => {
      const currentPlayerId = gameState.players.find(p => p.seat === gameState.currentPlayerSeat!)!.id;
      const newState = playerAction(gameState, currentPlayerId, 'fold');
      expect(newState.players.find(p => p.id === currentPlayerId)!.folded).toBe(true);
    });


    test('raise action works', () => {
      const currentPlayerId = gameState.players.find(p => p.seat === gameState.currentPlayerSeat!)!.id;
      const newState = playerAction(gameState, currentPlayerId, 'raise', 25);
      expect(newState.currentBet).toBe(25);
      expect(newState.lastRaiseAmount).toBe(15); // 25 - 10
    });

    test('call action works', () => {
      const currentPlayerId = gameState.players.find(p => p.seat === gameState.currentPlayerSeat!)!.id;
      const newState = playerAction(gameState, currentPlayerId, 'call');
      const player = newState.players.find(p => p.id === currentPlayerId)!;
      expect(player.currentBet).toBe(newState.currentBet);
    });

    test('all-in action works', () => {
      const currentPlayerId = gameState.players.find(p => p.seat === gameState.currentPlayerSeat!)!.id;
      const playerChips = gameState.players.find(p => p.id === currentPlayerId)!.chips;
      const newState = playerAction(gameState, currentPlayerId, 'allin');
      const player = newState.players.find(p => p.id === currentPlayerId)!;
      expect(player.allIn).toBe(true);
      expect(player.chips).toBe(0);
    });
  });

  describe('validateAction', () => {
    beforeEach(() => {
      gameState = startHand(gameState);
    });

    test('validates fold action', () => {
      const currentPlayerId = gameState.players.find(p => p.seat === gameState.currentPlayerSeat!)!.id;
      expect(validateAction(gameState, currentPlayerId, 'fold')).toBeNull();
    });

    test('rejects invalid bet amount', () => {
      const currentPlayerId = gameState.players.find(p => p.seat === gameState.currentPlayerSeat!)!.id;
      expect(validateAction(gameState, currentPlayerId, 'bet', -10)).toBe('Invalid amount');
    });

    test('rejects check when facing bet', () => {
      // Make a bet first
      const currentPlayerId = gameState.players.find(p => p.seat === gameState.currentPlayerSeat!)!.id;
      gameState = playerAction(gameState, currentPlayerId, 'bet', 20);
      const nextPlayerId = gameState.players.find(p => p.seat === gameState.currentPlayerSeat!)!.id;
      expect(validateAction(gameState, nextPlayerId, 'check')).toBe('Cannot check when facing a bet');
    });
  });

  describe('advanceStreet', () => {
    beforeEach(() => {
      gameState = startHand(gameState);
      // Have all players act and complete the round
      gameState.players.forEach(p => {
        p.actedThisRound = true;
        p.currentBet = gameState.bigBlind;
      });
      gameState.currentBet = gameState.bigBlind;
      gameState.currentPlayerSeat = null; // Round complete
    });

    test('advances from preflop to flop', () => {
      const newState = advanceStreet(gameState);
      expect(newState.street).toBe('flop');
      expect(newState.communityCards).toHaveLength(3);
    });
  });


  describe('selectWinner and selectMultipleWinners', () => {
    test('selectWinner awards pot correctly', () => {
      gameState.pot = 100;
      const winnerId = gameState.players[0].id;
      const newState = selectWinner(gameState, winnerId);
      expect(newState.players[0].chips).toBe(1000 + 95); // 100 - 5% rake
      expect(newState.pot).toBe(0);
    });

    test('selectMultipleWinners splits pot correctly', () => {
      gameState.pot = 100;
      const winnerIds = [gameState.players[0].id, gameState.players[1].id];
      const newState = selectMultipleWinners(gameState, winnerIds);
      expect(newState.players[0].chips).toBe(1000 + 48); // 95 / 2 = 47.5, first gets 48
      expect(newState.players[1].chips).toBe(1000 + 47);
    });
  });
});