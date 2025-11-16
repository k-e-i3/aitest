// script.js

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
    const match = yearStr.match(/令和(\d+)年/);
    if (match) {
        return 'R' + match[1];
    }
    return yearStr;
}

// ----- 初期化処理 -----
window.onload = () => {
    initializeQuestions();
    initializeControlPanel();
    
    // 初期表示は最初の問題にする
    if (allQuestions.length > 0) {
        displayQuestion(0);
    } else {
        quizContainer.innerHTML = '<p>問題データが読み込まれていません。`data_rX_no1.js`ファイルを確認してください。</p>';
    }
};

/**
 * 存在する問題データ配列を全て結合する
 */
function initializeQuestions() {
    allQuestions = [];

    // 読み込むべきデータセットの変数名をここに列挙します
    const datasets = [
        // 令和7年
        'questions_r7_no1', 'questions_r7_selective',
        // 令和6年
        'questions_r6_no1', 'questions_r6_selective',
        // 令和5年
        'questions_r5_no1', 'questions_r5_selective',
        // 令和4年
        'questions_r4_no1', 'questions_r4_selective',
        // 令和3年
        'questions_r3_no1', 'questions_r3_selective',
    ];

    console.log('=== データセット読み込みログ ===');
    for (const name of datasets) {
        if (typeof window[name] !== 'undefined' && Array.isArray(window[name])) {
            allQuestions = allQuestions.concat(window[name]);
            console.log(`- ${name}: 読み込み成功 (${window[name].length}問)`);
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
    // 1. ユニークな年度、問題セットのリストを作成 (normalizedYearを使用)
    const years = [...new Set(allQuestions.map(q => q.normalizedYear))].sort((a, b) => {
        // R7, R6, R5... のように降順でソート
        return parseInt(b.slice(1)) - parseInt(a.slice(1));
    });
    const sets = [...new Set(allQuestions.map(q => q.q_set))]; // 問題セットはそのまま使用

    // 2. 年度ドロップダウンを生成
    yearSelect.innerHTML = '';
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year; // R7, R6, R5, ...
        option.textContent = year;
        yearSelect.appendChild(option);
    });

    // 3. 問題セットドロップダウンを生成（全問題で共通と仮定）
    setSelect.innerHTML = '';
    sets.forEach(set => {
        const option = document.createElement('option');
        option.value = set;
        option.textContent = set;
        setSelect.appendChild(option);
    });

    // 4. ドロップダウンが変更されたときの連動処理を設定
    yearSelect.addEventListener('change', updateSetOptions);
    setSelect.addEventListener('change', updateQNumOptions);

    // 5. [この問題から開始] ボタンのクリックイベントを設定
    startBtn.addEventListener('click', () => {
        const selectedYear = yearSelect.value; // R4 形式
        const selectedSet = setSelect.value;
        const selectedQNum = qnumSelect.value;
        
        // 選択された問題のインデックスを検索 (normalizedYearと比較)
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
    });

    // 6. 初期表示
    updateSetOptions();
}

/**
 * 年度に合わせて問題セットの選択肢を更新する (現状はすべて「必須問題」と仮定)
 */
function updateSetOptions() {
    // 現状、すべての問題が「必須問題」なので、基本的にはセットの変更は不要ですが、
    // 将来的に「選択問題」などが追加された時のためにロジックは残します。
    const selectedYear = yearSelect.value;
    const setsForYear = [...new Set(allQuestions.filter(q => q.normalizedYear === selectedYear).map(q => q.q_set))];
    
    // ... セットオプションの生成ロジックは省略または簡易化
    
    // 問題番号を連動して更新
    updateQNumOptions(); 
}

/**
 * 年度と問題セットに合わせて大問の選択肢を更新する
 */
function updateQNumOptions() {
    const selectedYear = yearSelect.value; // R4 形式
    const selectedSet = setSelect.value;

    // normalizedYearと比較してフィルタリング
    const qnums = [...new Set(allQuestions
        .filter(q => q.normalizedYear === selectedYear && q.q_set === selectedSet)
        .map(q => q.q_num))];

    // 問A, 問B, 問C... のようにソート
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
    
    // normalizedYearを使用
    card.querySelector('#q-title').textContent = `[${q.normalizedYear}] ${q.q_set} ${q.q_num}`;
    card.querySelector('#q-genre').textContent = q.genre.join(' / ');
    card.querySelector('#q-text').textContent = q.question_text;

    const qImage = card.querySelector('#q-image');
    if (q.question_image) {
        qImage.src = q.question_image;
        qImage.style.display = 'block';
    }
    
    // ... (模範解答、ヒント、メモボタン、AIボタン、ナビゲーションボタンのロジックは変更なし) ...
    
    const answerContent = card.querySelector('#answer-content');
    if (q.type && q.type.includes('fill-in-the-blank')) {
        let answerHtml = '<strong>【模範解答】</strong><br><br>';
        for (const [key, value] of Object.entries(q.answer)) {
            answerHtml += `<p><strong>${key}:</strong> ${value}</p>`;
        }
        answerHtml += `<br><strong>【解説】</strong><br><p>${q.explanation}</p>`;
        answerContent.innerHTML = answerHtml;
    } else {
        let processHTML = q.answer_process ? `<strong>【計算過程】</strong><br><pre>${q.answer_process}</pre><br>` : '';
        answerContent.innerHTML = `${processHTML}<strong>【最終解答】</strong><br><p style="font-size: 1.2em; color: blue;">${q.answer_final || q.answer_text}</p><br><strong>【解説】</strong><br><p>${q.explanation}</p>`;
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

    const memoKey = `aitest_memo_${q.id}`;
    memoTextarea.value = localStorage.getItem(memoKey) || '';
    saveMemoBtn.addEventListener('click', () => {
        localStorage.setItem(memoKey, memoTextarea.value);
        alert(`「${q.id}」のメモを保存しました！`);
        memoContent.classList.add('hidden');
    });

    const aiAdviceContent = card.querySelector('#ai-advice-content');
    const userAnswerTextarea = card.querySelector('#user-answer-textarea');

    aiBtn.addEventListener('click', async () => {
        const userAnswer = userAnswerTextarea.value.trim();
        if (!userAnswer) {
            aiAdviceContent.textContent = '解答を入力してから「AIに相談」ボタンを押してください。';
            aiAdviceContent.classList.remove('hidden');
            return;
        }
        
        aiBtn.textContent = 'AIが分析中...⏳';
        aiBtn.disabled = true;
        aiAdviceContent.classList.remove('hidden');
        
        try {
            const advice = await getAIAdvice(q, userAnswer);
            aiAdviceContent.innerHTML = `<strong>【AIからのアドバイス】</strong><br><br>${advice.replace(/\n/g, '<br>')}`;
        } catch (error) {
            aiAdviceContent.textContent = 'AIアドバイスの取得に失敗しました。APIキーまたはネットワーク接続を確認してください。';
            console.error('AI Error:', error);
        } finally {
            aiBtn.textContent = 'この解答でAIに相談する';
            aiBtn.disabled = false;
        }
    });
    
    quizContainer.appendChild(card);
    updateNavButtons();
}

async function getAIAdvice(question, userAnswer) {
    if (typeof API_KEY === 'undefined' || API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Error("APIキーがconfig.jsに設定されていません。");
    }
    const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
    
    let correctAnswerText = '';
    if (question.answer) {
        correctAnswerText = Object.entries(question.answer).map(([key, value]) => `${key}: ${value}`).join('\n');
    } else {
        correctAnswerText = question.answer_text || question.answer_final || '';
    }

    const prompt = `あなたは測量士国家試験の非常に優秀な指導者です。以下の問題に対する受験生の解答を評価し、励ましながら具体的なアドバイスをしてください。

# 問題
${question.question_text}

# 模範解答
${correctAnswerText}

# 受験生の解答
${userAnswer}

# アドバイスの形式
1.  まず「素晴らしいですね！」「惜しい！」など、ポジティブな一言で始めます。
2.  良い点と改善点を、それぞれ具体的に指摘します。
3.  特に間違っている箇所については、なぜそうなるのかを優しく解説してください。
4.  最後に、次につながる学習のヒントを簡潔に示してください。`;

    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${response.status} ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
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
