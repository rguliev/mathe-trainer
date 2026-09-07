# Mathe-Trainer — Implementation Specification

## 1. Goal

Build a small, offline-friendly web app for grade-school children to practice arithmetic. A parent configures each session, then the child solves one task at a time. The app should be motivating, simple, and optimized for both tablets and laptops.

## 2. Core Constraints

* **UI language:** German.
* **Primary devices:** tablets and laptops.
* **Input style:** typed numeric answers only; no multiple-choice.
* **Profiles:** no user accounts, saved profiles, or child-specific history.
* **Backend:** none.
* **Preferred delivery:** static GitHub Pages app with local HTML/CSS/JS/assets and no external dependencies.
* **Responsive design:** the application must adapt gracefully to different screen sizes and input methods (touch and keyboard/mouse).

## 3. User Flow

1. Parent chooses exercise sets, visual theme, and session limit.
2. Child solves one exercise at a time.
3. App shows a results screen with a child summary first and parent details below.
4. Child or parent can replay with the same settings.

## 4. Parent Setup Screen

### Exercise Sets

All selected sets are mixed randomly during the session. More complex selected sets are weighted higher; each complexity step doubles that set's chance relative to the simplest selected set. For example, multiplication appears about twice as often as addition up to 20 when both are selected.

| Set                                          | Description                                             |
| -------------------------------------------- | ------------------------------------------------------- |
| Addition bis 10                              | Addition/inverse subtraction with result up to 10       |
| Addition bis 20 — ohne Zehnerüberschreitung  | Addition up to 20 without carrying                      |
| Addition bis 20 — mit Zehnerüberschreitung   | Addition up to 20 with carrying                         |
| Addition bis 100 — ohne Zehnerüberschreitung | Addition up to 100 without carrying in the ones place   |
| Addition bis 100 — mit Zehnerüberschreitung  | Addition up to 100 with carrying in the ones place      |
| Malrechnen/Dividieren bis 10                 | Multiplication and exact division based on factors 1–10 |

### Theme Selection

The parent chooses one visual theme for the session.

| Theme     | Description                                                              |
| --------- | ------------------------------------------------------------------------ |
| Simple    | Clean, minimal, distraction-free design                                  |
| Frozen    | Frozen-inspired winter/fantasy theme with icy colors and playful visuals |
| Minecraft | Blocky, pixel-inspired theme with Minecraft-like aesthetics              |

Requirements:

* Theme selection affects colors, typography, decorations, animations, and illustrations where applicable.
* Gameplay, exercise generation, scoring, and functionality remain identical across themes.
* Themes must be implemented through a modular theme system so additional themes can be added later without changing core application logic.
* If a theme-specific asset is unavailable, the app should gracefully fall back to the Simple theme.

### Session Limit

The parent chooses exactly one mode:

| Mode            | Input                        |
| --------------- | ---------------------------- |
| Zeitlimit       | Positive number of minutes   |
| Anzahl Aufgaben | Positive number of exercises |

Validation:

* At least one exercise set must be selected.
* A theme must be selected.
* The selected limit value must be a positive integer.
* A large **„Start“** button begins the child session.

## 5. Exercise Generation

### Addition-Based Sets

Canonical form: `a + b = c`.

Allowed templates:

| Template     | Expected answer |
| ------------ | --------------- |
| `a + b = __` | `c`             |
| `a + __ = c` | `b`             |
| `__ + b = c` | `a`             |
| `c - a = __` | `b`             |
| `c - __ = b` | `a`             |

Rules:

* `c` must stay within the selected set limit: 10, 20, or 100.
* No generated answer should be negative.
* Addition sets up to 20 select from `assets/js/addition-triplets.js`: all sorted triplets `0 <= a <= b`, `a + b = c <= 20`, with each fact listed once. Filter by the selected limit and crossing rule first. Triplets containing 0, 1, or 10 have relative weight 1/5; all others have weight 1. For crossing-10 sets up to 20, multiply the weight by 0.375 when either addend is 9 (20% total probability before repetition checks). Randomly swap the addends after selecting a triplet, then choose the task template and apply the usual repetition and reduced-answer checks.
* For “mit Zehnerüberschreitung”, `(a % 10) + (b % 10) > 10`.
* For “ohne Zehnerüberschreitung”, `(a % 10) + (b % 10) < 10`.
* Tasks with reduced answers (`0`, `1`, or multiples of `10`) should appear at most about once per 20 tasks.

### Multiplication/Division Set

Canonical form: `a × b = c`, where `a` and `b` are factors from 1 to 10.

Allowed templates:

| Template     | Expected answer |
| ------------ | --------------- |
| `a × b = __` | `c`             |
| `a × __ = c` | `b`             |
| `__ × b = c` | `a`             |
| `c ÷ a = __` | `b`             |
| `c ÷ __ = b` | `a`             |

Rules:

* Division tasks must always have whole-number answers.
* Mix multiplication and division variants randomly.
* Avoid duplicate exercises within a session where practical.

## 6. Child Exercise Screen

Required behavior:

* Show one exercise at a time.
* Use large centered exercise text, at least `32px`.
* Provide a large numeric input field.
* Submit by pressing **Enter** or tapping a large confirm button.
* On correct answer: record success, increment score/streak, show a small positive animation, move to next task.
* On wrong answer: record failure, reset streak, briefly shake/flash input, move to next task immediately.
* No retry after a wrong answer.
* Track duration per exercise from display until submission.
* Apply the selected theme consistently throughout the session.

### Live HUD

| Element                       | Visibility                                                  |
| ----------------------------- | ----------------------------------------------------------- |
| Score, e.g. `Richtig: 7 / 10` | Always visible                                              |
| Current streak                | Always visible                                              |
| Timer or remaining task count | Hidden by default; child can show/hide via small eye toggle |

The timer/count is hidden by default because it may stress children.

## 7. Session End Conditions

End the session when the selected limit is reached:

* **Zeitlimit:** end when time expires.
* **Anzahl Aufgaben:** end after the configured number of submitted answers.

Always record:

* Total elapsed time.
* Number of tasks attempted.
* Number correct/incorrect.
* Longest streak.
* Average time per task.
* Per-task details.

## 8. Results Screen

The replay button must be at the very top.

### Child Section

Show:

* Star rating.
* Correct answers / total answers.
* Longest streak.
* Average time per task.

Star thresholds:

| Stars | Correct rate |
| ----- | ------------ |
| 3     | `>= 90%`     |
| 2     | `>= 70%`     |
| 1     | `>= 50%`     |
| 0     | `< 50%`      |

### Parent Section

Show a detailed review table:

| Field    | Description                 |
| -------- | --------------------------- |
| #        | Task number                 |
| Aufgabe  | Rendered exercise           |
| Antwort  | Child’s submitted answer    |
| Richtig  | Correct answer              |
| Ergebnis | Correct/incorrect indicator |
| Zeit     | Time spent on task          |

Also show:

* Total session time.
* Average time per task.
* Final score.
* Longest streak.

## 9. UX Requirements

* Friendly, calm, child-oriented visual design.
* Responsive and adaptive layout that works well on tablets and laptops.
* Tablet portrait layout without horizontal scrolling.
* Efficient use of larger laptop screens without excessive empty space.
* Large tap targets and readable typography.
* Support both touch interaction and keyboard/mouse input.
* Positive animations for correct answers.
* Neutral, non-punitive feedback for wrong answers.
* Theme-specific styling should enhance engagement without reducing readability or usability.
* All themes must maintain sufficient contrast and accessibility for children.

## 10. Out of Scope

* User accounts.
* Saved child profiles.
* Long-term progress tracking.
* Backend or network dependency.
* Sound effects.
* Adaptive difficulty.
* Leaderboards or competitive features.

## 11. Acceptance Criteria

* All six exercise sets can be selected and mixed.
* Theme selection is available during setup.
* The app includes Simple, Frozen, and Minecraft themes.
* Themes can be extended in the future without modifying exercise or session logic.
* Both session modes work: time limit and task count.
* All task templates generate valid, answerable exercises.
* Division tasks always produce integer answers.
* Wrong answers are counted and skipped immediately.
* Score and streak are always visible during play.
* Timer/count is hidden by default and toggleable during play.
* Results screen includes both child summary and parent detail table.
* The selected theme is applied consistently across setup, gameplay, and results screens.
* Layout and usability remain effective on common tablet and laptop screen sizes.
* App works offline after loading and requires no backend.
