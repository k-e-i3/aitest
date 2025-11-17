// script.js (完成版)

// ----- DOM要素の取得 -----
const quizContainer = document.getElementById('quiz-container');
const quizCardTemplate = document.getElementById('quiz-card-template');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const yearSelect = document.getElementById('year-select');
const setSelect = document.getElementById('set-select');
const qnumSelect = document.getElementById('qnum-select');
const startBtn = document.getElementById('start-btn');

// ----- グローバル変数 -----
let allQuestions = [];
let currentQuestionIndex = 0;

/**
 * 年度の文字列を「令和4年」 -> 「R4」に変換するヘルパー関数
 * @param {string} yearStr - 「令和4年」または「R4」のような文字列
 * @returns {string} - 「R4」形式の文字列
 */
function normalizeYear(yearStr) {
    if (!yearStr) return ''; // nullやundefinedの場合のガード
    const match = yearStr.match(/令和(\d+)年/);
    if (match) {
        return 'R' + match[1];
    }
    return yearStr;
}

/**
 * 存在する問題データ配列を全て結合する
 */
function initializeQuestions() {
    allQuestions = [];
    // 読み込むべきデータセットの変数名をここに列挙します
    const datasets = [
        'questions_r7_no1', 'questions_r7_selective',
        'questions_r6_no1', 'questions_r6_selective',
        'questions_r5_no1', 'questions_r5_selective',
        'questions_r4_no1', 'questions_r4_selective',
        'questions_r3_no1', 'questions_r3_selective',
    ];

    console.log('=== データセット読み込みログ ===');
    for (const name of datasets) {
        if (typeof window[name] !== 'undefined' && Array.isArray(window[name])) {
            allQuestions = allQuestions.concat(window[name]);
            console.log(`- ${name}: 読み込み成功 (${window[name].length}問)`);
        } else {
            console.warn(`- ${name}: データが見つかりません`);
        }
    }
    console.log(`合計 ${allQuestions.length} 問の問題を読み込みました。`);

    // 各問題に正規化された年度を追加
    allQuestions.forEach(q => {
        q.normalizedYear = normalizeYear(q.year);
    });
}

/**
 * コントロールパネル（問題選択ドロップダウン）を初期化する
 */
function initializeControlPanel() {
    if (allQuestions.length === 0) return; // 問題がない場合は何もしない

    const years = [...new Set(allQuestions.map(q => q.normalizedYear))].sort((a, b) => {
        return parseInt(b.slice(1)) - parseInt(a.slice(1));
    });
    
    yearSelect.innerHTML = '';
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });

    yearSelect.addEventListener('change', updateSetOptions);
    setSelect.addEventListener('change', updateQNumOptions);
    startBtn.addEventListener('click', jumpToQuestion);

    updateSetOptions(); // 初回実行
}

/**
 * 年度に合わせて問題セットの選択肢を更新する
 */
function updateSetOptions() {
    const selectedYear = yearSelect.value;
    const setsForYear = [...new Set(allQuestions.filter(q => q.normalizedYear === selectedYear).map(q => q.q_set))];
    
    // 問題セットをソート (必須問題が先に来るように)
    setsForYear.sort((a, b) => {
        if (a === '必須問題') return -1;
        if (b === '必須問題') return 1;
        return a.localeCompare(b);
    });

    setSelect.innerHTML = '';
    setsForYear.forEach(set => {
        const option = document.createElement('option');
        option.value = set;
        option.textContent = set;
        setSelect.appendChild(option);
    });

    updateQNumOptions();
}

/**
 * 年度と問題セットに合わせて大問の選択肢を更新する
 */
function updateQNumOptions() {
    const selectedYear = yearSelect.value;
    const selectedSet = setSelect.value;

    const qnums = [...new Set(allQuestions
        .filter(q => q.normalizedYear === selectedYear && q.q_set === selectedSet)
        .map(q => q.q_num))];

    qnums.sort();

    qnumSelect.innerHTML = '';
    qnums.forEach(qnum => {
        const option = document.createElement('option');
        option.value = qnum;
        option.textContent = qnum;
        qnumSelect.appendChild(option);
    });
}

/**
 * 選択された問題にジャンプする
 */
function jumpToQuestion() {
    const selectedYear = yearSelect.value;
    const selectedSet = setSelect.value;
    const selectedQNum = qnumSelect.value;
    
    const targetIndex = allQuestions.findIndex(q => 
        q.normalizedYear === selectedYear && 
        q.q_set === selectedSet && 
        q.q_num === selectedQNum
    );

    if (targetIndex !== -1) {
        currentQuestionIndex = targetIndex;
        displayQuestion(currentQuestionIndex);
    } else {
        alert('選択された問題が見つかりません。');
    }
}

/**
 * 指定されたインデックスの問題を画面に表示する関数
 */
function displayQuestion(index) {
    quizContainer.innerHTML = '';
    const q = allQuestions[index];
    if (!q) {
        quizContainer.innerHTML = '<p>問題の読み込みに失敗しました。</p>';
        return;
    }

    const card = quizCardTemplate.content.cloneNode(true);
    
    card.querySelector('#q-title').textContent = `[${q.normalizedYear}] ${q.q_set} ${q.q_num}`;
    card.querySelector('#q-genre').textContent = (q.genre || []).join(' / ');
    card.querySelector('#q-text').textContent = q.question_text;

    const qImage = card.querySelector('#q-image');
    if (q.question_image) {
        qImage.src = q.question_image;
        qImage.style.display = 'block';
    } else {
        qImage.style.display = 'none';
    }
    
    const answerContent = card.querySelector('#answer-content');
    if (q.type && q.type.includes('fill-in-the-blank') && q.answer) {
        let answerHtml = '<strong>【模範解答】</strong><br><br>';
        for (const [key, value] of Object.entries(q.answer)) {
            answerHtml += `<p><strong>${key}:</strong> ${value}</p>`;
        }
        if (q.explanation) {
            answerHtml += `<br><strong>【解説】</strong><br><p>${q.explanation}</p>`;
        }
        answerContent.innerHTML = answerHtml;
    } else {
        let processHTML = q.answer_process ? `<strong>【計算過程】</strong><br><pre>${q.answer_process}</pre><br>` : '';
        let answerHTML = `<strong>【最終解答】</strong><br><p style="font-size: 1.2em; color: blue;">${q.answer_final || q.answer_text || '解答がありません'}</p>`;
        let explanationHTML = q.explanation ? `<br><strong>【解説】</strong><br><p>${q.explanation}</p>`: '';
        answerContent.innerHTML = processHTML + answerHTML + explanationHTML;
    }
    
    card.querySelector('#hint-content').textContent = `【ヒント】\n${q.hint || 'この問題にはヒントがありません。'}`;

    const hintBtn = card.querySelector('.hint-btn');
    const answerBtn = card.querySelector('.answer-btn');
    const memoBtn = card.querySelector('.memo-btn');
    const saveMemoBtn = card.querySelector('.save-memo-btn');
    const aiBtn = card.querySelector('.ai-btn');

    const hintContent = card.querySelector('#hint-content');
    const memoContent = card.querySelector('#memo-content');
    const memoTextarea = card.querySelector('.memo-textarea');
    
    hintBtn.addEventListener('click', () => hintContent.classList.toggle('hidden'));
    answerBtn.addEventListener('click', () => answerContent.classList.toggle('hidden'));
    memoBtn.addEventListener('click', () => memoContent.classList.toggle('hidden'));

    const memoKey = `aite
