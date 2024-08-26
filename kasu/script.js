
const questions = dataText.trim().split('\n').slice(1).map(line => {
    const [type, number, question, correct, a, b, c, d, img, audio, category, correctFeedback, wrongFeedback, id] = line.split('\t');
    return { type, number, question, correct, options: [a, b, c, d], img, audio, category, correctFeedback: correctFeedback.trim() === "" ? "✨" : correctFeedback, wrongFeedback: wrongFeedback.trim() === "" ? "🫧" : wrongFeedback, id: Number(id) };
});

const typeMapping = {
    'mock': 1 // 模擬題型
};
const categoryMapping = {};

let typeCounter = 2; // 從2開始
let categoryCounter = 1;

questions.forEach(question => {
    if (!typeMapping[question.type]) {
        typeMapping[question.type] = typeCounter++;
    }
    if (!categoryMapping[question.category]) {
        categoryMapping[question.category] = categoryCounter++;
    }
});

const categoryMappingWithAll = {
    'all': 1, // 全部
    ...categoryMapping // 其他類別
};

const orderMapping = {
    "category": 2,
    "sequence": 3,
    "random": 4
};








const category = document.getElementById('category');
const clearQuestionStats = document.getElementById('clear-questionStats');
const confirmButton = document.getElementById('confirm-button');
const endScreen = document.getElementById('end-screen');
const feedbackContainer = document.getElementById('feedback-container');
const gameLogo = document.getElementById('game-logo');
const historyContainer = document.getElementById('history-container');
const homeButton = document.getElementById('home-button');
const matchingContainer = document.getElementById('matching-container');
const optionsContainer = document.getElementById('options-container');
const orderType = document.getElementById('order-type');
const progressBar = document.getElementById('progress-bar');
const progressBarContainer = document.getElementById('progress-bar-container');
const questionContainer = document.getElementById('question-container');
const questionType = document.getElementById('question-type');
const quizContainer = document.getElementById('quiz-container');
const resetSorting = document.getElementById('reset-sorting');
const restartButton = document.getElementById('restart-button');
const resultIcon = document.getElementById('result-icon');
const settingsContainer = document.getElementById('settings-container');
const shareButton = document.getElementById('share-button');
const shareQuestionStats = document.getElementById('share-questionStats');
const sortingContainer = document.getElementById('sorting-container');
const soundButton = document.getElementById('sound-button');
const startAgainButton = document.getElementById('start-again-button');
const startButton = document.getElementById('start-button');
const topControls = document.getElementById('top-controls');
const arrangingContainer = document.getElementById('arranging-container');
const groupingContainer = document.getElementById('grouping-container');

orderType.disabled = true;
category.disabled = true;
startButton.disabled = true;

let currentQuestion;
let currentQuestionIndex = 0;
let myQuestions = [];
let correctLength = 0;
let selectedOptionIndex = null;
let isConfirmed = false;
let isGloballyMuted = false;
let isQuestionTextVisible = true;
let isBubbleContainerVisible = true;

const uniqueTypes = [...new Set(questions.map(q => q.type))];
uniqueTypes.forEach(type => {
    const option = document.createElement('option');
    option.value = type;
    option.textContent = type === 'mock' ? '模擬' : type;
    questionType.appendChild(option);
});

function populateCategoryOptions(selectedType) {
    category.innerHTML = '';
    const allOption = document.createElement('option');
    allOption.value = 'all';
    allOption.textContent = '全部';
    category.appendChild(allOption);

    const uniqueCategories = [...new Set(questions.filter(q => q.type === selectedType).map(q => q.category))];
    uniqueCategories.forEach(categoryTitle => {
        const option = document.createElement('option');
        option.value = categoryTitle;
        option.textContent = categoryTitle;
        category.appendChild(option);
    });
}

questionType.addEventListener('change', () => {
	shareButton.classList.remove('hidden');	
    const selectedType = questionType.value;
    if (selectedType) {
        orderType.disabled = false;
        category.disabled = false;
        startButton.disabled = false;
        if (selectedType === 'mock') {
            orderType.value = '';
            category.value = '';
            orderType.disabled = true;
            category.disabled = true;
        } else {
            //orderType.value = 'random';
			orderType.value = 'category'; // 題目預設排序
            populateCategoryOptions(selectedType);
        }
    } else {
        orderType.disabled = true;
        category.disabled = true;
        orderType.value = '';
        category.innerHTML = '';
    }
});

orderType.addEventListener('change', () => {
    if (orderType.value === 'sequence') {
        category.disabled = true;
        category.innerHTML = '';
    } else {
        category.disabled = false;
        const selectedType = questionType.value;
        populateCategoryOptions(selectedType);

        if (orderType.value === 'random') {
            category.value = 'all';
        }
    }
});

let filteredQuestions = [];

function getQuestionStats() {
    return JSON.parse(localStorage.getItem('questionStats')) || {};
}




function updateQuestionStats(questionId, isCorrect) {
    let stats = getQuestionStats();
    if (!stats[questionId]) {
        stats[questionId] = { correct: 0, incorrect: 0 };
    }
    if (isCorrect) {
        stats[questionId].correct++;
    } else {
        stats[questionId].incorrect++;
    }
    localStorage.setItem('questionStats', JSON.stringify(stats));
    logQuestionStats();
}

// 全螢幕模式函數
function enterFullscreen(element) {
    if(element.requestFullscreen) {
        element.requestFullscreen();
    } else if(element.mozRequestFullScreen) { // Firefox
        element.mozRequestFullScreen();
    } else if(element.webkitRequestFullscreen) { // Chrome, Safari 和 Opera
        element.webkitRequestFullscreen();
    } else if(element.msRequestFullscreen) { // IE/Edge
        element.msRequestFullscreen();
    }
}


startButton.addEventListener('click', () => {
    const selectedType = questionType.value;
    const selectedOrder = orderType.value;
    const selectedCategory = category.value;

    if (!selectedType) {
        alert('請選擇題型後再開始測驗！');
        return;
    }

    // 進入全螢幕模式
    enterFullscreen(document.documentElement);

    filteredQuestions = [];
    if (selectedType === 'mock') {
        filteredQuestions = questions;
    } else {
        filteredQuestions = questions.filter(q => q.type === selectedType);
        if (selectedOrder === 'category' && selectedCategory !== 'all') {
            filteredQuestions = filteredQuestions.filter(q => q.category === selectedCategory);
        }
    }

    if (selectedOrder === 'sequence') {
        filteredQuestions.sort((a, b) => a.number - b.number);
    } else if (selectedOrder === 'random') {
        filteredQuestions = getRandomQuestions(filteredQuestions);
    }

    startQuiz(filteredQuestions);
});


function getRandomQuestions(questions) {
    let stats = getQuestionStats();
    let sortedQuestions = questions.map((q, index) => ({
        question: q,
        index: index,
        incorrectCount: (stats[index] && stats[index].incorrect) || 0
    }));
    
    let result = [];
    let remainingQuestions = [...sortedQuestions];
    let targetLength = Math.min(10, sortedQuestions.length);
    
    while (remainingQuestions.length > 0 && result.length < targetLength) {
        // 選擇兩個隨機題目
        for (let i = 0; i < 4 && remainingQuestions.length > 0 && result.length < targetLength; i++) {
            let randomIndex = Math.floor(Math.random() * remainingQuestions.length);
            result.push(remainingQuestions[randomIndex]);
            remainingQuestions.splice(randomIndex, 1);
        }
        
        // 選擇一個錯題（如果有的話）
        if (remainingQuestions.length > 0 && result.length < targetLength) {
            remainingQuestions.sort((a, b) => b.incorrectCount - a.incorrectCount);
            result.push(remainingQuestions[0]);
            remainingQuestions.splice(0, 1);
        }
    }
    
    return result.map(item => item.question);
}







// 監聽全螢幕變化事件
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);

// 處理全螢幕變化
function handleFullscreenChange() {
    if (!document.fullscreenElement && !document.webkitFullscreenElement &&
        !document.mozFullScreenElement && !document.msFullscreenElement) {
    }
}

shareButton.addEventListener('click', () => {
    const selectedType = questionType.value;
    const selectedOrder = orderType.value;
    const selectedCategory = category.value;

    if (!selectedType) {
        alert('請選擇題型後再分享！');
        return;
    }

    const typeValue = selectedType === 'mock' ? 1 : (typeMapping[selectedType] || 0);
    const orderValue = selectedOrder ? orderMapping[selectedOrder] : 0;
    const categoryValue = selectedCategory === 'all' ? 1 : (categoryMapping[selectedCategory] || 0);

    const params = new URLSearchParams({
        type: typeValue,
        order: orderValue,
        category: categoryValue
    }).toString();

    const shareUrl = `${window.location.origin}${window.location.pathname}?${params}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
        alert('分享連結已複製到剪貼簿！');
    }).catch(err => {
        console.error('複製失敗：', err);
    });
});

homeButton.addEventListener('click', () => {
    window.location.href = window.location.pathname;
});



function startQuiz(q) {
    settingsContainer.classList.add('hidden');
    shareButton.classList.add('hidden');
	homeButton.classList.add('hidden');

	optionsContainer.style.display = 'none';
	sortingContainer.style.display = 'none';
	matchingContainer.style.display = 'none';
	arrangingContainer.style.display = 'none';
	groupingContainer.style.display = 'none';

    quizContainer.classList.remove('hidden');
	confirmButton.classList.remove('hidden');
	startAgainButton.classList.remove('hidden');
	soundButton.classList.remove('hidden');
    progressBarContainer.classList.remove('hidden');

	feedbackContainer.classList.remove('show');

    matchCorrectLength = 0;
    matchQuestionLength = 0;

	groupingallItemsLength = 0;
	groupingItemsLength = 0;
	groupingItemsWrong = 0;
	groupingQuestionLength = 0;

    progressBar.style.width = '0';
	isGloballyMuted = false; 

	selectedAnswers = [];

    myQuestions = q;    
    currentQuestionIndex = 0;
	correctLength = 0;
    showQuestion();
}

feedbackContainer.addEventListener('click', function() {
  feedbackContainer.classList.toggle('hiding2');
});

let currentQuestionAudio = null;
let currentQuestionPlayAudio = null;

// fn 出題
function showQuestion() {

    if (feedbackContainer.classList.contains('show')) {
        feedbackContainer.classList.add('hiding');
		feedbackContainer.classList.remove('hiding2');
        feedbackContainer.classList.remove('show');
        
        setTimeout(() => {
            feedbackContainer.innerHTML = '';
            feedbackContainer.className = 'feedback';
        }, 300);
    }
    if (currentQuestionIndex >= myQuestions.length) {
        endQuiz();
        return;
    }

    currentQuestion = myQuestions[currentQuestionIndex];
    questionContainer.innerHTML = '';

    if (!currentQuestion) {
        console.error('No question found at index:', currentQuestionIndex);
        endQuiz();
        return;
    }

    const audioControlsContainer = document.createElement('div');
    audioControlsContainer.className = 'audio-controls-container';

    const catIcon = document.createElement('span');
    catIcon.textContent = '😺';
    catIcon.className = 'cat-icon';
	catIcon.id = 'catIcon';

    catIcon.addEventListener('click', function() {
        isBubbleContainerVisible = !isBubbleContainerVisible;
        
        if (isBubbleContainerVisible) {
            this.textContent = '😽';
            bubbleContainer.style.display = 'block';
        } else {
            this.textContent = '😼';
            bubbleContainer.style.display = 'none';
        }
        
        this.classList.add('cat-icon-animate');
        
        setTimeout(() => {
            this.textContent = isBubbleContainerVisible ? '😺' : '😼';
            this.classList.remove('cat-icon-animate');
        }, 500);
    });
    
    audioControlsContainer.appendChild(catIcon);

    const bubbleContainer = document.createElement('div');
    bubbleContainer.className = 'bubble-container';

    if (currentQuestion.audio) {
        const { audioButton, audio, playAudio } = createQuestionAudioButton(currentQuestion.audio);
        bubbleContainer.appendChild(audioButton);
        
        currentQuestionAudio = audio;
        currentQuestionPlayAudio = playAudio;

		let autoPlayButton = document.querySelector('.auto-play-button');
		if (!autoPlayButton) {
			autoPlayButton = document.createElement('button');
			autoPlayButton.className = 'auto-play-button';
			autoPlayButton.addEventListener('click', toggleAutoPlay);
		}

		autoPlayButton.classList.toggle('active', isAutoPlayDisabled);
		autoPlayButton.textContent = isAutoPlayDisabled ? '🖐️' : '👈';
		autoPlayButton.title = isAutoPlayDisabled ? '啟用自動播放' : '取消自動播放';

		bubbleContainer.appendChild(autoPlayButton);
    }

    audioControlsContainer.appendChild(bubbleContainer);

    questionContainer.appendChild(audioControlsContainer);



    const toggleButton = document.createElement('button');
    toggleButton.className = 'toggle-question-text';
    toggleButton.textContent = '🙆‍';
    toggleButton.title = '切換題目文字顯示';
    toggleButton.addEventListener('click', toggleQuestionTextVisibility);
    toggleButton.disabled = isAutoPlayDisabled;

    bubbleContainer.appendChild(toggleButton);

    const questionTextElement = document.createElement('div');
    questionTextElement.className = 'question-text';
    let questionText = `${currentQuestionIndex + 1}. ${currentQuestion.question}`;
    questionText = questionText.replace(/{([^}]+)}/g, '🟢🟢');
    questionTextElement.innerHTML = questionText; //here
    questionContainer.appendChild(questionTextElement);

    if (currentQuestion.img) {
        const img = document.createElement('img');
        img.src = currentQuestion.img;
        img.className = 'question-image';
        questionContainer.appendChild(img);
    }

	optionsContainer.style.display = 'none';
	sortingContainer.style.display = 'none';
	matchingContainer.style.display = 'none';
	arrangingContainer.style.display = 'none';
	groupingContainer.style.display = 'none';

    // 新增: 處理「安排」題型
  if (isGroupingQuestion(currentQuestion)) {
    showGroupingQuestion(currentQuestion);
    groupingContainer.style.display = 'flex';
  } else if (isArrangingQuestion(currentQuestion)) {
        showArrangingQuestion(currentQuestion);
		arrangingContainer.style.display = 'flex';
    } else if (isSortingQuestion(currentQuestion)) {
        showSortingQuestion(currentQuestion);
        sortingContainer.style.display = 'block';
    } else if (isMatchingQuestion(currentQuestion)) {
        showMatchingQuestion(currentQuestion);
        matchingContainer.style.display = 'flex';
    } else {
        showNormalQuestion(currentQuestion);
        optionsContainer.style.display = '';
    }


    feedbackContainer.innerHTML = '';
    feedbackContainer.className = 'feedback';

    confirmButton.disabled = true;

    const progress = ((currentQuestionIndex + 1) / myQuestions.length) * 100;
    progressBar.style.width = `${progress}%`;

    selectedOptionIndex = null;
    isConfirmed = false;
    confirmButton.textContent = '確定';

    soundButton.style.display = '';
    progressBarContainer.classList.remove('hidden');

    updateQuestionTextVisibility();
}


let correctPairs = {};

function showMatchingQuestion(question) {    

	matchingContainer.innerHTML = `
        <div class="matching-left"></div>
        <div class="matching-right"></div>
    `;

    const leftColumn = matchingContainer.querySelector('.matching-left');
    const rightColumn = matchingContainer.querySelector('.matching-right');

/*
    const pairs = question.options.filter(option => option.includes('|') || option.includes('\\') || option.includes(';') || option.includes('='))
  .map(option => option.split(/[|;=\\]/).map(word => word.trim()));
*/

	const pairs = question.options
	  .flatMap(option => option.split(/\s+|;/)
		.filter(pair => pair.trim() !== '')
		.map(pair => pair.split(/[|\\=]/).map(word => word.trim()))
		.filter(pair => pair.length === 2 && pair.every(word => word !== ''))
	  );


		
    // 建立正確配對的映射
    correctPairs = Object.fromEntries(pairs);

    // 分別對左右列進行隨機排序
    const shuffledLeft = [...pairs].sort(() => Math.random() - 0.5);
    const shuffledRight = [...pairs].sort(() => Math.random() - 0.5);

    shuffledLeft.forEach(pair => {
        const leftItem = createMatchingItem(pair[0], 'left');
        leftColumn.appendChild(leftItem);
    });

    shuffledRight.forEach(pair => {
        const rightItem = createMatchingItem(pair[1], 'right');
        rightColumn.appendChild(rightItem);
    });

    updateConfirmButton();
}

function createMatchingItem(text, side) {
    const item = document.createElement('div');
    item.className = `matching-item ${side}-item`;
    item.textContent = text;
    item.addEventListener('click', handleMatchingItemClick);
    return item;
}

let selectedLeft = null;
let selectedRight = null;
let isMatchingClickable = true;

function handleMatchingItemClick(event) {
	if (!isMatchingClickable) return; 

    const clickedItem = event.target;
    const isLeftItem = clickedItem.classList.contains('left-item');
	const catIcon = document.querySelector('.cat-icon');	

    if (isLeftItem) {
        if (selectedLeft) selectedLeft.classList.remove('selected');
        selectedLeft = clickedItem;
    } else {
        if (selectedRight) selectedRight.classList.remove('selected');
        selectedRight = clickedItem;
    }

    clickedItem.classList.add('selected');

    if (selectedLeft && selectedRight) {
		// 配對正確
        if (correctPairs[selectedLeft.textContent] === selectedRight.textContent) {
            selectedLeft.classList.add('matched');
            selectedRight.classList.add('matched');
			moveMatchedPairToTop(selectedLeft, selectedRight);  // 正確的上移
            selectedLeft = null;
            selectedRight = null;
			matchCorrectLength = matchCorrectLength + 1;
			catIcon.textContent = '😸';
        } else {
			//配對錯誤
			isMatchingClickable = false; 
			catIcon.textContent = '🙀';
                selectedLeft.classList.add('matchedWrong');
                selectedRight.classList.add('matchedWrong');

            setTimeout(() => {
                selectedLeft.classList.remove('matchedWrong');
                selectedRight.classList.remove('matchedWrong');
                selectedLeft.classList.remove('selected');
                selectedRight.classList.remove('selected');
                selectedLeft = null;
                selectedRight = null;
				matchCorrectLength = matchCorrectLength - 1;
				isMatchingClickable = true;
            }, 500);
        }
    }

    updateConfirmButton();
}

function moveMatchedPairToTop(leftItem, rightItem) {
    const leftColumn = document.querySelector('.matching-left');
    const rightColumn = document.querySelector('.matching-right');

	setTimeout(() => {
		// 移動左側項目到頂部
		leftColumn.insertBefore(leftItem, leftColumn.firstChild);
		// 移動右側項目到頂部
		rightColumn.insertBefore(rightItem, rightColumn.firstChild);        
    }, 500);
}




function toggleQuestionTextVisibility() {
    if (!isGloballyMuted) {
        isQuestionTextVisible = !isQuestionTextVisible;
        updateQuestionTextVisibility();
    }
}


function updateQuestionTextVisibility() {
    const questionText = document.querySelector('.question-text');
    const toggleButton = document.querySelector('.toggle-question-text');
    
    if (isAutoPlayDisabled) {
        // 如果取消自動播放，強制顯示文字
        isQuestionTextVisible = true;
        questionText.style.opacity = '1';
        questionText.style.filter = 'none';
        toggleButton.textContent = '🙆‍';
        toggleButton.disabled = true;
    } else {
        // 如果開啟自動播放，允許切換
        questionText.style.opacity = isQuestionTextVisible ? '1' : '0.1';
        questionText.style.filter = isQuestionTextVisible ? 'none' : 'blur(5px)';
        toggleButton.textContent = isQuestionTextVisible ? '🙆‍' : '🙅‍';
        toggleButton.disabled = false;
    }
}


// 修改播放音效的邏輯
function playSound(soundName) {
    if (isSoundEnabled && sounds[soundName]) {
        sounds[soundName].play();
    }
}

function detectMediaInOptions(options) {
    return options.some(option => 
        option.startsWith('http') || 
        option.endsWith('.jpg') || 
        option.endsWith('.png') || 
        option.endsWith('.gif') ||
        option.endsWith('.mp3')
    );
}


// 在全局範圍內定義一個變量來跟踪當前正在播放的音頻
let currentlyPlayingAudio = null;
let currentlyPlayingButton = null;
let isAutoPlayDisabled = false;

function toggleAutoPlay() {
    isAutoPlayDisabled = !isAutoPlayDisabled;
    const autoPlayButton = document.querySelector('.auto-play-button');
    autoPlayButton.classList.toggle('active', isAutoPlayDisabled);
    autoPlayButton.textContent = isAutoPlayDisabled ? '🖐️' : '👈';
    autoPlayButton.title = isAutoPlayDisabled ? '啟用自動播放' : '取消自動播放';
    updateQuestionTextVisibility();
}


function updateAudioButtonsState() {
    const audioButtons = document.querySelectorAll('.question-audio-button');
    audioButtons.forEach(button => {
        button.classList.toggle('muted', isGloballyMuted);
        if (isGloballyMuted && button.classList.contains('playing')) {
            button.classList.remove('playing');
            // 如果有正在播放的音頻，停止它
            if (currentlyPlayingAudio) {
                currentlyPlayingAudio.pause();
                currentlyPlayingAudio.currentTime = 0;
            }
        }
    });
}

function createQuestionAudioButton(src) {
    const audioButton = document.createElement('button');
    audioButton.className = 'question-audio-button';
    
    const audio = new Audio(src);

    function playAudio() {
        if (!isAutoPlayDisabled) {
            audio.play();
            audioButton.classList.add('playing');
        }
    }

    audioButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (audio.paused) {
            audio.play();
            audioButton.classList.add('playing');
        } else {
            audio.pause();
            audio.currentTime = 0;
            audioButton.classList.remove('playing');
        }
    });

    audio.addEventListener('ended', () => {
        audioButton.classList.remove('playing');
    });

    // 自動播放
    setTimeout(playAudio, 500); // 延遲半秒播放，確保DOM已完全加載

    return { audioButton, audio, playAudio };
}

function createAudioOption(src) {
    const container = document.createElement('div');
    container.className = 'audio-option';

    const audio = document.createElement('audio');
    audio.src = src;

    const playButton = document.createElement('button');
    playButton.className = 'play-button';
    
    playButton.addEventListener('click', (e) => {
        e.stopPropagation(); // 防止觸發選項選擇

        // 如果有其他正在播放的音頻,停止它並重置其按鈕
        if (currentlyPlayingAudio && currentlyPlayingAudio !== audio) {
            currentlyPlayingAudio.pause();
            currentlyPlayingAudio.currentTime = 0;
            if (currentlyPlayingButton) {
                currentlyPlayingButton.classList.remove('playing');
            }
        }

        if (audio.paused) {
            audio.play();
            playButton.classList.add('playing');
            currentlyPlayingAudio = audio;
            currentlyPlayingButton = playButton;
        } else {
            audio.pause();
            audio.currentTime = 0;
            playButton.classList.remove('playing');
            currentlyPlayingAudio = null;
            currentlyPlayingButton = null;
        }
    });

    // 添加音頻結束事件監聽器
    audio.addEventListener('ended', () => {
        playButton.classList.remove('playing');
        currentlyPlayingAudio = null;
        currentlyPlayingButton = null;
    });

    container.appendChild(playButton);
    container.appendChild(audio);
    return container;
}



confirmButton.addEventListener('click', () => {
    if (!isConfirmed) {
        currentQuestion = myQuestions[currentQuestionIndex];

        // 停止當前正在播放的音頻
        if (currentQuestionAudio) {
            currentQuestionAudio.pause();
            currentQuestionAudio.currentTime = 0;
        }

		if (isGroupingQuestion(currentQuestion)) {
		  handleGroupingConfirm(currentQuestion);
        } else if (isArrangingQuestion(currentQuestion)) {
            handleArrangingConfirm(currentQuestion);
        } else if (isSortingQuestion(currentQuestion)) {
            handleSortingConfirm(currentQuestion);
        } else if (isMatchingQuestion(currentQuestion)) {
            handleMatchingConfirm(currentQuestion);
			console.log(currentQuestion)
        } else {
            handleNormalConfirm(currentQuestion);
        }
    } else {
        feedbackContainer.classList.add('hiding2');
        //feedbackContainer.classList.remove('show');

        currentQuestionIndex++;
        showQuestion();
        confirmButton.textContent = '確定';
        isConfirmed = false;
    }
});





let matchCorrectLength = 0;
let matchQuestionLength = 0;

// fn配對計分
function handleMatchingConfirm(question) {
    const matchedItems = document.querySelectorAll('.matching-item.matched');
	const pairs = question.options
	  .flatMap(option => option.split(/\s+|;/)
		.filter(pair => pair.trim() !== '')
		.map(pair => pair.split(/[|\\=]/).map(word => word.trim()))
		.filter(pair => pair.length === 2 && pair.every(word => word !== ''))
	  );
	matchQuestionLength = matchQuestionLength + pairs.length -1; //配對題數 -1;



    const isCorrect = matchedItems.length === pairs.length * 2;
	const isCorrectMatch = matchCorrectLength === pairs.length;

    updateQuestionStats(question.id, isCorrectMatch);

	if(matchCorrectLength < 0){matchCorrectLength = 0;}

    if (isCorrect) {
        correctLength = correctLength + matchCorrectLength;
        playSound('right');
    } else {
        playSound('wrong');
    }
	matchCorrectLength = 0; //歸零;

    const feedbackIcon = isCorrect ? '✅' : '❌';
    const feedbackText = isCorrect ? question.correctFeedback : question.wrongFeedback;
    
    feedbackContainer.innerHTML = `
        <div class="feedback-icon">${feedbackIcon}</div>
        <div class="feedback-text">${feedbackText}</div>
    `;
    feedbackContainer.className = `feedback ${isCorrect ? 'correct' : 'incorrect'} show`;

    document.querySelectorAll('.matching-item').forEach(item => item.classList.add('disabled'));
    isConfirmed = true;
    confirmButton.textContent = '繼續 ➡️';
}


function logQuestionStats() {
    const stats = JSON.parse(localStorage.getItem('questionStats')) || {};
    const validIds = questions.map(q => q.id);

    //console.log('Question Statistics:');
    const statsList = Object.entries(stats)
        .filter(([id, data]) => validIds.includes(Number(id)))
        .map(([id, data]) => {
            const totalAttempts = data.correct + data.incorrect;
            return {
                ID: Number(id),
                Correct: data.correct,
                Incorrect: data.incorrect,
                TotalAttempts: totalAttempts,
                CorrectRate: ((data.correct / totalAttempts) * 100).toFixed(2) + '%'
            };
        });
    //console.table(statsList);
}

const sounds = {
  right: new Audio('right.mp3'),
  wrong: new Audio('wrong.mp3'),
  pass: new Audio('pass.mp3')
};

// 預加載音頻
Object.values(sounds).forEach(sound => sound.load());


function getQuizInfo() {
    const questionTypeText = questionType.options[questionType.selectedIndex]?.text || '　　　';
    const orderTypeText = orderType.value ? orderType.options[orderType.selectedIndex]?.text : '　　';
    const categoryText = category.value ? category.options[category.selectedIndex]?.text : '(無)';

    return `${questionTypeText} | ${orderTypeText} | ${categoryText}`;
}

// 結束
function endQuiz() {
    quizContainer.classList.add('hidden');
    endScreen.classList.remove('hidden');
	topControls.classList.add('hidden');
	progressBarContainer.classList.add('hidden');
    shareButton.classList.add('hidden');
	homeButton.classList.add('hidden');
	startAgainButton.classList.add('hidden');
	soundButton.classList.add('hidden');
	playSound('pass');

	const accuracy = (correctLength) / (myQuestions.length + matchQuestionLength + groupingallItemsLength - groupingQuestionLength);
    
    const quizInfo = getQuizInfo();
    document.querySelector('#end-screen .quiz-info').textContent = quizInfo;
    
    const scoreStars = document.querySelector('#end-screen .score-stars');
    scoreStars.innerHTML = generateStarRating(accuracy);

    // 保存歷史記錄
    saveHistory(accuracy * 100, quizInfo);
    
    // 顯示歷史記錄
    displayHistory();
	logQuestionStats();
}

function generateStarRating(accuracy) {
    let starCount = Math.round(accuracy * 10); // 計算應顯示的半星數量
    let starRatingHTML = '';
    
    for (let i = 0; i < 5; i++) {
        if (starCount >= (i + 1) * 2) {
            // 滿星
            starRatingHTML += '<span class="material-icons star yellow">star</span>';
        } else if (starCount >= (i * 2) + 1) {
            // 半星
            starRatingHTML += '<span class="material-icons star yellow">star_half</span>';
        } else {
            // 白色星星
            starRatingHTML += '<span class="material-icons star white">star</span>';
        }
    }
    
    // starRatingHTML += ` (${(accuracy * 100).toFixed(2)}%)`; // 加上百分比
    
    return starRatingHTML;
}


function saveHistory(score, quizInfo) {
    let history = JSON.parse(localStorage.getItem('quizHistory')) || [];
    const now = new Date();
    const dateString = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    history.unshift({
        date: dateString,
        score: score,
        quizInfo: quizInfo
    });

    // 只保留最近的 10 條記錄
    if (history.length > 10) {
        history = history.slice(0, 10);
    }

    localStorage.setItem('quizHistory', JSON.stringify(history));
    displayHistory();
}

function displayHistory() {
    const historyContainer = document.querySelector('.history-container');
    const historyList = document.getElementById('history-list');
    const history = JSON.parse(localStorage.getItem('quizHistory')) || [];

    if (history.length === 0) {
        historyContainer.classList.add('hidden');
    } else {
        historyContainer.classList.remove('hidden');

        historyList.innerHTML = history.map((item, index) => `
            <div class="history-item" data-index="${index}">
                <span class="delete-icon material-icons">close</span>
                <span class="history-date">${item.date}</span>
                <span class="history-score">✨ ${item.score.toFixed(0)}</span><br />
                <span class="history-info">${item.quizInfo}</span>
            </div>
        `).join('');

        // 添加刪除事件監聽器
        historyList.querySelectorAll('.delete-icon').forEach(icon => {
            icon.addEventListener('click', deleteHistoryItem);
        });
    }
}

function deleteHistoryItem(event) {
    event.stopPropagation(); // 防止事件冒泡
    const index = event.target.closest('.history-item').dataset.index;
    let history = JSON.parse(localStorage.getItem('quizHistory')) || [];
    
    history.splice(index, 1);
    localStorage.setItem('quizHistory', JSON.stringify(history));
    
    displayHistory(); // 重新顯示歷史記錄
}


clearQuestionStats.addEventListener('click', () => {
    if (confirm('確定要清除所有題目統計數據嗎？這個操作無法撤銷。')) {
        localStorage.removeItem('questionStats');
        logQuestionStats(); // 重新顯示清空後的統計資料
    }
});


function deleteHistoryItem(event) {
    event.stopPropagation();
    const index = event.target.closest('.history-item').dataset.index;
    let history = JSON.parse(localStorage.getItem('quizHistory')) || [];
    
    if (confirm('確定要刪除這條記錄嗎？')) {
        history.splice(index, 1);
        localStorage.setItem('quizHistory', JSON.stringify(history));
        displayHistory();
    }
}

document.getElementById('clear-history').addEventListener('click', () => {
    if (confirm('確定要清除所有歷史記錄嗎？')) {
        localStorage.removeItem('quizHistory');
        displayHistory();
    }
});




function shareQuestionStatsFn() {
    const stats = JSON.parse(localStorage.getItem('questionStats')) || {};
    const statusParam = Object.entries(stats)
        .map(([id, data]) => `${id},${data.correct},${data.incorrect}`)
        .join(',');

    const url = new URL(window.location.href);
    url.searchParams.set('status', statusParam);

	let currentURL = decodeURIComponent(url)

    if (currentURL.startsWith("http")) { // 偵測是否以http開頭;
        shortenUrl(currentURL)
            .then((shortenedUrl) => {              
                navigator.clipboard.writeText(shortenedUrl); // 在這裡處理縮短後的網址
				alert('短已複製到剪貼簿');
            })
            .catch((error) => {
                navigator.clipboard.writeText(decodeURIComponent(currentURL)); // 無法縮短則複製原始網址
				alert('長網址已複製到剪貼簿');
            });
    } else {
        navigator.clipboard.writeText(decodeURIComponent(currentURL)); // 離線版的原始網址
		alert('離線長網址已複製到剪貼簿');
    }
}



// Tinyurl 縮短網址
async function shortenUrl(originalUrl) {
    const apiUrl = "https://tinyurl.com/api-create.php?url=";
    const encodedUrl = encodeURIComponent(originalUrl);
    const shortenApiUrl = apiUrl + encodedUrl;
    try {
        const response = await fetch(shortenApiUrl);
        const shortenedUrl = await response.text();
        return shortenedUrl; // Tinyurl 縮短的網址
    } catch (error) {
        return originalUrl; // 無法縮短則返回原始網址
    }
}


















function importQuestionStats() {
    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get('status');
    
    if (statusParam) {
        const stats = {};
        const entries = statusParam.split(',');
        for (let i = 0; i < entries.length; i += 3) {
            const id = entries[i];
            const correct = parseInt(entries[i + 1]);
            const incorrect = parseInt(entries[i + 2]);
            stats[id] = { correct, incorrect };
        }
        
        // 合併現有的統計數據
        const existingStats = JSON.parse(localStorage.getItem('questionStats')) || {};
        const mergedStats = { ...existingStats, ...stats };
        localStorage.setItem('questionStats', JSON.stringify(mergedStats));
        
        // 移除 URL 參數並重新加載頁面
        const url = new URL(window.location.href);
        url.searchParams.delete('status');
        window.history.replaceState({}, document.title, url.toString());
        location.reload();
    }
}

// 在頁面加載時調用
document.addEventListener('DOMContentLoaded', importQuestionStats);


resultIcon.addEventListener('click', () => {
    settingsContainer.classList.toggle('hidden');
	endScreen.classList.toggle('hidden');
	topControls.classList.toggle('hidden');
});

gameLogo.addEventListener('click', () => {
    settingsContainer.classList.toggle('hidden');
	endScreen.classList.toggle('hidden');
	topControls.classList.toggle('hidden');
});

startAgainButton.addEventListener('click', () => {

    restart();
});

restartButton.addEventListener('click', () => {
    restart();
});

function restart() {

    // 停止當前正在播放的音頻
    if (currentQuestionAudio) {
        currentQuestionAudio.pause();
        currentQuestionAudio.currentTime = 0;
    }

    // 停止所有可能正在播放的音頻
    stopAllAudio();

    const elementsToHide = [// 要隱藏的;	
        quizContainer, 
        progressBarContainer, 
        homeButton, 
        startAgainButton, 
        soundButton, 
        endScreen
    ];
    
    const elementsToShow = [// 要顯示的;	
        shareButton, 
        settingsContainer, 
        topControls
    ];
    
    elementsToHide.forEach(element => element.classList.add('hidden'));
    elementsToShow.forEach(element => element.classList.remove('hidden'));
    
    initializeFromUrlParams();
	exitFullscreen();
}



function exitFullscreen() {
    if (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
        if(document.exitFullscreen) {
            document.exitFullscreen();
        } else if(document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if(document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if(document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

function stopAllAudio() {
    // 停止主要問題音頻
    if (currentQuestionAudio) {
        currentQuestionAudio.pause();
        currentQuestionAudio.currentTime = 0;
    }

    // 停止所有選項音頻（如果有的話）
    const allAudioElements = document.querySelectorAll('audio');
    allAudioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });

    // 重置所有播放按鈕的狀態
    const allPlayButtons = document.querySelectorAll('.play-button, .question-audio-button');
    allPlayButtons.forEach(button => {
        button.classList.remove('playing');
    });

    // 重置全局播放狀態
    currentlyPlayingAudio = null;
    currentlyPlayingButton = null;
}




function initializeFromUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type');
    const order = params.get('order');
    const categoryValue = params.get('category');

    if (type) {
        questionType.value = Object.keys(typeMapping).find(key => typeMapping[key] == type);
        if (questionType.value === 'mock') {
            orderType.disabled = true;
            category.disabled = true;
            orderType.value = ''; // 清空選擇
        } else {
            orderType.disabled = false;
            orderType.value = 'category';
            populateCategoryOptions(questionType.value);
            if (order) {
                orderType.value = Object.keys(orderMapping).find(key => orderMapping[key] == order);
                category.value = categoryValue == '1' ? 'all' : Object.keys(categoryMapping).find(key => categoryMapping[key] == categoryValue);
            }
        }
		shareButton.classList.add('hidden');
		homeButton.classList.remove('hidden');
		endScreen.classList.add('hidden');
        questionType.disabled = true;
        orderType.disabled = true;
        category.disabled = true;
        startButton.disabled = false;
    }
}



document.addEventListener('DOMContentLoaded', () => {
    initializeFromUrlParams();
    displayHistory();
    importQuestionStats();
    shareQuestionStats.addEventListener('click', shareQuestionStatsFn);
});




// 音效狀態
let isSoundEnabled = true;

// 音效按鈕點擊事件
soundButton.addEventListener('click', () => {
    isSoundEnabled = !isSoundEnabled;
    soundButton.textContent = isSoundEnabled ? '🔔' : '🔕';
    soundButton.title = isSoundEnabled ? '禁用音效' : '啟用音效';
});

function displayQuestionStats() {
    const stats = JSON.parse(localStorage.getItem('questionStats')) || {};
    let html = '<h3>題目統計</h3><table><tr><th>ID</th><th>答對</th><th>答錯</th><th>總次數</th><th>正確率</th></tr>';
    
    Object.entries(stats).forEach(([id, data]) => {
        const totalAttempts = data.correct + data.incorrect;
        const correctRate = totalAttempts > 0 ? ((data.correct / totalAttempts) * 100).toFixed(2) + '%' : 'N/A';
        html += `<tr>
            <td>${id}</td>
            <td>${data.correct}</td>
            <td>${data.incorrect}</td>
            <td>${totalAttempts}</td>
            <td>${correctRate}</td>
        </tr>`;
    });
    
    html += '</table>';
    
    // 假設您有一個用於顯示統計信息的容器元素
    const statsContainer = document.getElementById('stats-container');
    if (statsContainer) {
        statsContainer.innerHTML = html;
    }
}

// 題型辨別
function isArrangingQuestion(question) {
    return question.type === '安排' || question.correct === '安排' || question.correct === 'arrange' || question.correct === 'ap' || question.correct === 'a';
}

function isMatchingQuestion(question) {
    return question.type === '配對' || question.correct === '配對' || question.correct === 'match' || question.correct === 'pd' || question.correct === 'm';
}

function isSortingQuestion(question) {
    return question.type === '排序' || question.correct === '排序' || question.correct === 'sort' || question.correct === 'px' || question.correct === 's';
}

function isGroupingQuestion(question) {
  return question.type === '分組' || question.correct === '分組' || question.correct === 'group' || question.correct === 'fz' || question.correct === 'g';
}


// fn 排序出題
function showSortingQuestion(question) {
    const wordBank = document.getElementById('word-bank');
    const answerArea = document.getElementById('answer-area');

	const optionA = question.options[0];

    let words = [];

	 if (optionA.split(/\s+/).length <= 2) {
		words = splitWord(optionA);
	  } else {
		words = optionA.split(/\s+/);
	  }

    const shuffledWords = [...words].sort(() => Math.random() - 0.5);
    wordBank.innerHTML = '';
    answerArea.innerHTML = '';

    shuffledWords.forEach(word => {
        const wordElement = document.createElement('div');
		colorWord(wordElement, word);
        wordElement.classList.add("word");
        wordElement.textContent = word;
        wordElement.addEventListener('click', () => moveWord(wordElement, answerArea, wordBank));
        wordBank.appendChild(wordElement);
    });

    resetSorting.addEventListener('click', () => resetSortingFn(shuffledWords, wordBank, answerArea));
}



function colorWord(element, text) {
  const patterns = {
	aeiou: /^(ee|oo|er|ii|a|e|i|o|u|y|oe|[ýŷüǖǘǚÜǕǗǙǛƗǜɄɨʉ⌃ÉéÀÁÂÈÊÌÍÎÒÓÔÙÚÛàáâèêìíîòóôùúûĀāĂăĒēĔĕĚěĪīĬĭŃńŌōŎŏŐőŪūŬŭŰűǍǎǏǐǑǒǓǔǸǹḾḿ]|ỳ|ȳ|y̌|M̀|m̀|M̂|N̂|m̂|n̂|M̄|N̄|m̄|n̄|M̆|m̆|N̆|n̆|Ő͘|ő͘|A̋|E̋|I̋|M̋|N̋|a̋|e̋|i̋|m̋|n̋|M̌|Ň|m̌|ň|O̍͘|o̍͘|A̍|E̍|I̍|M̍|N̍|O̍|U̍|a̍|e̍|i̍|m̍|n̍|o̍|u̍|Ő͘|ő͘|O̍͘|o̍͘|O͘|o͘|Ò͘|Ó͘|Ô͘|ò͘|ó͘|ô͘|Ō͘|ō͘|Ǒ͘|ǒ͘|E̋re|Ére|Ère|Êre|Ěre|Ēre|E̍re|e̋re|ére|ère|êre|ěre|ēre|e̍re|I̋r|Ír|Ìr|Îr|Ǐr|Īr|I̍r|i̋r|ír|ìr|îr|ǐr|īr|i̍r|Őo|Óo|Òo|Ôo|Ǒo|Ōo|O̍o|őo|óo|òo|ôo|ǒo|ōo|o̍o|Őe|Óe|Òe|Ôe|Ǒe|Ōe|O̍e|őe|óe|òe|ôe|ǒe|ōe|o̍e|E̋e|Ée|Èe|Êe|Ěe|Ēe|E̍e|e̋e|ée|èe|êe|ěe|ēe|e̍e)$/,
    b: /^(b|p|m|f|v|bb)$/,
    d: /^(d|t|n|l)$/,
    g: /^(g|k|ng|h)$/,
    z: /^(z|c|s)$/,
    j: /^(j|q|x)$/,
    zh: /^(zh|ch|sh|rh|ts|tsh)$/,
    tone: /^([ˊˇˋˆ⁺\^\+])$/
  };

  for (const [className, regex] of Object.entries(patterns)) {
    if (regex.test(text)) {
      element.classList.add(className);
      return;
    }
  }
}




function splitWord(word) {
  const exceptions = "E̋re,Ére,Ère,Êre,Ěre,Ēre,E̍re,e̋re,ére,ère,êre,ěre,ēre,e̍re,I̋r,Ír,Ìr,Îr,Ǐr,Īr,I̍r,i̋r,ír,ìr,îr,ǐr,īr,i̍r,Őo,Óo,Òo,Ôo,Ǒo,Ōo,O̍o,őo,óo,òo,ôo,ǒo,ōo,o̍o,Őe,Óe,Òe,Ôe,Ǒe,Ōe,O̍e,őe,óe,òe,ôe,ǒe,ōe,o̍e,E̋e,Ée,Èe,Êe,Ěe,Ēe,E̍e,e̋e,ée,èe,êe,ěe,ēe,e̍e,Ő,Ó,Ò,Ô,Ǒ,Ō,O̍,ő,ó,ò,ô,ǒ,ō,o̍,Ǖ,Ǘ,Ǚ,Ǜ,ǖ,ǘ,ǚ,ǜ,Ȳ,Y̌,Ý,Ỳ,Ŷ,ȳ,y̌,ý,ỳ,ŷ,A̋,Á,À,Â,Ǎ,Ā,A̍,a̋,á,à,â,ǎ,ā,a̍,E̋,É,È,Ê,Ě,Ē,E̍,e̋,é,è,ê,ě,ē,e̍,Ű,Ú,Ù,Û,Ǔ,Ū,U̍,ű,ú,ù,û,ǔ,ū,u̍,I̋,Í,Ì,Î,Ǐ,Ī,I̍,i̋,í,ì,î,ǐ,ī,i̍,M̋,Ḿ,M̀,M̂,M̌,M̄,M̍,m̋,ḿ,m̀,m̂,m̌,m̄,m̍,N̋,Ń,Ǹ,N̂,Ň,N̄,N̍,n̋,ń,ǹ,n̂,ň,n̄,n̍,Ő͘,ő͘,O̍͘,o̍͘,O͘,o͘,Ò͘,Ó͘,Ô͘,ò͘,ó͘,ô͘,Ō͘,ō͘,Ǒ͘,ǒ͘,Ő͘,ő͘,rh,zh,ch,sh,bb,ee,oo,ng,ii,er,ir,ere,oe,nn,tsh,ph,th,kh,ts,Rh,Zh,Ch,Sh,Bb,Ee,Oo,Ng,Ii,Er,Ir,Ere,Oe,Nn,Tsh,Ph,Th,Kh,Ts".split(",");
  let result = [];
  let temp = '';
  for (let i = 0; i < word.length; i++) {
    temp += word[i];
    if (i < word.length - 1) {
      const pair = word[i] + word[i + 1];
      if (!exceptions.includes(pair)) {
        result.push(temp);
        temp = '';
      }
    }
  }
  if (temp !== '') {
    result.push(temp);
  }
  return result;
}

// fn移動單詞
function moveWord(wordElement, targetContainer, sourceContainer) {

    if (targetContainer.contains(wordElement)) {
        sourceContainer.appendChild(wordElement);
    } else {
        targetContainer.appendChild(wordElement);
    }
	resetSorting.disabled = targetContainer.children.length < 1;
	confirmButton.disabled = sourceContainer.children.length > 0;
}

// fn排序重設
function resetSortingFn(words, wordBank, answerArea) {
    if (wordBank.children.length === 0) {
        // 如果 wordBank 為空，獲取 answerArea 中所有單詞的文本
        const currentWords = Array.from(answerArea.children).map(el => el.textContent);
        
        // 清空 answerArea
        answerArea.innerHTML = '';
        
        // 清空 wordBank（以防萬一）
        wordBank.innerHTML = '';
        
        // 使用獲取的單詞重新創建元素並添加到 wordBank
        currentWords.forEach(word => {
            const wordElement = document.createElement('div');
			colorWord(wordElement, word);
            wordElement.classList.add("word");
            wordElement.textContent = word;
            wordElement.addEventListener('click', () => moveWord(wordElement, answerArea, wordBank));
            wordBank.appendChild(wordElement);
        });		
    } else {
        // 原有的重置邏輯
        wordBank.innerHTML = '';
        answerArea.innerHTML = '';
        words.forEach(word => {
            const wordElement = document.createElement('div');
            wordElement.className = 'word';
            wordElement.textContent = word;
            wordElement.addEventListener('click', () => moveWord(wordElement, answerArea, wordBank));
            wordBank.appendChild(wordElement);
        });
    }
	confirmButton.disabled = true;
}

// 新增：更新確認按鈕狀態
function updateConfirmButton() {
    const matchedItems = document.querySelectorAll('.matching-item.matched');
    const totalPairs = document.querySelectorAll('.left-item').length;
    confirmButton.disabled = matchedItems.length !== totalPairs * 2;
}

let isCorrectFirst = 0;
let sortingItemsWrong = 0;

function handleSortingConfirm(question) {
    const answerArea = document.getElementById('answer-area');
    const wordBank = document.getElementById('word-bank');
    const userAnswer = Array.from(answerArea.children).map(word => word.textContent).join(' ');
    const isCorrect = userAnswer.replace(/\s+/g, '') === question.options[0].replace(/\s+/g, '');
	const catIcon = document.querySelector('.cat-icon');
    updateQuestionStats(question.id, isCorrect);
    if (isCorrect) {
        if(isCorrectFirst == 0){
          correctLength += 1; // 第一次正確才有加分
        }
        isCorrectFirst = 0;
        playSound('right');
        resetSorting.disabled = true;
        resetSorting.classList.remove('error');
        document.querySelectorAll('.word').forEach(word => word.classList.add('disabled'));
        isConfirmed = true;
        confirmButton.textContent = '繼續 ➡️';
		catIcon.textContent = '😸';
		sortingItemsWrong = 0;
    } else {
		sortingItemsWrong += 1;
		catIcon.textContent = '🙀';
        isCorrectFirst = isCorrectFirst + 1;
        playSound('wrong');
        resetSorting.classList.add('error');
		answerArea.classList.add('shake');

        // 0.8秒後自動執行 resetSortingFn
        setTimeout(() => {
			answerArea.classList.remove('shake');
            resetSortingFn(question.options[0].split(/\s+/), wordBank, answerArea);
        }, 1000);
		//confirmButton.disabled = true;
    }
	let rightAnswer = "";
	if (sortingItemsWrong >= 2) {
		rightAnswer = " 🙈 " + question.options[0];		
	}else{
		rightAnswer = question.wrongFeedback;	
	}
    const feedbackIcon = isCorrect ? '✅' : '❌';
    const feedbackText = isCorrect ? question.correctFeedback : rightAnswer;
	rightAnswer = "";
    
    feedbackContainer.innerHTML = `
        <div class="feedback-icon">${feedbackIcon}</div>
        <div class="feedback-text">${feedbackText}</div>
    `;
    feedbackContainer.className = `feedback ${isCorrect ? 'correct' : 'incorrect'} show`;   
}








// 顯示普通題目 here
let lastSelectedIndex = null;

function showNormalQuestion(currentQuestion) {
    optionsContainer.innerHTML = '';
    const hasMediaOptions = detectMediaInOptions(currentQuestion.options);
    optionsContainer.className = hasMediaOptions ? 'options grid-options' : 'options';
    
    currentQuestion.options.forEach((option, index) => {
        if (option.trim() !== '') {
            const li = document.createElement('li');
            if (option.endsWith('.mp3')) {
                li.appendChild(createAudioOption(option));
            } else if (option.startsWith('http') || option.endsWith('.jpg') || option.endsWith('.png') || option.endsWith('.gif')) {
                const img = document.createElement('img');
                img.src = option;
                li.appendChild(img);
            } else {
                li.textContent = option;
            }
            li.addEventListener('click', () => handleOptionClick(index));
            optionsContainer.appendChild(li);
        }
    });

    // 重置上一次選擇的索引
    lastSelectedIndex = null;
}

function handleOptionClick(index) {
    if (index === lastSelectedIndex) {
        // 如果點擊的是已選中的選項，觸發 confirmButton 點擊事件
        confirmButton.click();
    } else {
        // 否則，選中新的選項
        selectOption(index);
    }
}

function selectOption(index) {
    selectedOptionIndex = index;
    lastSelectedIndex = index;
    const options = optionsContainer.querySelectorAll('li');
    options.forEach(option => option.classList.remove('selected'));
    options[index].classList.add('selected');
    confirmButton.disabled = false;
}




// 新增：處理普通題確認
function handleNormalConfirm(currentQuestion) {
	const catIcon = document.querySelector('.cat-icon');
    if (selectedOptionIndex === null) return;

    selectedAnswers[currentQuestionIndex] = selectedOptionIndex;
    
    const correctIndex = Number(currentQuestion.correct) - 1;

    let isCorrect = selectedOptionIndex === correctIndex;
    updateQuestionStats(currentQuestion.id, isCorrect);
    
    if (isCorrect) {
	  correctLength += 1;
	  catIcon.textContent = '😸';
      playSound('right'); 

    } else {
      playSound('wrong');
	  catIcon.textContent = '😿';

    }

    const options = optionsContainer.querySelectorAll('li');
    options.forEach((option, index) => {
        option.classList.remove('correct', 'incorrect', 'selected');
        if (index === selectedOptionIndex) {
            option.classList.add(isCorrect ? 'correct' : 'incorrect');
        } else if (index === correctIndex && !isCorrect) {
            option.classList.add('correct');
        }
    });

    const feedbackIcon = isCorrect ? '✅' : '❌';
    const feedbackText = isCorrect ? currentQuestion.correctFeedback : currentQuestion.wrongFeedback;
    
    feedbackContainer.innerHTML = `
        <div class="feedback-icon">${feedbackIcon}</div>
        <div class="feedback-text">${feedbackText}</div>
    `;
    feedbackContainer.className = `feedback ${isCorrect ? 'correct' : 'incorrect'} show`;

    options.forEach(option => option.classList.add('disabled'));
    isConfirmed = true;
    confirmButton.textContent = '繼續 ➡️';
}










//===安排=================================
function showArrangingQuestion(question) {
  const itemsContainer = arrangingContainer.querySelector('.arranging-items');
  const dropzone = arrangingContainer.querySelector('.arranging-dropzone');
  itemsContainer.innerHTML = '';
  dropzone.innerHTML = '';

  // 解析選項
  let options = question.options
  .flatMap(option => option.split('|'))
  .filter(option => option.trim() !== '');

  // 隨機打亂選項順序
  options = options.sort(() => Math.random() - 0.5);
  options.forEach((option, index) => {
    const item = document.createElement('div');
    item.className = 'arranging-item';
    item.textContent = option;
    item.draggable = true; // 重置拖曳狀態
    item.id = `item-${index}`;
    item.classList.remove('disabled'); // 移除禁用狀態
    item.addEventListener('dragstart', dragStart);
    item.addEventListener('dragend', dragEnd);
    itemsContainer.appendChild(item);
  });
  dropzone.addEventListener('dragover', dragOver);
  dropzone.addEventListener('drop', drop);
  confirmButton.disabled = true;
}
function dragStart(e) {
  e.dataTransfer.setData('text/plain', e.target.id);
  setTimeout(() => e.target.classList.add('dragging'), 0);
}
function dragEnd(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.arranging-item').forEach(item => {
    item.classList.remove('drag-over-top', 'drag-over-bottom');
  });
  document.querySelector('.arranging-dropzone').classList.remove('drag-over');
}
function dragOver(e) {
  e.preventDefault();
  const dropzone = e.currentTarget;
  const afterElement = getDragAfterElement(dropzone, e.clientY);
  const draggable = document.querySelector('.dragging');
  
  // 移除所有之前的拖曳效果
  dropzone.querySelectorAll('.arranging-item').forEach(item => {
    item.classList.remove('drag-over-top', 'drag-over-bottom');
  });
  dropzone.classList.remove('drag-over');
  
  if (e.target.classList.contains('arranging-item')) {
    const box = e.target.getBoundingClientRect();
    const offsetY = e.clientY - box.top;
    if (offsetY < box.height / 2) {
      e.target.classList.add('drag-over-top');
      dropzone.insertBefore(draggable, e.target);
    } else {
      e.target.classList.add('drag-over-bottom');
      dropzone.insertBefore(draggable, e.target.nextSibling);
    }
  } else if (e.target === dropzone) {
    // 如果拖曳到空的 dropzone 區域
    dropzone.classList.add('drag-over');
    if (afterElement == null) {
      dropzone.appendChild(draggable);
    } else {
      dropzone.insertBefore(draggable, afterElement);
    }
  }
  updateItemNumbers();
  updateConfirmButtonState();
}
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.arranging-item:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}
function drop(e) {
  e.preventDefault();
  const draggedItemId = e.dataTransfer.getData('text');
  const draggedItem = document.getElementById(draggedItemId);
  updateItemNumbers();
  updateConfirmButtonState();
}
function updateConfirmButtonState() {
  const dropzone = document.querySelector('.arranging-dropzone');
  const itemsContainer = document.querySelector('.arranging-items');
  
  // 檢查 itemsContainer 是否為空（所有項目都被拖到了 dropzone）
  const allItemsMoved = itemsContainer.children.length === 0;
  
  // 只有當所有項目都被移動到 dropzone 時，才啟用確認按鈕
  confirmButton.disabled = !allItemsMoved;
}
let hintItems = "";
function handleArrangingConfirm(question) {
    const dropzone = document.querySelector('.arranging-dropzone');
    const catIcon = document.querySelector('.cat-icon');
    const userAnswer = Array.from(dropzone.children).map(item => {
        return item.textContent.replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*/, '');
    });

  let correctAnswer = question.options
  .flatMap(option => option.split('|'))
  .filter(option => option.trim() !== '');


    const isCorrect = JSON.stringify(userAnswer) === JSON.stringify(correctAnswer);
    updateQuestionStats(question.id, isCorrect);
    if (isCorrect) {
        if (isCorrectFirst == 0) {
            correctLength += 1; // 第一次正確才有加分
        }
        isCorrectFirst = 0;
        playSound('right');
        // 禁用所有項目的拖曳
        document.querySelectorAll('.arranging-item').forEach(item => {
            item.draggable = false;
            item.classList.add('disabled');
        });
        confirmButton.textContent = '繼續 ➡️';
        isConfirmed = true;
        catIcon.textContent = '😸';
    } else {
        dropzone.classList.add('shake');
        setTimeout(() => {
            dropzone.classList.remove('shake');
        }, 1000);
        isCorrectFirst = isCorrectFirst + 1;
        playSound('wrong');
        catIcon.textContent = '😿';
        // 生成帶有序號的正確答案提示
        hintItems = correctAnswer.map((item, index) => {
            const number = ['➊', '➋', '➌', '➍', '➎', '➏', '➐', '➑', '➒', '➓'][index];
            return `${number}${item.substring(0, 4)}`;
        }).join(' ');
        confirmButton.textContent = '重排再確認';
        isConfirmed = false;
    }
    const feedbackIcon = isCorrect ? '✅' : '❌';
    const feedbackText = isCorrect ? currentQuestion.correctFeedback : `${hintItems}\n${question.wrongFeedback}`;
    hintItems = "";
    feedbackContainer.innerHTML = `
        <div class="feedback-icon">${feedbackIcon}</div>
        <div class="feedback-text">${feedbackText}</div>
    `;
    feedbackContainer.className = `feedback ${isCorrect ? 'correct' : 'incorrect'} show`;    
}
function updateItemNumbers() {
  const dropzone = document.querySelector('.arranging-dropzone');
  const items = dropzone.querySelectorAll('.arranging-item');
  const numbers = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
  
  items.forEach((item, index) => {
    // 移除舊的序號（如果存在）
    const oldNumber = item.querySelector('.item-number');
    if (oldNumber) {
      oldNumber.remove();
    }
    
    // 添加新的序號
    const numberSpan = document.createElement('span');
    numberSpan.className = 'item-number';
    numberSpan.textContent = numbers[index] || (index + 1).toString();
    item.insertBefore(numberSpan, item.firstChild);
  });
}



//====分組================================

let groupingallItemsLength = 0
let groupingQuestionLength = 0
let groupingItemsLength = 0
let groupingItemsWrong = 0

function showGroupingQuestion(question) {
  const groupingContainer = document.getElementById('grouping-container');
  groupingContainer.innerHTML = '';
  groupingContainer.style.display = 'flex';

/*
  const groups = question.options.filter(option => option.includes(':'));
  const allItems = groups.flatMap(group => {
    const [groupName, itemsStr] = group.split(/:|：/);
    return itemsStr.split(/;|；/).map(item => ({ group: groupName, item: item.trim() }));
  });
*/

  const groups = question.options.filter(option => /[:：|]/.test(option));
  const allItems = groups.flatMap(group => {
    const [groupName, itemsStr] = group.split(/[:：]/);
    return itemsStr.split(/[;；|]/).map(item => ({ group: groupName.trim(), item: item.trim() }));
  });



  groupingallItemsLength = groupingallItemsLength + allItems.length; //加到總題數;
  groupingItemsLength = allItems.length; // 用於算單題得分;
  groupingItemsWrong = 0; // 用於算單題得分;
  groupingQuestionLength = groupingQuestionLength + 1;

  // 打亂所有項目的順序
  const shuffledItems = allItems.sort(() => Math.random() - 0.5);

  // 創建所有組
  groups.forEach(group => {
    const [groupName] = group.split(/[:：]/);
    const groupElement = document.createElement('div');
    groupElement.className = 'group';
    groupElement.innerHTML = `
      <div class="group-header">
        <span class="material-icons toggle-group">expand_more</span>
        <div class="group-name">${groupName}</div>
      </div>
      <div class="group-items-wrapper">
        <div class="group-items" data-group="${groupName}"></div>
      </div>
      <div class="collapsed-dropzone" style="display: none;">拖曳至此</div>
    `;
    groupingContainer.appendChild(groupElement);

    const toggleButton = groupElement.querySelector('.toggle-group');
    toggleButton.addEventListener('click', toggleGroup);
    const groupNameButton = groupElement.querySelector('.group-name');
    groupNameButton.addEventListener('click', toggleGroup);
  });

  // 獲取所有組的容器
  const groupContainers = document.querySelectorAll('.group-items');

  // 確保分配不完全正確
  let attempt = 0;
  const maxAttempts = 2; // 最大重試次數
  do {
    if (attempt >= maxAttempts) {
      console.warn('Reached maximum attempts to distribute items incorrectly.');
      break;
    }
    attempt++;

    // 重置所有組
    groupContainers.forEach(container => container.innerHTML = '');

    // 將打亂的項目均勻分配到各組
    shuffledItems.forEach((itemData, index) => {
      const itemElement = createGroupItem(itemData.item);
      const targetGroupIndex = index % groupContainers.length;
      groupContainers[targetGroupIndex].appendChild(itemElement);
    });
  } while (isDistributionCorrect(groups, groupContainers));

  setupDragAndDrop();
  updateConfirmButtonStateGroup();
  updateMoveButtons();
}

function isDistributionCorrect(groups, groupContainers) {
  return groups.every((group, index) => {
    const [groupName, itemsStr] = group.split(/[:：]/);
    const correctItems = itemsStr.split(/[;；|]/).map(item => item.trim());
    const currentItems = Array.from(groupContainers[index].querySelectorAll('.item-text')).map(item => item.textContent.trim());
    return correctItems.length === currentItems.length && correctItems.every(item => currentItems.includes(item));
  });
}


function toggleGroup(e) {
  const group = e.target.closest('.group');
  const groupHeader = group.querySelector('.group-header');
  const toggleIcon = groupHeader.querySelector('.toggle-group');
  const groupItemsWrapper = group.querySelector('.group-items-wrapper');
  const collapsedDropzone = group.querySelector('.collapsed-dropzone');

  group.classList.toggle('collapsed');
  toggleIcon.textContent = group.classList.contains('collapsed') ? 'expand_more' : 'expand_less';

  if (group.classList.contains('collapsed')) {
    groupItemsWrapper.style.display = 'none';
    collapsedDropzone.style.display = 'block';
    updateCollapsedGroupItemCount(group);
  } else {
    groupItemsWrapper.style.display = 'block';
    collapsedDropzone.style.display = 'none';
    const countElement = group.querySelector('.collapsed-item-count');
    if (countElement) {
      countElement.remove();
    }
  }
}

function updateCollapsedGroupItemCount(group) {
  const itemCount = group.querySelectorAll('.group-items .group-item').length;
  let countElement = group.querySelector('.collapsed-item-count');
  
  if (!countElement) {
    countElement = document.createElement('span');
    countElement.className = 'collapsed-item-count';
    group.querySelector('.collapsed-dropzone').appendChild(countElement);
  }
  
  if (group.classList.contains('collapsed')) {
    countElement.textContent = `(${itemCount})`;
    countElement.style.display = 'inline';
  } else {
    countElement.style.display = 'none';
  }
}


function createGroupItem(itemText) {
  const itemElement = document.createElement('div');
  itemElement.className = 'group-item';
  itemElement.innerHTML = `
    <span class="item-text">${itemText}</span>
    <div class="item-controls">
      <span class="move-up"><span class="material-icons">keyboard_arrow_up</span></span>
      <span class="move-down"><span class="material-icons">keyboard_arrow_down</span></span>
    </div>
  `;
  itemElement.draggable = true;
  return itemElement;
}

function updateMoveButtons() {
  const groups = Array.from(document.querySelectorAll('.group-items'));
  groups.forEach((group, groupIndex) => {
    const items = group.querySelectorAll('.group-item');
    items.forEach((item) => {
      const moveUp = item.querySelector('.move-up');
      const moveDown = item.querySelector('.move-down');
      
      if (groupIndex === 0) {
        moveUp.style.display = 'none';
      } else {
        moveUp.style.display = '';
      }
      
      if (groupIndex === groups.length - 1) {
        moveDown.style.display = 'none';
      } else {
        moveDown.style.display = '';
      }
    });
  });
}


function setupDragAndDrop() {
  const items = document.querySelectorAll('.group-item');
  const groups = document.querySelectorAll('.group');

  items.forEach(item => {
    item.addEventListener('dragstart', dragStartGroup);
    item.addEventListener('dragend', dragEndGroup);
  });

  groups.forEach(group => {
    group.addEventListener('dragover', dragOverGroup);
    group.addEventListener('dragleave', dragLeave);
    group.addEventListener('drop', dropGroup);
  });

  document.querySelectorAll('.move-up').forEach(button => {
    button.addEventListener('click', moveItemUp);
  });

  document.querySelectorAll('.move-down').forEach(button => {
    button.addEventListener('click', moveItemDown);
  });
}

function moveItemUp(e) {
  const item = e.target.closest('.group-item');
  const currentGroup = item.closest('.group-items');
  const groups = Array.from(document.querySelectorAll('.group-items'));
  const currentIndex = groups.indexOf(currentGroup);
  
  if (currentIndex > 0) {
    const targetGroup = groups[currentIndex - 1];
    targetGroup.appendChild(item);
    updateConfirmButtonStateGroup();
    updateCollapsedGroupItemCount(targetGroup.closest('.group'));
  }    
  updateMoveButtons();
}

function moveItemDown(e) {
  const item = e.target.closest('.group-item');
  const currentGroup = item.closest('.group-items');
  const groups = Array.from(document.querySelectorAll('.group-items'));
  const currentIndex = groups.indexOf(currentGroup);
  
  if (currentIndex < groups.length - 1) {
    const targetGroup = groups[currentIndex + 1];
    targetGroup.appendChild(item);
    updateConfirmButtonStateGroup();
    updateCollapsedGroupItemCount(targetGroup.closest('.group'));
  }  
  updateMoveButtons();
}


function dragStartGroup(e) {
  e.dataTransfer.setData('text/plain', e.target.textContent);
  e.target.classList.add('dragging');
}



function dragEndGroup(e) {
  e.target.classList.remove('dragging');
  document.querySelectorAll('.group-item').forEach(item => {
    item.classList.remove('drag-over-top', 'drag-over-bottom');
  });
  document.querySelectorAll('.group').forEach(group => {
    group.classList.remove('drag-over');
  });
}

function dragOverGroup(e) {
  e.preventDefault();
  const group = e.target.closest('.group');
  if (group) {
    if (group.classList.contains('collapsed')) {
      const collapsedDropzone = group.querySelector('.collapsed-dropzone');
      if (e.target === collapsedDropzone || collapsedDropzone.contains(e.target)) {
        collapsedDropzone.classList.add('drag-over');
      }
    } else {
      const afterElement = getDragAfterElementGroup(group, e.clientY);
      const draggable = document.querySelector('.dragging');
      
      document.querySelectorAll('.group-item').forEach(item => {
        item.classList.remove('drag-over-top', 'drag-over-bottom');
      });
      
      if (afterElement == null) {
        const lastItem = group.querySelector('.group-items').lastElementChild;
        if (lastItem) {
          lastItem.classList.add('drag-over-bottom');
        }
      } else {
        afterElement.classList.add('drag-over-top');
      }
    }
  }
}


function getDragAfterElementGroup(group, y) {
  const draggableElements = [...group.querySelectorAll('.group-item:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}


function dragLeave(e) {
  const group = e.target.closest('.group');
  if (group) {
    group.classList.remove('drag-over');
  }
}

function dropGroup(e) {
  e.preventDefault();
  const group = e.target.closest('.group');
  
  if (group) {
    const draggable = document.querySelector('.dragging');
    if (group.classList.contains('collapsed')) {
      const groupItems = group.querySelector('.group-items');
      groupItems.appendChild(draggable);
      group.querySelector('.collapsed-dropzone').classList.remove('drag-over');
    } else {
      const groupItems = group.querySelector('.group-items');
      const afterElement = getDragAfterElementGroup(group, e.clientY);
      
      if (afterElement == null) {
        groupItems.appendChild(draggable);
      } else {
        groupItems.insertBefore(draggable, afterElement);
      }
    }
    
    updateCollapsedGroupItemCount(group);
  }

  document.querySelector('.dragging').classList.remove('dragging');
  document.querySelectorAll('.group-item').forEach(item => {
    item.classList.remove('drag-over-top', 'drag-over-bottom');
  });
  
  updateConfirmButtonStateGroup();
  updateMoveButtons();
}

function updateConfirmButtonStateGroup() {
  const groups = document.querySelectorAll('.group-items');
  const itemsContainer = document.querySelector('.group-items[data-group="items"]');
  
  // 檢查是否所有組都有至少一個項目，且項目容器（如果存在）為空
  const isAllItemsGrouped = Array.from(groups).every(group => 
    (group !== itemsContainer && group.children.length > 0) || 
    (group === itemsContainer && group.children.length === 0)
  );
  
  confirmButton.disabled = !isAllItemsGrouped;
}

// here
function handleGroupingConfirm(question) {
  const groups = document.querySelectorAll('.group');
  let isCorrect = true;
  const catIcon = document.querySelector('.cat-icon');

  groups.forEach(group => {
    const groupName = group.querySelector('.group-name').textContent;
    // 修改這裡：獲取項目文字時，只獲取 .item-text 元素的內容
    const items = Array.from(group.querySelectorAll('.group-item .item-text')).map(item => item.textContent.trim());

    const correctGroup = question.options.find(option => option.startsWith(groupName));
    if (correctGroup) {
      const correctItems = correctGroup.split(/[:：]/)[1].split(/[;；|]/).map(item => item.trim());
      if (!items.every(item => correctItems.includes(item)) || items.length !== correctItems.length) {
        isCorrect = false;
      }
    } else {
      // 如果找不到對應的正確組，也視為錯誤
      isCorrect = false;
    }
  });

  // 剩下的代碼保持不變
  updateQuestionStats(question.id, isCorrect);

  if (isCorrect) {
    correctLength += groupingItemsLength - groupingItemsWrong;
    playSound('right');
    catIcon.textContent = '😸';
    document.querySelectorAll('.group-item').forEach(item => {
      item.draggable = false;
      item.classList.add('disabled');
    });
  } else {
	  if(groupingItemsWrong >= groupingItemsLength){
		  groupingItemsWrong = groupingItemsLength;
	}else{
		groupingItemsWrong += 1;
	}	 
    playSound('wrong');
    catIcon.textContent = '😿';
    document.querySelector('.grouping-container').classList.add('shake');
    setTimeout(() => {
      document.querySelector('.grouping-container').classList.remove('shake');
    }, 1000);
  }

	let rightAnswer = "";
	if (groupingItemsWrong >= 2) {
	  const groups = question.options.filter(option => option.includes(':') || option.includes('：'));
	  rightAnswer = groups.map(group => {
		const [groupName, itemsStr] = group.split(/:|：/);
		const items = itemsStr.split(/;|；/).map(item => item.trim().substring(0, 3)).join(' / ');
		return `${groupName.substring(0, 3)}：${items}`;
	  }).join('<br />');  // 在每個組之間添加兩個換行
	  rightAnswer += '<br />'; 
	}

	const feedbackIcon = isCorrect ? '✅' : '❌';
	const feedbackText = isCorrect ? question.correctFeedback : rightAnswer + question.wrongFeedback;
	rightAnswer = "";

  feedbackContainer.innerHTML = `
    <div class="feedback-icon">${feedbackIcon}</div>
    <div class="feedback-text">${feedbackText}</div>
  `;
  feedbackContainer.className = `feedback ${isCorrect ? 'correct' : 'incorrect'} show`;

  isConfirmed = isCorrect;
  confirmButton.textContent = isCorrect ? '繼續 ➡️' : '重新分組';
}

