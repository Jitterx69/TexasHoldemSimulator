export type Street = 'preflop' | 'flop' | 'turn' | 'river';

export type ActionType = 'fold' | 'call' | 'check' | 'bet' | 'raise' | 'allin';

export interface Player {
  id: string;
  name: string;
  seat: number;
  chips: number;
  currentBet: number; // Current bet this round
  totalBet: number; // Total bet across all rounds in this hand
  folded: boolean;
  allIn: boolean;
  holeCards: string[]; // Two hole cards
  actedThisRound: boolean; // Whether player has acted in current betting round
}

export interface Action {
  type: ActionType;
  playerId: string;
  amount?: number;
  timestamp: number;
}

export interface SidePot {
  id: string;
  amount: number;
  eligiblePlayerIds: string[];
}

export interface GameState {
  roomId: string;
  tableName: string;
  players: Player[];
  dealerSeat: number;
  smallBlind: number;
  bigBlind: number;
  pot: number; // total across main + side pots
  sidePots: SidePot[];
  currentBet: number; // highest bet this round
  lastRaiseAmount: number; // for min raise calculation
  currentPlayerSeat: number | null;
  street: Street;
  communityCards: string[]; // community cards for hand evaluation
  deck: string[]; // remaining deck
  handHistory: Action[];
  handActive: boolean;
  roundWinners: string[]; // player IDs who won the current round
  completedRounds: number; // number of completed rounds
  chipLeader: string | null; // player ID with highest chips
  showdownRequired: boolean; // whether showdown modal should be shown
}

export interface RoomOptions {
  tableName: string;
  playerNames: string[];
  initialChips: number;
  smallBlind: number;
  bigBlind: number;
}