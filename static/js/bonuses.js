// `max` = maximum times this bonus can be applied per round (across all players).
// Set to `null` or omit to remove the limit.
const BASE_BONUSES = [
    { label: '🟣🟢🟡 14', value: 10, max: 3 },
    { label: '⚫ 14', value: 20, max: 1 },
    { label: '🧜🏻‍♀️ Sirena capturada', value: 20, max: 2 },
    { label: '🏴‍☠️ Pirata capturado', value: 30, max: 6 },
    { label: '☠️👑 Skull King capturado', value: 40, max: 1 },
    { label: '💰 Botín', value: 20, max: 2 },
];

const EXPANSION_BONUSES = [
    { label: '🏴‍☠️👊🏻 Kon capturado', value: 30, max: 1 },
    { label: '8️⃣ +5', value: 5, max: 4 },
    { label: '7️⃣ −5', value: -5, max: 4 },
    { label: '🦑 Monstruo marino asesinado', value: 20, max: 3 },
];
