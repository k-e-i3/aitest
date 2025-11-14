    // script.js

// グローバル変数
const quizContainer = document.getElementById('quiz-container');
const quizCardTemplate = document.getElementById('quiz-card-template');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

let allQuestions = [];
let currentQuestionIndex = 0;

/**
 * 存在する問題データ配列を全て結合する関数
 */
function initializeQuestions() {
    allQuestions = [];
    if (typeof questions_r7_no1 !== 'undefined') allQuestions = allQuestions.concat(questions_r7_no1);
    // 今後他のファイルも追加
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

    card.querySelector('#q-title').textContent = `[${q.year}] ${q.q_set} ${q.q_num}`;
    card.querySelector('#q-genre').textContent = q.genre.join(' / ');
    card.querySelector('#q-text').textContent = q.question_text;

    const qImage = card.querySelector('#q-image');
    if (q.question_image) {
        qImage.src = q.question_image;
        qImage.style.display = 'block';
    }
    
    const answerContent = card.querySelector('#answer-content');
    if (q.type.includes('fill-in-the-blank')) { // 穴埋め問題の解答整形
        let answerHtml = '<strong>【模範解答】</strong><br>';
        for (const [key, value] of Object.entries(q.answer)) {
            answerHtml += `<strong>${key}:</strong> ${value}<br>`;
        }
        answerHtml += `<br><strong>【解説】</strong><br>${q.explanation}`;
        answerContent.innerHTML = answerHtml;
    } else { // その他
        answerContent.innerHTML = `<strong>【模範解答】</strong><br><pre>${q.answer_text || q.answer_final}</pre><br><strong>【解説】</strong><br>${q.explanation}`;
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
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;
    
    let correctAnswerText = '';
    if (question.answer) { // 穴埋めセットの場合
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

window.onload = () => {
    initializeQuestions();
    displayQuestion(currentQuestionIndex);
    // TODO: コントロールパネルの初期化処理
};
