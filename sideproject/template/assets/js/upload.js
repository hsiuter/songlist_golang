// script.js

window.onload = function () {
    var username = document.querySelector('.user-info span').textContent;
    // 检查用户名是否为空或仅包含欢迎信息
    if (!username || username.trim() === '欢迎回来！！' || username.includes('欢迎回来！！')) {
        window.location.href = '/loginpage'; // 重定向到登录页面
    };
    document.getElementById('addSongForm').addEventListener('submit', function (event) {
        event.preventDefault();

        const songName = document.getElementById('songName').value;
        const singer = document.getElementById('singer').value;
        const language = document.getElementById('language').value;
        const description = document.getElementById('description').value;

        fetch('/add-song', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `name=${encodeURIComponent(songName)}&singer=${encodeURIComponent(singer)}&language=${encodeURIComponent(language)}&description=${encodeURIComponent(description)}`
        })
            .then(response => {
                if (response.ok) {
                    alert("歌曲添加成功");
                    // 可以在这里清空表单，或者刷新歌单列表
                    document.getElementById('addSongForm').reset();
                    loadSongs(); // 如果您有这个函数来重新加载歌单
                } else {
                    alert("添加歌曲失败");
                }
            });
    });
    // 当页面加载时，加载歌单
    loadSongs();
    document.getElementById('showImageBtn').onclick = function () {
        document.getElementById('imageModal').style.display = "block";
        document.getElementById('overlay').style.display = "block";
        document.getElementById('modalImage').src = "/assets/img/example.png"; // 替换为图片的路径
    }

    // 点击遮罩层或关闭按钮隐藏图片和遮罩层
    document.getElementsByClassName("close")[0].onclick = function () {
        document.getElementById('imageModal').style.display = "none";
        document.getElementById('overlay').style.display = "none";
    }
    document.getElementById('overlay').onclick = function () {
        document.getElementById('imageModal').style.display = "none";
        document.getElementById('overlay').style.display = "none";
    }

};

function uploadFile(event) {
    var fileInput = document.getElementById('songlist');
    var file = fileInput.files[0];
    var formData = new FormData();
    formData.append('songlist', file);

    fetch('/upload-songlist', {
        method: 'POST',
        body: formData,
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
        }
    })
        .then(response => {
            if (response.status === 200) {
                return response.text();
            } else if (response.status === 400) {
                throw new Error('请选择文件');
            } else {
                throw new Error('Server Error');
            }
        })
        .then(data => {
            console.log(data);
            if (data === '上传成功') {
                alert('上傳成功！');
                window.location.reload();
            } else {
                alert('上傳失败，服务器返回了错误的响应！');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('上傳失败！' + error.message);
        });

    event.preventDefault();
}

function uploadTheme() {
    var mainColorInput = document.getElementById('main_color');
    var subColorInput = document.getElementById('sub_color');
    var subColor_1Input = document.getElementById('sub_color_1');

    var mainColor = mainColorInput.value;
    var subColor = subColorInput.value;
    var subColor_1 = subColor_1Input.value;

    // 将颜色值转换为十六进制格式
    mainColor = "#" + mainColor.slice(1); // 去掉颜色值前面的#
    subColor = "#" + subColor.slice(1);
    subColor_1 = "#" + subColor_1.slice(1);

    var formData = new FormData();
    formData.append('main_color', mainColor);
    formData.append('sub_color', subColor);
    formData.append('sub_color_1', subColor_1);

    fetch('update-theme?timestamp=' + Date.now(), {
        method: 'POST',
        body: formData,
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
        }
    })
        .then(data => {
            console.log(data);
            alert('主题更新成功！');
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
        });
}

function uploadAvatar() {
    var avatarInput = document.getElementById('avatar');
    var avatar = avatarInput.files[0];

    var formData = new FormData();
    formData.append('avatar', avatar);

    fetch('/update-avatar', {
        method: 'POST',
        body: formData,
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('只允许上传 .jpg 文件');
            }
            return response.text();
        })
        .then(data => {
            console.log(data);
            alert('头像更新成功！');
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
        });
}

function deleteSongList() {
    fetch('/delete-songlist', {
        method: 'POST'
    })
        .then(response => response.text())
        .then(data => {
            console.log(data);
            alert('歌单删除成功！');
            window.location.reload();
        })
        .catch(error => {
            console.error('Error:', error);
            alert('删除歌单失败。');
        });
}

function showSection(sectionId) {
    // 隐藏所有section
    var sections = document.getElementsByClassName('section');
    for (var i = 0; i < sections.length; i++) {
        sections[i].style.display = 'none';
    }
    // 显示选中的section
    document.getElementById(sectionId).style.display = 'block';
}



function deleteSong(songID) {
    // 显示确认对话框
    var confirmDelete = confirm("您确定要删除这首歌曲吗？");
    if (confirmDelete) {
        // 用户确认删除
        fetch('/delete-song', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'song_id=' + songID
        })
            .then(response => {
                if (response.ok) {
                    document.getElementById('song-' + songID).remove();
                } else {
                    alert("删除失败");
                }
            });
    }
    // 如果用户点击取消，不执行任何操作
}

function loadSongs() {
    // 发送请求到服务器获取歌单
    fetch('/display-songlists_for_user')
        .then(response => response.json())
        .then(data => {
            const listElement = document.getElementById('songlist_display');
            console.log(data);
            listElement.innerHTML = ''; // 清空现有列表
            data.forEach(song => {
                console.log(song.Name);
                const li = document.createElement('li');
                li.id = 'song-' + song.ID;
                li.textContent = `${song.Name}`;
                const deleteButton = document.createElement('button');
                deleteButton.textContent = '删除';
                deleteButton.onclick = function () {
                    deleteSong(song.ID);
                };
                li.appendChild(deleteButton);
                listElement.appendChild(li);
            });
        });
}

