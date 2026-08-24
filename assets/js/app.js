    (() => {
      "use strict";

      const EXERCISE_SETS = [
        {
          id: "add10",
          label: "Addition bis 10",
          description: "Addition und passende Subtraktion mit Ergebnis bis 10.",
          type: "addition",
          limit: 10,
          carry: "any",
          complexity: 1
        },
        {
          id: "add20NoCarry",
          label: "Addition bis 20 - ohne Zehnerüberschreitung",
          description: "Aufgaben bis 20, bei denen die Einer nicht über 9 gehen.",
          type: "addition",
          limit: 20,
          carry: "without",
          complexity: 2
        },
        {
          id: "add20Carry",
          label: "Addition bis 20 - mit Zehnerüberschreitung",
          description: "Aufgaben bis 20, bei denen im Einerbereich gebündelt wird.",
          type: "addition",
          limit: 20,
          carry: "with",
          complexity: 2
        },
        {
          id: "add100NoCarry",
          label: "Addition bis 100 - ohne Zehnerüberschreitung",
          description: "Zweistellige Aufgaben ohne Übertrag in der Einerstelle.",
          type: "addition",
          limit: 100,
          carry: "without",
          complexity: 3
        },
        {
          id: "add100Carry",
          label: "Addition bis 100 - mit Zehnerüberschreitung",
          description: "Zweistellige Aufgaben mit Übertrag in der Einerstelle.",
          type: "addition",
          limit: 100,
          carry: "with",
          complexity: 3
        },
        {
          id: "multiplyDivide10",
          label: "Malrechnen/Dividieren bis 10",
          description: "Malaufgaben und passende Teilaufgaben mit Faktoren von 1 bis 10.",
          type: "multiplication",
          complexity: 3
        }
      ];

      const THEMES = {
        simple: {
          id: "simple",
          label: "Simple",
          description: "Klar, ruhig und ohne Ablenkung.",
          className: "theme-simple",
          swatch: "simple",
          ratingClass: "star",
          ratingSingular: "Stern",
          ratingPlural: "Sterne"
        },
        frozen: {
          id: "frozen",
          label: "Frozen",
          description: "Kühle Winterfarben und leichte Fantasy-Formen.",
          className: "theme-frozen",
          swatch: "frozen",
          ratingClass: "snowflake",
          ratingSingular: "Schneeflocke",
          ratingPlural: "Schneeflocken"
        },
        minecraft: {
          id: "minecraft",
          label: "Minecraft",
          description: "Blockige Formen, klare Kanten und Pixel-Anmutung.",
          className: "theme-minecraft",
          swatch: "minecraft",
          ratingClass: "cube",
          ratingSingular: "Erdwürfel",
          ratingPlural: "Erdwürfel"
        }
      };

      const ADDITION_TEMPLATES = [
        {
          id: "sum",
          render: ({ a, b }) => `${a} + ${b} = ?`,
          answer: ({ c }) => c
        },
        {
          id: "rightAddend",
          render: ({ a, c }) => `${a} + ? = ${c}`,
          answer: ({ b }) => b
        },
        {
          id: "leftAddend",
          render: ({ b, c }) => `? + ${b} = ${c}`,
          answer: ({ a }) => a
        },
        {
          id: "subtractResult",
          render: ({ c, a }) => `${c} - ${a} = ?`,
          answer: ({ b }) => b
        },
        {
          id: "subtractPart",
          render: ({ c, b }) => `${c} - ? = ${b}`,
          answer: ({ a }) => a
        }
      ];

      const MULTIPLICATION_TEMPLATES = [
        {
          id: "product",
          render: ({ a, b }) => `${a} × ${b} = ?`,
          answer: ({ c }) => c
        },
        {
          id: "rightFactor",
          render: ({ a, c }) => `${a} × ? = ${c}`,
          answer: ({ b }) => b
        },
        {
          id: "leftFactor",
          render: ({ b, c }) => `? × ${b} = ${c}`,
          answer: ({ a }) => a
        },
        {
          id: "divisionResult",
          render: ({ c, a }) => `${c} ÷ ${a} = ?`,
          answer: ({ b }) => b
        },
        {
          id: "divisionPart",
          render: ({ c, b }) => `${c} ÷ ? = ${b}`,
          answer: ({ a }) => a
        }
      ];

      const setById = new Map(EXERCISE_SETS.map((set) => [set.id, set]));
      const additionCandidates = new Map();
      const multiplicationCandidates = buildMultiplicationCandidates();
      const FAST_SOLVE_MS = 8000;
      const REDUCED_ANSWER_INTERVAL = 20;

      const els = {
        setupScreen: document.querySelector("#setupScreen"),
        playScreen: document.querySelector("#playScreen"),
        resultsScreen: document.querySelector("#resultsScreen"),
        setupForm: document.querySelector("#setupForm"),
        setOptions: document.querySelector("#setOptions"),
        themeOptions: document.querySelector("#themeOptions"),
        setupError: document.querySelector("#setupError"),
        limitValue: document.querySelector("#limitValue"),
        limitValueLabel: document.querySelector("#limitValueLabel"),
        limitUnit: document.querySelector("#limitUnit"),
        scoreText: document.querySelector("#scoreText"),
        streakText: document.querySelector("#streakText"),
        limitToggle: document.querySelector("#limitToggle"),
        limitInfo: document.querySelector("#limitInfo"),
        limitInfoLabel: document.querySelector("#limitInfoLabel"),
        limitInfoValue: document.querySelector("#limitInfoValue"),
        endSessionButton: document.querySelector("#endSessionButton"),
        playPanel: document.querySelector("#playPanel"),
        equationText: document.querySelector("#equationText"),
        answerForm: document.querySelector("#answerForm"),
        answerInput: document.querySelector("#answerInput"),
        answerButton: document.querySelector("#answerButton"),
        feedbackText: document.querySelector("#feedbackText"),
        replayButton: document.querySelector("#replayButton"),
        changeSettingsButton: document.querySelector("#changeSettingsButton"),
        stars: document.querySelector("#stars"),
        childScore: document.querySelector("#childScore"),
        childBestStreak: document.querySelector("#childBestStreak"),
        childAverage: document.querySelector("#childAverage"),
        childRate: document.querySelector("#childRate"),
        parentTotalTime: document.querySelector("#parentTotalTime"),
        parentAverage: document.querySelector("#parentAverage"),
        parentScore: document.querySelector("#parentScore"),
        parentBestStreak: document.querySelector("#parentBestStreak"),
        detailRows: document.querySelector("#detailRows")
      };

      const state = {
        settings: null,
        session: null,
        completedSession: null,
        revealLimit: false,
        advanceTimer: null
      };

      init();

      function init() {
        renderSetupOptions();
        wireEvents();
        updateLimitInput();
        applyTheme("simple");
      }

      function renderSetupOptions() {
        const setFragment = document.createDocumentFragment();
        EXERCISE_SETS.forEach((set, index) => {
          const label = document.createElement("label");
          label.className = "choice-card";
          label.innerHTML = `
            <input type="checkbox" name="sets" value="${set.id}" ${index === 0 ? "checked" : ""}>
            <span class="choice-inner">
              <span class="check-indicator" aria-hidden="true"></span>
              <span>
                <span class="choice-title">${set.label}</span>
                <span class="choice-description">${set.description}</span>
              </span>
            </span>
          `;
          setFragment.appendChild(label);
        });
        els.setOptions.appendChild(setFragment);

        const themeFragment = document.createDocumentFragment();
        Object.values(THEMES).forEach((theme) => {
          const label = document.createElement("label");
          label.className = "choice-card";
          label.innerHTML = `
            <input type="radio" name="theme" value="${theme.id}" ${theme.id === "simple" ? "checked" : ""}>
            <span class="choice-inner">
              <span class="theme-swatch ${theme.swatch}" aria-hidden="true"></span>
              <span>
                <span class="choice-title">${theme.label}</span>
                <span class="choice-description">${theme.description}</span>
              </span>
            </span>
          `;
          themeFragment.appendChild(label);
        });
        els.themeOptions.appendChild(themeFragment);
      }

      function wireEvents() {
        els.setupForm.addEventListener("submit", (event) => {
          event.preventDefault();
          const settings = readSettings();
          if (!settings) {
            return;
          }
          startSession(settings);
        });

        document.querySelectorAll("input[name='limitMode']").forEach((input) => {
          input.addEventListener("change", updateLimitInput);
        });

        document.querySelectorAll("input[name='theme']").forEach((input) => {
          input.addEventListener("change", () => {
            if (input.checked) {
              applyTheme(input.value);
            }
          });
        });

        els.answerInput.addEventListener("input", () => {
          els.answerInput.value = els.answerInput.value.replace(/[^\d]/g, "");
        });

        els.answerForm.addEventListener("submit", (event) => {
          event.preventDefault();
          submitAnswer();
        });

        els.limitToggle.addEventListener("click", () => {
          state.revealLimit = !state.revealLimit;
          updateHud();
        });

        els.endSessionButton.addEventListener("click", () => {
          finishSession();
        });

        els.replayButton.addEventListener("click", () => {
          if (state.completedSession) {
            startSession(state.completedSession.settings);
          }
        });

        els.changeSettingsButton.addEventListener("click", () => {
          if (state.completedSession) {
            restoreSettings(state.completedSession.settings);
          }
          showScreen("setup");
          setTimeout(() => {
            els.setupForm.querySelector("input[name='sets']")?.focus();
          }, 0);
        });
      }

      function updateLimitInput() {
        const mode = document.querySelector("input[name='limitMode']:checked")?.value || "time";
        if (mode === "time") {
          els.limitValueLabel.textContent = "Minuten";
          els.limitUnit.textContent = "Min.";
          if (!els.limitValue.value || Number(els.limitValue.value) > 90) {
            els.limitValue.value = "5";
          }
        } else {
          els.limitValueLabel.textContent = "Aufgaben";
          els.limitUnit.textContent = "Stk.";
          if (!els.limitValue.value || Number(els.limitValue.value) < 1) {
            els.limitValue.value = "10";
          }
        }
      }

      function readSettings() {
        const sets = [...document.querySelectorAll("input[name='sets']:checked")].map((input) => input.value);
        const theme = document.querySelector("input[name='theme']:checked")?.value;
        const limitMode = document.querySelector("input[name='limitMode']:checked")?.value || "time";
        const limitRaw = els.limitValue.value.trim();

        if (!sets.length) {
          setSetupError("Bitte mindestens eine Aufgabenart auswählen.");
          return null;
        }

        if (!theme || !THEMES[theme]) {
          setSetupError("Bitte ein Thema auswählen.");
          return null;
        }

        if (!/^[1-9]\d*$/.test(limitRaw)) {
          setSetupError("Bitte eine positive ganze Zahl eingeben.");
          els.limitValue.focus();
          return null;
        }

        setSetupError("");
        return {
          sets,
          theme,
          limitMode,
          limitValue: Number(limitRaw)
        };
      }

      function restoreSettings(settings) {
        document.querySelectorAll("input[name='sets']").forEach((input) => {
          input.checked = settings.sets.includes(input.value);
        });
        const themeInput = document.querySelector(`input[name='theme'][value='${settings.theme}']`);
        if (themeInput) {
          themeInput.checked = true;
        }
        const modeInput = document.querySelector(`input[name='limitMode'][value='${settings.limitMode}']`);
        if (modeInput) {
          modeInput.checked = true;
        }
        els.limitValue.value = String(settings.limitValue);
        updateLimitInput();
        applyTheme(settings.theme);
      }

      function setSetupError(message) {
        els.setupError.textContent = message;
      }

      function applyTheme(themeId) {
        const theme = THEMES[themeId] || THEMES.simple;
        Object.values(THEMES).forEach((entry) => document.body.classList.remove(entry.className));
        document.body.classList.add(theme.className);
      }

      function startSession(settings) {
        clearTimers();
        state.settings = { ...settings, sets: [...settings.sets] };
        state.revealLimit = false;
        applyTheme(settings.theme);

        const now = performance.now();
        state.session = {
          settings: state.settings,
          startTime: now,
          endTime: null,
          deadline: settings.limitMode === "time" ? now + settings.limitValue * 60 * 1000 : null,
          currentTask: null,
          taskStartTime: null,
          details: [],
          correct: 0,
          incorrect: 0,
          streak: 0,
          bestStreak: 0,
          usedKeys: new Set(),
          reducedAnswerCount: 0,
          locked: false,
          interval: null,
          finished: false
        };

        if (settings.limitMode === "time") {
          state.session.interval = window.setInterval(() => {
            updateHud();
            if (timeRemainingMs() <= 0) {
              finishSession();
            }
          }, 250);
        }

        showScreen("play");
        nextTask();
      }

      function nextTask() {
        const session = state.session;
        if (!session || session.finished) {
          return;
        }

        if (shouldEndSession()) {
          finishSession();
          return;
        }

        session.currentTask = generateTask(
          session.settings.sets,
          session.usedKeys,
          session.details.length,
          session.reducedAnswerCount
        );
        session.taskStartTime = performance.now();
        session.locked = false;
        els.equationText.textContent = session.currentTask.display;
        els.answerInput.value = "";
        els.answerInput.disabled = false;
        els.answerButton.disabled = false;
        els.feedbackText.textContent = "";
        els.playPanel.classList.remove("correct-flash", "wrong-flash", "fast-correct");
        updateHud();
        setTimeout(() => els.answerInput.focus(), 0);
      }

      function submitAnswer() {
        const session = state.session;
        if (!session || session.finished || session.locked) {
          return;
        }

        if (session.settings.limitMode === "time" && timeRemainingMs() <= 0) {
          finishSession();
          return;
        }

        const raw = els.answerInput.value.trim();
        if (!/^\d+$/.test(raw)) {
          els.feedbackText.textContent = "Bitte eine Zahl eingeben.";
          els.playPanel.classList.remove("wrong-flash", "fast-correct");
          void els.playPanel.offsetWidth;
          els.playPanel.classList.add("wrong-flash");
          els.answerInput.focus();
          return;
        }

        session.locked = true;
        els.answerInput.disabled = true;
        els.answerButton.disabled = true;

        const submitted = Number(raw);
        const task = session.currentTask;
        const correct = submitted === task.answer;
        const durationMs = Math.max(0, performance.now() - session.taskStartTime);
        const fastCorrect = correct && durationMs < FAST_SOLVE_MS;

        session.details.push({
          number: session.details.length + 1,
          task: task.display,
          submitted,
          correctAnswer: task.answer,
          correct,
          durationMs
        });
        if (isReducedAnswer(task.answer)) {
          session.reducedAnswerCount += 1;
        }

        if (correct) {
          session.correct += 1;
          session.streak += 1;
          session.bestStreak = Math.max(session.bestStreak, session.streak);
          els.feedbackText.textContent = fastCorrect ? "Richtig und schnell." : "Richtig.";
          els.playPanel.classList.add("correct-flash");
          if (fastCorrect) {
            els.playPanel.classList.add("fast-correct");
          }
        } else {
          session.incorrect += 1;
          session.streak = 0;
          els.feedbackText.textContent = "Weiter.";
          els.playPanel.classList.add("wrong-flash");
        }

        updateHud();
        const delay = fastCorrect ? 820 : correct ? 620 : 420;
        state.advanceTimer = window.setTimeout(() => {
          state.advanceTimer = null;
          if (!state.session || state.session.finished) {
            return;
          }
          if (shouldEndSession()) {
            finishSession();
          } else {
            nextTask();
          }
        }, delay);
      }

      function shouldEndSession() {
        const session = state.session;
        if (!session) {
          return true;
        }
        if (session.settings.limitMode === "tasks") {
          return session.details.length >= session.settings.limitValue;
        }
        return timeRemainingMs() <= 0;
      }

      function finishSession() {
        const session = state.session;
        if (!session || session.finished) {
          return;
        }

        session.finished = true;
        session.endTime = performance.now();
        clearTimers();
        els.answerInput.disabled = false;
        els.answerButton.disabled = false;

        const completed = {
          settings: { ...session.settings, sets: [...session.settings.sets] },
          details: session.details.map((detail) => ({ ...detail })),
          correct: session.correct,
          incorrect: session.incorrect,
          bestStreak: session.bestStreak,
          elapsedMs: Math.max(0, session.endTime - session.startTime)
        };

        state.completedSession = completed;
        state.session = null;
        renderResults(completed);
        showScreen("results");
        setTimeout(() => els.replayButton.focus(), 0);
      }

      function clearTimers() {
        if (state.advanceTimer) {
          window.clearTimeout(state.advanceTimer);
          state.advanceTimer = null;
        }
        if (state.session?.interval) {
          window.clearInterval(state.session.interval);
          state.session.interval = null;
        }
      }

      function updateHud() {
        const session = state.session;
        if (!session) {
          return;
        }

        els.scoreText.textContent = `${session.correct} / ${session.details.length}`;
        els.streakText.textContent = String(session.streak);

        els.limitToggle.classList.toggle("is-active", state.revealLimit);
        els.limitToggle.setAttribute("aria-pressed", String(state.revealLimit));
        els.limitToggle.setAttribute("aria-label", state.revealLimit ? "Limit ausblenden" : "Limit anzeigen");
        els.limitToggle.title = state.revealLimit ? "Limit ausblenden" : "Limit anzeigen";
        els.limitInfo.classList.toggle("hidden", !state.revealLimit);

        if (session.settings.limitMode === "time") {
          els.limitInfoLabel.textContent = "Zeit";
          els.limitInfoValue.textContent = formatClock(timeRemainingMs());
        } else {
          const remaining = Math.max(0, session.settings.limitValue - session.details.length);
          els.limitInfoLabel.textContent = "Noch";
          els.limitInfoValue.textContent = `${remaining}`;
        }
      }

      function timeRemainingMs() {
        const session = state.session;
        if (!session || session.settings.limitMode !== "time") {
          return 0;
        }
        return Math.max(0, session.deadline - performance.now());
      }

      function renderResults(session) {
        const attempted = session.details.length;
        const correct = session.correct;
        const correctRate = attempted ? correct / attempted : 0;
        const averageMs = attempted
          ? session.details.reduce((sum, detail) => sum + detail.durationMs, 0) / attempted
          : 0;
        const stars = getStars(correctRate);
        const theme = THEMES[session.settings.theme] || THEMES.simple;
        const ratingLabel = stars === 1 ? theme.ratingSingular : theme.ratingPlural;

        els.stars.replaceChildren();
        els.stars.setAttribute("aria-label", `${stars} ${ratingLabel}`);
        for (let index = 0; index < 3; index += 1) {
          const star = document.createElement("span");
          star.className = `rating-icon ${theme.ratingClass}`;
          if (index >= stars) {
            star.classList.add("star-empty");
          }
          els.stars.appendChild(star);
        }

        els.childScore.textContent = `${correct} / ${attempted}`;
        els.childBestStreak.textContent = String(session.bestStreak);
        els.childAverage.textContent = formatSeconds(averageMs);
        els.childRate.textContent = `${Math.round(correctRate * 100)}%`;

        els.parentTotalTime.textContent = formatLongDuration(session.elapsedMs);
        els.parentAverage.textContent = formatSeconds(averageMs);
        els.parentScore.textContent = `${correct} / ${attempted}`;
        els.parentBestStreak.textContent = String(session.bestStreak);

        els.detailRows.replaceChildren();
        session.details.forEach((detail) => {
          const row = document.createElement("tr");
          appendCell(row, String(detail.number));
          appendCell(row, detail.task);
          appendCell(row, String(detail.submitted));
          appendCell(row, String(detail.correctAnswer));
          const resultCell = appendCell(row, detail.correct ? "richtig" : "nicht richtig");
          resultCell.className = detail.correct ? "result-correct" : "result-wrong";
          appendCell(row, formatSeconds(detail.durationMs));
          els.detailRows.appendChild(row);
        });
      }

      function appendCell(row, text) {
        const cell = document.createElement("td");
        cell.textContent = text;
        row.appendChild(cell);
        return cell;
      }

      function getStars(rate) {
        if (rate >= 0.9) {
          return 3;
        }
        if (rate >= 0.7) {
          return 2;
        }
        if (rate >= 0.5) {
          return 1;
        }
        return 0;
      }

      function showScreen(name) {
        els.setupScreen.classList.toggle("hidden", name !== "setup");
        els.playScreen.classList.toggle("hidden", name !== "play");
        els.resultsScreen.classList.toggle("hidden", name !== "results");
      }

      function generateTask(selectedSets, usedKeys, completedCount, reducedAnswerCount) {
        const weightedSets = buildWeightedSetIds(selectedSets);
        const reducedAnswersAllowed = shouldAllowReducedAnswer(completedCount, reducedAnswerCount);
        let fallback = null;
        let uniqueFallback = null;
        for (let attempt = 0; attempt < 400; attempt += 1) {
          const setId = randomItem(weightedSets);
          const set = setById.get(setId) || EXERCISE_SETS[0];
          const task = set.type === "multiplication"
            ? generateMultiplicationTask(set.id)
            : generateAdditionTask(set);

          fallback = fallback || task;
          if (!usedKeys.has(task.key)) {
            uniqueFallback = uniqueFallback || task;
          }
          if (isReducedAnswer(task.answer) && !reducedAnswersAllowed) {
            continue;
          }
          if (!usedKeys.has(task.key)) {
            usedKeys.add(task.key);
            return task;
          }
        }

        const task = uniqueFallback || fallback || generateAdditionTask(EXERCISE_SETS[0]);
        usedKeys.add(task.key);
        return task;
      }

      function generateAdditionTask(set) {
        const candidates = getAdditionCandidates(set);
        const base = randomItem(candidates);
        const template = randomItem(ADDITION_TEMPLATES);
        const display = template.render(base);
        const answer = template.answer(base);
        return {
          display,
          answer,
          key: `${set.id}:${template.id}:${base.a}:${base.b}:${base.c}`
        };
      }

      function generateMultiplicationTask(setId) {
        const base = randomItem(multiplicationCandidates);
        const template = randomItem(MULTIPLICATION_TEMPLATES);
        const display = template.render(base);
        const answer = template.answer(base);
        return {
          display,
          answer,
          key: `${setId}:${template.id}:${base.a}:${base.b}:${base.c}`
        };
      }

      function getAdditionCandidates(set) {
        if (!additionCandidates.has(set.id)) {
          additionCandidates.set(set.id, buildAdditionCandidates(set.limit, set.carry));
        }
        return additionCandidates.get(set.id);
      }

      function buildAdditionCandidates(limit, carry) {
        const candidates = [];
        for (let a = 1; a <= limit; a += 1) {
          for (let b = 1; b <= limit; b += 1) {
            const c = a + b;
            if (c > limit) {
              continue;
            }

            const onesSum = (a % 10) + (b % 10);
            if (carry === "with" && onesSum <= 10) {
              continue;
            }
            if (carry === "without" && onesSum >= 10) {
              continue;
            }

            candidates.push({ a, b, c });
          }
        }
        return candidates;
      }

      function buildMultiplicationCandidates() {
        const candidates = [];
        for (let a = 1; a <= 10; a += 1) {
          for (let b = 1; b <= 10; b += 1) {
            candidates.push({ a, b, c: a * b });
          }
        }
        return candidates;
      }

      function buildWeightedSetIds(selectedSets) {
        const knownSets = selectedSets
          .map((setId) => setById.get(setId))
          .filter(Boolean);
        if (!knownSets.length) {
          return [EXERCISE_SETS[0].id];
        }

        const minComplexity = Math.min(...knownSets.map((set) => set.complexity || 1));
        return knownSets.flatMap((set) => {
          const relativeComplexity = Math.max(0, (set.complexity || 1) - minComplexity);
          const weight = 2 ** relativeComplexity;
          return Array.from({ length: weight }, () => set.id);
        });
      }

      function shouldAllowReducedAnswer(completedCount, reducedAnswerCount) {
        return Math.floor((completedCount + 1) / REDUCED_ANSWER_INTERVAL) > reducedAnswerCount;
      }

      function isReducedAnswer(answer) {
        return answer === 0 || answer === 1 || answer % 10 === 0;
      }

      function randomItem(items) {
        return items[Math.floor(Math.random() * items.length)];
      }

      function formatSeconds(ms) {
        const seconds = Math.max(0, ms / 1000);
        return `${seconds.toFixed(1).replace(".", ",")} s`;
      }

      function formatLongDuration(ms) {
        const totalSeconds = Math.max(0, Math.round(ms / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        if (minutes <= 0) {
          return `${seconds} s`;
        }
        return `${minutes} Min. ${String(seconds).padStart(2, "0")} s`;
      }

      function formatClock(ms) {
        const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${String(seconds).padStart(2, "0")}`;
      }
    })();
