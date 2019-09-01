/**
 * Created by Administrator on 2016/6/24.
 */
var myApp = angular.module('machineEvaApp', [
    'paperService', 'Util', 'ngDialog'
]).controller('machineEvaController', ['$scope', '$http', '$location', 'paperService', 'ngDialog', function ($scope, $http, $location, paperService, ngDialog) {
    var search = $location.search();
    var href = search.from.slice(0, search.from.indexOf('#/'));
    var examId = search.examId,
        taskFlnkid = search.taskFlnkid,
        exType = search.exType;
    //存储试卷数据
    var paperData = [];
    //进入题目时间
    var inQstTime = 0;
    //选出答案时间
    var choseQstTime = 0;
    //试卷倒计时定时器
    var totalTimeTimer = null;
    //正确题目数
    $scope.correctTotalNum = 0;
    //未达题目数
    $scope.unDo = 0;
    //错误题目数
    $scope.wrongTotalNum = 0;
    //总分
    $scope.totalScore = 0;
    $scope.totalTime = 0;
    $scope.curIndex = 0;
    $scope.answeredNum = 0;
    $scope.totalSpendTime = '';
    $scope.isPaperPage = true;
    //查询返回的题目状态
    var topicMode = null;
    //获取老师是否收卷定时器
    var queryAnswerStatusInterval = null;
    var config = {
        queryInterval: 60000
    };
    /*
     * 获取试卷
     * */
    // $http.post('/BootStrap/Interface/generalQuery.ashx', {
    //     Proc_name:'Proc_QueryTask',
    //     FLnkID : taskFlnkid
    // }).success(function (res) {
    //     if (res.msg[0].status === 1) {
    //         toAnalysisPage();
    //     }else if(res.msg[0].isfinish){
    //         $scope.toWaitPage();
    //     }else {
    //         getDetail();
    //     }
    // });
    $http.post('http://www.51jyfw.com/BootStrap/Interface/Interface0285.ashx',{exType: exType}).then(function (response) {
        _.each(response.data.msg, function (item) {
            if (item.FLnkID === taskFlnkid) {
                if (item.status === 1) {
                    toAnalysisPage();
                }else if(item.isfinish){
                    $scope.toWaitPage();
                }else {
                    getDetail();
                }
            }
        })
    });

    function getDetail() {
        $http.post('http://www.51jyfw.com/BootStrap/Interface/Interface0286.ashx', {
            examFLnkId: examId
        }).then(function (backsta) {
            //TODO 学生没有开始考试 获取试卷 加载状态
            topicMode = backsta.data.msg.answeritems;
            $http.post('http://www.51jyfw.com/BootStrap/Interface/Interface0181.ashx', {
                examId: examId
            }).then(function (res) {
                var data = paperService.parsePaperData(res.data.msg);
                paperService.setQuestionsOrder(data);
                /*_.each(data,function (item) {
                 if(item.QTypeId === '338'){
                 paperData = item;
                 }
                 });*/
                //paperData = paperService.getAllQuestionInPaper(data);
                paperData = getAllQuestion(data);
                _.each(paperData, function (i) {
                    _.each(topicMode, function (j) {
                        if (i.FLnkID === j.qFLnkId) {
                            if (j.answer) {
                                if (i.isObjective !== '1') {
                                    i.tempBlankAnswer = [];
                                    i.isDone = false;
                                    _.each(j.answer.split(";"), function (itemAnswer) {
                                        i.tempBlankAnswer.push({
                                            answer: itemAnswer
                                        });
                                        i.isDone = true;
                                    });
                                } else {
                                    i.stuAnswers = j.answer;
                                    i.isDone = true;
                                    if ((i.Answer) && (i.stuAnswers === (/[A-Z]/).exec(i.Answer).join(','))) {
                                        i.isCorrect = true;
                                        i.scored = +i.score;
                                    } else {
                                        i.isCorrect = false;
                                        i.scored = 0;
                                    }
                                }
                            } else {
                                if (i.isObjective !== '1') {
                                    i.tempBlankAnswer = [];
                                    for (var j = 0, count = i.AnswerCount || 1; j < count; j++) {
                                        i.tempBlankAnswer.push({
                                            answer: ''
                                        });
                                    }
                                } else {
                                    i.stuAnswers = '';
                                }
                                i.isDone = false;
                            }
                            i.scored = j.scores;
                            i.costTime = +j.times;
                        }
                    });
                });
                var FinishDate = new Date(backsta.data.msg.FinishDate),sysTime = new Date(backsta.data.msg.sysTime);
                $scope.totalTime = Math.ceil(FinishDate.getTime() - sysTime.getTime())/1000;
                if ($scope.totalTime <= 0) {
                    $scope.totalTime =  Math.ceil(0);
                    $scope.toWaitPage();
                    return
                }
                if (paperData.length > 0) {
                    $scope.examsNum = paperData.length;
                    $scope.questionsData = paperData;
                }
                //TODO 设置题目初始状态
                startTotalTimer();
                //一进入试卷开始做题时间点为总时间长度
                resetInQstTime();
                setOptSta();
                showAnsweredQst();
                showPaper($scope.curIndex);
                });
        });
    }

    function getAllQuestion(groups) {
        var allQuestions = [];
        _.each(groups, function (item, index) {
            _.each(item.question, function (q) {
                if (q.mode === 'A' || q.mode === 'B') {
                    q.sub = pushFatherTitle(q);
                    allQuestions = allQuestions.concat(q.sub);
                } else {
                    allQuestions.push(q);
                }
            });
        });
        return allQuestions;
    }

    function pushFatherTitle(qObj) {
        for (var i = 0; i < qObj.sub.length; i++) {
            if (qObj.sub[i].isSub) {
                qObj.sub[i].father = {title: qObj.title};
                if (qObj.mode === 'B') {
                    qObj.sub[i].subOrder = i + 1;
                    qObj.sub[i].orders = qObj.orders;
                    qObj.sub[i].mode = 'B';
                }
            }
        }
        return qObj.sub;
    }

    /*
     * 展示试题
     * */
    function showPaper(qstIndex) {
        if (paperData.length > 0) {
            $scope.curQstNo = (paperData[qstIndex].mode === 'B' ? (paperData[qstIndex].orders + '.' + paperData[qstIndex].subOrder) : paperData[qstIndex].orders);
            $scope.curQst = paperData[qstIndex];
        }
    }

    /*
     * 上一题
     * */
    $scope.preQst = function () {
        if ($scope.curIndex === 0) {
            return;
        }
        obtainStuAnswer();
        submitSingle(paperData[$scope.curIndex]);
        showAnsweredQst();
        resetInQstTime();
        $scope.curIndex = $scope.curIndex - 1;
        setOptSta();
        showPaper($scope.curIndex);
    };
    /*
     * 下一题
     * */
    $scope.nextQst = function () {
        obtainStuAnswer();
        submitSingle(paperData[$scope.curIndex]);
        showAnsweredQst();
        resetInQstTime();
        if ($scope.curIndex === (paperData.length - 1)) {
            $scope.checkSubmit();
        } else {
            $scope.curIndex = $scope.curIndex + 1;
            setOptSta();
            showPaper($scope.curIndex);
        }
    };
    /*
     * 交卷
     * */
    function handPager() {
        //交卷操作
        clearInterval(totalTimeTimer);
        obtainStuAnswer();
        showAnsweredQst();
        $http.post('http://www.51jyfw.com/BootStrap/Interface/Interface0286.ashx', {
            examFLnkId: examId
        }).then(function (backsta) {
            $scope.totalSpendTime = timeTrans(backsta.data.msg.SpendTime * 60);
            $http.post('http://www.51jyfw.com/BootStrap/Interface/Interface0288.ashx', {
                examFLnkID: examId
            }).then(function (response) {
                if (response.data.code === 3) {
                    //老师强制收卷
                    toAnalysisPage();
                } else if (response.data.code === 2) {
                    ngDialog.open({
                        template: '<p>系统错误!</p>' +
                        '<div class="ngdialog-buttons">' +
                        '<button type="button" class="ngdialog-button ngdialog-button-primary" ng-click="errorPaper()">关闭</button></div>',
                        className: 'ngdialog-theme-default',
                        appendClassName: 'dialog-input-klg',
                        closeByDocument: false,
                        showClose: false,
                        closeByEscape: false,
                        plain: true,
                        scope: $scope,
                        controller: function ($scope) {
                            return function () {
                                $scope.errorPaper = function (chaName) {
                                    ngDialog.closeAll();
                                    window.close();
                                }
                            };
                        }
                    });
                } else if (response.data.code === 0) {
                    countScore();
                    $scope.totalTime = 0;
                    $scope.totalScore = 0;
                    _.each(response.data.msg, function (itemScore) {
                        $scope.totalScore += itemScore.Scores;
                        if(itemScore.IsRight === 1){
                            $scope.correctTotalNum = itemScore.sumTotal;
                        } else {
                            $scope.wrongTotalNum = itemScore.sumTotal - $scope.unDo;
                        }
                    });
                    showExamRes();
                }
            }, function (response) {
                ngDialog.open({
                    template: '<p>提交失败，请重新提交!</p>' +
                    '<div class="ngdialog-buttons">' +
                    '<button type="button" class="ngdialog-button ngdialog-button-primary" ng-click="closeThisDialog()">确定</button></div>',
                    className: 'ngdialog-theme-default',
                    appendClassName: 'evaluate-dialog',
                    closeByDocument: true,
                    plain: true,
                    scope: $scope
                });
            });
        });
    }

    /*
     * 页面下方可以直接点击试题号跳转到所选试题
     * */
    $scope.fastLink2Qst = function (qstOrder, index) {
        obtainStuAnswer();
        submitSingle(paperData[$scope.curIndex]);
        showAnsweredQst();
        resetInQstTime();
        $scope.curIndex = index;
        setOptSta();
        showPaper($scope.curIndex);
    };
    /*
     * 提取学生答案并判断是否正确
     * */
    function obtainStuAnswer() {

        var stuAnswers = new Array();
        if (paperData[$scope.curIndex].isObjective === '1') {
            if ($scope.choosenA) {
                stuAnswers.push('A');
            }
            if ($scope.choosenB) {
                stuAnswers.push('B');
            }
            if ($scope.choosenC) {
                stuAnswers.push('C');
            }
            if ($scope.choosenD) {
                stuAnswers.push('D');
            }
        } else {
            _.each(paperData[$scope.curIndex].tempBlankAnswer, function (item) {
                if (item.answer) {
                    stuAnswers.push(item.answer);
                }
            });
        }
        if (stuAnswers.length > 0) {
            if (paperData[$scope.curIndex].isObjective === '1') {
                stuAnswers = stuAnswers.join(',');
                if (paperData[$scope.curIndex].Answer) {
                    paperData[$scope.curIndex].Answer = paperData[$scope.curIndex].Answer.trim().toUpperCase();
                }
                if ((paperData[$scope.curIndex].Answer) && (stuAnswers === (/[A-Z]/).exec(paperData[$scope.curIndex].Answer).join(','))) {
                    paperData[$scope.curIndex].isCorrect = true;
                    paperData[$scope.curIndex].scored = +paperData[$scope.curIndex].score;
                } else {
                    paperData[$scope.curIndex].isCorrect = false;
                    paperData[$scope.curIndex].scored = 0;
                }
                paperData[$scope.curIndex].stuAnswers = stuAnswers;
                paperData[$scope.curIndex].isDone = true;
            } else {
                stuAnswers = stuAnswers.join(';');
                paperData[$scope.curIndex].isCorrect = false;
                paperData[$scope.curIndex].isDone = false;
                if (stuAnswers === paperData[$scope.curIndex].Answer) {
                    paperData[$scope.curIndex].isCorrect = true;
                }
                _.each(paperData[$scope.curIndex].tempBlankAnswer, function (item) {
                    if (item.answer) {
                        paperData[$scope.curIndex].isDone = true;
                    }
                })
            }
        } else {
            paperData[$scope.curIndex].stuAnswers = '';
            paperData[$scope.curIndex].isDone = false;
        }
    }

    function IsSingleOpt(){
        var answerLength = $scope.curQst.Answer.split(',').length;
        return answerLength === 1;
    }

    var optionMap = {
        'A': 'choosenA',
        'B': 'choosenB',
        'C': 'choosenC',
        'D': 'choosenD'
    };

    /*
     * 计算每题时间
     * */
    $scope.seekUTime = function (choseOpt) {
        switch (choseOpt) {
            case 'A':
                $scope.choosenA = !($scope.choosenA);
                break;
            case 'B':
                $scope.choosenB = !($scope.choosenB);
                break;
            case 'C':
                $scope.choosenC = !($scope.choosenC);
                break;
            case 'D':
                $scope.choosenD = !($scope.choosenD);
                break;
        }
        if(IsSingleOpt()) {
            for(var key in optionMap) {
                if(key !== choseOpt) {
                    $scope[optionMap[key]] = false;
                }
            }
        }
        //刷新页面下方题号表格状态
        obtainStuAnswer();
        //刷新已做试题
        showAnsweredQst();
        choseQstTime = $scope.totalTime;
        var stuCostT = 0;
        stuCostT = inQstTime - choseQstTime;
        if (paperData[$scope.curIndex].costTime) {
            paperData[$scope.curIndex].costTime = paperData[$scope.curIndex].costTime + stuCostT;
        } else {
            paperData[$scope.curIndex].costTime = stuCostT;
        }
    };
    /*
     * 开始考试倒计时
     * */
    function startTotalTimer() {
        clearInterval(totalTimeTimer);
        totalTimeTimer = setInterval(function () {
            $scope.$apply(function () {
                $scope.totalTime -= 1;
            });
            if ($scope.totalTime === 0) {
                handPager();
            }
        }, 1000);
    }

    /*
     * 重置进入试题时间
     * */
    function resetInQstTime() {
        inQstTime = $scope.totalTime;
        choseQstTime = 0;
    }

    /*
     * 设置选项状态
     * */
    function setOptSta() {
        //重置选项
        $scope.choosenA = false;
        $scope.choosenB = false;
        $scope.choosenC = false;
        $scope.choosenD = false;
        var stuAnswerArry = null;
        if (paperData[$scope.curIndex].stuAnswers) {
            for (var i = 0; i < paperData[$scope.curIndex].stuAnswers.length; i++) {
                stuAnswerArry = paperData[$scope.curIndex].stuAnswers.split(',');
            }
            for (var j = 0; j < stuAnswerArry.length; j++) {
                switch (stuAnswerArry[j]) {
                    case 'A':
                        $scope.choosenA = true;
                        break;
                    case 'B':
                        $scope.choosenB = true;
                        break;
                    case 'C':
                        $scope.choosenC = true;
                        break;
                    case 'D':
                        $scope.choosenD = true;
                        break;
                }
            }
        }

    }

    /*
     * 计算总分
     * */
    function countScore() {
        $scope.correctTotalNum = 0;
        $scope.unDo = 0;
        $scope.totalScore = 0;
        for (var i = 0; i < paperData.length; i++) {
            if (paperData[i].isCorrect) {
                $scope.correctTotalNum += 1;
                $scope.totalScore = $scope.totalScore + paperData[i].score;
            }
            if (!paperData[i].isDone) {
                $scope.unDo += 1;
            }
        }
        $scope.wrongTotalNum = paperData.length - $scope.unDo - $scope.correctTotalNum;
    }

    /*
     * 计算出已做题目
     * */
    function showAnsweredQst() {
        var stuDoneQst = 0;
        for (var i = 0; i < paperData.length; i++) {
            if (paperData[i].isDone) {
                stuDoneQst += 1;
            }
        }
        $scope.answeredNum = stuDoneQst;
    }

    /*
     * 交卷后展示提示框
     * */
    function confirm2Submit() {
        ngDialog.open({
            template: 'afterExaminationTips.tpl.html',
            closeByDocument: true,
            scope: $scope
        });
    }

    $scope.deterCon = function (boo) {
        ngDialog.closeAll();
        if (boo) {
            return;
        } else {
            handPager();
        }
    };
    /*
     * 交卷后展示考试结果
     * */
    function showExamRes() {
        ngDialog.open({
            template: 'showResultTip.tpl.html',
            closeByDocument: false,
            showClose: false,
            closeByEscape: false,
            scope: $scope
        });
    }

    $scope.checkSubmit = function () {
        //在交卷前 提交最后一题答案
        submitSingle(paperData[$scope.curIndex]);
        if ($scope.answeredNum < $scope.examsNum) {
            confirm2Submit();
        } else {
            handPager();
        }
    };
    //到等待页面
    $scope.toWaitPage = function () {
        clearInterval(totalTimeTimer);
        ngDialog.closeAll();
        $scope.isPaperPage = false;
        //定时 重复调用接口查询老师是否收卷
        clearInterval(queryAnswerStatusInterval);
        checkTecGet();
        queryAnswerStatusInterval = setInterval(function () {
            checkTecGet();
        }, config.queryInterval);
    };
    function timeTrans(input) {
        input = input || 0;
        var minute = Math.floor(input / 60);
        if (minute < 10) {
            minute = '0' + minute;
        }
        var second = input % 60;
        if (second < 10) {
            second = '0' + second;
        }
        return minute + '分钟';
    }

    /* 向平台同步学生答题状态
     * */
    function submitSingle(topics) {
        /*if(!topics.stuAnswers){
         return;
         }*/
        var isObjective = '';
        _.each(topics.tempBlankAnswer, function (item, index) {
            if(topics.isDone) {
                if (index === 0) {
                    isObjective = item.answer
                } else {
                    isObjective += ';' + item.answer
                }
            }
        });
        $http.post('http://www.51jyfw.com/BootStrap/Interface/Interface0287.ashx', {
            answer: topics.isObjective !== '1' ? isObjective : topics.stuAnswers,
            scores: topics.score,
            qFLnkId: topics.FLnkID,
            examFLnkID: examId,
            times: topics.costTime,
            answerTrue: topics.Answer
        }).then(function (res) {
            if (res.data.code) {
                if (res.data.code === 3) {
                    //TODO 考试结束弹出提示告知学生 用户点击确定跳转到班级分析界面
                    ngDialog.open({
                        template: '<p>老师已收卷，考试结束!</p>' +
                        '<div class="ngdialog-buttons">' +
                        '<button type="button" class="ngdialog-button ngdialog-button-primary" ng-click="endPaper()">确定</button></div>',
                        className: 'ngdialog-theme-default',
                        appendClassName: 'dialog-input-klg',
                        closeByDocument: false,
                        showClose: false,
                        closeByEscape: false,
                        plain: true,
                        scope: $scope,
                        controller: function ($scope) {
                            return function () {
                                $scope.endPaper = function (chaName) {
                                    ngDialog.closeAll();
                                    toAnalysisPage();
                                }
                            };
                        }
                    });
                } else if (res.data.code === 2) {
                    //TODO 弹出系统异常提示，点击确定关闭窗口
                    ngDialog.open({
                        template: '<p>系统出错!</p>' +
                        '<div class="ngdialog-buttons">' +
                        '<button type="button" class="ngdialog-button ngdialog-button-primary" ng-click="errorPaper()">关闭</button></div>',
                        className: 'ngdialog-theme-default',
                        appendClassName: 'dialog-input-klg',
                        closeByDocument: false,
                        showClose: false,
                        closeByEscape: false,
                        plain: true,
                        scope: $scope,
                        controller: function ($scope) {
                            return function () {
                                $scope.errorPaper = function (chaName) {
                                    ngDialog.closeAll();
                                    window.close();
                                }
                            };
                        }
                    });
                }
            }
        });
    }

    /*最后提交试卷收集所有题目答案
     * */
    function getAllAnswer(groups) {
        var questions = [];
        _.each(groups, function (groups) {
            if (groups.isObjective !== '1') {
                groups.stuAnswersIsObjective = '';
                _.each(groups.tempBlankAnswer, function (itemAnswer, index) {
                    if(groups.isDone){
                        if (index === 0) {
                            groups.stuAnswersIsObjective = itemAnswer.answer
                        } else{
                            groups.stuAnswersIsObjective += ';' + itemAnswer.answer
                        }
                    }
                });
            }
            questions.push({
                answer: groups.isObjective !== '1' ? groups.stuAnswersIsObjective : groups.stuAnswers,
                scores: groups.score || 0,
                isTrue: '',
                qFLnkId: groups.FLnkID,
                times: groups.costTime,
                answerTrue: groups.Answer
            });
        });
        return questions;
    }

    /*检查老师是否已经收卷
     * */
    function checkTecGet() {
        $http.post('http://www.51jyfw.com/BootStrap/Interface/Interface0285.ashx',{exType: exType}).then(function (response) {
            _.each(response.data.msg, function (item) {
                if (item.examFId === examId) {
                    if (item.status === 1) {
                        toAnalysisPage();
                        return;
                    }
                }
            })
        });
    }

    /*跳转到班级总结页面
     * */
    function toAnalysisPage() {
        clearInterval(queryAnswerStatusInterval);
        //cookies中id本身带有双引号,所以要去除
        location.href = href + '#/roomEvaluateAnalysis?ExamFlnkID=' + examId + '&ClassFlnkID=' + JSON.parse(sessionStorage.getItem('currentUser')).scid;
    }
}]).filter('trustHtml', function ($sce) {
    return function (input) {
        return $sce.trustAsHtml(input);
    };
}).filter('secondToMinute', function () {
    return function (input) {
        input = input || 0;
        var minute = Math.floor(input / 60);
        if (minute < 10) {
            minute = '0' + minute;
        }
        var second = input % 60;
        if (second < 10) {
            second = '0' + second;
        }
        return minute + ' : ' + second;
    };
});
