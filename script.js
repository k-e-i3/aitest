// script.js

// グローバル変数
const quizContainer = document.getElementById('quiz-container');
const quizCardTemplate = document.getElementById('quiz-card-template');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

let allQuestions = []; // 全ての問題を格納する配列
let currentQuestionIndex = 0;

/**
 * 存在する問題データ配列を全て結合する関数
 */
function initializeQuestions() {
    allQuestions = []; // 初期化
    if (typeof questions_r7_no1 !== 'undefined') allQuestions = allQuestions.concat(questions_r7_no1);
    // if (typeof questions_r7_no2 !== 'undefined') allQuestions = allQuestions.concat(questions_r7_no2);
    // ... 今後追加するファイルも同様に記述
}

/**
 * 指定されたインデックスの問題を画面に表示する関数
 * @param {number} index - allQuestions配列のインデックス
 */
function displayQuestion(index) {
    quizContainer.innerHTML = '';
    const q = allQuestions[index];
    if (!q) {
        quizContainer.innerHTML = '<p>問題の読み込みに失敗しました。</p>';
        return;
    }

    const card = quizCardTemplate.content.cloneNode(true);

    card.querySelector('#q-title').textContent = `${q.year} ${q.q_num}`;
    card.querySelector('#q-genre').textContent = `ジャンル: ${q.genre.join(' / ')}`;
    card.querySelector('#q-text').innerHTML = q.question_text.replace(/\n/g, '<br>');

    const qImage = card.querySelector('#q-image');
    if (q.question_image) {
        qImage.src = q.question_image;
        qImage.style.display = 'block';
    }
    
    // 解答エリアの表示を問題タイプに応じて変更
    const answerContent = card.querySelector('#answer-content');
    if(q.type === 'calculation') {
        answerContent.innerHTML = `<strong>【計算過程】</strong>\n<pre>${q.answer_process}</pre>\n<strong>【最終解答】</strong>\n<span style="font-size: 1.5em; color: blue;">${q.answer_final}</span>\n\n<strong>【解説】</strong>\n${q.explanation}`;
    } else { // 記述や穴埋め問題
        answerContent.innerHTML = `<strong>【模範解答】</strong>\n<p style="font-size: 1.2em; color: blue;">${q.answer_text}</p>\n\n<strong>【解説】</strong>\n${q.explanation}`;
    }
    
    card.querySelector('#hint-content').textContent = `【ヒント】\n${q.hint || 'この問題にはヒントがありません。'}`;

    // 各ボタン要素とコンテンツエリアを取得
    const hintBtn = card.querySelector('.hint-btn');
    const answerBtn = card.querySelector('.answer-btn');
    const memoBtn = card.querySelector('.memo-btn');
    const saveMemoBtn = card.querySelector('.save-memo-btn');

    const hintContent = card.querySelector('#hint-content');
    const memoContent = card.querySelector('#memo-content');
    const memoTextarea = card.querySelector('.memo-textarea');
    
    hintBtn.addEventListener('click', () => hintContent.classList.toggle('hidden'));
    answerBtn.addEventListener('click', () => answerContent.classList.toggle('hidden'));
    memoBtn.addEventListener('click', () => memoContent.classList.toggle('hidden'));

    const memoKey = `aitest_memo_${q.id}`;
    memoTextarea.value = localStorage.getItem(memoKey) || '';
    saveMemoBtn.addEventListener('click', () => {
        localStorage.setItem(memoKey, memoTextarea.value);
        alert(`「${q.id}」のメモを保存しました！`);
        memoContent.classList.add('hidden');
    });
    
    quizContainer.appendChild(card);
    updateNavButtons();
}

function goToNextQuestion() {
    if (currentQuestionIndex < allQuestions.length - 1) {
        currentQuestionIndex++;
        displayQuestion(currentQuestionIndex);
    }
}

function goToPrevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion(currentQuestionIndex);
    }
}

function updateNavButtons() {
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.disabled = currentQuestionIndex >= allQuestions.length - 1;
}

prevBtn.addEventListener('click', goToPrevQuestion);
nextBtn.addEventListener('click', goToNextQuestion);

// ページが読み込まれたら、問題を初期化して最初の問題を表示
window.onload = () => {
    initializeQuestions();
    displayQuestion(currentQuestionIndex);
};
