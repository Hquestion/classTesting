/**
 * Created by Administrator on 2016/6/4.
 */
angular.module('Util', [])
.service('utilService', ['ngDialog',function(ngDialog){
    var NoMap = {
            0: '',
            1: '一',
            2: '二',
            3: '三',
            4: '四',
            5: '五',
            6: '六',
            7: '七',
            8: '八',
            9: '九',
            10: '十'
    };
    return {
        showTypeList: [{
            id: '0',
            name: '四行一列'
        }, {
            id: '1',
            name: '两行两列'
        }, {
            id: '2',
            name: '一行四列'
        }],
        getCNNoByIndex: function(index){
            if (!index) {
                return '';
            }
            var shang = Math.floor(index / 10),
                yu = index % 10;
            var cnStr = '';
            if (shang > 1) {
                cnStr = NoMap[shang] + NoMap[10] + NoMap[yu];
            } else if (shang === 1) {
                cnStr = NoMap[10] + NoMap[yu];
            } else {
                cnStr = NoMap[yu];
            }
            return cnStr;
        },
        showSimpleText: (function() {
            return function(text, className) {
                var dialogObj = ngDialog.open({
                    template: '<div class="toast-title">' + text + '</div>',
                    className: 'ngdialog-theme-default',
                    appendClassName: className,
                    closeByDocument: true,
                    plain: true
                });
            };
        })()
    }
}]);