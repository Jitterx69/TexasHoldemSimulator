import { GameState, Player, RoomOptions, ActionType, Street } from './types';

export function validateAction(state: GameState, playerId: string, action: ActionType, amount?: number): string | null {
  if (!state.handActive) return 'No active hand';
  if (state.currentPlayerSeat === null) return 'No current player';
  const player = state.players.find(p => p.id === playerId);
  if (!player) return 'Player not found';
  if (player.folded) return 'Player has folded';
  if (player.allIn) return 'Player is all-in';
  const currentPlayer = state.players.find(p => p.seat === state.currentPlayerSeat);
  if (currentPlayer?.id !== playerId) return 'Not your turn';

  if ((action === 'bet' || action === 'raise') && (!amount || amount <= 0 || !Number.isInteger(amount))) {
    return 'Invalid amount';
  }

  if (action === 'check' && player.currentBet < state.currentBet) {
    return 'Cannot check when facing a bet';
  }

  if (action === 'bet' && state.currentBet > 0) {
    return 'Cannot bet when there is already a bet';
  }

  if (action === 'raise') {
    const minRaise = state.currentBet + Math.max(state.lastRaiseAmount, state.bigBlind);
    if (amount! < minRaise) return `Raise must be at least ${minRaise}`;
  }

  if (action === 'call') {
    const callAmount = Math.min(state.currentBet - player.currentBet, player.chips);
    if (callAmount < 0) return 'Invalid call amount';
  }

  return null; // Valid
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function createDeck(): string[] {
  const suits = ['h', 'd', 'c', 's']; // hearts, diamonds, clubs, spades
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
  const deck: string[] = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push(rank + suit);
    }
  }
  return shuffleDeck(deck);
}

function shuffleDeck(deck: string[]): string[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function dealHoleCards(state: GameState, deck: string[]): { newState: GameState; remainingDeck: string[] } {
  const newState = { ...state };
  newState.players = newState.players.map(p => ({ ...p, holeCards: [] }));

  let currentDeck = [...deck];

  // Deal 2 cards to each player
  for (let cardIndex = 0; cardIndex < 2; cardIndex++) {
    for (const player of newState.players) {
      if (currentDeck.length > 0) {
        player.holeCards.push(currentDeck.shift()!);
      }
    }
  }

  return { newState, remainingDeck: currentDeck };
}

function dealCommunityCards(state: GameState, deck: string[], count: number): { newState: GameState; remainingDeck: string[] } {
  const newState = { ...state };
  let currentDeck = [...deck];

  for (let i = 0; i < count; i++) {
    if (currentDeck.length > 0) {
      newState.communityCards.push(currentDeck.shift()!);
    }
  }

  return { newState, remainingDeck: currentDeck };
}

export function createNewRoom(options: RoomOptions): GameState {
  const players: Player[] = options.playerNames.map((name, index) => ({
    id: generateId(),
    name,
    seat: index,
    chips: options.initialChips,
    currentBet: 0,
    totalBet: 0,
    folded: false,
    allIn: false,
    holeCards: [],
    actedThisRound: false,
  }));

  return {
    roomId: generateId(),
    tableName: options.tableName,
    players,
    dealerSeat: 0,
    smallBlind: options.smallBlind,
    bigBlind: options.bigBlind,
    rakePercentage: options.rakePercentage || 0,
    blindLevel: 1,
    pot: 0,
    sidePots: [],
    currentBet: 0,
    lastRaiseAmount: 0,
    currentPlayerSeat: null,
    street: 'preflop',
    communityCards: [],
    deck: createDeck(),
    handHistory: [],
    handActive: false,
    roundWinners: [],
    completedRounds: 0,
    chipLeader: null,
    showdownRequired: false,
  };
}

export function startHand(state: GameState): GameState {
  if (state.handActive) return state;
  if (state.players.length < 2) {
    throw new Error('Need at least 2 players to start a hand');
  }

  const newState = { ...state, handActive: true, handHistory: [], communityCards: [], deck: createDeck(), street: 'preflop' as Street, roundWinners: [] };

  newState.players = newState.players.map(p => ({
    ...p,
    currentBet: 0,
    totalBet: 0,
    folded: false,
    allIn: false,
    holeCards: [],
    actedThisRound: false,
  }));

  newState.dealerSeat = (newState.dealerSeat + 1) % newState.players.length;

  // Deal hole cards
  const { newState: stateWithHoleCards, remainingDeck } = dealHoleCards(newState, newState.deck);
  newState.players = stateWithHoleCards.players;
  newState.deck = remainingDeck;

  const isHeadsUp = newState.players.length === 2;
  const sbSeat = isHeadsUp ? newState.dealerSeat : (newState.dealerSeat + 1) % newState.players.length;
  const bbSeat = isHeadsUp ? (newState.dealerSeat + 1) % newState.players.length : (newState.dealerSeat + 2) % newState.players.length;

  const sbPlayer = newState.players.find(p => p.seat === sbSeat)!;
  const bbPlayer = newState.players.find(p => p.seat === bbSeat)!;

  // Validate blind amounts
  if (sbPlayer.chips < newState.smallBlind || bbPlayer.chips < newState.bigBlind) {
    // Not enough chips for blinds - this shouldn't happen in a proper game setup
    throw new Error('Not enough chips for blinds');
  }

  sbPlayer.chips -= newState.smallBlind;
  sbPlayer.currentBet = newState.smallBlind;
  sbPlayer.totalBet = newState.smallBlind;
  sbPlayer.actedThisRound = false; // SB can complete if needed

  bbPlayer.chips -= newState.bigBlind;
  bbPlayer.currentBet = newState.bigBlind;
  bbPlayer.totalBet = newState.bigBlind;
  bbPlayer.actedThisRound = false; // BB has the option to check/raise

  newState.pot = newState.smallBlind + newState.bigBlind;
  newState.currentBet = newState.bigBlind;
  newState.lastRaiseAmount = newState.bigBlind;

  // In heads-up, action starts with the button (SB)
  newState.currentPlayerSeat = isHeadsUp ? sbSeat : (bbSeat + 1) % newState.players.length;

  return newState;
}

export function playerAction(state: GameState, playerId: string, action: ActionType, amount?: number): GameState {
  const validationError = validateAction(state, playerId, action, amount);
  if (validationError) return state;

  const player = state.players.find(p => p.id === playerId);
  if (!player || player.folded || player.allIn) return state;

  const currentPlayer = state.players.find(p => p.seat === state.currentPlayerSeat)!;
  if (currentPlayer.id !== playerId) return state;

  const newState = { ...state };
  newState.players = newState.players.map(p => ({ ...p }));

  const currentPlayerCopy = newState.players.find(p => p.seat === newState.currentPlayerSeat)!;

  let betAmount = 0;
  let isRaise = false;

  switch (action) {
    case 'fold':
      currentPlayerCopy.folded = true;
      break;
    case 'check':
      if (currentPlayerCopy.currentBet < newState.currentBet) {
        return state; // Cannot check when facing a bet
      }
      break;
    case 'call':
      betAmount = Math.min(newState.currentBet - currentPlayerCopy.currentBet, currentPlayerCopy.chips);
      break;
    case 'bet':
      if (newState.currentBet > 0) return state;
      const totalBetAmount = amount || 0;
      if (totalBetAmount < newState.bigBlind) return state;
      betAmount = totalBetAmount; // This is what we're adding to the pot
      if (betAmount > currentPlayerCopy.chips) return state;
      newState.currentBet = totalBetAmount;
      newState.lastRaiseAmount = totalBetAmount;
      break;
    case 'raise':
      const minRaise = newState.currentBet + Math.max(newState.lastRaiseAmount, newState.bigBlind);
      const raiseTotalAmount = amount || 0;
      if (raiseTotalAmount < minRaise || raiseTotalAmount <= newState.currentBet) return state;

      betAmount = raiseTotalAmount - currentPlayerCopy.currentBet; // Additional chips needed
      if (betAmount > currentPlayerCopy.chips) return state;

      newState.lastRaiseAmount = raiseTotalAmount - newState.currentBet;
      newState.currentBet = raiseTotalAmount;
      break;
    case 'allin':
      betAmount = currentPlayerCopy.chips;
      if (betAmount > 0) {
        currentPlayerCopy.allIn = true;
        const totalBet = currentPlayerCopy.currentBet + betAmount;
        const minRaise = newState.currentBet + Math.max(newState.lastRaiseAmount, newState.bigBlind);
        if (totalBet >= minRaise) {
          // All-in is a legal raise
          isRaise = true;
          const oldCurrentBet = newState.currentBet;
          newState.currentBet = totalBet;
          newState.lastRaiseAmount = totalBet - oldCurrentBet;
        } else if (totalBet > newState.currentBet) {
          // All-in is more than current bet but less than min raise - still raises but doesn't reopen action fully
          newState.currentBet = totalBet;
          // Don't update lastRaiseAmount since it's not a full raise
        }
        // If totalBet <= currentBet, it's just a call
      }
      break;
  }

  // Validate that player has enough chips
  if (betAmount > currentPlayerCopy.chips) return state;

  currentPlayerCopy.chips -= betAmount;
  currentPlayerCopy.currentBet += betAmount;
  currentPlayerCopy.totalBet += betAmount;
  currentPlayerCopy.actedThisRound = true;
  newState.pot += betAmount;

  // If this was a bet, raise, or legal all-in raise, reset actedThisRound for all other active players
  const isLegalRaise = action === 'raise' || action === 'bet' || (action === 'allin' && isRaise);
  if (isLegalRaise) {
    newState.players.forEach(p => {
      if (!p.folded && !p.allIn && p.id !== playerId) {
        p.actedThisRound = false;
      }
    });
  }

  newState.handHistory.push({
    type: action,
    playerId,
    amount: betAmount,
    timestamp: Date.now(),
    street: newState.street,
    pot: newState.pot
  });

  newState.currentPlayerSeat = getNextActivePlayerSeat(newState);

  return newState;
}

function getNextActivePlayerSeat(state: GameState): number | null {
  const activePlayers = state.players.filter(p => !p.folded && !p.allIn);

  // If all non-folded players are all-in, betting is complete
  const nonFoldedPlayers = state.players.filter(p => !p.folded);
  if (nonFoldedPlayers.every(p => p.allIn) || nonFoldedPlayers.length === 1) return null;

  if (activePlayers.length <= 1) return null;

  // Round is complete when ALL active players have:
  // 1. Acted this round AND
  // 2. Matched the current bet
  const allActed = activePlayers.every(p => p.actedThisRound);
  const allMatched = activePlayers.every(p => p.currentBet === state.currentBet);

  if (allActed && allMatched) {
    return null; // Betting round complete
  }

  // Find next player who needs to act OR hasn't matched the bet
  let seat = state.currentPlayerSeat!;
  for (let i = 0; i < state.players.length; i++) {
    seat = (seat + 1) % state.players.length;
    const player = state.players.find(p => p.seat === seat);
    if (player && !player.folded && !player.allIn) {
      // Player needs to act if they haven't acted OR haven't matched the bet
      if (!player.actedThisRound || player.currentBet < state.currentBet) {
        return seat;
      }
    }
  }
  return null;
}

export function advanceStreet(state: GameState): GameState {
  if (!state.handActive || state.currentPlayerSeat !== null) return state;

  const newState = { ...state };
  newState.players = newState.players.map(p => ({ ...p, currentBet: 0, actedThisRound: false }));
  newState.currentBet = 0;
  newState.lastRaiseAmount = 0;
  // Note: totalBet is NOT reset - it persists across streets

  const streets = ['preflop', 'flop', 'turn', 'river'];
  const currentIndex = streets.indexOf(newState.street);
  if (currentIndex < streets.length - 1) {
    newState.street = streets[currentIndex + 1] as Street;

    // Deal community cards
    if (newState.street === 'flop') {
      // Burn 1, deal 3
      newState.deck.shift(); // burn
      const { newState: stateWithFlop, remainingDeck } = dealCommunityCards(newState, newState.deck, 3);
      newState.communityCards = stateWithFlop.communityCards;
      newState.deck = remainingDeck;
    } else if (newState.street === 'turn' || newState.street === 'river') {
      // Burn 1, deal 1
      newState.deck.shift(); // burn
      const { newState: stateWithCard, remainingDeck } = dealCommunityCards(newState, newState.deck, 1);
      newState.communityCards = stateWithCard.communityCards;
      newState.deck = remainingDeck;
    }

    const activePlayers = newState.players.filter(p => !p.folded);
    if (activePlayers.length > 1) {
      // Action starts with first active player to the left of dealer button
      newState.currentPlayerSeat = getFirstActivePlayerAfterDealer(newState);
    } else {
      newState.currentPlayerSeat = null;
      // If only one player remains, they win by default
      if (activePlayers.length === 1) {
        // Deduct rake
        const rake = Math.floor(newState.pot * newState.rakePercentage);
        newState.pot -= rake;
        activePlayers[0].chips += newState.pot;
        newState.pot = 0;
        newState.roundWinners = [activePlayers[0].id];
        newState.completedRounds += 1;
        const playersByChips = [...newState.players].sort((a, b) => b.chips - a.chips);
        newState.chipLeader = playersByChips[0].id;
      }
      newState.handActive = false;
    }
  } else {
    // River betting is complete, require manual showdown
    const activePlayers = newState.players.filter(p => !p.folded);

    if (activePlayers.length > 1) {
      // Multiple players remain, calculate side pots and require manual winner selection
      newState.sidePots = calculateSidePots(newState);
      newState.showdownRequired = true;
    } else if (activePlayers.length === 1) {
      // Single winner - award pot automatically
      activePlayers[0].chips += newState.pot;
      newState.pot = 0;
      newState.roundWinners = [activePlayers[0].id];

      // Increment completed rounds and update chip leader
      newState.completedRounds += 1;
      const playersByChips = [...newState.players].sort((a, b) => b.chips - a.chips);
      newState.chipLeader = playersByChips[0].id;
    }

    newState.handActive = false;
  }

  // Remove busted players (chips <= 0)
  newState.players = newState.players.filter(p => p.chips > 0);

  return newState;
}

function getFirstActivePlayerAfterDealer(state: GameState): number {
  let seat = state.dealerSeat;
  for (let i = 0; i < state.players.length; i++) {
    seat = (seat + 1) % state.players.length;
    const player = state.players.find(p => p.seat === seat);
    if (player && !player.folded) {
      return seat;
    }
  }
  return state.dealerSeat; // fallback
}

export function distributePots(state: GameState, results: { potId: string; winners: string[] }[]): GameState {
  const newState = { ...state };

  for (const result of results) {
    const sidePot = newState.sidePots.find(p => p.id === result.potId);
    if (!sidePot) continue;

    // Deduct rake from this pot
    const rake = Math.floor(sidePot.amount * newState.rakePercentage);
    sidePot.amount -= rake;

    const winners = result.winners.filter(id => sidePot.eligiblePlayerIds.includes(id));
    if (winners.length === 0) continue;

    // Split the pot among winners
    const share = Math.floor(sidePot.amount / winners.length);
    const remainder = sidePot.amount % winners.length;

    winners.forEach((playerId, index) => {
      const player = newState.players.find(p => p.id === playerId);
      if (player) {
        player.chips += share;
        if (index < remainder) player.chips += 1; // Distribute remainder
      }
    });

    sidePot.amount = 0; // Mark as distributed
  }

  // Reset for next hand
  newState.pot = 0;
  newState.sidePots = [];
  newState.handActive = false;

  return newState;
}

// Calculate side pots when players go all-in
function calculateSidePots(state: GameState): { id: string; amount: number; eligiblePlayerIds: string[] }[] {
  const sidePots: { id: string; amount: number; eligiblePlayerIds: string[] }[] = [];
  const allInAmounts = state.players
    .filter(p => p.allIn && !p.folded)
    .map(p => p.totalBet)
    .sort((a, b) => a - b);

  if (allInAmounts.length === 0) return sidePots; // No side pots if no all-ins

  let remainingPot = state.pot;
  let previousAmount = 0;

  for (const amount of allInAmounts) {
    if (amount > previousAmount) {
      const allContributed = state.players.filter(p => p.totalBet >= amount).length;
      const eligiblePlayers = state.players.filter(p => !p.folded && p.totalBet >= amount);
      const potAmount = (amount - previousAmount) * allContributed;
      if (potAmount > 0) {
        sidePots.push({
          id: generateId(),
          amount: potAmount,
          eligiblePlayerIds: eligiblePlayers.map(p => p.id),
        });
        remainingPot -= potAmount;
      }
      previousAmount = amount;
    }
  }

  if (remainingPot > 0) {
    const maxAllInAmount = allInAmounts[allInAmounts.length - 1];
    const mainPotPlayers = state.players.filter(p => !p.folded && p.totalBet >= maxAllInAmount);
    sidePots.push({
      id: generateId(),
      amount: remainingPot,
      eligiblePlayerIds: mainPotPlayers.map(p => p.id),
    });
  }

  return sidePots;
}

export function selectWinner(state: GameState, winnerId: string): GameState {
  const newState = { ...state };

  // Award the entire pot to the selected winner
  const winner = newState.players.find(p => p.id === winnerId);
  if (winner) {
    // Deduct rake
    const rake = Math.floor(newState.pot * newState.rakePercentage);
    newState.pot -= rake;
    winner.chips += newState.pot;
    newState.pot = 0;
    newState.roundWinners = [winnerId];
    newState.showdownRequired = false;

    // Increment completed rounds and update chip leader
    newState.completedRounds += 1;
    const playersByChips = [...newState.players].sort((a, b) => b.chips - a.chips);
    newState.chipLeader = playersByChips[0].id;
  }

  return newState;
}

export function selectMultipleWinners(state: GameState, winnerIds: string[]): GameState {
  const newState = { ...state };

  if (winnerIds.length === 0) return newState;

  // Deduct rake
  const rake = Math.floor(newState.pot * newState.rakePercentage);
  newState.pot -= rake;

  // Split the pot equally among winners
  const potShare = Math.floor(newState.pot / winnerIds.length);
  const remainder = newState.pot % winnerIds.length;

  winnerIds.forEach((winnerId, index) => {
    const winner = newState.players.find(p => p.id === winnerId);
    if (winner) {
      winner.chips += potShare;
      if (index < remainder) winner.chips += 1; // Distribute remainder
    }
  });

  newState.pot = 0;
  newState.roundWinners = winnerIds;
  newState.showdownRequired = false;

  // Increment completed rounds and update chip leader
  newState.completedRounds += 1;
  const playersByChips = [...newState.players].sort((a, b) => b.chips - a.chips);
  newState.chipLeader = playersByChips[0].id;

  return newState;
}
