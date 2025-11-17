## Bulls & Cows (Pure HTML/CSS/JS)

A retro Game Boy–inspired version of Bulls & Cows implemented with only `demo.html`, `demo.css`, and `demo.js`. The UI features a power toggle, mode selection (YOU vs. AI), animated splash screen, on-screen keypad, and AI feedback panel.

### Getting Started
1. Clone or download the project.
2. Open `demo.html` directly in a modern browser (Chrome, Edge, Firefox, or Safari). No build step is required.

### Gameplay
#### YOU Mode
1. Power on → Press Start → select **YOU**.
2. Enter a 3-digit number (digits 1–9, no repeats, no zeros) using the keypad or keyboard.
3. Submit guesses; green `+` = bull, orange `-` = cow, `•` = no match.
4. You have 7 lives; hitting zero reveals the secret number.

#### AI Mode
1. Power on → Press Start → select **AI**.
2. Enter your secret 3-digit number (same rules).
3. AI will guess; provide Bulls/Cows feedback via the inputs and Submit.
4. Each wrong attempt costs the AI one life; if it runs out, you win.

### Controls & Shortcuts
- **Power ON/OFF**: toggles console.
- **Start**: begin/reset current mode once powered.
- **Keypad / Keyboard**: enter digits 1–9.
- **Enter**: submit guess.
- **Delete**: remove last digit.
- **Directions Panel**: quick tips on the right side of the layout.

### Project Structure
```
demo.html   # Markup & layout
demo.css    # Retro-styled theme
demo.js     # Game logic, animations, AI logic
open.png / close.png  # Pac-Man intro frames
README.md
```

### Customization Ideas
- Swap Pac-Man splash or keypad textures.
- Adjust colors/fonts in `demo.css`.
- Replace or expand Directions panel content.
