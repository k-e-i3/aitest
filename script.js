// script.js

// グローバル変数
const quizContainer = document.getElementById('quiz-container');
const quizCardTemplate = document.getElementById('quiz-card-template');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
let currentQuestionIndex = 0;

// 各ファイルで `questions_r7_no1` のような変数名で問題配列を定義すると仮定
let allQuestions = [];

// window.onload など、アプリの初期化時に実行
function initialize() {
    // 存在する問題データ配列をすべて結合する
    if (typeof questions_r7_no1 !== 'undefined') allQuestions = allQuestions.concat(questions_r7_no1);
    if (typeof questions_r7_no2 !== 'undefined') allQuestions = allQuestions.concat(questions_r7_no2);
    if (typeof questions_r7_no3 !== 'undefined') allQuestions = allQuestions.concat(questions_r7_no3);
    if (typeof questions_r7_no4 !== 'undefined') allQuestions = allQuestions.concat(questions_r7_no4);
    if (typeof questions_r7_no5 !== 'undefined') allQuestions = allQuestions.concat(questions_r7_no5);
    
    // 最初に最初の問題を表示
    displayQuestion(0);
}


/**
 * 指定されたインデックスの問題を画面に表示する関数
 * @param {number} index - questions配列のインデックス
 */
function displayQuestion(index) {
    quizContainer.innerHTML = '';
    const q = questions[index];
    if (!q) {
        quizContainer.innerHTML = '<p>問題が見つかりません。</p>';
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

    card.querySelector('#hint-content').textContent = `【ヒント】\n${q.hint}`;
    card.querySelector('#answer-content').innerHTML = `<strong>【計算過程】</strong>\n<pre>${q.answer_process}</pre>\n<strong>【最終解答】</strong>\n<span style="font-size: 1.5em; color: blue;">${q.answer_final}</span>\n\n<strong>【解説】</strong>\n${q.explanation}`;
    
    // ----- ★ ここからが今回の追加分です ★ -----

    // 各ボタン要素を取得
    const hintBtn = card.querySelector('.hint-btn');
    const answerBtn = card.querySelector('.answer-btn');
    const memoBtn = card.querySelector('.memo-btn');
    const saveMemoBtn = card.querySelector('.save-memo-btn');
    const aiBtn = card.querySelector('.ai-btn'); // AIボタンも取得しておく

    // 各コンテンツエリアを取得
    const hintContent = card.querySelector('#hint-content');
    const answerContent = card.querySelector('#answer-content');
    const memoContent = card.querySelector('#memo-content');
    const memoTextarea = card.querySelector('.memo-textarea');
    
    // ボタンクリックで表示/非表示を切り替えるイベントを追加
    hintBtn.addEventListener('click', () => {
        hintContent.classList.toggle('hidden');
    });

    answerBtn.addEventListener('click', () => {
        answerContent.classList.toggle('hidden');
    });

    memoBtn.addEventListener('click', () => {
        memoContent.classList.toggle('hidden');
    });

    // メモ機能の実装
    const memoKey = `aitest_memo_${q.id}`;
    
    // 1. メモを読み込む
    memoTextarea.value = localStorage.getItem(memoKey) || '';

    // 2. メモを保存する
    saveMemoBtn.addEventListener('click', () => {
        localStorage.setItem(memoKey, memoTextarea.value);
        alert(`「${q.id}」のメモを保存しました！`);
        // 保存したら一旦閉じる
        memoContent.classList.add('hidden');
    });
    
    // (AIボタンの機能は後で追加します)

    // ----- ★ 追加分はここまで ★ -----

    quizContainer.appendChild(card);
    
    // ★ ナビゲーションボタンの状態を更新
    updateNavButtons();
}

// ★ 前後問題への移動機能
function goToNextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
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

// ★ ナビゲーションボタンの有効/無効を切り替える関数
function updateNavButtons() {
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.disabled = currentQuestionIndex >= questions.length - 1;
}

// イベントリスナーを設定
prevBtn.addEventListener('click', goToPrevQuestion);
nextBtn.addEventListener('click', goToNextQuestion);

// ページが読み込まれたら、最初の問題を表示する
window.onload = () => {
    displayQuestion(currentQuestionIndex);
};
