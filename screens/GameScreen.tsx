import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGame } from '../context/GameContext';
import { ActionType } from '../engine/types';
import ShowdownScreen from './ShowdownScreen';

interface GameScreenProps {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
}

const GameScreen: React.FC<GameScreenProps> = ({ navigation }) => {
  const { state, dispatch } = useGame();
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [showShowdownModal, setShowShowdownModal] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState('');
  const [lastAction, setLastAction] = useState<{ playerName: string; type: 'call' | 'raise'; amount: number } | null>(null);

  if (!state) return null;

  const handleStartHand = () => {
    setLastAction(null);
    dispatch({ type: 'START_HAND' });
  };

  const handleAdvanceStreet = () => {
    setLastAction(null);
    dispatch({ type: 'ADVANCE_STREET' });
  };

  const handleAction = (action: ActionType, playerId: string, amount?: number) => {
    const player = state.players.find(p => p.id === playerId);
    if (player && (action === 'call' || action === 'raise')) {
      let actionAmount = 0;
      if (action === 'call') {
        // For calls, show how much they called (difference from their current bet to the required bet)
        actionAmount = Math.min(state.currentBet - player.currentBet, player.chips);
      } else if (action === 'raise') {
        // For raises, show the raise amount (how much they increased the bet by)
        actionAmount = (amount || 0) - state.currentBet;
      }
      setLastAction({
        playerName: player.name,
        type: action,
        amount: actionAmount
      });
    }
    dispatch({ type: 'PLAYER_ACTION', playerId, action, amount });
  };

  const handleRaisePress = () => {
    if (!currentPlayer) return;
    const minRaise = state.currentBet + state.lastRaiseAmount;
    setRaiseAmount(minRaise.toString());
    setShowRaiseModal(true);
  };

  const handleRaiseConfirm = () => {
    if (!currentPlayer) return;
    const amount = parseInt(raiseAmount);
    const minRaise = state.currentBet + state.lastRaiseAmount;
    const maxRaise = currentPlayer.chips;

    if (amount >= minRaise && amount <= maxRaise) {
      handleAction('raise', currentPlayer.id, amount);
      setShowRaiseModal(false);
      setRaiseAmount('');
    } else {
      Alert.alert('Invalid Amount', `Raise amount must be between ${minRaise} and ${maxRaise}`);
    }
  };

  const adjustRaiseAmount = (delta: number) => {
    const current = parseInt(raiseAmount) || 0;
    const newAmount = Math.max(0, current + delta);
    setRaiseAmount(newAmount.toString());
  };

  const currentPlayer = state.players.find(p => p.seat === state.currentPlayerSeat);

  // Auto-open showdown modal when required
  useEffect(() => {
    if (state.showdownRequired && !showShowdownModal) {
      setShowShowdownModal(true);
    }
  }, [state.showdownRequired, showShowdownModal]);

  // Calculate dynamic card size based on number of players
  const numPlayers = state.players.length;
  const baseCardHeight = 120; // Base height for 3 players (increased from 80)
  const baseFontSize = 24; // Base font size for player name (increased from 18)
  const basePadding = 20; // Base padding (increased from 15)

  // Scale factor: smaller cards for more players
  const scaleFactor = Math.max(0.8, 3 / numPlayers); // Minimum 80% size (increased from 70%)
  const cardHeight = baseCardHeight * scaleFactor;
  const playerNameFontSize = baseFontSize * scaleFactor;
  const playerInfoFontSize = 18 * scaleFactor; // Increased base from 14 to 18
  const statusFontSize = 16 * scaleFactor; // Increased base from 12 to 16
  const cardPadding = basePadding * scaleFactor;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{state.tableName}</Text>

        <View style={styles.gameInfoContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Pot</Text>
            <Text style={styles.infoValue} adjustsFontSizeToFit numberOfLines={1}>{state.pot}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Street</Text>
            <Text style={styles.infoValue} adjustsFontSizeToFit numberOfLines={1}>{state.street.toUpperCase()}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Drift Bet</Text>
            <Text style={styles.infoValue} adjustsFontSizeToFit numberOfLines={1}>{state.currentBet}</Text>
            {lastAction && (
              <Text style={styles.lastActionText}>
                {lastAction.playerName} {lastAction.type === 'call' ? 'called' : 'raised'} {lastAction.amount}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.players}>
          {state.players.map(player => {
            const isRoundWinner = state.roundWinners.includes(player.id);
            const isChipLeader = state.chipLeader === player.id;
            const awards = [];
            if (isRoundWinner) awards.push('👑');
            if (isChipLeader) awards.push('💸');
  
            return (
              <View key={player.id} style={[styles.player, { height: cardHeight, padding: cardPadding }]}>
                <View style={styles.playerNameContainer}>
                  <Text style={[styles.playerName, { fontSize: playerNameFontSize }]}>
                    {awards.join(' ')} {awards.length > 0 ? ' ' : ''}{player.name}
                  </Text>
                  {player.folded && (
                    <Text style={[styles.foldedIndicator, { fontSize: playerNameFontSize }]}>
                      (F)
                    </Text>
                  )}
                </View>
                <Text style={[styles.playerChips, { fontSize: playerInfoFontSize }]}>Chips: {player.chips}</Text>
                <Text style={[styles.playerBet, { fontSize: playerInfoFontSize }]}>Bet: {player.currentBet}</Text>
                {player.allIn && <Text style={[styles.status, { fontSize: statusFontSize }]}>ALL-IN</Text>}
                {state.dealerSeat === player.seat && <Text style={[styles.status, { fontSize: statusFontSize }]}>DEALER</Text>}
              </View>
            );
          })}
        </View>

        {!state.handActive && (
          <TouchableOpacity style={styles.button} onPress={handleStartHand}>
            <Text style={styles.buttonText}>Start New Hand</Text>
          </TouchableOpacity>
        )}

        {state.handActive && state.currentPlayerSeat !== null && currentPlayer && (
          <View style={styles.actions}>
            <Text style={styles.currentPlayer}>{currentPlayer.name}'s turn</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleAction('fold', currentPlayer.id)}>
                <Text style={styles.buttonText}>Fold</Text>
              </TouchableOpacity>
              {state.currentBet === 0 ? (
                <TouchableOpacity style={styles.actionButton} onPress={() => handleAction('check', currentPlayer.id)}>
                  <Text style={styles.buttonText}>Check</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.actionButton} onPress={() => handleAction('call', currentPlayer.id)}>
                  <Text style={styles.buttonText}>Call {state.currentBet - currentPlayer.currentBet}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.actionButton} onPress={handleRaisePress}>
                <Text style={styles.buttonText}>Raise</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleAction('allin', currentPlayer.id)}>
                <Text style={styles.buttonText}>All-in</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {state.handActive && state.currentPlayerSeat === null && (
          <TouchableOpacity style={styles.button} onPress={handleAdvanceStreet}>
            <Text style={styles.buttonText}>Advance to Next Street</Text>
          </TouchableOpacity>
        )}

        <Modal visible={showRaiseModal} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Raise Amount</Text>
              <Text style={styles.modalSubtitle}>
                Min: {state.currentBet + state.lastRaiseAmount} | Max: {currentPlayer?.chips || 0}
              </Text>

              <View style={styles.sliderContainer}>
                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => adjustRaiseAmount(-10)}
                >
                  <Text style={styles.adjustButtonText}>-10</Text>
                </TouchableOpacity>

                <TextInput
                  style={styles.amountInput}
                  value={raiseAmount}
                  onChangeText={setRaiseAmount}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                />

                <TouchableOpacity
                  style={styles.adjustButton}
                  onPress={() => adjustRaiseAmount(10)}
                >
                  <Text style={styles.adjustButtonText}>+10</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowRaiseModal(false)}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleRaiseConfirm}
                >
                  <Text style={styles.buttonText}>Raise</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>

      {/* Showdown Button */}
      <TouchableOpacity
        style={styles.showdownButton}
        onPress={() => setShowShowdownModal(true)}
      >
        <Text style={styles.showdownButtonText}>❓</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made By Mohit 😎</Text>
      </View>

      {/* Showdown Modal */}
      <Modal
        visible={showShowdownModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowShowdownModal(false)}
      >
        <ShowdownScreen onClose={() => setShowShowdownModal(false)} />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f4c75',
  },
  scrollContainer: {
    flex: 1,
    padding: 10,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: -50,
    paddingVertical: 50,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  gameInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#1b262c',
    padding: 20,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center',
    minHeight: 80,
  },
  infoLabel: {
    color: '#bbe1fa',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  lastActionText: {
    color: '#ffdd00',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 5,
  },
  players: {
    marginBottom: 20,
  },
  player: {
    backgroundColor: '#3282b8',
    borderRadius: 8,
    marginBottom: 10,
    justifyContent: 'center',
  },
  playerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  foldedIndicator: {
    color: '#ffdd00',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  playerChips: {
    color: '#bbe1fa',
    fontSize: 14,
  },
  playerBet: {
    color: '#ffffff',
    fontSize: 14,
  },
  status: {
    color: '#ffdd00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#3282b8',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
  },
  actions: {
    backgroundColor: '#1b262c',
    padding: 15,
    borderRadius: 8,
  },
  currentPlayer: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  actionButton: {
    backgroundColor: '#3282b8',
    padding: 10,
    borderRadius: 5,
    minWidth: 70,
    alignItems: 'center',
    margin: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1b262c',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#bbe1fa',
    textAlign: 'center',
    marginBottom: 20,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  adjustButton: {
    backgroundColor: '#3282b8',
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 10,
    minWidth: 50,
    alignItems: 'center',
  },
  adjustButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  amountInput: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 5,
    fontSize: 18,
    textAlign: 'center',
    minWidth: 100,
    marginHorizontal: 10,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  modalButton: {
    padding: 12,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  confirmButton: {
    backgroundColor: '#3282b8',
  },
  showdownButton: {
    position: 'absolute',
    bottom: 60,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3282b8',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  showdownButtonText: {
    color: '#FFFF00',
    fontSize: 24,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: '#0f4c75',
  },
  footerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default GameScreen;