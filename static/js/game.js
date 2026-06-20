(function () {
    const root = document.getElementById('game-app');
    const gameId = root.dataset.gameId;
    const t = (key, vars) => window.SkullKingI18n ? window.SkullKingI18n.t(key, vars) : key;
    window.addEventListener('langchange', render);

    function colorDot(color) {
        const dot = document.createElement('span');
        dot.className = 'player-color-dot';
        dot.style.backgroundColor = color;
        return dot;
    }

    let gameData = null;
    let currentRound = 1;
    let currentView = 'round';
    const expandedRounds = new Set();

    // Per-round wizard state: 'bids' then 'tricks' (tricks won + bonuses).
    let roundPhase = 'bids';
    let roundPhaseFor = null;
    let expandedPlayers = new Set();
    let roundWinner = null; // player id of the previous round winner (shown as a star in the next bids phase)

    async function loadGame() {
        const res = await fetch(`/api/game/${gameId}`);
        gameData = await res.json();
    }

    function computePreviewScore(roundNumber, bid, tricks, bonus) {
        if (bid === 0) return tricks === 0 ? 10 * roundNumber : -10 * roundNumber;
        if (tricks === bid) return 20 * bid + (bonus || 0);
        return -10 * Math.abs(bid - tricks);
    }

    function firstIncompleteRound() {
        for (let r = 1; r <= gameData.num_rounds; r++) {
            const roundScores = gameData.scores[String(r)];
            if (!roundScores || gameData.players.some((p) => !(String(p.id) in roundScores))) {
                return r;
            }
        }
        return gameData.num_rounds;
    }

    // Computes, for each player, the cumulative score after each played round
    // (index 0 = round 1), plus the number of the last round with any data.
    function computeCumulative() {
        const cumulative = {};
        const runningTotals = {};
        gameData.players.forEach((p) => {
            cumulative[p.id] = [];
            runningTotals[p.id] = 0;
        });

        let lastPlayedRound = 0;
        for (let r = 1; r <= gameData.num_rounds; r++) {
            const roundScores = gameData.scores[String(r)];
            let played = false;
            for (const p of gameData.players) {
                const entry = roundScores ? roundScores[String(p.id)] : null;
                if (entry) {
                    runningTotals[p.id] += entry.score;
                    played = true;
                }
                cumulative[p.id].push(runningTotals[p.id]);
            }
            if (played) lastPlayedRound = r;
        }

        return { cumulative, lastPlayedRound };
    }

    // --- Autosave -----------------------------------------------------------
    // Every change to bids/tricks/bonus is persisted automatically
    // (debounced), so moving between rounds or steps never loses data.
    let autosaveTimer = null;
    let pendingSave = null;

    function scheduleAutosave(fn) {
        pendingSave = fn;
        clearTimeout(autosaveTimer);
        autosaveTimer = setTimeout(() => {
            autosaveTimer = null;
            const f = pendingSave;
            pendingSave = null;
            if (f) f();
        }, 400);
    }

    function flushAutosave() {
        if (!autosaveTimer) return;
        clearTimeout(autosaveTimer);
        autosaveTimer = null;
        const f = pendingSave;
        pendingSave = null;
        if (f) f();
    }

    function button(text, onClick, className) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = text;
        b.className = className || 'btn btn-secondary btn-small';
        b.addEventListener('click', onClick);
        return b;
    }

    function th(text) {
        const e = document.createElement('th');
        e.textContent = text;
        return e;
    }

    function td(text) {
        const e = document.createElement('td');
        e.textContent = text;
        return e;
    }

    // Counter with -/+ buttons, clamped to [min, max]. The max can be lowered
    // later (e.g. when other players' values reduce the remaining headroom).
    function createCounter(min, max, selected) {
        const wrap = document.createElement('div');
        wrap.className = 'counter';
        let current = selected;
        let currentMax = max;
        const callbacks = [];

        const minusBtn = document.createElement('button');
        minusBtn.type = 'button';
        minusBtn.className = 'counter-btn';
        minusBtn.textContent = '−';

        const valueSpan = document.createElement('div');
        valueSpan.className = 'counter-value';

        const plusBtn = document.createElement('button');
        plusBtn.type = 'button';
        plusBtn.className = 'counter-btn';
        plusBtn.textContent = '+';

        function refresh() {
            valueSpan.textContent = String(current);
            minusBtn.disabled = current <= min;
            plusBtn.disabled = current >= currentMax;
        }

        minusBtn.addEventListener('click', () => {
            if (current > min) {
                current--;
                refresh();
                callbacks.forEach((cb) => cb(current));
            }
        });
        plusBtn.addEventListener('click', () => {
            if (current < currentMax) {
                current++;
                refresh();
                callbacks.forEach((cb) => cb(current));
            }
        });

        refresh();
        wrap.append(minusBtn, valueSpan, plusBtn);

        return {
            element: wrap,
            getValue: () => current,
            onChange: (cb) => { callbacks.push(cb); },
            setMax: (newMax) => { currentMax = newMax; refresh(); },
        };
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function render() {
        root.innerHTML = '';
        root.classList.remove('view-fade');
        void root.offsetWidth;
        root.classList.add('view-fade');

        if (gameData.finished) {
            const banner = document.createElement('div');
            banner.className = 'finished-banner';
            banner.textContent = t('game_finished');
            root.appendChild(banner);
        }

        const tabs = document.createElement('div');
        tabs.className = 'view-tabs';
        tabs.appendChild(button(t('current_round_tab'), () => {
            flushAutosave();
            currentView = 'round';
            render();
        }, 'view-tab' + (currentView === 'round' ? ' active' : '')));
        tabs.appendChild(button(t('standings_tab'), () => {
            flushAutosave();
            currentView = 'standings';
            render();
        }, 'view-tab' + (currentView === 'standings' ? ' active' : '')));
        root.appendChild(tabs);

        if (currentView === 'standings') {
            const { cumulative, lastPlayedRound } = computeCumulative();

            if (lastPlayedRound === 0) {
                const card = document.createElement('div');
                card.className = 'card';
                const p = document.createElement('p');
                p.className = 'muted';
                p.textContent = t('no_scores_yet');
                card.appendChild(p);
                root.appendChild(card);
                return;
            }

            const chartCard = document.createElement('div');
            chartCard.className = 'card';
            renderProgressChart(chartCard, cumulative, lastPlayedRound);
            root.appendChild(chartCard);

            const standingsCard = document.createElement('div');
            standingsCard.className = 'card';
            renderStandings(standingsCard, cumulative, lastPlayedRound);
            root.appendChild(standingsCard);

            const totalsCard = document.createElement('div');
            totalsCard.className = 'card';
            renderTotals(totalsCard);
            root.appendChild(totalsCard);
            return;
        }

        const nav = document.createElement('div');
        nav.className = 'round-nav';
        const prevBtn = button(t('prev_round_btn'), () => {
            if (currentRound > 1) {
                flushAutosave();
                currentRound--;
                render();
                scrollToTop();
            }
        });
        const title = document.createElement('div');
        title.className = 'round-title';
        title.textContent = t('round_N_of_M', { n: currentRound, total: gameData.num_rounds });
        const nextBtn = button(t('next_round_btn'), () => {
            if (currentRound < gameData.num_rounds) {
                flushAutosave();
                currentRound++;
                render();
                scrollToTop();
            }
        });
        prevBtn.disabled = currentRound <= 1;
        nextBtn.disabled = currentRound >= gameData.num_rounds;
        nav.append(prevBtn, title, nextBtn);
        root.appendChild(nav);

        const formCard = document.createElement('div');
        formCard.className = 'card';
        renderRoundForm(formCard);
        root.appendChild(formCard);

        const totalsCard = document.createElement('div');
        totalsCard.className = 'card';
        renderTotals(totalsCard);
        root.appendChild(totalsCard);

        const actions = document.createElement('div');
        actions.className = 'game-actions';
        if (gameData.finished) {
            actions.appendChild(button(t('reopen_game'), reopenGame, 'btn btn-secondary'));
        } else if (currentRound === gameData.num_rounds) {
            actions.appendChild(button(t('finish_game'), finishGame, 'btn'));
        }
        root.appendChild(actions);
    }

    function renderRoundForm(container) {
        const roundNumber = currentRound;
        const roundScores = gameData.scores[String(roundNumber)] || {};

        if (roundPhaseFor !== roundNumber) {
            const hasAllBids = gameData.players.every((p) => String(p.id) in roundScores);
            roundPhase = hasAllBids ? 'tricks' : 'bids';
            roundPhaseFor = roundNumber;
            expandedPlayers = new Set();
        }

        const rowsData = [];
        const tricksRows = [];

        // --- Autosave: persist every change to bids/tricks/bonuses ------------
        const statusEl = document.createElement('div');
        statusEl.className = 'save-status';

        function setSaveStatus(state) {
            statusEl.className = 'save-status' + (state ? ' ' + state : '');
            statusEl.textContent = state ? t('save_' + state) : '';
        }

        async function persist() {
            const scores = rowsData.map((r) => ({
                player_id: r.playerId,
                bid: r.getBid(),
                tricks: r.getTricks(),
                bonus: r.getBonus(),
            }));

            const roundKey = String(roundNumber);
            const stored = gameData.scores[roundKey] || {};
            scores.forEach((s) => {
                stored[String(s.player_id)] = {
                    bid: s.bid,
                    tricks: s.tricks,
                    bonus: s.bonus,
                    voided: false,
                    score: computePreviewScore(roundNumber, s.bid, s.tricks, s.bonus),
                };
            });
            gameData.scores[roundKey] = stored;

            setSaveStatus('saving');
            try {
                await fetch(`/api/game/${gameId}/round/${roundNumber}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ scores }),
                });
                setSaveStatus('saved');
            } catch (err) {
                setSaveStatus('error');
            }
        }

        function requestSave() {
            setSaveStatus('pending');
            scheduleAutosave(persist);
        }

        container.appendChild(statusEl);

        // --- Step 1: Bids -----------------------------------------------------
        const bidsSection = document.createElement('div');
        bidsSection.className = 'round-phase';

        const bidsTitle = document.createElement('h3');
        bidsTitle.className = 'phase-title';
        bidsTitle.textContent = t('step1_title');
        bidsSection.appendChild(bidsTitle);

        // --- Step 2: Tricks won + bonuses -------------------------------------
        const tricksSection = document.createElement('div');
        tricksSection.className = 'round-phase';

        const tricksTitle = document.createElement('h3');
        tricksTitle.className = 'phase-title';
        tricksTitle.textContent = t('step2_title');
        tricksSection.appendChild(tricksTitle);

        const backBtn = button(t('back_to_bids'), () => {
            roundPhase = 'bids';
            updatePhaseVisibility();
            scrollToTop();
        }, 'btn btn-secondary');
        tricksSection.appendChild(backBtn);

        // Bid counter + Kraken button
        const roundInfoBar = document.createElement('div');
        roundInfoBar.className = 'round-info-bar';
        const bidCounterEl = document.createElement('span');
        bidCounterEl.className = 'bid-counter';
        let krakenPlayed = false;
        const krakenBtn = document.createElement('button');
        krakenBtn.type = 'button';
        krakenBtn.className = 'kraken-btn';
        krakenBtn.innerHTML = '🦑 Kraken';
        krakenBtn.addEventListener('click', () => {
            krakenPlayed = !krakenPlayed;
            krakenBtn.classList.toggle('active', krakenPlayed);
            updateBidCounter();
        });
        roundInfoBar.append(bidCounterEl, krakenBtn);
        tricksSection.appendChild(roundInfoBar);

        function updateBidCounter() {
            const totalBid = rowsData.reduce((s, r) => s + r.getBid(), 0);
            const available = roundNumber - (krakenPlayed ? 1 : 0);
            bidCounterEl.textContent = t('bids_counter', { total: totalBid, available });
            bidCounterEl.className = 'bid-counter'
                + (totalBid > available ? ' over' : totalBid === available ? ' exact' : '');
        }

        // Per-round winner stars
        const starBtns = [];
        function refreshStars() {
            starBtns.forEach(({ playerId, btn }) => {
                btn.classList.toggle('active', roundWinner === playerId);
            });
        }

        const bonusPanels = [];

        function closeAllBonusPanels() {
            bonusPanels.forEach(({ panel, chevron }) => {
                panel.classList.remove('open');
                chevron.classList.remove('open');
            });
        }

        // Bonuses available for this round, shared across all players: each
        // bonus can be applied at most `max` times total (e.g. only one
        // Skull King per round).
        const presets = [];
        const groupBreaks = [];
        presets.push(...BASE_BONUSES);
        if (gameData.expansion) {
            groupBreaks.push({ index: presets.length, title: t('expansion_bonuses') });
            presets.push(...EXPANSION_BONUSES);
        }
        const roundBonusCounts = presets.map(() => 0);
        const presetButtons = presets.map(() => []);

        function updateBonusOptionAvailability(idx) {
            const preset = presets[idx];
            const reached = preset.max != null && roundBonusCounts[idx] >= preset.max;
            presetButtons[idx].forEach((btn) => {
                btn.disabled = reached;
            });
        }

        gameData.players.forEach((p) => {
            const entry = roundScores[String(p.id)] || { bid: 0, tricks: 0, bonus: 0 };

            // Bid (step 1)
            const bidCard = document.createElement('div');
            bidCard.className = 'player-card';

            const bidHeader = document.createElement('div');
            bidHeader.className = 'player-card-header';
            const bidNameSpan = document.createElement('span');
            bidNameSpan.className = 'player-name';
            bidNameSpan.append(colorDot(p.color), document.createTextNode(p.name));
            const bidStarBadge = document.createElement('span');
            bidStarBadge.className = 'winner-star-badge' + (roundWinner === p.id ? ' active' : '');
            bidStarBadge.textContent = '★';
            bidHeader.append(bidNameSpan, bidStarBadge);
            bidCard.appendChild(bidHeader);

            const bidGroup = document.createElement('div');
            bidGroup.className = 'field-group';
            const bidLabel = document.createElement('div');
            bidLabel.className = 'field-label';
            bidLabel.textContent = t('bid_label');
            const bidRow = createCounter(0, roundNumber, entry.bid);
            bidGroup.append(bidLabel, bidRow.element);
            bidCard.appendChild(bidGroup);

            bidsSection.appendChild(bidCard);

            // Tricks won + bonuses (step 2), collapsed by default
            const tricksCard = document.createElement('div');
            tricksCard.className = 'player-card collapsible-card';

            const tricksHeader = document.createElement('div');
            tricksHeader.className = 'player-card-header collapsible-header';

            const tricksNameSpan = document.createElement('span');
            tricksNameSpan.className = 'player-name';
            tricksNameSpan.append(colorDot(p.color), document.createTextNode(p.name));

            const headerRight = document.createElement('span');
            headerRight.className = 'collapsible-header-right';
            const bidSummarySpan = document.createElement('span');
            bidSummarySpan.className = 'bid-summary';
            const scoreSpan = document.createElement('span');
            scoreSpan.className = 'score-preview';
            const chevron = document.createElement('span');
            chevron.className = 'collapsible-chevron';
            chevron.textContent = '▸';

            const starBtn = document.createElement('button');
            starBtn.type = 'button';
            starBtn.className = 'winner-star' + (roundWinner === p.id ? ' active' : '');
            starBtn.textContent = '★';
            starBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                roundWinner = roundWinner === p.id ? null : p.id;
                refreshStars();
            });
            starBtns.push({ playerId: p.id, btn: starBtn });
            headerRight.append(bidSummarySpan, starBtn, scoreSpan, chevron);

            tricksHeader.append(tricksNameSpan, headerRight);
            tricksCard.appendChild(tricksHeader);

            const tricksBody = document.createElement('div');
            tricksBody.className = 'collapsible-body';

            const tricksBodyInner = document.createElement('div');
            tricksBodyInner.className = 'collapsible-body-inner';
            tricksBody.appendChild(tricksBodyInner);

            // Tricks won
            const tricksGroup = document.createElement('div');
            tricksGroup.className = 'field-group';
            const tricksLabel = document.createElement('div');
            tricksLabel.className = 'field-label';
            tricksLabel.textContent = t('tricks_label');
            const tricksRow = createCounter(0, roundNumber, entry.tricks);
            tricksRows.push(tricksRow);
            tricksGroup.append(tricksLabel, tricksRow.element);
            tricksBodyInner.appendChild(tricksGroup);

            // Bonuses
            const bonusGroup = document.createElement('div');
            bonusGroup.className = 'field-group';

            let bonusTotal = entry.bonus || 0;

            const counts = presets.map(() => 0);

            const bonusToggle = document.createElement('button');
            bonusToggle.type = 'button';
            bonusToggle.className = 'bonus-toggle';

            const bonusToggleLabel = document.createElement('span');
            const bonusToggleChevron = document.createElement('span');
            bonusToggleChevron.className = 'collapsible-chevron';
            bonusToggleChevron.textContent = '▸';
            bonusToggle.append(bonusToggleLabel, bonusToggleChevron);

            const bonusPanel = document.createElement('div');
            bonusPanel.className = 'bonus-panel';

            const bonusPanelInner = document.createElement('div');
            bonusPanelInner.className = 'bonus-panel-inner';
            bonusPanel.appendChild(bonusPanelInner);

            function refreshBonusToggle() {
                const sign = bonusTotal > 0 ? '+' : '';
                bonusToggleLabel.textContent = t('bonus_label', { sign, total: bonusTotal });
                bonusToggle.classList.toggle('active-bonus', bonusTotal !== 0);
            }
            refreshBonusToggle();
            bonusPanels.push({ panel: bonusPanel, chevron: bonusToggleChevron });

            bonusToggle.addEventListener('click', () => {
                const opening = !bonusPanel.classList.contains('open');
                closeAllBonusPanels();
                bonusPanel.classList.toggle('open', opening);
                bonusToggleChevron.classList.toggle('open', opening);
            });

            presets.forEach((preset, idx) => {
                const brk = groupBreaks.find((b) => b.index === idx);
                if (brk) {
                    const groupTitle = document.createElement('div');
                    groupTitle.className = 'bonus-group-title';
                    groupTitle.textContent = brk.title;
                    bonusPanelInner.appendChild(groupTitle);
                }

                const optBtn = document.createElement('button');
                optBtn.type = 'button';
                optBtn.className = 'bonus-option';

                const labelSpan = document.createElement('span');
                labelSpan.textContent = preset.label;

                const badge = document.createElement('span');
                badge.className = 'count-badge';
                badge.textContent = '×0';
                badge.style.display = 'none';

                optBtn.append(labelSpan, badge);

                optBtn.addEventListener('click', () => {
                    counts[idx]++;
                    roundBonusCounts[idx]++;
                    bonusTotal += preset.value;
                    badge.textContent = `×${counts[idx]}`;
                    badge.style.display = 'inline-block';
                    optBtn.classList.add('has-count');
                    refreshBonusToggle();
                    updateBonusOptionAvailability(idx);
                    updatePreview();
                    requestSave();
                });

                presetButtons[idx].push(optBtn);
                updateBonusOptionAvailability(idx);

                bonusPanelInner.appendChild(optBtn);
            });

            const resetBtn = document.createElement('button');
            resetBtn.type = 'button';
            resetBtn.className = 'bonus-reset';
            resetBtn.textContent = t('reset_bonus');
            resetBtn.addEventListener('click', () => {
                bonusTotal = 0;
                bonusPanel.querySelectorAll('.bonus-option').forEach((btn, idx) => {
                    roundBonusCounts[idx] -= counts[idx];
                    counts[idx] = 0;
                    const badge = btn.querySelector('.count-badge');
                    badge.textContent = '×0';
                    badge.style.display = 'none';
                    btn.classList.remove('has-count');
                    updateBonusOptionAvailability(idx);
                });
                refreshBonusToggle();
                updatePreview();
                requestSave();
            });
            bonusPanelInner.appendChild(resetBtn);

            bonusGroup.append(bonusToggle, bonusPanel);
            tricksBodyInner.appendChild(bonusGroup);

            tricksCard.appendChild(tricksBody);
            tricksSection.appendChild(tricksCard);

            function setExpanded(exp) {
                tricksCard.classList.toggle('expanded', exp);
                if (exp) expandedPlayers.add(p.id);
                else expandedPlayers.delete(p.id);
            }
            tricksHeader.addEventListener('click', () => {
                closeAllBonusPanels();
                setExpanded(!tricksCard.classList.contains('expanded'));
            });
            setExpanded(expandedPlayers.has(p.id));

            function updatePreview() {
                const bid = bidRow.getValue();
                const tricks = tricksRow.getValue();
                const score = computePreviewScore(roundNumber, bid, tricks, bonusTotal);
                scoreSpan.textContent = (score > 0 ? '+' : '') + score;
                scoreSpan.classList.remove('positive', 'negative');
                if (score > 0) scoreSpan.classList.add('positive');
                else if (score < 0) scoreSpan.classList.add('negative');
                bidSummarySpan.textContent = t('bid_summary', { n: bid });
            }

            bidRow.onChange(updatePreview);
            bidRow.onChange(requestSave);
            bidRow.onChange(updateBidCounter);
            tricksRow.onChange(updatePreview);
            tricksRow.onChange(updateTricksLimits);
            tricksRow.onChange(requestSave);
            tricksRow.onChange(() => {
                roundWinner = p.id;
                refreshStars();
            });

            rowsData.push({
                playerId: p.id,
                getBid: () => bidRow.getValue(),
                getTricks: () => tricksRow.getValue(),
                getBonus: () => bonusTotal,
                updatePreview,
            });
            updatePreview();
        });

        updateBidCounter();

        // The tricks won across all players in a round can never exceed the
        // round number (there are exactly `roundNumber` cards per round).
        function updateTricksLimits() {
            const total = tricksRows.reduce((sum, r) => sum + r.getValue(), 0);
            tricksRows.forEach((r) => {
                const remaining = roundNumber - total + r.getValue();
                r.setMax(Math.min(roundNumber, remaining));
            });
        }
        updateTricksLimits();

        const nextBtn = button(t('next_tricks'), () => {
            roundPhase = 'tricks';
            updatePhaseVisibility();
            scrollToTop();
        }, 'btn');
        bidsSection.appendChild(nextBtn);

        if (currentRound < gameData.num_rounds) {
            const nextRoundBtn = button(t('next_round'), () => {
                flushAutosave();
                currentRound++;
                render();
                scrollToTop();
            }, 'btn');
            tricksSection.appendChild(nextRoundBtn);
        }

        container.append(bidsSection, tricksSection);

        function updatePhaseVisibility() {
            bidsSection.style.display = roundPhase === 'bids' ? '' : 'none';
            tricksSection.style.display = roundPhase === 'tricks' ? '' : 'none';
        }
        updatePhaseVisibility();

        if (gameData.finished) {
            container.querySelectorAll('button').forEach((el) => { el.disabled = true; });
        }
    }

    function renderTotals(container) {
        const title = document.createElement('h2');
        title.textContent = t('scoreboard_title');
        container.appendChild(title);

        const hint = document.createElement('p');
        hint.className = 'muted';
        hint.style.fontSize = '0.8rem';
        hint.style.margin = '0 0 0.5rem';
        hint.textContent = t('tap_round_hint');
        container.appendChild(hint);

        const wrapper = document.createElement('div');
        wrapper.style.overflowX = 'auto';

        const table = document.createElement('table');
        table.className = 'totals-table';

        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        headRow.appendChild(th(t('round_col')));
        gameData.players.forEach((p) => {
            const cell = th(p.name);
            cell.prepend(colorDot(p.color));
            headRow.appendChild(cell);
        });
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        const totals = {};
        gameData.players.forEach((p) => { totals[p.id] = 0; });

        for (let r = 1; r <= gameData.num_rounds; r++) {
            const roundScores = gameData.scores[String(r)];
            const tr = document.createElement('tr');
            tr.className = 'round-row';
            const roundCell = td(String(r));
            roundCell.className = 'round-cell';
            tr.appendChild(roundCell);

            let hasData = false;
            for (const p of gameData.players) {
                const entry = roundScores ? roundScores[String(p.id)] : null;
                if (entry) {
                    totals[p.id] += entry.score;
                    tr.appendChild(td((entry.score > 0 ? '+' : '') + entry.score + (entry.voided ? ' ⚓' : '')));
                    hasData = true;
                } else {
                    tr.appendChild(td('—'));
                }
            }

            const detailRow = document.createElement('tr');
            detailRow.className = 'round-detail-row';
            const detailCell = document.createElement('td');
            detailCell.colSpan = gameData.players.length + 1;
            const detail = document.createElement('div');
            detail.className = 'round-detail';
            gameData.players.forEach((p) => {
                const entry = roundScores ? roundScores[String(p.id)] : null;
                const line = document.createElement('div');
                if (entry) {
                    const bonusPart = entry.bonus ? `, ${t('detail_bonus')} ${entry.bonus > 0 ? '+' : ''}${entry.bonus}` : '';
                    line.textContent = `${p.name}: ${t('detail_bid')} ${entry.bid}, ${t('detail_tricks')} ${entry.tricks}${bonusPart}${entry.voided ? ' ' + t('detail_voided') : ''}`;
                } else {
                    line.textContent = `${p.name}: ${t('no_data')}`;
                }
                detail.appendChild(line);
            });
            detailCell.appendChild(detail);
            detailRow.appendChild(detailCell);
            detailRow.style.display = expandedRounds.has(r) ? '' : 'none';

            if (hasData) {
                tr.addEventListener('click', () => {
                    if (expandedRounds.has(r)) {
                        expandedRounds.delete(r);
                    } else {
                        expandedRounds.add(r);
                    }
                    detailRow.style.display = expandedRounds.has(r) ? '' : 'none';
                });
            } else {
                tr.style.cursor = 'default';
            }

            tbody.appendChild(tr);
            tbody.appendChild(detailRow);
        }

        const totalRow = document.createElement('tr');
        totalRow.className = 'total-row';
        totalRow.appendChild(td(t('total_row')));
        gameData.players.forEach((p) => totalRow.appendChild(td(String(totals[p.id]))));
        tbody.appendChild(totalRow);

        table.appendChild(tbody);
        wrapper.appendChild(table);
        container.appendChild(wrapper);
    }

    function renderProgressChart(container, cumulative, lastPlayedRound) {
        const title = document.createElement('h2');
        title.textContent = t('progress_title');
        container.appendChild(title);

        const pointCount = lastPlayedRound + 1; // round 0 (start) .. lastPlayedRound
        const series = gameData.players.map((p) => ({
            id: p.id,
            name: p.name,
            color: p.color,
            values: [0, ...cumulative[p.id].slice(0, lastPlayedRound)],
        }));

        let minVal = 0;
        let maxVal = 0;
        series.forEach((s) => {
            s.values.forEach((v) => {
                if (v < minVal) minVal = v;
                if (v > maxVal) maxVal = v;
            });
        });
        if (minVal === maxVal) {
            maxVal += 1;
            minVal -= 1;
        }

        const width = 300;
        const height = 160;
        const padX = 14;
        const padY = 14;

        const xStep = pointCount > 1 ? (width - 2 * padX) / (pointCount - 1) : 0;
        const scaleX = (i) => padX + i * xStep;
        const scaleY = (v) => height - padY - ((v - minVal) / (maxVal - minVal)) * (height - 2 * padY);

        const svgNs = 'http://www.w3.org/2000/svg';
        const svg = document.createElementNS(svgNs, 'svg');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.setAttribute('preserveAspectRatio', 'none');
        svg.setAttribute('class', 'progress-chart');

        if (minVal < 0 && maxVal > 0) {
            const zeroY = scaleY(0);
            const zeroLine = document.createElementNS(svgNs, 'line');
            zeroLine.setAttribute('x1', String(padX));
            zeroLine.setAttribute('x2', String(width - padX));
            zeroLine.setAttribute('y1', String(zeroY));
            zeroLine.setAttribute('y2', String(zeroY));
            zeroLine.setAttribute('stroke', '#cbd5e1');
            zeroLine.setAttribute('stroke-width', '1');
            zeroLine.setAttribute('stroke-dasharray', '4 3');
            svg.appendChild(zeroLine);
        }

        series.forEach((s) => {
            const pointsAttr = s.values.map((v, i) => `${scaleX(i)},${scaleY(v)}`).join(' ');

            const polyline = document.createElementNS(svgNs, 'polyline');
            polyline.setAttribute('points', pointsAttr);
            polyline.setAttribute('fill', 'none');
            polyline.setAttribute('stroke', s.color);
            polyline.setAttribute('stroke-width', '2');
            polyline.setAttribute('stroke-linejoin', 'round');
            polyline.setAttribute('stroke-linecap', 'round');
            svg.appendChild(polyline);

            s.values.forEach((v, i) => {
                const circle = document.createElementNS(svgNs, 'circle');
                circle.setAttribute('cx', String(scaleX(i)));
                circle.setAttribute('cy', String(scaleY(v)));
                circle.setAttribute('r', '2.5');
                circle.setAttribute('fill', s.color);
                svg.appendChild(circle);
            });
        });

        container.appendChild(svg);

        const legend = document.createElement('div');
        legend.className = 'chart-legend';
        series.forEach((s) => {
            const item = document.createElement('div');
            item.className = 'legend-item';
            item.append(colorDot(s.color), document.createTextNode(s.name));
            legend.appendChild(item);
        });
        container.appendChild(legend);
    }

    function renderStandings(container, cumulative, lastPlayedRound) {
        const title = document.createElement('h2');
        title.textContent = t('standings_title');
        container.appendChild(title);

        const currentTotals = gameData.players.map((p) => ({
            id: p.id,
            name: p.name,
            color: p.color,
            total: cumulative[p.id][lastPlayedRound - 1],
        }));
        currentTotals.sort((a, b) => b.total - a.total);

        // Competitive ranking: ties share the same position (1,1,3 instead of 1,2,3)
        const currentRanks = currentTotals.map((p, idx) =>
            idx === 0 ? 1
            : currentTotals[idx].total === currentTotals[idx - 1].total
                ? currentTotals.findIndex((x, i) => i < idx && x.total === p.total) + 1
                : idx + 1
        );

        let prevRanks = null;
        if (lastPlayedRound > 1) {
            const prevTotals = gameData.players.map((p) => ({
                id: p.id,
                total: cumulative[p.id][lastPlayedRound - 2],
            }));
            prevTotals.sort((a, b) => b.total - a.total);
            prevRanks = {};
            prevTotals.forEach((p, idx) => {
                prevRanks[p.id] = idx === 0 ? 1
                    : prevTotals[idx].total === prevTotals[idx - 1].total
                        ? prevRanks[prevTotals[idx - 1].id]
                        : idx + 1;
            });
        }

        const maxTotal = Math.max(...currentTotals.map((p) => p.total), 0);
        const minTotal = Math.min(...currentTotals.map((p) => p.total), 0);
        const range = Math.max(maxTotal - minTotal, 1);

        const list = document.createElement('div');
        list.className = 'standings-list';
        const fills = [];

        currentTotals.forEach((p, idx) => {
            const rank = currentRanks[idx];
            const row = document.createElement('div');
            row.className = 'standing-row' + (rank === 1 ? ' rank-1' : '');

            const rankSpan = document.createElement('div');
            rankSpan.className = 'standing-rank';
            rankSpan.textContent = `${rank}º`;

            const info = document.createElement('div');
            info.className = 'standing-info';
            const name = document.createElement('div');
            name.className = 'standing-name';
            name.append(colorDot(p.color), document.createTextNode(p.name));
            const bar = document.createElement('div');
            bar.className = 'standing-bar';
            const fill = document.createElement('div');
            fill.className = 'standing-bar-fill';
            const pct = ((p.total - minTotal) / range) * 100;
            fill.style.width = '0%';
            fill.style.backgroundColor = p.color;
            fills.push({ fill, pct: Math.max(pct, 4) });
            bar.appendChild(fill);
            info.append(name, bar);

            const totals = document.createElement('div');
            totals.className = 'standing-totals';
            const totalSpan = document.createElement('div');
            totalSpan.className = 'standing-total';
            totalSpan.textContent = String(p.total);
            totals.appendChild(totalSpan);

            if (prevRanks) {
                const delta = prevRanks[p.id] - rank;
                const deltaSpan = document.createElement('div');
                if (delta > 0) {
                    deltaSpan.className = 'standing-delta delta-up';
                    deltaSpan.textContent = `▲ ${delta}`;
                } else if (delta < 0) {
                    deltaSpan.className = 'standing-delta delta-down';
                    deltaSpan.textContent = `▼ ${Math.abs(delta)}`;
                } else {
                    deltaSpan.className = 'standing-delta delta-same';
                    deltaSpan.textContent = '—';
                }
                totals.appendChild(deltaSpan);
            }

            row.append(rankSpan, info, totals);
            list.appendChild(row);
        });

        container.appendChild(list);

        requestAnimationFrame(() => {
            fills.forEach(({ fill, pct }) => { fill.style.width = `${pct}%`; });
        });

        const note = document.createElement('p');
        note.className = 'muted';
        note.style.fontSize = '0.85rem';
        note.textContent = t('standings_after_round', { n: lastPlayedRound, total: gameData.num_rounds });
        container.appendChild(note);
    }

    async function finishGame() {
        if (!confirm(t('confirm_finish_game'))) return;
        flushAutosave();
        await fetch(`/api/game/${gameId}/finish`, { method: 'POST' });
        await loadGame();
        render();
    }

    async function reopenGame() {
        flushAutosave();
        await fetch(`/api/game/${gameId}/reopen`, { method: 'POST' });
        await loadGame();
        render();
    }

    loadGame().then(() => {
        currentRound = gameData.finished ? gameData.num_rounds : firstIncompleteRound();
        render();
    });
})();
