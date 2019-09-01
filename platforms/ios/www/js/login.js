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
            $.post('http://www.51jyfw.com/BootStrap/Interface/Interface0001.ashx', {
                auto: '0',
                ipaddress: '192.168.1.1',
                psw: this.password,
                username: this.name
            }).then(function(res) {
                console.log(res);
                localStorage.setItem('name', self.name);
                localStorage.setItem('password', self.password);
                localStorage.setItem('user', JSON.stringify(res));
                // 跳转列表页面
                location.href = './examList.html';
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