# Apple Math Munch 🍎

A fun and addictive browser-based puzzle game where you match apples to sum up to 10! Test your quick math skills and strategic thinking while racing against time.

## Features

- Simple and intuitive gameplay
- Touch and mouse support
- Responsive design for all devices
- Progressive Web App (PWA) support
- Local high score tracking
- Smooth animations and effects
- Debug mode for testing

## How to Play

1. Draw rectangles to select apples
2. Selected apples must sum to 10
3. Each successful match gives you points equal to the number of apples matched
4. You have 3 minutes to score as high as possible
5. Game ends when time runs out

## Getting Started

### Prerequisites

- Node.js (v12 or higher)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/apple-math-munch.git
   cd apple-math-munch
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Game

1. Start the server:
   ```bash
   npm start
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

### Development Mode

To access debug features, add `?debug` to the URL: 
http://localhost:3000/?debug

This will enable:
- Show Tip button
- Auto Solve feature
- Auto Run mode

## Technical Details

- Built with vanilla JavaScript
- Uses HTML5 Canvas for rendering
- Express.js for serving the game
- Responsive CSS Grid layout
- Service Worker for offline support

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers with touch support

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.