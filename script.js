// script.js

// グローバル変数
const quizContainer = document.getElementById('quiz-container');
const quizCardTemplate = document.getElementById('quiz-card-template');
let currentQuestionIndex = 0;

/**
 * 指定されたインデックスの問題を画面に表示する関数
 * @param {number} index - questions配列のインデックス
 */
function displayQuestion(index) {
    // コンテナをクリア
    quizContainer.innerHTML = '';

    // 表示する問題データを取得
    const q = questions[index];
    if (!q) {
        quizContainer.innerHTML = '<p>問題が見つかりません。</p>';
        return;
    }

    // テンプレートから新しいカードを作成
    const card = quizCardTemplate.content.cloneNode(true);

    // 各要素にデータを設定
    card.querySelector('#q-title').textContent = `${q.year} ${q.q_num}`;
    card.querySelector('#q-genre').textContent = `ジャンル: ${q.genre.join(' / ')}`;
    card.querySelector('#q-text').innerHTML = q.question_text.replace(/\n/g, '<br>');

    const qImage = card.querySelector('#q-image');
    if (q.question_image) {
        qImage.src = q.question_image;
        qImage.style.display = 'block';
    }

    // ★解答やヒントなどの内容も事前にセットしておく
    card.querySelector('#hint-content').textContent = `【ヒント】\n${q.hint}`;
    card.querySelector('#answer-content').innerHTML = `<strong>【計算過程】</strong>\n${q.answer_process}\n\n<strong>【最終解答】</strong>\n<span style="font-size: 1.5em; color: blue;">${q.answer_final}</span>\n\n<strong>【解説】</strong>\n${q.explanation}`;

    // 作成したカードを画面に追加
    quizContainer.appendChild(card);
}

// ページが読み込まれたら、最初の問題を表示する
window.onload = () => {
    displayQuestion(currentQuestionIndex);
};
