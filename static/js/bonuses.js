// `max` = número máximo de veces que este bonus se puede añadir por ronda
// (entre todos los jugadores). Pon `null` o quítalo para no limitarlo.
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
