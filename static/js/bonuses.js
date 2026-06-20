// `max`      = maximum times this bonus can be applied per round (across all players).
//              Set to `null` or omit to remove the limit.
// `label_en` = English label (label = Spanish default).
const BASE_BONUSES = [
    { label: '🟣🟢🟡 14',               label_en: '🟣🟢🟡 14',                    value: 10,  max: 3 },
    { label: '⚫ 14',                    label_en: '⚫ 14',                          value: 20,  max: 1 },
    { label: '🧜🏻‍♀️ Sirena capturada',   label_en: '🧜🏻‍♀️ Mermaid captured',        value: 20,  max: 2 },
    { label: '🏴‍☠️ Pirata capturado',    label_en: '🏴‍☠️ Pirate captured',           value: 30,  max: 6 },
    { label: '☠️👑 Skull King capturado', label_en: '☠️👑 Skull King captured',      value: 40,  max: 1 },
    { label: '💰 Botín',                 label_en: '💰 Loot',                        value: 20,  max: 2 },
];

const EXPANSION_BONUSES = [
    { label: '🏴‍☠️👊🏻 Kon capturado',         label_en: '🏴‍☠️👊🏻 Kon captured',       value: 30,  max: 1 },
    { label: '8️⃣ +5',                          label_en: '8️⃣ +5',                      value: 5,   max: 4 },
    { label: '7️⃣ −5',                          label_en: '7️⃣ −5',                      value: -5,  max: 4 },
    { label: '🦑 Monstruo marino asesinado',    label_en: '🦑 Sea monster killed',       value: 20,  max: 3 },
];
