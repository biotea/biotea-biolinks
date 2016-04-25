var init = function() {
    var self = this;
    var appTopic = require('biotea-vis-topicDistribution');
    var appSimilarity = require('biotea-vis-similarity');
    var appAnnotation = require('biotea-vis-annotation');

    self.selectedTopic = 'chapter1';
    self.topicsSelect = undefined;
    self.topicsOption = undefined;
    self.articleTitle = undefined;
    self.similarity = undefined;

    self.start = function() {
        self.topicDistribution = new appTopic({
            el: '#visDist',
            width: 880
        });

        var controls = d3.select('#controls');

        var topicsDiv = controls.append('div');
        topicsDiv.append('span').text('Chapter: ');
        self.topicsSelect = topicsDiv.append('span').append('select')
            .attr('id', 'topicsSelection')
            .on('change', function() {
                var selectedIndex = self.topicsSelect.property('selectedIndex')
                self.selectedTopic = self.topicsOption[0][selectedIndex].__data__.value;
                self.updateDistribution(selectedIndex);
            });
        self.topicsOption = self.topicsSelect.selectAll('option')
            .data(protocolTopics)
            .enter().append('option')
            .attr('value', function(topic) {return topic.value;})
            .text(function(topic) {return topic.text;});

        self.updateDistribution(0);

        var articleDiv = d3.select('#selectedArticle');
        articleDiv.html('');
        articleDiv.append('span').text('Selected Article: ');
        self.articleTitle = articleDiv.append('span').text('Click on any column in the distribution matrix to select'
            + 'an article');

        self.topicDistribution.getDispatcher().on('selected', function(obj) {
            var collection = protocolArticles;
            var selectedArticle = _.find(collection, function(el) {
                return +obj.article === +el.id;
            });
            var articleText = selectedArticle.title;
            self.articleTitle.text(articleText);

            self.updateSimilarity(selectedArticle);
        });
    };

    self.updateAnnotation = function(topic, ftId, articles) {
        d3.select('#annotGroup').style('display', 'block');
        d3.select('#annotatedArticle').html('');

        d3.select('#annotatedArticle').html(function() {
            var annotArt = _.find(articles, function(art) {
                return art.id === ftId;
            });
            return 'Annotated article: ' + annotArt.title;
        });

        d3.select('#visAnnotation').selectAll('*').remove();
        d3.select('#visAnnotation').html('');
        var annotation = new appAnnotation({
            el: '#visAnnotation',
            width: 400,
            height: 500,
            translation: -100,
            path: './protocols/' + topic + '/',
            id: ftId
        });
    };

    self.updateSimilarity = function(selectedArticle) {
        var topic = selectedArticle.topic;
        var path = './protocols/' + topic + '/';
            articles = _.filter(pmc_articles, function(elem) {
                return elem.topic === selectedArticle.topic;
            });
        }

        if (articles.length >= 3) {
            var relatedIdsFT = [];
            var relatedIdsTA = [];
            _.each(articles, function(elem) {
                if (elem.id !== selectedArticle.id) {
                    relatedIdsFT.push(elem.id);
                    relatedIdsTA.push(elem.pmid);
                }
            });

            if (self.similarity) {
                self.similarity.stopForce();
            }
            d3.select('#visSimilarity').selectAll('*').remove();
            d3.select('#visSimilarity').html('');
            self.similarity = new appSimilarity({
                el: '#visSimilarity', width: 400, height: 400,
                path: pathFT,
                queryId: selectedArticle.id, prefixId: "PMC", relatedIds: relatedIdsFT
            });

            self.similarity.getDispatcher().on('selected', function(obj) {
                self.updateAnnotation(obj.datum.relatedId, articles);
            });

            d3.select('#clickNode').style('display', 'block');
        }
    };

    self.updateDistribution = function(topic, selectedIndex) {
        var path = './protocols/' + topic + '/distribution/';
        var topics = protocolTopics;
        var articles = protocolArticles;

        var topicArticles = _.filter(articles, function(art) {
            return art.topic === topics[selectedIndex].value;
        });
        var topicIds = _.pluck(topicArticles, 'id');

        self.topicDistribution.setPath(path);
        self.topicDistribution.setIds(topicIds);
        self.topicDistribution.render();

        if (self.articleTitle !== undefined) {
            if (topicArticles.length >= 3) {
                d3.select('#simGroup').style('display', 'block');
                self.articleTitle.text('Click on any column in the distribution matrix to select an article and ' +
                    'display similarity network');
            } else {
                d3.select('#simGroup').style('display', 'none');
                self.articleTitle.text('Click on any column in the distribution matrix to select an article');
            }
            d3.select('#annotGroup').style('display', 'none');
            d3.select('#clickNode').style('display', 'none');
        }
    };

    return self;
}();