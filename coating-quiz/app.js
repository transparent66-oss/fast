(() => {
  const $ = (id) => document.getElementById(id);
  const screens = [$('start-screen'), $('quiz-screen'), $('result-screen')];
  let questionIndex = 0;
  let score = 0;
  let answers = [];
  let answered = false;

  function showScreen(target) {
    screens.forEach((screen) => { screen.hidden = screen !== target; });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startGame() {
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
  }

  function selectAnswer(selectedIndex) {
    if (answered) return;
    answered = true;
    const question = window.quizQuestions[questionIndex];
    const isCorrect = selectedIndex === question.answer;
    if (isCorrect) score++;
    answers.push(question.choices[selectedIndex].category);
    [...$('choices').children].forEach((button, index) => {
      button.disabled = true;
      if (index === question.answer) button.classList.add('is-correct');
      else if (index === selectedIndex) button.classList.add('is-selected-wrong');
    });
    const picked = question.choices[selectedIndex];
    $('feedback-status').textContent = isCorrect ? 'その通り！' : '考え方をチェック';
    $('feedback-status').className = isCorrect ? 'status-correct' : 'status-review';
    $('feedback-note').textContent = isCorrect ? 'BEST CHOICE' : 'LEARN THE POINT';
    $('answer-feedback').textContent = picked.feedback;
    $('explanation-text').textContent = picked.explanation;
    $('feedback').hidden = false;
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
    $('tendency-text').textContent = `${descriptions[top]}（今回の回答 ${count}/10）`;
    showScreen($('result-screen'));
  }

  $('start-button').addEventListener('click', startGame);
  $('replay-button').addEventListener('click', startGame);
  $('next-button').addEventListener('click', () => {
    if (questionIndex < window.quizQuestions.length - 1) { questionIndex++; renderQuestion(); }
    else finishGame();
  });
})();
