/** Self-contained browser runtime. Its source is embedded in exports; keep it dependency-free. */
export function activityRuntime(data, scoreGuess, selectionLine) {
    'use strict';
    const { config, phonemes, target, words, puzzle, attempts } = data;
    const root = document.getElementById('game');
    const findSound = s => phonemes.find(p => p.symbol === s);
    const soundLabel = s => { const p = findSound(s); return p ? `${p.label} (as in ${p.example})` : s; };
    const el = (tag, className, text) => { const n = document.createElement(tag); if (className)
        n.className = className; if (text !== undefined)
        n.textContent = text; return n; };
    const announce = (text) => { message.textContent = text; };
    document.getElementById('title').textContent = config.title;
    document.getElementById('instructions').textContent = config.instructions;
    document.getElementById('activity-kind').textContent = config.type === 'wordle' ? 'PHONEME WORDLE' : 'PHONEME WORD SEARCH';
    document.getElementById('level').textContent = config.difficulty[0].toUpperCase() + config.difficulty.slice(1);
    const message = el('p', 'message');
    message.setAttribute('role', 'status');
    message.setAttribute('aria-live', 'polite');
    message.setAttribute('aria-atomic', 'true');
    const hint = el('p', 'sound-hint', config.hints ? 'Hover over or focus a phoneme to explore its sound.' : 'Use the phoneme symbols to play.');
    function addHint(button, symbol) { button.setAttribute('aria-label', `/${symbol}/${config.hints ? ' · ' + soundLabel(symbol) : ''}`); if (config.hints) {
        button.title = `/${symbol}/ · ${soundLabel(symbol)}`;
        button.addEventListener('focus', () => { hint.textContent = `/${symbol}/ — ${soundLabel(symbol)}`; });
        button.addEventListener('mouseenter', () => { hint.textContent = `/${symbol}/ — ${soundLabel(symbol)}`; });
    } }
    const restart = el('button', 'restart', '↻  Start again');
    restart.type = 'button';
    if (config.type === 'wordle') {
        let guesses = [], current = [], finished = false;
        const layout = el('div', 'wordle-layout');
        const guessPanel = el('div', 'guess-panel');
        const inputPanel = el('div', 'input-panel');
        layout.append(guessPanel, inputPanel);
        root.append(layout);
        const meta = el('div', 'game-meta');
        const progress = el('span', '', 'Guess 1 of ' + attempts);
        meta.append(el('span', '', target.phonemes.length + ' sounds'), progress);
        guessPanel.append(meta);
        const board = el('div', 'wordle-board');
        board.style.setProperty('--columns', target.phonemes.length);
        board.style.maxWidth = (target.phonemes.length * 56) + 'px';
        board.setAttribute('role', 'group');
        board.setAttribute('aria-label', 'Phoneme guesses');
        guessPanel.append(board);
        const legend = el('div', 'legend');
        [['correct', '✓', 'Right place'], ['present', '↔', 'Different place'], ['absent', '−', 'Not in word']].forEach(([status, mark, label]) => { const item = el('span'); item.append(el('i', status, mark), document.createTextNode(label)); legend.append(item); });
        guessPanel.append(legend, message);
        const keyboard = el('div', 'keyboard');
        keyboard.setAttribute('aria-label', 'Phoneme keyboard');
        inputPanel.append(keyboard);
        for (const kind of ['consonant', 'vowel']) {
            const group = el('div', 'key-group');
            group.append(el('p', 'key-label', kind === 'vowel' ? 'Vowel sounds' : 'Consonant sounds'));
            const keys = el('div', 'key-row');
            phonemes.filter(p => p.kind === kind).forEach(p => { const button = el('button', 'sound-key'); button.type = 'button'; button.append(el('span', 'symbol', p.symbol)); if (config.labels)
                button.append(el('small', '', p.label)); addHint(button, p.symbol); button.addEventListener('click', () => add(p.symbol)); keys.append(button); });
            group.append(keys);
            keyboard.append(group);
        }
        const actions = el('div', 'game-actions');
        const remove = el('button', 'delete-button', '⌫  Delete');
        const enter = el('button', 'check-button', 'Check guess');
        remove.type = enter.type = 'button';
        actions.append(remove, enter);
        inputPanel.append(actions, hint, restart);
        function render() { board.replaceChildren(); for (let row = 0; row < attempts; row++) {
            const submitted = guesses[row];
            const values = submitted ? submitted.values : (row === guesses.length ? current : []);
            for (let col = 0; col < target.phonemes.length; col++) {
                const state = submitted ? submitted.feedback[col] : '';
                const tile = el('div', 'tile ' + state + (row === guesses.length && !finished ? ' active-row' : ''));
                tile.append(el('span', '', values[col] || ''));
                if (state)
                    tile.append(el('small', 'tile-mark', state === 'correct' ? '✓' : state === 'present' ? '↔' : '−'));
                tile.setAttribute('aria-label', `Guess ${row + 1}, sound ${col + 1}: ${values[col] || 'empty'}${state ? ', ' + ({ correct: 'right place', present: 'in another place', absent: 'not in word' }[state]) : ''}`);
                board.append(tile);
            }
        } progress.textContent = finished ? 'Activity complete' : `Guess ${guesses.length + 1} of ${attempts}`; enter.disabled = finished; remove.disabled = finished || current.length === 0; keyboard.querySelectorAll('button').forEach(b => { b.disabled = finished; }); }
        function add(s) { if (finished)
            return; if (current.length >= target.phonemes.length) {
            announce('Your guess is ready. Select Check guess, or delete a sound to change it.');
            return;
        } current.push(s); if (config.hints)
            hint.textContent = `/${s}/ — ${soundLabel(s)}`; announce(`${current.length} of ${target.phonemes.length} sounds selected.`); render(); }
        function submit() { if (finished)
            return; if (current.length !== target.phonemes.length) {
            announce(`Choose ${target.phonemes.length} sounds before checking your guess.`);
            return;
        } const values = [...current], feedback = scoreGuess(values, target.phonemes); guesses.push({ values, feedback }); current = []; if (feedback.every(s => s === 'correct')) {
            finished = true;
            message.classList.add('success');
            announce(`You found it! /${target.phonemes.join('')}/ = ${target.english.toUpperCase()}. ${guesses.length} ${guesses.length === 1 ? 'guess' : 'guesses'} — well done.`);
        }
        else if (guesses.length === attempts) {
            finished = true;
            announce(`Good practice! The word was /${target.phonemes.join('')}/ = ${target.english.toUpperCase()}. Select Start again to practise it.`);
        }
        else {
            announce(feedback.map((s, i) => `/${values[i]}/: ${s === 'correct' ? 'right place' : s === 'present' ? 'different place' : 'not in word'}`).join('. ') + '. Try your next guess.');
        } render(); }
        enter.addEventListener('click', submit);
        remove.addEventListener('click', () => { current.pop(); announce('Last sound removed.'); render(); });
        document.addEventListener('keydown', event => { if (event.ctrlKey || event.metaKey || event.altKey)
            return; const buttonFocused = document.activeElement?.tagName === 'BUTTON'; if (event.key === 'Enter' && !buttonFocused) {
            event.preventDefault();
            submit();
        }
        else if (event.key === 'Backspace') {
            event.preventDefault();
            if (!finished) {
                current.pop();
                render();
            }
        }
        else if (event.key.length === 1) {
            const p = phonemes.find(p => p.symbol === ({g: 'ɡ', r: 'ɹ'}[event.key.toLowerCase()] || event.key.toLowerCase()));
            if (p) {
                event.preventDefault();
                add(p.symbol);
            }
        } });
        restart.addEventListener('click', () => { guesses = []; current = []; finished = false; message.classList.remove('success'); announce(`A fresh start. Choose ${target.phonemes.length} sounds.`); render(); keyboard.querySelector('button').focus(); });
        render();
        announce(`Ready when you are. Choose ${target.phonemes.length} sounds to begin.`);
    }
    else {
        let start = null;
        let found = [];
        let highlighted = new Set();
        let previewCells = new Set();
        let showAnswers = false;
        const { rows, cols, grid, placements } = puzzle;
        const answerCells = new Set(placements.flatMap(p => p.cells));
        const meta = el('div', 'game-meta');
        const count = el('span', '', '0 of ' + words.length + ' words found');
        meta.append(el('span', '', `${rows} × ${cols} grid`), count);
        root.append(meta);
        const direction = el('p', 'directions', config.difficulty === 'gentle'
            ? 'Look across → and down ↓.'
            : config.difficulty === 'standard'
                ? 'Look across →, down ↓ and diagonally ↘.'
                : 'Look in all eight directions, including backwards.');
        root.append(direction);
        const board = el('div', 'search-board');
        board.style.setProperty('--size', cols);
        board.setAttribute('role', 'group');
        board.setAttribute('aria-label', 'Word search phoneme grid. Drag a straight line or select the first and last tiles. Arrow keys move; Enter or Space selects.');
        let suppressClick = false;
        const buttons = grid.map((symbol, index) => {
            const button = el('button', 'search-cell', symbol);
            button.type = 'button';
            button.tabIndex = index === 0 ? 0 : -1;
            button.setAttribute('data-index', String(index));
            addHint(button, symbol);
            button.setAttribute('aria-label', `Row ${Math.floor(index / cols) + 1}, column ${index % cols + 1}: /${symbol}/${config.hints ? ' ' + soundLabel(symbol) : ''}`);
            button.setAttribute('aria-pressed', 'false');
            button.addEventListener('click', () => {
                if (suppressClick) { suppressClick = false; return; }
                select(index);
            });
            button.addEventListener('keydown', event => {
                let next = index;
                const row = Math.floor(index / cols), col = index % cols;
                if (event.key === 'ArrowRight') next = row * cols + Math.min(col + 1, cols - 1);
                else if (event.key === 'ArrowLeft') next = row * cols + Math.max(col - 1, 0);
                else if (event.key === 'ArrowDown') next = Math.min(row + 1, rows - 1) * cols + col;
                else if (event.key === 'ArrowUp') next = Math.max(row - 1, 0) * cols + col;
                else if (event.key === 'Escape') {
                    start = null;
                    previewCells.clear();
                    announce('Selection cleared. Choose a first tile.');
                    render();
                    return;
                } else return;
                event.preventDefault();
                buttons.forEach((button, i) => { button.tabIndex = i === next ? 0 : -1; });
                buttons[next].focus();
            });
            return button;
        });
        buttons.forEach(button => board.append(button));
        root.append(board, message);
        const list = el('ul', 'search-words');
        const showButton = el('button', 'restart answer-toggle', 'Show answers');
        showButton.type = 'button';
        showButton.setAttribute('aria-pressed', 'false');
        showButton.addEventListener('click', () => {
            showAnswers = !showAnswers;
            showButton.textContent = showAnswers ? 'Hide answers' : 'Show answers';
            showButton.setAttribute('aria-pressed', String(showAnswers));
            announce(showAnswers ? 'Answer guide shown. Find each highlighted word to complete the activity.' : 'Answer guide hidden. Continue your search.');
            render();
        });
        root.append(list, hint, showButton, restart);

        function render() {
            count.textContent = `${found.length} of ${words.length} words found`;
            buttons.forEach((button, i) => {
                button.className = 'search-cell' + (highlighted.has(i) ? ' found' : '')
                    + (showAnswers && answerCells.has(i) ? ' answer' : '')
                    + (previewCells.has(i) ? ' path-preview' : '')
                    + (start === i ? ' selected' : '');
                button.setAttribute('aria-pressed', highlighted.has(i) || start === i ? 'true' : 'false');
            });
            list.replaceChildren();
            words.forEach((word, index) => {
                const complete = found.includes(index);
                const item = el('li', complete ? 'complete' : '');
                item.append(el('span', 'word-status', complete ? '✓' : '○'), el('span', 'ipa', '/' + word.phonemes.join('') + '/'));
                if (config.labels || complete) item.append(el('small', '', word.english));
                if (complete) item.setAttribute('aria-label', `Found: /${word.phonemes.join('')}/, ${word.english}`);
                list.append(item);
            });
        }
        function select(index) {
            if (found.length === words.length) return;
            if (start === null) {
                start = index;
                if (config.hints) hint.textContent = `/${grid[index]}/ — ${soundLabel(grid[index])}`;
                announce(`First sound /${grid[index]}/ selected. Now select the last tile. Select the same tile to cancel.`);
                render();
                return;
            }
            if (start === index) {
                start = null;
                announce('Selection cleared. Choose a first tile.');
                render();
                return;
            }
            const cells = selectionLine(start, index, cols);
            start = null;
            const sounds = cells.map(i => grid[i]).join('|');
            const reverse = [...cells].reverse().map(i => grid[i]).join('|');
            const match = words.findIndex(word => word.phonemes.join('|') === sounds || word.phonemes.join('|') === reverse);
            if (match < 0) {
                announce('That is not one of the listed words. Try another straight line.');
            } else if (found.includes(match)) {
                announce('You have already found ' + words[match].english + '. Look for another word.');
            } else {
                found.push(match);
                cells.forEach(cell => highlighted.add(cell));
                announce(`Found /${words[match].phonemes.join('')}/ = ${words[match].english.toUpperCase()}! ${words.length - found.length} words to go.`);
                if (found.length === words.length) {
                    message.classList.add('success');
                    announce(`All ${words.length} words found! ` + words.map(word => `/${word.phonemes.join('')}/ = ${word.english}`).join(', ') + '. Well done.');
                }
            }
            render();
        }

        // Pointer capture keeps drag order correct in every direction, including
        // reverse drags. The two-click and keyboard workflows remain available.
        let pointerAnchor = null, pointerEnd = null, dragged = false;
        function cellAt(element) {
            const cell = element?.closest?.('button[data-index]');
            if (!cell || !board.contains(cell)) return null;
            return Number(cell.getAttribute('data-index'));
        }
        board.addEventListener('pointerdown', event => {
            if (event.button !== 0 || event.isPrimary === false || found.length === words.length) return;
            const index = cellAt(event.target);
            if (index === null) return;
            pointerAnchor = index;
            pointerEnd = index;
            dragged = false;
            buttons[index].setPointerCapture?.(event.pointerId);
        });
        board.addEventListener('pointermove', event => {
            if (pointerAnchor === null) return;
            const index = cellAt(document.elementFromPoint(event.clientX, event.clientY));
            if (index === null) return;
            pointerEnd = index;
            if (index !== pointerAnchor) dragged = true;
            previewCells = new Set(selectionLine(pointerAnchor, pointerEnd, cols));
            render();
        });
        board.addEventListener('pointerup', () => {
            if (pointerAnchor === null) return;
            if (dragged) {
                start = pointerAnchor;
                previewCells.clear();
                select(pointerEnd);
                suppressClick = true;
                setTimeout(() => { suppressClick = false; }, 0);
            }
            pointerAnchor = pointerEnd = null;
            dragged = false;
            previewCells.clear();
            render();
        });
        board.addEventListener('pointercancel', () => {
            pointerAnchor = pointerEnd = null;
            dragged = false;
            previewCells.clear();
            render();
        });
        restart.addEventListener('click', () => {
            start = null;
            found = [];
            highlighted = new Set();
            previewCells.clear();
            showAnswers = false;
            showButton.textContent = 'Show answers';
            showButton.setAttribute('aria-pressed', 'false');
            message.classList.remove('success');
            announce('A fresh search. Drag along a word or select its first and last tiles.');
            render();
            buttons[0].focus();
        });
        render();
        announce('Select the first tile of a word, or drag along its sounds.');
    }
}
