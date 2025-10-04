import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useGame } from '../context/GameContext';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const { state } = useGame();

  const handleContinue = () => {
    if (state) {
      (navigation as any).navigate('Game');
    }
  };

  const handleCreateNew = () => {
    (navigation as any).navigate('Setup');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Texas Hold'em Simulator</Text>
      {state && (
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue Room</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.button} onPress={handleCreateNew}>
        <Text style={styles.buttonText}>Create New Room</Text>
      </TouchableOpacity>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Made By Mohit 😎</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f4c75',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#3282b8',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: 200,
    alignItems: 'center',
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
  footerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default HomeScreen;
