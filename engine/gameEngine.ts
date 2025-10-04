import { GameState, Player, RoomOptions, ActionType, Street } from './types';

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
  // Small blind doesn't get actedThisRound = true (they can complete if needed)

  bbPlayer.chips -= newState.bigBlind;
  bbPlayer.currentBet = newState.bigBlind;
  bbPlayer.totalBet = newState.bigBlind;
  // Big blind doesn't get actedThisRound = true (they have the option to check/raise)

  newState.pot = newState.smallBlind + newState.bigBlind;
  newState.currentBet = newState.bigBlind;
  newState.lastRaiseAmount = newState.bigBlind;

  newState.currentPlayerSeat = (bbSeat + 1) % newState.players.length;

  return newState;
}

export function playerAction(state: GameState, playerId: string, action: ActionType, amount?: number): GameState {
  if (!state.handActive || state.currentPlayerSeat === null) return state;

  const player = state.players.find(p => p.id === playerId);
  if (!player || player.folded || player.allIn) return state;

  const currentPlayer = state.players.find(p => p.seat === state.currentPlayerSeat)!;
  if (currentPlayer.id !== playerId) return state;

  const newState = { ...state };
  newState.players = newState.players.map(p => ({ ...p }));

  const currentPlayerCopy = newState.players.find(p => p.seat === newState.currentPlayerSeat)!;

  let betAmount = 0;

  switch (action) {
    case 'fold':
      currentPlayerCopy.folded = true;
      break;
    case 'check':
      if (newState.currentBet > currentPlayerCopy.currentBet) {
        // Can only check if you've matched the current bet
        // Exception: BB on preflop with no raises and first action
        const isHeadsUp = newState.players.length === 2;
        const bbSeat = isHeadsUp ? (newState.dealerSeat + 1) % newState.players.length : (newState.dealerSeat + 2) % newState.players.length;
        const isBigBlind = currentPlayer.seat === bbSeat;
        const isPreflop = newState.street === 'preflop';
        const noRaises = newState.currentBet === newState.bigBlind;
        const firstAction = !currentPlayerCopy.actedThisRound;

        if (!(isBigBlind && isPreflop && noRaises && firstAction)) {
          return state; // Cannot check
        }
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
        if (totalBet > newState.currentBet) {
          const oldCurrentBet = newState.currentBet;
          newState.currentBet = totalBet;
          newState.lastRaiseAmount = totalBet - oldCurrentBet;
        }
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

  // If this was a bet or raise, reset actedThisRound for all other active players
  if (action === 'raise' || action === 'bet') {
    newState.players.forEach(p => {
      if (!p.folded && !p.allIn && p.id !== playerId) {
        p.actedThisRound = false;
      }
    });
  }

  newState.handHistory.push({ type: action, playerId, amount: betAmount, timestamp: Date.now() });

  newState.currentPlayerSeat = getNextActivePlayerSeat(newState);

  return newState;
}

function getNextActivePlayerSeat(state: GameState): number | null {
  const activePlayers = state.players.filter(p => !p.folded && !p.allIn);
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
      // For post-flop streets, action starts with first active player to the left of dealer button
      if (newState.street !== 'preflop') {
        newState.currentPlayerSeat = getFirstActivePlayerAfterDealer(newState);
      } else {
        // Preflop starts after big blind
        const bbSeat = (newState.dealerSeat + 2) % newState.players.length;
        newState.currentPlayerSeat = (bbSeat + 1) % newState.players.length;
      }
    } else {
      newState.currentPlayerSeat = null;
      // If only one player remains, they win by default
      if (activePlayers.length === 1) {
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
      // Multiple players remain, require manual winner selection
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

  let remainingPot = state.pot;
  let previousAmount = 0;

  for (const amount of allInAmounts) {
    if (amount > previousAmount) {
      const contributingPlayers = state.players.filter(p => !p.folded && p.totalBet >= amount);
      const potAmount = (amount - previousAmount) * contributingPlayers.length;
      if (potAmount > 0) {
        sidePots.push({
          id: generateId(),
          amount: potAmount,
          eligiblePlayerIds: contributingPlayers.map(p => p.id),
        });
        remainingPot -= potAmount;
      }
      previousAmount = amount;
    }
  }

  if (remainingPot > 0) {
    const mainPotPlayers = state.players.filter(p => !p.folded);
    sidePots.push({
      id: generateId(),
      amount: remainingPot,
      eligiblePlayerIds: mainPotPlayers.map(p => p.id),
    });
  }

  return sidePots;
}

// Poker hand evaluation
type HandRank = 'high_card' | 'pair' | 'two_pair' | 'three_of_a_kind' | 'straight' | 'flush' | 'full_house' | 'four_of_a_kind' | 'straight_flush' | 'royal_flush';

interface HandValue {
  rank: HandRank;
  value: number[]; // For tie-breaking
  cards: string[];
}

function evaluateHand(holeCards: string[], communityCards: string[]): HandValue {
  const allCards = [...holeCards, ...communityCards];
  const sortedCards = sortCards(allCards);

  // Check for flush first, then check if flush cards form a straight
  const flush = getFlush(sortedCards);
  if (flush) {
    const flushStraight = getStraight(flush);
    if (flushStraight) {
      if (isRoyalFlush(flushStraight)) {
        return { rank: 'royal_flush', value: [10], cards: flushStraight };
      }
      return { rank: 'straight_flush', value: [getStraightValue(flushStraight)], cards: flushStraight };
    }
    return { rank: 'flush', value: getHighCardValues(flush.slice(0, 5)), cards: flush.slice(0, 5) };
  }

  // Check for straight (not flush)
  const straight = getStraight(sortedCards);
  if (straight) {
    return { rank: 'straight', value: [getStraightValue(straight)], cards: straight };
  }

  const groups = getCardGroups(sortedCards);
  const fourOfAKind = groups.find(g => g.count === 4);
  if (fourOfAKind) {
    const kicker = sortedCards.find(c => getRankValue(c) !== fourOfAKind.rank);
    return { rank: 'four_of_a_kind', value: [fourOfAKind.rank, getRankValue(kicker!)], cards: fourOfAKind.cards.concat(kicker!) };
  }

  const threeOfAKind = groups.find(g => g.count === 3);
  const pairs = groups.filter(g => g.count === 2);
  if (threeOfAKind && pairs.length > 0) {
    return { rank: 'full_house', value: [threeOfAKind.rank, pairs[0].rank], cards: threeOfAKind.cards.concat(pairs[0].cards) };
  }

  if (threeOfAKind) {
    const kickers = sortedCards.filter(c => getRankValue(c) !== threeOfAKind.rank).slice(0, 2);
    return { rank: 'three_of_a_kind', value: [threeOfAKind.rank, ...kickers.map(getRankValue)], cards: threeOfAKind.cards.concat(kickers) };
  }

  if (pairs.length >= 2) {
    const topPairs = pairs.slice(0, 2);
    const kicker = sortedCards.find(c => !topPairs.some(p => p.rank === getRankValue(c)));
    return { rank: 'two_pair', value: [topPairs[0].rank, topPairs[1].rank, getRankValue(kicker!)], cards: topPairs[0].cards.concat(topPairs[1].cards, kicker!) };
  }

  if (pairs.length === 1) {
    const kickers = sortedCards.filter(c => getRankValue(c) !== pairs[0].rank).slice(0, 3);
    return { rank: 'pair', value: [pairs[0].rank, ...kickers.map(getRankValue)], cards: pairs[0].cards.concat(kickers) };
  }

  return { rank: 'high_card', value: getHighCardValues(sortedCards.slice(0, 5)), cards: sortedCards.slice(0, 5) };
}

function sortCards(cards: string[]): string[] {
  return cards.sort((a, b) => getRankValue(b) - getRankValue(a));
}

function getRankValue(card: string): number {
  const rank = card[0];
  const rankMap: { [key: string]: number } = { '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14 };
  return rankMap[rank] || 0;
}

function getFlush(cards: string[]): string[] | null {
  const suitGroups = cards.reduce((acc, card) => {
    const suit = card[1];
    if (!acc[suit]) acc[suit] = [];
    acc[suit].push(card);
    return acc;
  }, {} as { [suit: string]: string[] });

  for (const suit in suitGroups) {
    if (suitGroups[suit].length >= 5) {
      return sortCards(suitGroups[suit]);
    }
  }
  return null;
}

function getStraight(cards: string[]): string[] | null {
  const uniqueRanks = [...new Set(cards.map(c => getRankValue(c)))].sort((a, b) => b - a);
  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    if (uniqueRanks[i] - uniqueRanks[i + 4] === 4) {
      const straightRanks = uniqueRanks.slice(i, i + 5);
      const straightCards = cards.filter(c => straightRanks.includes(getRankValue(c))).slice(0, 5);
      return sortCards(straightCards);
    }
  }
  // Check for A-2-3-4-5 straight
  if (uniqueRanks.includes(14) && uniqueRanks.includes(2) && uniqueRanks.includes(3) && uniqueRanks.includes(4) && uniqueRanks.includes(5)) {
    const lowStraight = cards.filter(c => [14, 2, 3, 4, 5].includes(getRankValue(c))).slice(0, 5);
    return sortCards(lowStraight);
  }
  return null;
}

function isRoyalFlush(cards: string[]): boolean {
  const ranks = cards.slice(0, 5).map(c => getRankValue(c)).sort((a, b) => b - a);
  return ranks[0] === 14 && ranks[1] === 13 && ranks[2] === 12 && ranks[3] === 11 && ranks[4] === 10;
}

function getStraightValue(cards: string[]): number {
  const ranks = cards.map(c => getRankValue(c)).sort((a, b) => b - a);
  // Check for wheel (A-2-3-4-5)
  if (ranks.length === 5 && ranks[0] === 14 && ranks[4] === 2) {
    return 5; // Ace plays low in wheel
  }
  return ranks[0]; // Highest card in straight
}

function getHighCardValues(cards: string[]): number[] {
  return cards.map(c => getRankValue(c));
}

function getCardGroups(cards: string[]) {
  const rankCounts: { [rank: number]: { count: number; cards: string[] } } = {};
  cards.forEach(card => {
    const rank = getRankValue(card);
    if (!rankCounts[rank]) {
      rankCounts[rank] = { count: 0, cards: [] };
    }
    rankCounts[rank].count++;
    rankCounts[rank].cards.push(card);
  });

  return Object.entries(rankCounts)
    .map(([rank, data]) => ({ rank: parseInt(rank), count: data.count, cards: data.cards }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank);
}

function compareHands(hand1: HandValue, hand2: HandValue): number {
  const rankOrder: HandRank[] = ['high_card', 'pair', 'two_pair', 'three_of_a_kind', 'straight', 'flush', 'full_house', 'four_of_a_kind', 'straight_flush', 'royal_flush'];
  const rank1 = rankOrder.indexOf(hand1.rank);
  const rank2 = rankOrder.indexOf(hand2.rank);

  if (rank1 !== rank2) return rank1 - rank2;

  for (let i = 0; i < Math.min(hand1.value.length, hand2.value.length); i++) {
    if (hand1.value[i] !== hand2.value[i]) return hand1.value[i] - hand2.value[i];
  }
  return 0;
}

export function selectWinner(state: GameState, winnerId: string): GameState {
  const newState = { ...state };

  // Award the entire pot to the selected winner
  const winner = newState.players.find(p => p.id === winnerId);
  if (winner) {
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
