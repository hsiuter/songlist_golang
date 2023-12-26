window.onload = function () {
    document.getElementById("forget-password-form").addEventListener("submit", function (event) {
        event.preventDefault(); // 阻止默认表单提交行为

        // 获取表单数据
        var username = document.getElementById("username").value;
        var securityQuestion = document.getElementById("security_question").value;
        var securityAnswer = document.getElementById("security_answer").value;
        var newPassword = document.getElementById("new_password").value;

        // 创建一个新的HTTP请求
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "/reset-password", true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

        // 构建发送到服务器的表单数据
        var formData = "username=" + encodeURIComponent(username) +
            "&security_question=" + encodeURIComponent(securityQuestion) +
            "&security_answer=" + encodeURIComponent(securityAnswer) +
            "&new_password=" + encodeURIComponent(newPassword);

        // 发送表单数据
        xhr.send(formData);

        // 处理服务器的响应
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    alert("密码重置成功"); // 密码重置成功的提示
                    window.location.href = '/loginpage'; // 密码重置成功后跳转到登录页面
                } else {
                    alert("密码重置失败: " + xhr.responseText); // 显示密码重置失败的具体原因
                }
            }
        };
    });

}