// script.js (最終修正版)

// DOMが完全に読み込まれてから、すべての処理を開始する
document.addEventListener('DOMContentLoaded', () => {

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
    
    // --- ここから下は、すべて document.addEventListener の中に移動 ---

    function normalizeYear(yearStr) {
        if (!yearStr) return '';
        const match = yearStr.match(/令和(\d+)年/);
        if (match) {
            return 'R' + match[1];
        }
        return yearStr;
    }

    function initializeQuestions() {
        allQuestions = [];
        const datasets = [
            'questions_r7_no1', 'questions_r7_selective',
            'questions_r6_no1', 'questions_r6_selective',
            'questions_r5_no1', 'questions_r5_selective',
            'questions_r4_no1', 'questions_r4_selective',
            'questions_r3_no1', 'questions_r3_selective',
        ];

        console.log('=== データセット読み込みログ (DOMContentLoaded) ===');
        for (const name of datasets) {
            if (typeof window[name] !== 'undefined' && Array.isArray(window[name])) {
                allQuestions = allQuestions.concat(window[name]);
                console.log(`- ${name}: 読み込み成功 (${window[name].length}問)`);
            } else {
                console.warn(`- ${name}: データが見つかりません`);
            }
        }
        console.log(`合計 ${allQuestions.length} 問の問題を読み込みました。`);

        allQuestions.forEach(q => {
            q.normalizedYear = normalizeYear(q.year);
        });
    }

    function initializeControlPanel() {
        if (allQuestions.length === 0) return;

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

        updateSetOptions();
    }

    function updateSetOptions() {
        const selectedYear = yearSelect.value;
        const setsForYear = [...new Set(allQuestions.filter(q => q.normalizedYear === selectedYear).map(q => q.q_set))];
        
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
        const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
        
        let correctAnswerText = '';
        if (question.answer) {
            correctAnswerText = Object.entries(question.answer).map(([key, value]) => `${key}: ${value}`).join('\n');
        } else {
            correctAnswerText = question.answer_text || question.answer_final || '';
        }

        const prompt = `あなたは測量士国家試験の非常に優秀な指導者です。以下の問題に対する受験生の解答を評価し、励ましながら具体的なアドバイスをしてください。\n\n# 問題\n${question.question_text}\n\n# 模範解答\n${correctAnswerText}\n\n# 受験生の解答\n${userAnswer}\n\n# アドバイスの形式\n1. まず「素晴らしいですね！」「惜しい！」など、ポジティブな一言で始めます。\n2. 良い点と改善点を、それぞれ具体的に指摘します。\n3. 特に間違っている箇所については、なぜそうなるのかを優しく解説してください。\n4. 最後に、次につながる学習のヒントを簡潔に示してください。`;

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


    // ----- 初期化処理の実行 -----
    initializeQuestions();
    initializeControlPanel();

    if (allQuestions.length > 0) {
        displayQuestion(0);
    } else {
        quizContainer.innerHTML = '<p>問題データが読み込まれていません。データファイルのパスや変数名、読み込み順序を確認してください。</p>';
    }

}); // ここで document.addEventListener を閉じる
