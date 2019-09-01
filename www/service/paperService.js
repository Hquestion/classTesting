/**
 * Created by Administrator on 2016/6/4.
 */
angular.module('paperService', [])
.service('paperService', ['$q', '$http', '$rootScope', 'utilService',function($q, $http, $rootScope, utilService){
    return {
        getPaperDataById: function(paperId){
            var self = this;
            var defer = $q.defer();
            $http.post('http://www.51jyfw.com/BootStrap/Interface' + '/Interface0181.ashx', {
                examId: paperId
            }).then(function(res){
                var data = self.parsePaperData(res.data.msg);
                self.setQuestionsOrder(data);
                res.data.msg = data;
                defer.resolve(res);
            }, function(res){
                defer.reject(res);
            });
            return defer.promise;
        },
        parsePaperData: function(data){
            var self = this;
            return _.map(data, function(item, index){
                var questionMeta = _.map(item.question, function (question) {
                    var score = self.getQuestionScore(question, item);
                    var subs = _.map(question.sub, function(s){
                        var subScore = self.getSubQuestionScore(s, question, item);
                        return {
                            title: s.title,
                            orders: s.orders,
                            ShowType: self.modifyShowType(s.ShowType),
                            OptionOne: s.OptionOne || s.OptionA || '',
                            OptionTwo: s.OptionTwo || s.OptionB || '',
                            OptionThree: s.OptionThree || s.OptionC || '',
                            OptionFour: s.OptionFour || s.OptionD || '',
                            knowledge: s.knowledge,
                            knowledgeNames: _.pluck(s.knowledge, 'name').join(',') || s.knowledges || '',
                            knowledges: _.pluck(s.knowledge, 'name').join(',') || s.knowledges || '',
                            score: subScore,
                            analysis: s.analysis,
                            qtypeName: s.QTypeName,
                            qtypeId: s.QTypeId,
                            typeId: s.TypeId,
                            IsCollection: s.IsCollection,
                            DifficultLevel: +s.DifficultLevel || 0,
                            Answer: s.Answer,
                            QFLnkID: s.FLnkID,
                            QID: s.QID,
                            mp3: s.mp3,
                            quality: +s.quality || 0,
                            fLnkId: s.FLnkID,
                            FLnkID: s.FLnkID,
                            isSub: true,
                            mainId: question.FLnkID,
                            parent: question,
                            isObjective:s.isObjective,
                            dis:s.dis,
                            showDis:s.showDis,
                            AnswerCount:s.AnswerCount
                        }
                    });
                    return {
                        mode: question.Mode || question.mode || '',
                        title: question.title,
                        orders: question.orders,
                        ShowType: self.modifyShowType(question.ShowType),
                        OptionOne: question.OptionOne || question.OptionA || '',
                        OptionTwo: question.OptionTwo || question.OptionB || '',
                        OptionThree: question.OptionThree || question.OptionC || '',
                        OptionFour: question.OptionFour || question.OptionD || '',
                        knowledge: question.knowledge,
                        knowledgeNames: _.pluck(question.knowledge, 'name').join(',') || question.knowledges || '',
                        knowledges: _.pluck(question.knowledge, 'name').join(',') || question.knowledges || '',
                        score: score,
                        analysis: question.analysis,
                        qtypeName: question.QTypeName,
                        qtypeId: question.QTypeId,
                        typeId: question.TypeId,
                        IsCollection: question.IsCollection,
                        DifficultLevel: +question.DifficultLevel || 0,
                        mp3: question.mp3,
                        Answer: question.Answer,
                        QFLnkID: question.FLnkID,
                        QID: question.QID,
                        quality: +question.quality || 0,
                        fLnkId: question.FLnkID,
                        FLnkID: question.FLnkID,
                        sub: subs,
                        isMain: true,
                        isObjective:question.isObjective,
                        dis:question.dis,
                        showDis:question.showDis,
                        AnswerCount:question.AnswerCount,
						originalId: question.srcFLnkID || question.FLnkID
					};
                });
                return {
                    QTypeScores: +item.QTypeScores || 0,
                    QTypeName: item.QTypeName,
                    Dtype: item.Dtype || item.QTypeName,
                    QNumber: item.question.length,
                    QTypeId: item.QTypeId,
                    question: questionMeta,
                    GradeId: item.GradeId,
                    GradeName: item.GradeName,
                    explain:item.Explain,
                    CNIndex: utilService.getCNNoByIndex(index + 1)
                };
            });
        },
        parseQstForPaper: function(question){
            var self = this;
            var subs = _.map(question.sub, function(s){
                return {
                    title: s.title,
                    ShowType: self.modifyShowType(s.ShowType),
                    OptionOne: s.OptionOne,
                    OptionTwo: s.OptionTwo,
                    OptionThree: s.OptionThree,
                    OptionFour: s.OptionFour,
                    knowledge: s.knowledge,
                    knowledgeNames: _.pluck(s.knowledge, 'name').join(','),
                    analysis: s.analysis,
                    qtypeName: s.QTypeName,
                    qtypeId: s.QTypeId,
                    typeId: s.TypeId,
                    IsCollection: s.IsCollection,
                    DifficultLevel: +s.DifficultLevel || 0,
                    Answer: s.Answer,
                    QFLnkID: s.FLnkID,
                    QID: s.QID,
                    quality: +s.quality || 0,
                    fLnkId: s.FLnkID,
                    FLnkID: s.FLnkID,
                    isSub: true,
                    mainId: question.FLnkID,
                    parent: question
                };
            });
            return {
                mode: question.Mode || '',
                title: question.title,
                ShowType: self.modifyShowType(question.ShowType),
                OptionOne: question.OptionOne,
                OptionTwo: question.OptionTwo,
                OptionThree: question.OptionThree,
                OptionFour: question.OptionFour,
                knowledge: question.knowledge,
                knowledges: _.pluck(question.knowledge, 'name').join(','),
                knowledgeNames: _.pluck(question.knowledge, 'name').join(','),
                analysis: question.analysis,
                qtypeName: question.QTypeName,
                qtypeId: question.QTypeId,
                typeId: question.TypeId,
                IsCollection: question.IsCollection,
                DifficultLevel: +question.DifficultLevel || 0,
                Answer: question.Answer,
                QFLnkID: question.FLnkID,
                QID: question.QID,
                quality: +question.quality || 0,
                fLnkId: question.FLnkID,
                FLnkID: question.FLnkID,
                sub: subs,
                isMain: true
            };
        },
        /**
         * 获取试卷题目列表时，用于为每道题初始化分数
         * @param question
         * @param group
         * @returns {*|number|string|string}
         */
        getQuestionScore: function(question, group){
            var groupLen = this.getQstNumOfGroup(group);
            var score = question.score;
            if(!score) {
                score = +((+group.QTypeScores / groupLen).toFixed(2));
            }else {
                score = +question.score || 0;
            }
            return score || 0;
        },
        /**
         * 获取试卷题目列表时，用于初始化每道父子类型题的子题的分数
         * @param sub
         * @param mainQuestion
         * @param group
         * @returns {*|number|string|string}
         */
        getSubQuestionScore: function(sub, mainQuestion, group){
            var score = sub.score;
            if(!score) {
                var qstScore = this.getQuestionScore(mainQuestion, group);
                score = qstScore / mainQuestion.sub.length;
            }else {
                score = +score || 0;
            }
            return score || 0;
        },
        /**
         * 计算分组里题目的数量
         * @param group
         * @returns {number}
         */
        getQstNumOfGroup: function(group){
            var num = 0;
            _.each(group.question, function(item){
                if(item.mode === 'A') {
                    if(!_.isEmpty(item.sub)) {
                        num += item.sub.length;
                    }
                }else {
                    num += 1;
                }
            });
            return num;
        },
        /**
         * 通过分组的分值计算试卷总分
         * @param groupList
         * @returns {number}
         */
        getTotalScore: function(groupList) {
            var totalScore = 0;
            _.each(groupList, function (item) {
                totalScore += item.QTypeScores;
            });
            return totalScore;
        },
        /**
         * 设置题目编号
         * @param groupList
         */
        setQuestionsOrder: function(groupList) {
            var allQuestions = [];
            _.each(groupList, function (item, index) {
                _.each(item.question, function (q) {
                    if (q.mode === 'A') {
                        allQuestions = allQuestions.concat(q.sub);
                        q.orders = '';
                    } else if (q.mode === 'B') {
                        allQuestions.push(q);
                        _.each(q.sub, function (s, index) {
                            s.orders = index + 1;
                        });
                    } else {
                        allQuestions.push(q);
                    }
                });
                item.CNIndex = utilService.getCNNoByIndex(index + 1);
            });
            _.each(allQuestions, function (item, index) {
                item.orders = index + 1;
            });
        },
        /**
         * 根据每道题目计算分组分值
         * @param group
         */
        calcGroupScore: function(group){
            var totalScore = 0;
            _.each(group.question, function (q) {
                //判断题目是不是子题，如果是子题，把统计子题的分数计入分值
                if(q.mode === 'A' || q.mode === 'B') {
                    if(!_.isEmpty(q.sub)) {
                        _.each(q.sub, function(s) {
                            totalScore += s.score || 0;
                        });
                    }else {
                        totalScore += q.score || 0;
                    }
                }else {
                    totalScore += q.score || 0;
                }
            });
            return totalScore;
        },
        calcQuestionScoreBySetGroupScore: function(group){
            var len = this.getQstNumOfGroup(group);
            var avgScore = +group.QTypeScores / len;
            return avgScore || 0;
        },
        getAllQuestionInPaper: function(groups){
            var allQuestions = [];
            _.each(groups, function (item, index) {
                _.each(item.question, function (q) {
                    if (q.mode === 'A') {
                        allQuestions = allQuestions.concat(q.sub);
                    } else if (q.mode === 'B') {
                        allQuestions.push(q);
                    } else {
                        allQuestions.push(q);
                    }
                });
            });
            return allQuestions;
        },

        getQuestionByGroup: function(groups){
            var list = [];
            _.each(groups, function (item, index) {
                var allSubQst = [];
                _.each(item.question, function (q) {
                    if (q.mode === 'A') {
                        allSubQst = allSubQst.concat(q.sub);
                    } else if (q.mode === 'B') {
                        allSubQst.push(q);
                    } else {
                        allSubQst.push(q);
                    }
                });
                list.push({
                    QTypeName: item.QTypeName,
                    allSubQst: allSubQst
                });
            });
            return list;
        },
        getQuestionIndexInGroup: function(q, g){
            return _.findIndex(g.question, function(item){
                return item.QFLnkID === q.QFLnkID;
            });
        },
        getGroupIndexInGroups: function(group, list) { 
            return _.findIndex(list, function(item){
                return item.Dtype === group.Dtype;
            });
        },
        getQstsForSubmit: function(groups){
            var questions = [];
            //提交试卷时，循环把题目放到数组里，判断题目是不是父题以及父题模式，吧子题放进待提交数组
            _.each(groups, function (group) {
                _.each(group.question, function (question) {
                    if (question.mode === 'A') {
                        //是父子题A模式
                        var parentOrder = question.sub[0] && question.sub[0].orders;
                        var subList = _.map(question.sub, function (item, index) {
                            return {
                                qFLnkID: item.QFLnkID || item.fLnkId || item.FLnkID || '',
                                qtypeName: question.qtypeName,
                                Dtype: group.Dtype,
                                qScores: item.score || 0,
                                Order: item.orders + '',
                                GAP: '0',
                                ShowType: item.ShowType && item.ShowType.id || '0',
                                mode: question.mode,
                                sOrder: index + 1,
                                parentOrder: parentOrder,
                                isSub: 1
                            }
                        });
                        questions.push({
                            qFLnkID: question.QFLnkID || item.fLnkId || item.FLnkID || '',
                            qtypeName: question.qtypeName,
                            Dtype: group.Dtype,
                            qScores: question.score || 0,
                            Order: parentOrder + '',
                            GAP: '0',
                            ShowType: question.ShowType && question.ShowType.id || '0',
                            mode: question.mode,
                            sOrder: 0,
                            parentOrder: 0,
                            explain: group.explain,
                            isSub: 1
                        });
                        questions = questions.concat(subList);
                    } else if (question.mode === 'B') {
                        //是父子题B模式
                        var parentOrderB = question.orders;
                        var subListB = _.map(question.sub, function (item, index) {
                            return {
                                qFLnkID: item.QFLnkID || item.fLnkId || item.FLnkID ||'',
                                qtypeName: question.qtypeName,
                                Dtype: group.Dtype,
                                qScores: item.score || 0,
                                Order: parentOrderB + '',
                                GAP: '0',
                                ShowType: item.ShowType && item.ShowType.id || '0',
                                mode: question.mode,
                                sOrder: index + 1,
                                parentOrder: parentOrderB,
                                isSub: 1
                            }
                        });
                        questions.push({
                            qFLnkID: question.QFLnkID || item.fLnkId || item.FLnkID || '',
                            qtypeName: question.qtypeName,
                            Dtype: group.Dtype,
                            qScores: question.score || 0,
                            Order: parentOrderB + '',
                            GAP: '0',
                            ShowType: question.ShowType && question.ShowType.id || '0',
                            mode: question.mode,
                            sOrder: 0,
                            parentOrder: 0,
                            explain: group.explain,
                            isSub: 1
                        });
                        questions = questions.concat(subListB);
                    } else {
                        //是普通题型
                        questions.push({
                            qFLnkID: question.QFLnkID || item.fLnkId || item.FLnkID || '',
                            qtypeName: question.qtypeName,
                            Dtype: group.Dtype,
                            qScores: question.score || 0,
                            Order: question.orders + '',
                            GAP: '0',
                            ShowType: question.ShowType && question.ShowType.id || '0',
                            sOrder: 0,
                            parentOrder: 0,
                            isSub: 0,
                            explain: group.explain,
                            mode: ''
                        });
                    }
                });
            });
            return questions;
        },
        getMainQuestionBySub: function(subQuestion, group){
            if(subQuestion.mainId){
                var main = _.find(group.question, function(item){
                    return item.FLnkID === subQuestion.mainId;
                });
                return main;
            }else {
                return ;
            }
        },
        getAllQuestions: function(groups){
            var results = [];
            _.each(groups, function(g){
                _.each(g.question, function(q){
                    //如果是子题,则把父子题都另存出来
                    if(q.sub && q.sub.length > 0) {
                        results.push(q);
                        _.each(q.sub, function(s){
                            results.push(s);
                        });
                    }else {
                        results.push(q);
                    }
                });
            });
            return results;
        },
        modifyShowType: function(showType){
            if(typeof showType === 'string') {
                return _.find(utilService.showTypeList, function(t){
                    return t.id === showType;
                }) || utilService.showTypeList[0];
            }else if(typeof showType === 'object'){
                return showType;
            }else {
                return utilService.showTypeList[0];
            }
        },
        getParentScore: function(parent){
            var score = 0;
            _.each(parent.sub, function(s){
				score += +s.score;
            });
            return score || +parent.score;
        },
        assignScore: function(tScore, len){
			var score = tScore;
			var step = 0.5;
			if (score >= len) {
				step = 1;
			}
			var list = new Array(len);
			for (var j = 0; j < list.length; j++) {
				list[j] = 0;
			}
			(function doAssign(leftScore) {
				for (var i = 0; i < len; i++) {
					if (leftScore > step) {
						list[i] += step;
						leftScore -= step;
					} else {
						if (leftScore > 0) {
							list[i] += leftScore;
							leftScore = 0
						} else {
							break;
						}

					}
				}
				if (leftScore > 0) {
					doAssign(leftScore);
				}
			})(score);
			return list.reverse();
        }
    }
}]);