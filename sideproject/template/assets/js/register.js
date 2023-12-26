window.onload = function () {
    document.getElementById("registration-form").addEventListener("submit", function (event) {
        event.preventDefault(); // 阻止默认表单提交行为

        // 获取用户名和密码
        var username = document.getElementById("username").value;
        var password = document.getElementById("password").value;
        var confirmPassword = document.getElementById("confirm_password").value;
        var email = document.getElementById("email").value;
        var security_question = document.getElementById("security_question").value;
        var security_answer = document.getElementById("security_answer").value;


        var validUsername = /^[A-Za-z0-9]+$/.test(username);
        if (password !== confirmPassword) {
            alert("密碼和確認密碼不匹配。");
            return;
        }

        // 检查所有必填字段是否完成
        if (!username || !password || !email || !security_question || !security_answer) {
            alert("請完成所有必填欄位。");
            return;
        }
        if (!validUsername) {
            alert("用户名只能包含英文字母和数字。");
            event.preventDefault(); // 阻止表单提交
            return;
        }
        // 创建一个新的HTTP请求
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/register", true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

        // 将用户名和密码作为表单数据发送到服务器
        xhr.send("username=" + encodeURIComponent(username) + "&password=" + encodeURIComponent(password) + "&email=" + encodeURIComponent(email) + "&security_question=" + encodeURIComponent(security_question) + "&security_answer=" + encodeURIComponent(security_answer));

        // 处理服务器的响应
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    alert("注册成功"); // 注册成功的提示
                    window.location.href = "/loginpage"; // 可选：注册成功后刷新页面
                } else {
                    alert("注册失败: " + xhr.responseText); // 显示注册失败的具体原因
                }
            }
        };
    });
}