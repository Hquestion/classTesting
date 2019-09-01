var vm = new Vue({
    el: '#app',
    data() {
        return {
            name: '',
            password: ''
        };
    },
    methods: {
        login(auto) {
            var self = this;
            $.ajax('http://www.51jyfw.com/BootStrap/Interface/Interface0001.ashx', {
                data: {
                    auto: '0',
                    ipaddress: '192.168.1.1',
                    psw: this.password,
                    username: this.name
                },
                'contentType': 'application/json'
            }).then(function(res) {
                console.log(res);
                if (res.code === 0) {
                    localStorage.setItem('name', self.name);
                    localStorage.setItem('password', self.password);
                    localStorage.setItem('user', JSON.stringify(res));
                    document.cookie = 'userId=' + res.FLnkID;
                    // 跳转列表页面
                    location.href = './examList.html';
                } else {
                    localStorage.removeItem('name');
                    localStorage.removeItem('password');
                    localStorage.removeItem('user');
                    alert(res.msg);
                }
            }, function () {
                if (!auto) {
                    alert('登陆失败，请检查账号密码重试！');
                }
            });
        },
        autoLogin(name, password) {
            this.name = name;
            this.password = password;
            this.login(true);
        }
    },
    created() {
        var name = localStorage.getItem('name');
        var password = localStorage.getItem('password');
        if (name && password) {
            // auto login
            this.autoLogin(name, password);
        }
    }
});