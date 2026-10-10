(() => {
  const $ = (id) => document.getElementById(id);
  const screens = [$('start-screen'), $('quiz-screen'), $('result-screen')];
  let questionIndex = 0;
  let score = 0;
  let answers = [];
  let answered = false;
  let secondsLeft = 20;
  let timerInterval = null;
  let audioContext = null;

  function startSoundEngine() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioContext) audioContext = new AudioContextClass();
    if (audioContext.state === 'suspended') audioContext.resume();
  }

  function playTone(frequency, startAt, duration, type = 'square', volume = 0.045) {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.02);
  }

  function playAnswerSound(isCorrect) {
    startSoundEngine();
    if (!audioContext) return;
    const now = audioContext.currentTime;
    if (isCorrect) {
      playTone(660, now, 0.12);
      playTone(880, now + 0.105, 0.18);
      playTone(1100, now + 0.235, 0.2);
    } else {
      playTone(330, now, 0.16, 'square', 0.04);
      playTone(220, now + 0.15, 0.24, 'square', 0.04);
    }
  }

  function stopTimer() {
    if (timerInterval !== null) {
      window.clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  function startTimer() {
    stopTimer();
    secondsLeft = 20;
    updateTimerDisplay();
    timerInterval = window.setInterval(() => {
      secondsLeft -= 1;
      updateTimerDisplay();
      if (secondsLeft <= 0) resolveAnswer(null, true);
    }, 1000);
  }

  function updateTimerDisplay() {
    $('countdown').textContent = String(secondsLeft).padStart(2, '0');
    $('timer-fill').style.width = `${Math.max(0, secondsLeft / 20 * 100)}%`;
    $('countdown').classList.toggle('timer-low', secondsLeft <= 5);
  }

  function showScreen(target) {
    screens.forEach((screen) => { screen.hidden = screen !== target; });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startGame() {
    startSoundEngine();
    questionIndex = 0;
    score = 0;
    answers = [];
    showScreen($('quiz-screen'));
    renderQuestion();
  }

  function renderQuestion() {
    answered = false;
    const question = window.quizQuestions[questionIndex];
    const number = questionIndex + 1;
    $('stage-label').innerHTML = `STAGE ${String(Math.ceil(number / 2)).padStart(2, '0')} <span class="eyebrow-jp">${question.stage}</span>`;
    $('question-count').innerHTML = `${String(number).padStart(2, '0')} <small>/ ${window.quizQuestions.length}</small>`;
    $('scenario').textContent = question.scenario;
    $('question-title').textContent = question.title;
    $('progress-fill').style.width = `${(number / window.quizQuestions.length) * 100}%`;
    document.querySelector('.progress-track').setAttribute('aria-valuenow', String(number));
    $('feedback').hidden = true;
    $('feedback').classList.remove('feedback-timeout');
    const choices = $('choices');
    choices.replaceChildren();
    question.choices.forEach((choice, index) => {
      const button = document.createElement('button');
      button.className = 'choice';
      button.type = 'button';
      button.innerHTML = `<span class="choice-letter">${String.fromCharCode(65 + index)}</span><span class="choice-text"></span><span class="choice-arrow" aria-hidden="true">↗</span>`;
      button.querySelector('.choice-text').textContent = choice.text;
      button.addEventListener('click', () => selectAnswer(index));
      choices.append(button);
    });
    $('next-button').textContent = questionIndex === window.quizQuestions.length - 1 ? '結果を見る　→' : '次の問題へ　→';
    startTimer();
  }

  function selectAnswer(selectedIndex) {
    resolveAnswer(selectedIndex, false);
  }

  function resolveAnswer(selectedIndex, timedOut) {
    if (answered) return;
    answered = true;
    stopTimer();
    const question = window.quizQuestions[questionIndex];
    const isCorrect = selectedIndex === question.answer;
    if (isCorrect) score++;
    if (!timedOut) answers.push(question.choices[selectedIndex].category);
    [...$('choices').children].forEach((button, index) => {
      button.disabled = true;
      if (index === question.answer) button.classList.add('is-correct');
      else if (index === selectedIndex && selectedIndex !== null) button.classList.add('is-selected-wrong');
    });
    const picked = timedOut ? question.choices[question.answer] : question.choices[selectedIndex];
    $('feedback-status').textContent = timedOut ? '時間切れ！' : isCorrect ? 'その通り！' : '考え方をチェック';
    $('feedback-status').className = isCorrect ? 'status-correct' : 'status-review';
    $('feedback-note').textContent = timedOut ? 'TIME UP' : isCorrect ? 'BEST CHOICE' : 'LEARN THE POINT';
    $('answer-feedback').textContent = timedOut ? `時間内に選べませんでした。正解は「${picked.text}」です。` : picked.feedback;
    $('explanation-text').textContent = timedOut ? `あせらず次へ進みましょう。${picked.explanation}` : picked.explanation;
    $('feedback').classList.toggle('feedback-timeout', timedOut);
    $('feedback').hidden = false;
    playAnswerSound(isCorrect);
    $('next-button').focus({ preventScroll: true });
  }

  function finishGame() {
    $('score-value').textContent = String(score);
    const ranks = [
      { min: 9, name: 'コーティング・マスター', description: '選び方のポイントをしっかり押さえています。自分の使い方に合わせた判断ができています。' },
      { min: 7, name: 'グッド・セレクター', description: '大切な視点が身についています。保証や手入れの条件も確認すると、さらに安心です。' },
      { min: 4, name: 'ケア・ビギナー', description: '基本を学び始めたところ。解説を参考に、気になる点を一つずつ確認していきましょう。' },
      { min: 0, name: 'これからの探究者', description: '選択の理由を振り返るところからスタート。愛車に合う答えは、使い方を知ることから見つかります。' }
    ];
    const rank = ranks.find((item) => score >= item.min);
    $('rank-name').textContent = rank.name;
    $('rank-description').textContent = rank.description;
    const counts = answers.reduce((result, item) => { result[item] = (result[item] || 0) + 1; return result; }, {});
    const [top, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || ['条件を確認して選ぶ', 0];
    const descriptions = {
      '条件を確認して選ぶ': '環境や維持方法を見て選ぶタイプ。愛車に合わせた視点が光っています。',
      '価格・上位プラン重視': '価格や上位プランに目が向きやすい傾向。施工内容や維持条件も並べてみましょう。',
      '業態・ブランドで判断': 'お店やブランドが気になるタイプ。看板に加えて、具体的な施工内容を聞くと判断が深まります。',
      '手入れ・保証を軽視': '施工後のケアは見落としやすいポイント。保証書や洗車方法もチェックしてみましょう。'
    };
    const timeoutCount = window.quizQuestions.length - answers.length;
    $('tendency-text').textContent = answers.length
      ? `${descriptions[top]}（回答した問題 ${answers.length}/10${timeoutCount ? `・時間切れ ${timeoutCount}問` : ''}）`
      : '今回は時間内に選べた問題がありませんでした。もう一度ゆっくり挑戦してみましょう。';
    showScreen($('result-screen'));
  }

  $('start-button').addEventListener('click', startGame);
  $('replay-button').addEventListener('click', startGame);
  $('next-button').addEventListener('click', () => {
    if (questionIndex < window.quizQuestions.length - 1) { questionIndex++; renderQuestion(); }
    else finishGame();
  });
})();
