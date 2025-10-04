import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { useGame } from '../context/GameContext';

interface ShowdownScreenProps {
  onClose: () => void;
}

const ShowdownScreen: React.FC<ShowdownScreenProps> = ({ onClose }) => {
  const { state, dispatch } = useGame();
  const [selectedWinners, setSelectedWinners] = useState<string[]>([]);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  const activePlayers = state ? state.players.filter(p => !p.folded) : [];

  const handleToggleWinner = (winnerId: string) => {
    setSelectedWinners(prev =>
      prev.includes(winnerId)
        ? prev.filter(id => id !== winnerId)
        : [...prev, winnerId]
    );
  };

  const handleConfirmWinners = () => {
    if (selectedWinners.length > 0) {
      // For multiple winners, we need to split the pot
      const potShare = Math.floor((state?.pot || 0) / selectedWinners.length);
      const remainder = (state?.pot || 0) % selectedWinners.length;

      // Create a new state with pot distributed
      const newState = { ...state! };
      selectedWinners.forEach((winnerId, index) => {
        const winner = newState.players.find(p => p.id === winnerId);
        if (winner) {
          winner.chips += potShare;
          if (index < remainder) winner.chips += 1; // Distribute remainder
        }
      });

      newState.pot = 0;
      newState.roundWinners = selectedWinners;
      newState.showdownRequired = false;
      newState.completedRounds += 1;

      // Update chip leader
      const playersByChips = [...newState.players].sort((a, b) => b.chips - a.chips);
      newState.chipLeader = playersByChips[0].id;

      // Update the state (we'll need to modify the context to handle this)
      // For now, let's dispatch individual winner selections
      // Actually, let's modify the gameEngine to handle multiple winners
      dispatch({ type: 'SELECT_MULTIPLE_WINNERS', winnerIds: selectedWinners });
      onClose();
    }
  };

  const selectedWinnersText = selectedWinners.length === 0
    ? 'Select Winner(s)'
    : selectedWinners.length === 1
      ? activePlayers.find(p => p.id === selectedWinners[0])?.name || 'Unknown'
      : `${selectedWinners.length} Winners Selected`;

  const pokerHands = [
    {
      rank: 1,
      name: 'Royal Flush 👑',
      cards: 'A♥ K♥ Q♥ J♥ 10♥',
      description: 'The highest possible straight flush — ace-high, all same suit.'
    },
    {
      rank: 2,
      name: 'Straight Flush 🌊',
      cards: '9♠ 8♠ 7♠ 6♠ 5♠',
      description: 'Five consecutive cards of the same suit.'
    },
    {
      rank: 3,
      name: 'Four of a Kind 🍀',
      cards: '3♣ 3♦ 3♠ 3♥ + any card',
      description: 'Four cards of the same rank.'
    },
    {
      rank: 4,
      name: 'Full House 🏠',
      cards: '3♦ 3♠ 3♥ + 7♣ 7♦',
      description: 'Three of a kind plus a pair.'
    },
    {
      rank: 5,
      name: 'Flush 💧',
      cards: 'J♥ 10♥ 7♥ 4♥ 2♥',
      description: 'Any five cards of the same suit, not in sequence.'
    },
    {
      rank: 6,
      name: 'Straight ➡️',
      cards: '10♠ 9♥ 8♠ 7♦ 6♣',
      description: 'Five consecutive cards of mixed suits.'
    },
    {
      rank: 7,
      name: 'Three of a Kind ☘️',
      cards: '7♠ 7♣ 7♦ + 2 random cards',
      description: 'Three cards of the same rank.'
    },
    {
      rank: 8,
      name: 'Two Pair ✌️',
      cards: 'Q♦ Q♠ + 3♣ 3♠ + any card',
      description: 'Two different pairs.'
    },
    {
      rank: 9,
      name: 'One Pair 👯‍♀️',
      cards: 'K♥ K♠ + 3 random cards',
      description: 'Two cards of the same rank.'
    },
    {
      rank: 10,
      name: 'High Card 🦅',
      cards: 'A♠ + 4 random cards',
      description: 'When no other hand is made, the highest card plays.'
    }
  ];


  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Poker Hands Ranking</Text>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {pokerHands.map((hand) => (
          <View key={hand.rank} style={styles.handCard}>
            <View style={styles.handHeader}>
              <Text style={styles.rankNumber}>{hand.rank}.</Text>
              <Text style={styles.handName}>{hand.name}</Text>
            </View>
            <Text style={styles.handCards}>{hand.cards}</Text>
            <Text style={styles.handDescription}>{hand.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Winner Selection */}
      <View style={styles.winnerSection}>
        <Text style={styles.winnerLabel}>Select Winner(s):</Text>
        <View style={styles.dropdownContainer}>
          <TouchableOpacity
            style={styles.winnerDropdown}
            onPress={() => setShowWinnerModal(true)}
          >
            <Text style={styles.winnerDropdownText}>{selectedWinnersText}</Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addWinnerButton}
            onPress={() => setShowWinnerModal(true)}
          >
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.confirmButton, selectedWinners.length === 0 && styles.disabledButton]}
          onPress={handleConfirmWinners}
          disabled={selectedWinners.length === 0}
        >
          <Text style={styles.confirmButtonText}>
            Award Pot (${state?.pot || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Winner Selection Modal */}
      <Modal visible={showWinnerModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Winner</Text>
            <ScrollView style={styles.playerList}>
              {activePlayers.map(player => (
                <TouchableOpacity
                  key={player.id}
                  style={[
                    styles.playerOption,
                    selectedWinners.includes(player.id) && styles.selectedPlayerOption
                  ]}
                  onPress={() => handleToggleWinner(player.id)}
                >
                  <Text style={styles.playerOptionText}>{player.name}</Text>
                  {selectedWinners.includes(player.id) && (
                    <Text style={styles.playerOptionText}>✓</Text>)}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowWinnerModal(false)}
            >
              <Text style={styles.cancelButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f4c75',
    padding: 30,
  },
  closeButton: {
    position: 'absolute',
    top: 64,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 36,
    marginBottom: 20,
  },
  scrollContainer: {
    flex: 1,
    marginBottom: 20,
  },
  handCard: {
    backgroundColor: '#1b262c',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#3282b8',
  },
  handHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rankNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffdd00',
    marginRight: 10,
    minWidth: 30,
  },
  handName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  handCards: {
    fontSize: 18,
    color: '#bbe1fa',
    fontWeight: 'bold',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  handDescription: {
    fontSize: 14,
    color: '#bbe1fa',
    lineHeight: 20,
  },
  winnerSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#3282b8',
    backgroundColor: '#1b262c',
  },
  winnerLabel: {
    fontSize: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  winnerDropdown: {
    flexDirection: 'row',
    width: '80%',
    justifyContent: 'space-between',
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: '#3282b8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  winnerDropdownText: {
    fontSize: 16,
    color: '#ffffff',
  },
  dropdownArrow: {
    fontSize: 16,
    color: '#ffffff',
  },
  confirmButton: {
    backgroundColor: '#3282b8',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1b262c',
    borderRadius: 30,
    padding: 10,
    width: '80%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 20,
  },
  playerList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  playerOption: {
    backgroundColor: '#3282b8',
    padding: 20,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerOptionText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#666',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 18,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedPlayerOption: {
    backgroundColor: '#4CAF50',
  },
  addWinnerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3282b8',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
});

export default ShowdownScreen;
