# 🃏 Texas Hold'em Poker Simulator

<div align="center">

![Texas Hold'em Poker](https://img.shields.io/badge/Poker-Texas%20Hold'em-blue?style=for-the-badge&logo=game&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

**A complete Texas Hold'em poker game built with React Native & Expo**

[📱 Download APK](#installation) • [🌐 Live Demo](#demo) • [📖 Game Rules](#game-rules) • [🛠️ Tech Stack](#tech-stack)

</div>

---

## 🎯 Overview

**Texas Hold'em Poker Simulator** is a fully-featured, authentic Texas Hold'em poker game that brings the excitement of casino poker to your mobile device. Experience professional-grade poker mechanics with intuitive controls, beautiful UI, and comprehensive game rules.

### ✨ Key Highlights

- 🃏 **Authentic Poker Rules** - Complete Texas Hold'em implementation
- 🎮 **Interactive Gameplay** - Smooth betting rounds and card dealing
- 👥 **Multi-Player Support** - 2-6 players per game
- 🏆 **Manual Winner Selection** - Choose winners with pot splitting
- 📚 **Educational Content** - Built-in poker hand rankings guide
- 📱 **Cross-Platform** - iOS, Android, and Web support
- 🎨 **Beautiful UI** - Modern design with dynamic layouts

---

## 🚀 Features

### 🎴 Game Mechanics
- **Complete Card Dealing** - Proper hole cards and community cards
- **Betting Rounds** - Preflop, Flop, Turn, River with correct action order
- **Hand Evaluation** - All poker hands from Royal Flush to High Card
- **Side Pots** - Automatic handling of all-in situations
- **Blind Structure** - Small blind and big blind rotation

### 🎮 User Experience
- **Intuitive Controls** - Easy-to-use betting interface
- **Visual Feedback** - Clear status indicators and action history
- **Responsive Design** - Adapts to different screen sizes
- **Custom Navigation** - Clean back arrows without default headers
- **Real-time Updates** - Live pot, bet, and player status tracking

### 🏆 Advanced Features
- **Multiple Winner Selection** - Split pots among multiple players
- **Auto Showdown** - Automatic modal opening after river
- **Player Management** - Custom names and chip counts
- **Round Tracking** - Complete game statistics
- **Educational Mode** - Poker hand rankings reference

---

## 📋 Game Rules

### 🎯 Objective
Texas Hold'em is a poker game where players compete for the pot by making the best possible five-card hand using any combination of their two hole cards and the five community cards.

### 🃏 Card Dealing
1. **Pre-Flop**: Each player receives 2 private hole cards
2. **Flop**: 3 community cards are dealt face-up
3. **Turn**: 1 additional community card (total 4)
4. **River**: 1 final community card (total 5)

### 💰 Betting Structure
- **Blinds**: Mandatory bets posted before cards
- **Betting Rounds**: Bet, Call, Raise, Fold, Check (when appropriate)
- **Raise Limits**: Maximum 3 raises per betting round
- **All-In**: Players can go all-in at any time

### 🏆 Hand Rankings (Highest to Lowest)
1. **Royal Flush** 👑 - A, K, Q, J, 10 of same suit
2. **Straight Flush** 🌊 - Five consecutive cards, same suit
3. **Four of a Kind** 🍀 - Four cards of same rank
4. **Full House** 🏠 - Three of a kind + pair
5. **Flush** 💧 - Five cards of same suit
6. **Straight** ➡️ - Five consecutive cards
7. **Three of a Kind** ☘️ - Three cards of same rank
8. **Two Pair** ✌️ - Two different pairs
9. **One Pair** 👯‍♀️ - Two cards of same rank
10. **High Card** 🦅 - Highest single card

---

## 🛠️ Tech Stack

### Core Technologies
- **React Native 0.81.4** - Cross-platform mobile development
- **Expo SDK 54** - Development platform and build tools
- **TypeScript 5.9** - Type-safe JavaScript
- **React Navigation 7** - Navigation and routing

### Key Dependencies
- **@react-navigation/native** - Navigation framework
- **@react-navigation/stack** - Stack navigation
- **@supabase/supabase-js** - Backend services (future use)
- **expo-status-bar** - Status bar customization

### Development Tools
- **ESLint** - Code linting and formatting
- **TypeScript Compiler** - Type checking
- **Expo CLI** - Development and build tools

---

## 📦 Installation

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)

### 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/VersionVex/TexasHoldemSimulator.git
   cd TexasHoldemSimulator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Run on your device**
   - **iOS**: Press `i` in terminal or scan QR code with Camera app
   - **Android**: Press `a` in terminal or scan QR code with Expo Go
   - **Web**: Press `w` in terminal for web browser

### 📱 Mobile Installation

#### For Testing (Expo Go)
1. Install **Expo Go** from App Store / Google Play
2. Scan the QR code shown in terminal after `npm start`

#### For Production Build
```bash
# Build for Android APK
npm run android

# Build for iOS
npm run ios

# Build for Web
npm run web
```

---

## 🎮 How to Play

### 🏁 Getting Started
1. **Launch App** → Welcome screen appears
2. **Tap "Start New Game"** → Game setup screen
3. **Configure Game**:
   - Number of players (2-6)
   - Player names
   - Starting chip stacks
   - Blind amounts

### 🎯 Gameplay Flow
1. **Pre-Flop** → Blinds posted, hole cards dealt, betting begins
2. **Flop** → 3 community cards revealed, betting round
3. **Turn** → 4th community card, betting round
4. **River** → 5th community card, final betting
5. **Showdown** → Winner selection modal appears automatically

### 🎮 Controls
- **Fold** → Surrender hand and current bet
- **Check** → Pass action (when no bet to call)
- **Call** → Match the current bet
- **Raise** → Increase the bet amount
- **All-In** → Bet entire chip stack

### 🏆 Winner Selection
- After river betting completes, showdown modal opens
- Select one or multiple winners using the dropdown
- Pot splits equally among selected players
- Tap "Award Pot" to complete the hand

---

## 📁 Project Structure

```
TexasHoldemSimulator/
├── assets/                 # App icons and images
│   ├── icon.png
│   ├── splash-icon.png
│   └── adaptive-icon.png
├── context/                # React Context for state management
│   └── GameContext.tsx
├── engine/                 # Game logic and poker mechanics
│   ├── gameEngine.ts      # Core game logic
│   └── types.ts           # TypeScript interfaces
├── screens/                # React Native screens
│   ├── HomeScreen.tsx     # Welcome screen
│   ├── SetupScreen.tsx    # Game configuration
│   ├── GameScreen.tsx     # Main poker table
│   └── ShowdownScreen.tsx # Winner selection & hand guide
├── utils/                  # Utility functions
│   └── supabase.ts        # Backend integration (future)
├── App.tsx                # Main app component
├── app.json               # Expo configuration
├── package.json           # Dependencies and scripts
└── tsconfig.json          # TypeScript configuration
```

---

## 🔧 Development

### 🏃‍♂️ Running in Development

```bash
# Install dependencies
npm install

# Start Expo development server
npm start

# Run on specific platform
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web browser
```

### 🧪 Testing

```bash
# Run tests (when implemented)
npm test
```

### 📝 Code Quality

```bash
# Lint code
npx eslint . --ext .ts,.tsx

# Type check
npx tsc --noEmit
```

### 🚀 Building for Production

```bash
# Build for production
npx expo build:android  # Android APK
npx expo build:ios      # iOS IPA
```

---

## 🎨 Screenshots

<div align="center">

### 📱 Mobile Interface
| Home Screen | Game Setup | Poker Table |
|-------------|------------|-------------|
| ![Home](https://via.placeholder.com/200x350/0f4c75/ffffff?text=Home+Screen) | ![Setup](https://via.placeholder.com/200x350/3282b8/ffffff?text=Game+Setup) | ![Game](https://via.placeholder.com/200x350/1b262c/ffffff?text=Poker+Table) |

### 🎮 Game Features
| Winner Selection | Hand Rankings | Betting Interface |
|------------------|---------------|-------------------|
| ![Showdown](https://via.placeholder.com/200x350/4CAF50/ffffff?text=Showdown) | ![Hands](https://via.placeholder.com/200x350/ffdd00/000000?text=Hand+Guide) | ![Betting](https://via.placeholder.com/200x350/3282b8/ffffff?text=Betting) |

</div>

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### 📋 Contribution Guidelines
- Follow the existing code style
- Add TypeScript types for new features
- Test on multiple platforms (iOS, Android, Web)
- Update documentation as needed

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Poker Rules Reference**: Official Texas Hold'em specifications
- **UI Inspiration**: Modern casino and poker app designs
- **React Native Community**: Excellent documentation and support
- **Expo Team**: Outstanding development platform

---

## 📞 Support

If you have questions, issues, or suggestions:

- 🐛 **Bug Reports**: [Open an Issue](https://github.com/VersionVex/TexasHoldemSimulator/issues)
- 💡 **Feature Requests**: [Create a Discussion](https://github.com/VersionVex/TexasHoldemSimulator/discussions)
- 📧 **Contact**: VersionVex

---

<div align="center">

**Enjoy authentic Texas Hold'em poker on your mobile device!** 🃏

**Made with ❤️ by VersionVex**

[⭐ Star this repo](https://github.com/VersionVex/TexasHoldemSimulator) • [🍴 Fork it](https://github.com/VersionVex/TexasHoldemSimulator/fork) • [📖 Read the docs](#)

</div>
