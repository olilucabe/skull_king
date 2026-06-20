# Skull King · Scoreboard

Web-based scoreboard for the **Skull King** card game, built with Flask and SQLite. Supports multiple simultaneous games, player groups, bonuses with per-round limits, tie-aware standings, and round-winner tracking.

## Features

- Player management with custom colours
- Quick-select groups for fast game setup
- Automatic scoring per round (bids, tricks, and bonuses)
- Bonuses with a configurable maximum per round (edit `static/js/bonuses.js`)
- Bid counter and Kraken button in the tricks phase
- Round-winner star (manual or automatic)
- Live standings with correct tie handling (1st, 1st, 3rd…)
- Game history and per-player statistics
- Mobile-first responsive design
- Autosave on every change

## Installation

```bash
git clone https://github.com/olilucabe/skull_king.git
cd skull_king
pip install -r requirements.txt
```

## Configuration

Copy `.env.example` to `.env` and edit the values:

```bash
cp .env.example .env
```

| Variable     | Default                 | Description                          |
|--------------|-------------------------|--------------------------------------|
| `SECRET_KEY` | `skull-king-dev-secret` | Flask secret key (change this!)      |
| `HOST`       | `0.0.0.0`               | Network interface                    |
| `PORT`       | `5000`                  | Server port                          |
| `DEBUG`      | `false`                 | Flask debug mode                     |

## Running

```bash
python app.py
```

The database is created automatically on first run. Access the app from any device on the same network at `http://<server-IP>:5000`.

## Project structure

```
skull_king/
├── app.py              # Flask routes and main logic
├── db.py               # SQLite connection and colour palette
├── scoring.py          # Score calculation
├── schema.sql          # Database schema
├── static/
│   ├── css/style.css
│   └── js/
│       ├── bonuses.js  # Bonus definitions (edit max values here)
│       ├── colorpicker.js
│       └── game.js     # Client-side game logic
└── templates/          # Jinja2 templates
```

## Customising bonuses

Edit `static/js/bonuses.js` to adjust bonus values and per-round limits:

```js
{ label: '☠️👑 Skull King captured', value: 40, max: 1 }
//                                               ^^^
//              max times this bonus can be applied per round (all players combined)
// Set max: null to remove the limit
```
