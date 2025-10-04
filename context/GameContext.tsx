import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { GameState, RoomOptions, ActionType } from '../engine/types';
import { createNewRoom, startHand, playerAction, advanceStreet, distributePots, selectWinner, selectMultipleWinners } from '../engine/gameEngine';

type GameAction =
  | { type: 'CREATE_ROOM'; options: RoomOptions }
  | { type: 'START_HAND' }
  | { type: 'PLAYER_ACTION'; playerId: string; action: ActionType; amount?: number }
  | { type: 'ADVANCE_STREET' }
  | { type: 'DISTRIBUTE_POTS'; results: { potId: string; winners: string[] }[] }
  | { type: 'SELECT_WINNER'; winnerId: string }
  | { type: 'SELECT_MULTIPLE_WINNERS'; winnerIds: string[] };

function gameReducer(state: GameState | null, action: GameAction): GameState | null {
  switch (action.type) {
    case 'CREATE_ROOM':
      return createNewRoom(action.options);
    case 'START_HAND':
      return state ? startHand(state) : null;
    case 'PLAYER_ACTION':
      return state ? playerAction(state, action.playerId, action.action, action.amount) : null;
    case 'ADVANCE_STREET':
      return state ? advanceStreet(state) : null;
    case 'DISTRIBUTE_POTS':
      return state ? distributePots(state, action.results) : null;
    case 'SELECT_WINNER':
      return state ? selectWinner(state, action.winnerId) : null;
    case 'SELECT_MULTIPLE_WINNERS':
      return state ? selectMultipleWinners(state, action.winnerIds) : null;
    default:
      return state;
  }
}

const GameContext = createContext<{
  state: GameState | null;
  dispatch: React.Dispatch<GameAction>;
} | null>(null);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, null);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};