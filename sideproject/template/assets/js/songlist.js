window.onload = function () {

    const url = window.location.href;
    const usernameRegex = /\/([^/]+)\/songlistpage/;
    const match = url.match(usernameRegex);

    if (match && match[1]) {
        const username = match[1];
        // 现在你有了用户名，可以将它发送到后端以获取userID和头像路径
        fetch(`/get-userid-and-avatar?username=${username}`, {
            method: 'GET'
        })
            .then(response => response.json())
            .then(data => {
                if (data.userID && data.avatarPath) {
                    const avatarPath = data.avatarPath;
                    // 在这里使用头像路径，例如设置用户头像的<img>标签的src属性
                    const avatarImage = document.getElementById('avatarImage');
                    console.log(avatarPath);
                    avatarImage.src = avatarPath;
                } else {
                    console.error("UserID or avatarPath not found in response");
                }
            })
            .catch(error => console.error('Error:', error));
    } else {
        console.error("Username not found in URL");
    }


    // 按钮元素
    const chineseButton = document.getElementById('chineseButton');
    const japaneseButton = document.getElementById('japaneseButton');
    const englishButton = document.getElementById('englishButton');

    // 按钮事件监听器
    chineseButton.addEventListener('click', () => toggleLanguageFilter('中文'));
    japaneseButton.addEventListener('click', () => toggleLanguageFilter('日文'));
    englishButton.addEventListener('click', () => toggleLanguageFilter('英文'));

    let selectedLanguage = '';

    function toggleLanguageFilter(language) {
        selectedLanguage = (selectedLanguage === language) ? '' : language;
        updateButtons();
        searchAndFilterSongs();
    }

    function updateButtons() {
        // 根据筛选状态更新按钮样式
        chineseButton.classList.toggle('button-selected', selectedLanguage === '中文');
        japaneseButton.classList.toggle('button-selected', selectedLanguage === '日文');
        englishButton.classList.toggle('button-selected', selectedLanguage === '英文');
    }

    function updateButtons() {
        // 更新按钮样式
        chineseButton.classList.toggle('selected', selectedLanguage === '中文');
        japaneseButton.classList.toggle('selected', selectedLanguage === '日文');
        englishButton.classList.toggle('selected', selectedLanguage === '英文');
    }

    // 添加搜索事件监听器
    document.getElementById('searchBox').addEventListener('input', function (e) {
        searchSong(e.target.value);
    });

    // 定义全局变量来存储歌单数据
    let songlistData = [];

    // 定义搜索歌曲的函数
    function searchAndFilterSongs() {
        const searchText = document.getElementById('searchBox').value;
        let filteredData = songlistData;

        if (selectedLanguage) {
            filteredData = filteredData.filter(songlist => songlist.Language === selectedLanguage);
        }

        if (searchText) {
            filteredData = filteredData.filter(songlist => songlist.Name.includes(searchText));
        }

        displaySongs(filteredData);
    }

    // 修改现有的搜索事件监听器
    document.getElementById('searchBox').addEventListener('input', searchAndFilterSongs);
    const username = match[1];
    console.log(username);
    // 修改原来的数据获取方法，以存储数据到全局变量
    fetch('/display-songlist', {
        method: 'POST',
        // username傳到後端
        body: JSON.stringify({ username: username }), // 将用户名作为JSON数据发送到后端
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            songlistData = data; // 存储数据到全局变量
            displaySongs(data); // 显示数据
        })
        .catch(error => console.error('Error:', error));

    // 定义一个新函数来显示歌单
    // 定义一个新函数来显示歌单
    function displaySongs(data) {
        const tableBody = document.getElementById('songlistTable').getElementsByTagName('tbody')[0];
        tableBody.innerHTML = ''; // 清空现有数据
        data.forEach(songlist => {
            let row = tableBody.insertRow();
            let songNameCell = row.insertCell(0);
            songNameCell.innerHTML = songlist.Name;
            songNameCell.classList.add('clickable-song-name'); // 添加class以便于添加事件监听器
            row.insertCell(1).innerHTML = songlist.Singer;
            row.insertCell(2).innerHTML = songlist.Language;
            row.insertCell(3).innerHTML = songlist.Description;

            // 為歌曲名添加點擊事件
            songNameCell.addEventListener('click', () => copySongNameToClipboard(songlist.Name));
        });
    }

    // 定义一个函数来处理歌曲名的点击事件
    function copySongNameToClipboard(songName) {
        const textToCopy = `我可以點歌嗎！想要聽${songName}`;

        // 創建一個臨時的文本區域來選擇和複製文字
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();

        try {
            // 嘗試使用 navigator.clipboard API
            navigator.clipboard.writeText(textToCopy).then(() => {
                alert('已複製到剪貼簿: ' + textToCopy);
            }).catch(() => {
                // 如果 navigator.clipboard 失敗，則使用 execCommand
                document.execCommand('copy') ? alert('已複製到剪貼簿: ' + textToCopy) : console.error('無法複製歌曲名稱');
            });
        } catch (err) {
            // 如果 navigator.clipboard 不可用，則使用 execCommand
            document.execCommand('copy') ? alert('已複製到剪貼簿: ' + textToCopy) : console.error('無法複製歌曲名稱', err);
        }

        // 移除臨時創建的文本區域
        document.body.removeChild(textArea);
    };

}
