(function () {
    const TRANSLATIONS = {
        es: {
            // Nav
            nav_home: 'Inicio',
            nav_new_game: 'Nueva partida',
            nav_history: 'Historial',
            nav_stats: 'Estadísticas',
            nav_players: 'Jugadores',
            // Index
            page_home_title: 'Bienvenido al marcador de Skull King',
            active_games: 'Partidas en curso',
            continue_btn: 'Continuar',
            delete_btn: 'Borrar',
            no_active_games: 'No hay partidas en curso.',
            new_game_btn: '+ Nueva partida',
            registered_players: 'Jugadores registrados',
            no_players_home: 'Todavía no hay jugadores. Añádelos al crear una partida o desde la sección de Jugadores.',
            manage_players: 'Gestionar jugadores',
            expansion_badge: 'Expansión',
            game_meta_players: '{n} jugadores',
            game_meta_rounds: '{n} rondas',
            // New game
            page_new_game: 'Nueva partida',
            players_section: 'Jugadores',
            tap_group_hint: 'Toca un grupo para seleccionar a sus jugadores directamente.',
            select_individually_hint: 'O selecciona jugadores individualmente.',
            no_saved_players: 'Todavía no hay jugadores guardados, añade sus nombres abajo.',
            add_new_players_label: 'Añadir jugadores nuevos (separados por comas)',
            add_new_players_ph: 'Ej: Ana, Luis, Marta',
            settings_section: 'Configuración',
            num_rounds_label: 'Número de rondas',
            expansion_checkbox: 'Jugamos con la expansión',
            create_game_btn: 'Crear partida',
            max_players_warning: 'Según las reglas oficiales el máximo es 8 jugadores.',
            // History
            page_history: 'Historial de partidas',
            game_rounds: '{n} rondas',
            player_col: 'Jugador',
            total_points_col: 'Puntos totales',
            view_details: 'Ver detalle',
            no_finished_games: 'Todavía no hay partidas finalizadas.',
            // Stats
            page_stats: 'Estadísticas de jugadores',
            games_col: 'Partidas',
            wins_col: 'Victorias',
            avg_col: 'Media por partida',
            no_stats: 'Todavía no hay datos suficientes. Termina alguna partida para ver estadísticas.',
            bid_accuracy: 'Precisión de apuestas',
            best_game: 'Mejor partida',
            sort_by: 'Ordenar por',
            no_group_stats: 'Crea grupos y termina partidas con todos sus miembros para ver estadísticas de grupo.',
            no_group_data: 'No hay partidas con todos los miembros del grupo.',
            group_mode_all: 'Todas las partidas',
            group_mode_shared: 'Solo partidas juntos',
            total_rounds: 'Rondas jugadas',
            total_bonus_pts: 'Bonus totales',
            max_bid_ever: 'Apuesta máxima',
            voided_rounds: 'Rondas anuladas',
            score_history: 'Historial de puntuaciones',
            zero_bid_title: 'Apuesta a 0',
            zero_bid_good: '🐢 Todo un maestro del 0. La seguridad ante todo.',
            zero_bid_ok: '⚖️ Cuando apuestas a 0 te la juegas… y a veces sale.',
            zero_bid_bad: '💀 El 0 no es lo tuyo. Mejor apuesta algo.',
            bid_accuracy_title: 'Precisión por apuesta',
            round_accuracy_title: 'Precisión por ronda',
            extreme_rounds: 'Mejor y peor ronda',
            best_round_label: 'Mejor ronda',
            worst_round_label: 'Peor ronda',
            fun_facts: 'Curiosidades',
            top_bid_label: 'Apuesta favorita',
            archetype_label: 'Arquetipo',
            archetype_captain: '⚔️ El Capitán — ambicioso y certero',
            archetype_gambler: '🎲 El Apostador — sueña en grande, falla en grande',
            archetype_sniper: '🎯 El Francotirador — conservador pero letal',
            archetype_survivor: '🐢 El Superviviente — poquito y a veces ni eso',
            overbid_fact: 'Te quedaste corto {n} veces (apostaste de más)',
            underbid_fact: 'Conseguiste más de lo apostado {n} veces',
            best_round_slot: 'Tu ronda favorita es la {n} ({pct}% de acierto)',
            max_bid_fact: '¡Llegaste a apostar {n}! Menudo valor',
            // Players
            page_players: 'Jugadores',
            player_name_ph: 'Nombre del jugador',
            add_btn: 'Añadir',
            name_col: 'Nombre',
            no_players: 'No hay jugadores todavía.',
            groups_section: 'Grupos',
            groups_hint: 'Crea grupos habituales para entrar directamente con ellos al crear una partida.',
            name_field: 'Nombre',
            N_players_group: '{n} jugador(es)',
            save_btn: 'Guardar',
            delete_group_btn: 'Borrar grupo',
            create_group_summary: '+ Crear grupo',
            group_name_ph: 'Ej: Noche de juegos',
            create_group_btn: 'Crear grupo',
            // Game — save status
            save_pending: 'Cambios sin guardar…',
            save_saving: 'Guardando…',
            save_saved: 'Guardado ✓',
            save_error: 'Error al guardar',
            // Game — round form
            step1_title: 'Paso 1 de 2 · Apuestas',
            step2_title: 'Paso 2 de 2 · Bazas conseguidas y bonus',
            back_to_bids: '← Volver a apuestas',
            bids_counter: 'Apuestas: {total} / {available}',
            bid_label: 'Apuesta',
            tricks_label: 'Bazas conseguidas',
            bonus_label: 'Bonus: {sign}{total}',
            reset_bonus: 'Reiniciar bonus',
            next_tricks: 'Siguiente: bazas y bonus →',
            next_round: 'Siguiente ronda ›',
            finish_game: 'Finalizar partida',
            reopen_game: 'Reabrir partida',
            expansion_bonuses: 'Bonus de expansión',
            bid_summary: 'Apuesta: {n}',
            // Game — navigation
            prev_round_btn: '‹ Anterior',
            next_round_btn: 'Siguiente ›',
            round_N_of_M: 'Ronda {n} de {total}',
            // Game — views
            game_finished: '🏁 Partida finalizada',
            current_round_tab: 'Ronda actual',
            standings_tab: 'Clasificación',
            no_scores_yet: 'Todavía no hay puntuaciones registradas.',
            scoreboard_title: 'Marcador',
            tap_round_hint: 'Toca una ronda para ver el detalle.',
            progress_title: 'Progreso por ronda',
            standings_title: 'Clasificación',
            round_col: 'Ronda',
            total_row: 'Total',
            detail_bid: 'apuesta',
            detail_tricks: 'bazas',
            detail_bonus: 'bonus',
            detail_voided: '(anulada)',
            no_data: 'sin datos',
            loot_pick_partner: '¿Con quién comparte el Botín?',
            cancel_btn: 'Cancelar',
            // History
            game_label: 'Partida',
            // Confirms
            confirm_delete_game: '¿Borrar esta partida?',
            confirm_delete_player: '¿Borrar a {name}?',
            confirm_delete_group: '¿Borrar el grupo {name}?',
            confirm_finish_game: '¿Finalizar la partida? Podrás reabrirla después si lo necesitas.',
            // Standings note
            standings_after_round: 'Después de la ronda {n} de {total}.',
        },
        en: {
            nav_home: 'Home',
            nav_new_game: 'New game',
            nav_history: 'History',
            nav_stats: 'Statistics',
            nav_players: 'Players',
            page_home_title: 'Welcome to the Skull King Scoreboard',
            active_games: 'Active games',
            continue_btn: 'Continue',
            delete_btn: 'Delete',
            no_active_games: 'No active games.',
            new_game_btn: '+ New game',
            registered_players: 'Registered players',
            no_players_home: 'No players yet. Add them when creating a game or from the Players section.',
            manage_players: 'Manage players',
            expansion_badge: 'Expansion',
            game_meta_players: '{n} players',
            game_meta_rounds: '{n} rounds',
            page_new_game: 'New game',
            players_section: 'Players',
            tap_group_hint: 'Tap a group to select its players.',
            select_individually_hint: 'Or select players individually.',
            no_saved_players: 'No saved players yet, add their names below.',
            add_new_players_label: 'Add new players (comma-separated)',
            add_new_players_ph: 'E.g.: Ana, Luis, Marta',
            settings_section: 'Settings',
            num_rounds_label: 'Number of rounds',
            expansion_checkbox: 'Play with the expansion',
            create_game_btn: 'Create game',
            max_players_warning: 'According to the official rules, the maximum is 8 players.',
            page_history: 'Game history',
            game_rounds: '{n} rounds',
            player_col: 'Player',
            total_points_col: 'Total points',
            view_details: 'View details',
            no_finished_games: 'No finished games yet.',
            page_stats: 'Player statistics',
            games_col: 'Games',
            wins_col: 'Wins',
            avg_col: 'Avg per game',
            no_stats: 'Not enough data yet. Finish a game to see statistics.',
            bid_accuracy: 'Bid accuracy',
            best_game: 'Best game',
            sort_by: 'Sort by',
            no_group_stats: 'Create groups and finish games with all their members to see group statistics.',
            no_group_data: 'No games found with all group members.',
            group_mode_all: 'All games',
            group_mode_shared: 'Shared games only',
            total_rounds: 'Rounds played',
            total_bonus_pts: 'Total bonuses',
            max_bid_ever: 'Highest bid',
            voided_rounds: 'Voided rounds',
            score_history: 'Score history',
            zero_bid_title: 'Bid zero',
            zero_bid_good: '🐢 A true zero master. Safety first.',
            zero_bid_ok: '⚖️ When you bet zero it\'s a gamble… and sometimes it pays off.',
            zero_bid_bad: '💀 Zero is not your thing. Better bid something.',
            bid_accuracy_title: 'Accuracy by bid',
            round_accuracy_title: 'Accuracy by round',
            extreme_rounds: 'Best and worst round',
            best_round_label: 'Best round',
            worst_round_label: 'Worst round',
            fun_facts: 'Fun facts',
            top_bid_label: 'Favourite bid',
            archetype_label: 'Archetype',
            archetype_captain: '⚔️ The Captain — ambitious and accurate',
            archetype_gambler: '🎲 The Gambler — dreams big, fails big',
            archetype_sniper: '🎯 The Sniper — conservative but deadly',
            archetype_survivor: '🐢 The Survivor — plays it safe, still misses',
            overbid_fact: 'Fell short {n} times (overbid)',
            underbid_fact: 'Got more tricks than bid {n} times',
            best_round_slot: 'Favourite round slot: round {n} ({pct}% accuracy)',
            max_bid_fact: 'Once bid {n} — respect.',
            page_players: 'Players',
            player_name_ph: 'Player name',
            add_btn: 'Add',
            name_col: 'Name',
            no_players: 'No players yet.',
            groups_section: 'Groups',
            groups_hint: 'Create regular groups for quick selection when starting a game.',
            name_field: 'Name',
            N_players_group: '{n} player(s)',
            save_btn: 'Save',
            delete_group_btn: 'Delete group',
            create_group_summary: '+ Create group',
            group_name_ph: 'E.g.: Game night',
            create_group_btn: 'Create group',
            save_pending: 'Unsaved changes…',
            save_saving: 'Saving…',
            save_saved: 'Saved ✓',
            save_error: 'Save error',
            step1_title: 'Step 1 of 2 · Bids',
            step2_title: 'Step 2 of 2 · Tricks & bonuses',
            back_to_bids: '← Back to bids',
            bids_counter: 'Bids: {total} / {available}',
            bid_label: 'Bid',
            tricks_label: 'Tricks won',
            bonus_label: 'Bonus: {sign}{total}',
            reset_bonus: 'Reset bonuses',
            next_tricks: 'Next: tricks & bonuses →',
            next_round: 'Next round ›',
            finish_game: 'End game',
            reopen_game: 'Reopen game',
            expansion_bonuses: 'Expansion bonuses',
            bid_summary: 'Bid: {n}',
            prev_round_btn: '‹ Previous',
            next_round_btn: 'Next ›',
            round_N_of_M: 'Round {n} of {total}',
            game_finished: '🏁 Game finished',
            current_round_tab: 'Current round',
            standings_tab: 'Standings',
            no_scores_yet: 'No scores recorded yet.',
            scoreboard_title: 'Scoreboard',
            tap_round_hint: 'Tap a round to see the details.',
            progress_title: 'Progress by round',
            standings_title: 'Standings',
            round_col: 'Round',
            total_row: 'Total',
            detail_bid: 'bid',
            detail_tricks: 'tricks',
            detail_bonus: 'bonus',
            detail_voided: '(voided)',
            no_data: 'no data',
            loot_pick_partner: 'Who shares the Loot with?',
            cancel_btn: 'Cancel',
            game_label: 'Game',
            confirm_delete_game: 'Delete this game?',
            confirm_delete_player: 'Delete {name}?',
            confirm_delete_group: 'Delete group {name}?',
            confirm_finish_game: 'End the game? You can reopen it later if needed.',
            standings_after_round: 'After round {n} of {total}.',
        },
    };

    let lang = localStorage.getItem('skull_lang') || 'es';

    function t(key, vars) {
        const dict = TRANSLATIONS[lang] || TRANSLATIONS.es;
        let str = dict[key] ?? TRANSLATIONS.es[key] ?? key;
        if (!vars) return str;
        return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : ''));
    }

    function applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach((el) => {
            el.textContent = t(el.dataset.i18n);
        });
        document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
            el.placeholder = t(el.dataset.i18nPh);
        });
        document.querySelectorAll('[data-i18n-meta="game_meta"]').forEach((el) => {
            const players = el.dataset.players;
            const rounds = el.dataset.rounds;
            const expansion = el.dataset.expansion === 'True' || el.dataset.expansion === '1';
            let text = t('game_meta_players', { n: players }) + ' · ' + t('game_meta_rounds', { n: rounds });
            if (expansion) text += ' · ' + t('expansion_badge');
            el.textContent = text;
        });
        document.querySelectorAll('[data-i18n-meta="game_rounds"]').forEach((el) => {
            el.textContent = t('game_rounds', { n: el.dataset.rounds });
        });
        document.querySelectorAll('[data-i18n-meta="group_players"]').forEach((el) => {
            el.textContent = t('N_players_group', { n: el.dataset.count });
        });
        document.querySelectorAll('form[data-confirm-key]:not([data-confirm-wired])').forEach((form) => {
            form.dataset.confirmWired = '1';
            form.addEventListener('submit', (e) => {
                const msg = t(form.dataset.confirmKey, { name: form.dataset.confirmName || '' });
                if (!confirm(msg)) e.preventDefault();
            });
        });
    }

    function setLang(newLang) {
        lang = newLang;
        localStorage.setItem('skull_lang', lang);
        applyTranslations();
        document.querySelectorAll('.lang-toggle').forEach((btn) => {
            btn.textContent = lang === 'es' ? 'EN' : 'ES';
        });
        window.dispatchEvent(new CustomEvent('langchange'));
    }

    document.addEventListener('DOMContentLoaded', () => {
        applyTranslations();
        document.querySelectorAll('.lang-toggle').forEach((btn) => {
            btn.textContent = lang === 'es' ? 'EN' : 'ES';
            btn.addEventListener('click', () => setLang(lang === 'es' ? 'en' : 'es'));
        });
    });

    window.SkullKingI18n = { t, lang: () => lang, setLang };
})();
