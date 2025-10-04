import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGame } from '../context/GameContext';

const SetupScreen: React.FC = () => {
  const navigation = useNavigation();
  const { dispatch } = useGame();
  const [numPlayers, setNumPlayers] = useState(3);
  const [playerNames, setPlayerNames] = useState(['Alice', 'Bob', 'Charlie']);
  const [initialChips, setInitialChips] = useState('1000');
  const [smallBlind, setSmallBlind] = useState('5');
  const [bigBlind, setBigBlind] = useState('10');
  const [tableName, setTableName] = useState('Poker Table');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');

  const handleNumPlayersChange = (num: number) => {
    setNumPlayers(num);
    setPlayerNames(prev => {
      const newNames = [...prev];
      while (newNames.length < num) newNames.push(`Player ${newNames.length + 1}`);
      return newNames.slice(0, num);
    });
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    setPlayerNames(prev => prev.map((n, i) => i === index ? name : n));
  };

  const handleCreate = () => {
    const options = {
      tableName,
      playerNames,
      initialChips: parseInt(initialChips) || 1000,
      smallBlind: parseInt(smallBlind) || 5,
      bigBlind: parseInt(bigBlind) || 10,
    };
    dispatch({ type: 'CREATE_ROOM', options });
    (navigation as any).navigate('Game');
  };

  const handleRenamePress = () => {
    setNewTableName(tableName);
    setShowRenameModal(true);
  };

  const handleRenameConfirm = () => {
    if (newTableName.trim()) {
      setTableName(newTableName.trim());
    }
    setShowRenameModal(false);
    setNewTableName('');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{tableName}</Text>
          <TouchableOpacity style={styles.editButton} onPress={handleRenamePress}>
            <Text style={styles.editButtonText}>✏️</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Number of Players: {numPlayers}</Text>
        <View style={styles.buttonRow}>
          {[2, 3, 4, 5, 6].map(num => (
            <TouchableOpacity
              key={num}
              style={[styles.numButton, num === numPlayers && styles.selected]}
              onPress={() => handleNumPlayersChange(num)}
            >
              <Text style={styles.buttonText}>{num}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Player Names:</Text>
        {playerNames.map((name, index) => (
          <TextInput
            key={index}
            style={styles.input}
            value={name}
            onChangeText={(text) => handlePlayerNameChange(index, text)}
            placeholder={`Player ${index + 1}`}
          />
        ))}

        <Text style={styles.label}>Initial Chips:</Text>
        <TextInput
          style={styles.input}
          value={initialChips}
          onChangeText={setInitialChips}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Small Blind:</Text>
        <TextInput
          style={styles.input}
          value={smallBlind}
          onChangeText={setSmallBlind}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Big Blind:</Text>
        <TextInput
          style={styles.input}
          value={bigBlind}
          onChangeText={setBigBlind}
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.createButton} onPress={handleCreate}>
          <Text style={styles.buttonText}>Start Game</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showRenameModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename Table</Text>
            <TextInput
              style={styles.renameInput}
              value={newTableName}
              onChangeText={setNewTableName}
              placeholder="Enter table name"
              maxLength={20}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowRenameModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleRenameConfirm}
              >
                <Text style={styles.buttonText}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made By Mohit 😎</Text>
      </View>
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
    padding: 20,
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  editButton: {
    marginLeft: 10,
    padding: 5,
  },
  editButtonText: {
    fontSize: 20,
  },
  label: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  numButton: {
    backgroundColor: '#3282b8',
    padding: 10,
    margin: 5,
    borderRadius: 5,
    minWidth: 40,
    alignItems: 'center',
  },
  selected: {
    backgroundColor: '#bbe1fa',
  },
  input: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#3282b8',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
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
    marginBottom: 20,
  },
  renameInput: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 5,
    fontSize: 16,
    marginBottom: 20,
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
  footerText: {
    color: '#ffffff',
    fontSize: 14,
    marginBottom: 'auto',
    fontWeight:'bold',
    textAlign: 'center',
  },
});

export default SetupScreen;