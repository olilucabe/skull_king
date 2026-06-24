import os
import re
import sqlite3

from flask import Flask, abort, flash, jsonify, redirect, render_template, request, url_for

import db as db_module
from scoring import compute_score

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

COLOR_RE = re.compile(r'^#[0-9a-fA-F]{6}$')


def assign_color(db):
    count = db.execute('SELECT COUNT(*) AS c FROM players').fetchone()['c']
    return db_module.PLAYER_COLORS[count % len(db_module.PLAYER_COLORS)]


def create_app():
    app = Flask(__name__)
    app.secret_key = os.environ.get('SECRET_KEY', 'skull-king-dev-secret')
    db_module.init_app(app)

    with app.app_context():
        db_module.init_db()

    @app.cli.command('init-db')
    def init_db_command():
        db_module.init_db()
        print('Base de datos inicializada.')

    # ------------------------------------------------------------------
    # Pages
    # ------------------------------------------------------------------

    @app.route('/')
    def index():
        db = db_module.get_db()
        players = db.execute('SELECT * FROM players ORDER BY name').fetchall()
        active_games = db.execute('''
            SELECT g.*, (SELECT COUNT(*) FROM game_players gp WHERE gp.game_id = g.id) AS num_players
            FROM games g
            WHERE finished = 0
            ORDER BY created_at DESC
        ''').fetchall()
        return render_template('index.html', players=players, active_games=active_games)

    @app.route('/players', methods=['GET', 'POST'])
    def players():
        db = db_module.get_db()
        if request.method == 'POST':
            name = request.form.get('name', '').strip()
            if name:
                try:
                    db.execute('INSERT INTO players (name, color) VALUES (?, ?)', (name, assign_color(db)))
                    db.commit()
                except sqlite3.IntegrityError:
                    flash(f'Ya existe un jugador llamado "{name}".', 'error')
            return redirect(url_for('players'))
        players = db.execute('SELECT * FROM players ORDER BY name').fetchall()
        groups = db.execute('SELECT * FROM groups ORDER BY name COLLATE NOCASE').fetchall()
        group_members = {}
        group_member_ids = {}
        for grp in groups:
            members = db.execute('''
                SELECT p.id, p.name, p.color FROM players p
                JOIN group_players gp ON gp.player_id = p.id
                WHERE gp.group_id = ?
                ORDER BY p.name COLLATE NOCASE
            ''', (grp['id'],)).fetchall()
            group_members[grp['id']] = members
            group_member_ids[grp['id']] = [m['id'] for m in members]
        return render_template(
            'players.html', players=players, palette=db_module.PLAYER_COLORS,
            groups=groups, group_members=group_members, group_member_ids=group_member_ids,
        )

    @app.route('/groups', methods=['POST'])
    def create_group():
        db = db_module.get_db()
        name = request.form.get('name', '').strip()
        emoji = request.form.get('emoji', '').strip()[:8] or '🏴‍☠️'
        player_ids = request.form.getlist('player_ids')
        if not name:
            flash('El grupo necesita un nombre.', 'error')
            return redirect(url_for('players'))
        cur = db.execute('INSERT INTO groups (name, emoji) VALUES (?, ?)', (name, emoji))
        group_id = cur.lastrowid
        for pid in player_ids:
            db.execute('INSERT OR IGNORE INTO group_players (group_id, player_id) VALUES (?, ?)', (group_id, pid))
        db.commit()
        return redirect(url_for('players'))

    @app.route('/groups/<int:group_id>/update', methods=['POST'])
    def update_group(group_id):
        db = db_module.get_db()
        name = request.form.get('name', '').strip()
        emoji = request.form.get('emoji', '').strip()[:8] or '🏴‍☠️'
        player_ids = request.form.getlist('player_ids')
        if not name:
            flash('El grupo necesita un nombre.', 'error')
            return redirect(url_for('players'))
        db.execute('UPDATE groups SET name = ?, emoji = ? WHERE id = ?', (name, emoji, group_id))
        db.execute('DELETE FROM group_players WHERE group_id = ?', (group_id,))
        for pid in player_ids:
            db.execute('INSERT OR IGNORE INTO group_players (group_id, player_id) VALUES (?, ?)', (group_id, pid))
        db.commit()
        return redirect(url_for('players'))

    @app.route('/groups/<int:group_id>/delete', methods=['POST'])
    def delete_group(group_id):
        db = db_module.get_db()
        db.execute('DELETE FROM groups WHERE id = ?', (group_id,))
        db.commit()
        return redirect(url_for('players'))

    @app.route('/players/<int:player_id>/delete', methods=['POST'])
    def delete_player(player_id):
        db = db_module.get_db()
        try:
            db.execute('DELETE FROM players WHERE id = ?', (player_id,))
            db.commit()
        except sqlite3.IntegrityError:
            flash('No se puede borrar: el jugador tiene partidas asociadas.', 'error')
        return redirect(url_for('players'))

    @app.route('/players/<int:player_id>/color', methods=['POST'])
    def set_player_color(player_id):
        db = db_module.get_db()
        data = request.get_json(silent=True) or request.form
        color = data.get('color', '')
        if not COLOR_RE.match(color):
            abort(400)
        db.execute('UPDATE players SET color = ? WHERE id = ?', (color, player_id))
        db.commit()
        return jsonify({'ok': True, 'color': color})

    @app.route('/game/new', methods=['GET', 'POST'])
    def new_game():
        db = db_module.get_db()
        if request.method == 'POST':
            player_ids = request.form.getlist('player_ids')
            new_names = [n.strip() for n in request.form.get('new_players', '').split(',') if n.strip()]
            try:
                num_rounds = int(request.form.get('num_rounds', 10))
            except ValueError:
                num_rounds = 10
            num_rounds = max(1, min(20, num_rounds))
            expansion = 1 if request.form.get('expansion') else 0

            for name in new_names:
                existing = db.execute('SELECT id FROM players WHERE name = ?', (name,)).fetchone()
                if existing:
                    player_ids.append(str(existing['id']))
                else:
                    cur = db.execute('INSERT INTO players (name, color) VALUES (?, ?)', (name, assign_color(db)))
                    player_ids.append(str(cur.lastrowid))

            seen = set()
            ordered_ids = []
            for pid in player_ids:
                if pid not in seen:
                    seen.add(pid)
                    ordered_ids.append(pid)

            if len(ordered_ids) < 2:
                flash('Se necesitan al menos 2 jugadores para crear una partida.', 'error')
                db.commit()
                return redirect(url_for('new_game'))


            cur = db.execute(
                'INSERT INTO games (num_rounds, expansion) VALUES (?, ?)', (num_rounds, expansion)
            )
            game_id = cur.lastrowid
            for pid in ordered_ids:
                db.execute('INSERT INTO game_players (game_id, player_id) VALUES (?, ?)', (game_id, pid))
            db.commit()
            return redirect(url_for('game_view', game_id=game_id))

        players = db.execute('''
            SELECT p.*, COUNT(gp.game_id) AS games_count
            FROM players p
            LEFT JOIN game_players gp ON gp.player_id = p.id
            GROUP BY p.id
            ORDER BY games_count DESC, p.name COLLATE NOCASE ASC
        ''').fetchall()
        groups = db.execute('SELECT * FROM groups ORDER BY name COLLATE NOCASE').fetchall()
        group_player_ids = {}
        for grp in groups:
            rows = db.execute('SELECT player_id FROM group_players WHERE group_id = ?', (grp['id'],)).fetchall()
            group_player_ids[grp['id']] = [row['player_id'] for row in rows]
        return render_template(
            'new_game.html', players=players, groups=groups, group_player_ids=group_player_ids,
        )

    @app.route('/game/<int:game_id>')
    def game_view(game_id):
        db = db_module.get_db()
        game = db.execute('SELECT * FROM games WHERE id = ?', (game_id,)).fetchone()
        if game is None:
            abort(404)
        players = db.execute('''
            SELECT p.* FROM players p
            JOIN game_players gp ON gp.player_id = p.id
            WHERE gp.game_id = ?
            ORDER BY gp.id
        ''', (game_id,)).fetchall()
        return render_template('game.html', game=game, players=players)

    @app.route('/game/<int:game_id>/delete', methods=['POST'])
    def delete_game(game_id):
        db = db_module.get_db()
        db.execute('DELETE FROM games WHERE id = ?', (game_id,))
        db.commit()
        return redirect(url_for('index'))

    @app.route('/history')
    def history():
        db = db_module.get_db()
        games = db.execute('SELECT * FROM games WHERE finished = 1 ORDER BY created_at DESC').fetchall()
        result = []
        for g in games:
            players = db.execute('''
                SELECT p.id, p.name, COALESCE(SUM(rs.score), 0) AS total
                FROM players p
                JOIN game_players gp ON gp.player_id = p.id AND gp.game_id = ?
                LEFT JOIN round_scores rs ON rs.player_id = p.id AND rs.game_id = ?
                GROUP BY p.id
                ORDER BY total DESC
            ''', (g['id'], g['id'])).fetchall()
            result.append({'game': g, 'players': players})
        return render_template('history.html', games=result)

    @app.route('/stats')
    def stats():
        db = db_module.get_db()
        rows = db.execute('''
            SELECT p.id, p.name, p.color,
                   COUNT(DISTINCT g.id) AS games_played,
                   COALESCE(SUM(rs.score), 0) AS total_score
            FROM players p
            JOIN game_players gp ON gp.player_id = p.id
            JOIN games g ON g.id = gp.game_id AND g.finished = 1
            LEFT JOIN round_scores rs ON rs.player_id = p.id AND rs.game_id = g.id
            GROUP BY p.id
        ''').fetchall()

        finished_games = db.execute('SELECT id FROM games WHERE finished = 1').fetchall()
        wins = {}
        best_game = {}
        for g in finished_games:
            game_scores = db.execute('''
                SELECT player_id, SUM(score) AS total
                FROM round_scores WHERE game_id = ?
                GROUP BY player_id
            ''', (g['id'],)).fetchall()
            if not game_scores:
                continue
            top_score = max(s['total'] for s in game_scores)
            for s in game_scores:
                pid = s['player_id']
                if s['total'] == top_score:
                    wins[pid] = wins.get(pid, 0) + 1
                if s['total'] > best_game.get(pid, float('-inf')):
                    best_game[pid] = s['total']

        bid_acc = db.execute('''
            SELECT rs.player_id,
                   COUNT(*) AS total,
                   SUM(CASE WHEN rs.tricks_won = rs.bid THEN 1 ELSE 0 END) AS exact
            FROM round_scores rs
            JOIN games g ON g.id = rs.game_id AND g.finished = 1
            WHERE rs.voided = 0
            GROUP BY rs.player_id
        ''').fetchall()
        accuracy = {r['player_id']: round(r['exact'] * 100 / r['total']) if r['total'] else 0
                    for r in bid_acc}

        stats_list = []
        for r in rows:
            gp = r['games_played']
            total = r['total_score'] or 0
            pid = r['id']
            w = wins.get(pid, 0)
            stats_list.append({
                'name': r['name'],
                'color': r['color'],
                'games_played': gp,
                'total_score': total,
                'avg_score': round(total / gp, 1) if gp else 0,
                'wins': w,
                'win_rate': round(w * 100 / gp) if gp else 0,
                'best_game': best_game.get(pid, 0),
                'bid_accuracy': accuracy.get(pid, 0),
            })
        # Keep player ids for the detail API link
        for i, r in enumerate(rows):
            stats_list[i]['id'] = r['id']

        stats_list.sort(key=lambda x: (x['wins'], x['avg_score']), reverse=True)
        max_avg = max((s['avg_score'] for s in stats_list), default=1) or 1
        max_best = max((s['best_game'] for s in stats_list), default=1) or 1

        # --- Group stats -------------------------------------------------
        finished_ids = [g['id'] for g in finished_games]
        groups_raw = db.execute('''
            SELECT g.id, g.name, g.emoji,
                   COUNT(gp.player_id) AS member_count
            FROM groups g
            LEFT JOIN group_players gp ON gp.group_id = g.id
            GROUP BY g.id
            HAVING member_count >= 2
        ''').fetchall()

        group_stats_list = []
        for grp in groups_raw:
            member_ids = [r['player_id'] for r in db.execute(
                'SELECT player_id FROM group_players WHERE group_id = ?', (grp['id'],)
            ).fetchall()]
            if len(member_ids) < 2 or not finished_ids:
                continue
            ph = ','.join('?' * len(member_ids))
            fph = ','.join('?' * len(finished_ids))
            game_rows = db.execute(f'''
                SELECT gp.game_id FROM game_players gp
                WHERE gp.game_id IN ({fph}) AND gp.player_id IN ({ph})
                GROUP BY gp.game_id
                HAVING COUNT(DISTINCT gp.player_id) = ?
            ''', finished_ids + member_ids + [len(member_ids)]).fetchall()
            group_game_ids = [r['game_id'] for r in game_rows]
            if not group_game_ids:
                continue
            g_wins = 0
            best_avg = 0.0
            total_avg = 0.0
            for gid in group_game_ids:
                top = db.execute(
                    'SELECT player_id FROM round_scores WHERE game_id = ? '
                    'GROUP BY player_id ORDER BY SUM(score) DESC LIMIT 1', (gid,)
                ).fetchone()
                if top and top['player_id'] in member_ids:
                    g_wins += 1
                mem = db.execute(f'''
                    SELECT SUM(score) AS s FROM round_scores
                    WHERE game_id = ? AND player_id IN ({ph})
                    GROUP BY player_id
                ''', [gid] + member_ids).fetchall()
                if mem:
                    avg = sum(r['s'] or 0 for r in mem) / len(mem)
                    total_avg += avg
                    if avg > best_avg:
                        best_avg = avg
            n = len(group_game_ids)
            group_stats_list.append({
                'name': grp['name'],
                'emoji': grp['emoji'],
                'member_count': grp['member_count'],
                'games_played': n,
                'wins': g_wins,
                'win_rate': round(g_wins * 100 / n) if n else 0,
                'avg_score': round(total_avg / n, 1) if n else 0,
                'best_game': round(best_avg, 1),
            })
        group_stats_list.sort(key=lambda x: (x['wins'], x['avg_score']), reverse=True)
        max_g_avg = max((s['avg_score'] for s in group_stats_list), default=1) or 1
        max_g_best = max((s['best_game'] for s in group_stats_list), default=1) or 1

        return render_template('stats.html',
            stats=stats_list, max_avg=max_avg, max_best=max_best,
            group_stats=group_stats_list, max_g_avg=max_g_avg, max_g_best=max_g_best)

    @app.route('/api/stats/player/<int:player_id>')
    def api_player_stats(player_id):
        db = db_module.get_db()
        player = db.execute('SELECT * FROM players WHERE id = ?', (player_id,)).fetchone()
        if not player:
            abort(404)

        bid_rows = db.execute('''
            SELECT rs.bid,
                   COUNT(*) AS total,
                   SUM(CASE WHEN rs.tricks_won = rs.bid THEN 1 ELSE 0 END) AS exact,
                   SUM(CASE WHEN rs.tricks_won > rs.bid THEN 1 ELSE 0 END) AS got_more,
                   SUM(CASE WHEN rs.tricks_won < rs.bid THEN 1 ELSE 0 END) AS got_less
            FROM round_scores rs
            JOIN games g ON g.id = rs.game_id AND g.finished = 1
            WHERE rs.player_id = ? AND rs.voided = 0
            GROUP BY rs.bid ORDER BY rs.bid
        ''', (player_id,)).fetchall()

        round_rows = db.execute('''
            SELECT rs.round_number AS rn,
                   COUNT(*) AS total,
                   SUM(CASE WHEN rs.tricks_won = rs.bid THEN 1 ELSE 0 END) AS exact,
                   AVG(CAST(rs.bid AS REAL)) AS avg_bid,
                   AVG(rs.score) AS avg_score
            FROM round_scores rs
            JOIN games g ON g.id = rs.game_id AND g.finished = 1
            WHERE rs.player_id = ? AND rs.voided = 0
            GROUP BY rs.round_number ORDER BY rs.round_number
        ''', (player_id,)).fetchall()

        game_rows = db.execute('''
            SELECT g.id, SUM(rs.score) AS total
            FROM games g
            JOIN round_scores rs ON rs.game_id = g.id AND rs.player_id = ?
            WHERE g.finished = 1
            GROUP BY g.id ORDER BY g.created_at
        ''', (player_id,)).fetchall()

        best = db.execute('''
            SELECT rs.bid, rs.tricks_won, rs.bonus_points, rs.score, rs.round_number
            FROM round_scores rs
            JOIN games g ON g.id = rs.game_id AND g.finished = 1
            WHERE rs.player_id = ? AND rs.voided = 0
            ORDER BY rs.score DESC LIMIT 1
        ''', (player_id,)).fetchone()

        worst = db.execute('''
            SELECT rs.bid, rs.tricks_won, rs.bonus_points, rs.score, rs.round_number
            FROM round_scores rs
            JOIN games g ON g.id = rs.game_id AND g.finished = 1
            WHERE rs.player_id = ? AND rs.voided = 0
            ORDER BY rs.score ASC LIMIT 1
        ''', (player_id,)).fetchone()

        agg = db.execute('''
            SELECT COALESCE(SUM(rs.bonus_points), 0) AS total_bonus,
                   SUM(CASE WHEN rs.voided = 1 THEN 1 ELSE 0 END) AS voided_count,
                   COUNT(*) AS total_rounds,
                   AVG(CAST(rs.bid AS REAL) / rs.round_number) AS avg_bid_ratio,
                   MAX(rs.bid) AS max_bid_ever
            FROM round_scores rs
            JOIN games g ON g.id = rs.game_id AND g.finished = 1
            WHERE rs.player_id = ?
        ''', (player_id,)).fetchone()

        top_bid = db.execute('''
            SELECT bid, COUNT(*) AS cnt FROM round_scores rs
            JOIN games g ON g.id = rs.game_id AND g.finished = 1
            WHERE rs.player_id = ? AND rs.voided = 0
            GROUP BY bid ORDER BY cnt DESC LIMIT 1
        ''', (player_id,)).fetchone()

        bid_stats = [{'bid': r['bid'], 'total': r['total'],
                      'exact': r['exact'], 'got_more': r['got_more'], 'got_less': r['got_less'],
                      'accuracy': round(r['exact'] * 100 / r['total']) if r['total'] else 0}
                     for r in bid_rows]

        round_stats = [{'round': r['rn'], 'total': r['total'], 'exact': r['exact'],
                        'accuracy': round(r['exact'] * 100 / r['total']) if r['total'] else 0,
                        'avg_bid': round(r['avg_bid'], 1) if r['avg_bid'] else 0,
                        'avg_score': round(r['avg_score'], 1) if r['avg_score'] else 0}
                       for r in round_rows]

        zero = next((b for b in bid_stats if b['bid'] == 0), None)

        return jsonify({
            'name': player['name'], 'color': player['color'],
            'bid_stats': bid_stats,
            'round_stats': round_stats,
            'score_history': [r['total'] for r in game_rows],
            'best_round': dict(best) if best else None,
            'worst_round': dict(worst) if worst else None,
            'total_bonus': agg['total_bonus'] or 0,
            'voided_count': agg['voided_count'] or 0,
            'total_rounds': agg['total_rounds'] or 0,
            'avg_bid_ratio': round((agg['avg_bid_ratio'] or 0) * 100),
            'max_bid_ever': agg['max_bid_ever'] or 0,
            'top_bid': top_bid['bid'] if top_bid else 0,
            'zero_bid': zero,
        })

    # ------------------------------------------------------------------
    # API
    # ------------------------------------------------------------------

    @app.route('/api/game/<int:game_id>')
    def api_game(game_id):
        db = db_module.get_db()
        game = db.execute('SELECT * FROM games WHERE id = ?', (game_id,)).fetchone()
        if game is None:
            abort(404)
        players = db.execute('''
            SELECT p.* FROM players p
            JOIN game_players gp ON gp.player_id = p.id
            WHERE gp.game_id = ?
            ORDER BY gp.id
        ''', (game_id,)).fetchall()
        rows = db.execute('SELECT * FROM round_scores WHERE game_id = ?', (game_id,)).fetchall()

        scores = {}
        for r in rows:
            scores.setdefault(str(r['round_number']), {})[str(r['player_id'])] = {
                'bid': r['bid'],
                'tricks': r['tricks_won'],
                'bonus': r['bonus_points'],
                'voided': bool(r['voided']),
                'score': r['score'],
            }

        return jsonify({
            'id': game['id'],
            'num_rounds': game['num_rounds'],
            'expansion': bool(game['expansion']),
            'finished': bool(game['finished']),
            'players': [{'id': p['id'], 'name': p['name'], 'color': p['color']} for p in players],
            'scores': scores,
        })

    @app.route('/api/game/<int:game_id>/round/<int:round_number>', methods=['POST'])
    def api_save_round(game_id, round_number):
        db = db_module.get_db()
        game = db.execute('SELECT * FROM games WHERE id = ?', (game_id,)).fetchone()
        if game is None:
            abort(404)
        if round_number < 1 or round_number > game['num_rounds']:
            abort(400)
        if game['finished']:
            abort(400, 'La partida ya ha finalizado.')

        data = request.get_json(silent=True) or {}
        voided = 1 if data.get('voided') else 0

        for entry in data.get('scores', []):
            player_id = int(entry['player_id'])
            bid = int(entry.get('bid', 0))
            tricks = int(entry.get('tricks', 0))
            bonus = int(entry.get('bonus', 0))

            if voided:
                score = 0
            else:
                score = compute_score(round_number, bid, tricks, bonus)

            db.execute('''
                INSERT INTO round_scores
                    (game_id, player_id, round_number, bid, tricks_won, bonus_points, voided, score)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(game_id, player_id, round_number) DO UPDATE SET
                    bid = excluded.bid,
                    tricks_won = excluded.tricks_won,
                    bonus_points = excluded.bonus_points,
                    voided = excluded.voided,
                    score = excluded.score
            ''', (game_id, player_id, round_number, bid, tricks, bonus, voided, score))

        db.commit()
        return jsonify({'ok': True})

    @app.route('/api/game/<int:game_id>/finish', methods=['POST'])
    def api_finish_game(game_id):
        db = db_module.get_db()
        db.execute('UPDATE games SET finished = 1 WHERE id = ?', (game_id,))
        db.commit()
        return jsonify({'ok': True})

    @app.route('/api/game/<int:game_id>/reopen', methods=['POST'])
    def api_reopen_game(game_id):
        db = db_module.get_db()
        db.execute('UPDATE games SET finished = 0 WHERE id = ?', (game_id,))
        db.commit()
        return jsonify({'ok': True})

    return app


app = create_app()

if __name__ == '__main__':
    app.run(
        host=os.environ.get('HOST', '0.0.0.0'),
        port=int(os.environ.get('PORT', 5000)),
        debug=os.environ.get('DEBUG', 'false').lower() == 'true',
    )
