# Skull King · Marcador

Marcador web para el juego de cartas **Skull King**, desarrollado con Flask y SQLite. Soporta múltiples partidas simultáneas, sistema de grupos, bonificaciones con límite por ronda, clasificación con empates y seguimiento del ganador por ronda.

## Características

- Gestión de jugadores con colores personalizados
- Creación de grupos rápidos para selección en partida
- Puntuación automática por ronda (apuestas, bazas y bonus)
- Bonus con límite máximo por ronda (configurable en `static/js/bonuses.js`)
- Contador de apuestas y botón Kraken en fase de bazas
- Estrella de ganador de ronda (manual o automática)
- Clasificación en tiempo real con empates correctos (1º, 1º, 3º…)
- Historial de partidas y estadísticas por jugador
- Diseño responsive optimizado para móvil
- Guardado automático

## Instalación

```bash
git clone https://github.com/olilucabe/skull_king.git
cd skull_king
pip install -r requirements.txt
```

## Configuración

Copia `.env.example` a `.env` y edita los valores:

```bash
cp .env.example .env
```

| Variable     | Por defecto            | Descripción                         |
|--------------|------------------------|-------------------------------------|
| `SECRET_KEY` | `skull-king-dev-secret`| Clave secreta de Flask (¡cámbiala!) |
| `HOST`       | `0.0.0.0`              | Interfaz de red                     |
| `PORT`       | `5000`                 | Puerto del servidor                 |
| `DEBUG`      | `false`                | Modo debug de Flask                 |

## Uso

```bash
python app.py
```

La base de datos se crea automáticamente en el primer arranque. Accede desde cualquier dispositivo en la misma red en `http://<IP-del-servidor>:5000`.

## Estructura

```
skull_king/
├── app.py              # Rutas Flask y lógica principal
├── db.py               # Conexión SQLite y paleta de colores
├── scoring.py          # Cálculo de puntuaciones
├── schema.sql          # Esquema de la base de datos
├── static/
│   ├── css/style.css   # Estilos
│   └── js/
│       ├── bonuses.js  # Definición de bonus (edita aquí los max por ronda)
│       ├── colorpicker.js
│       └── game.js     # Lógica de partida en cliente
└── templates/          # Plantillas Jinja2
```

## Bonus personalizables

Edita `static/js/bonuses.js` para ajustar las bonificaciones y sus límites máximos por ronda:

```js
{ label: '☠️👑 Skull King capturado', value: 40, max: 1 }
//                                                  ^^^
//                           máximo de veces por ronda entre todos los jugadores
// Pon `max: null` para sin límite
```
