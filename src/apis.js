(function() {
    // all the Descriptions will be inserted here
    window.apis = {};

    apis.github = {

	// A Repository
	"https://api.github.com/repos/*/*":

	{
	    '$':
	    {
		'@id': [{'f:valueof': 'url'}],
		'@ns': {'ns:default': 'gh'},
		'@context': {'gh': 'https://api.github.com/vocabulary#'},
		'@type': ['https://api.github.com/vocabulary#Repository'],
		'@only': ['name', 'watchers', 'forks', 'description', 'owner', 'url']
	    },
	    
	    '$.owner':
	    {
		'@ns': {'ns:default': 'gh',
			'ns:replace': {'avatar_url':'foaf:depiction'}},
		'@context': {'gh': 'https://api.github.com/vocabulary#',
			     'foaf': 'http://xmlns.com/foaf/0.1/',
			     'foaf:depiction': {'@type': '@id'}},
		'@type': ['https://api.github.com/vocabulary#User',
			  'http://xmlns.com/foaf/0.1/Person'],
		'@id': [{'f:valueof': 'login'},
			{'f:prefix': 'http://geektalk.com/vocabulary/geek#'}],
		'@remove': ['url']
	    }
	},


	// People collaborating in the project
	"https://api.github.com/repos/*/*/collaborators,\
         https://api.github.com/repos/*/*/watchers,\
         https://api.github.com/users/*":

	{
	    '$': 
	    {
		'@ns': {'ns:default': 'gh',
			'ns:replace': {'avatar_url':'foaf:depiction',
				       'name': 'foaf:name'}},
		'@context': {'gh': 'https://api.github.com/vocabulary#',
			     'foaf': 'http://xmlns.com/foaf/0.1/',
			     'foaf:depiction': {'@type': '@id'},
			     'gh:url' : {'@type': '@id'}},
		'@type': ['https://api.github.com/vocabulary#User',
			  'http://xmlns.com/foaf/0.1/Person'],
		'@id': [{'f:valueof': 'login'},
			{'f:prefix': 'http://geektalk.com/vocabulary/geek#'}],
		'@only': ['url', 'avatar_url', 'name', 'login', 'blog', 'company', 'email', 'followers', 'following', 'location', 'public_repos']
	    }
	}

    };

    apis.stackOverflow = {
	'@declare':
	{
	    'gt': 'http://antoniogarrote.com/geektalk/',
	    'gt:fromSODate': 'function(argument, input, obj){ var d = new Date(input*1000);\
                                                              var pad = function(n){ return n<10 ? \'0\'+n : n };\
                                                              return d.getUTCFullYear()+\'-\'\
                                                              + pad(d.getUTCMonth()+1)+\'-\'\
                                                              + pad(d.getUTCDate())+\'T\'\
                                                              + pad(d.getUTCHours())+\':\'\
                                                              + pad(d.getUTCMinutes())+\':\'\
                                                              + pad(d.getUTCSeconds())+\'Z\'; }'
	},

	// A StackOverflow user
	"https://api.stackexchange.com/2.2/users":

	{
	    '$':
	    {
		'@ns':{'ns:default': 'so',
		       'ns:replace': {'avatar_url':'foaf:depiction'}},
		'@context': {'so': 'http://api.stackoverflow.com/1.1/vocabulary#',
			     'so:github_id': {'@type': '@id'},
			     'foaf': 'http://xmlns.com/foaf/0.1/',
			     'foaf:depiction': {'@type': '@id'}},
		'@type': ['http://api.stackoverflow.com/1.1/vocabulary#User',
			  'http://xmlns.com/foaf/0.1/Person'],
		'@id': [{'f:valueof': 'display_name'},
			{'f:prefix': 'http://geektalk.com/vocabulary/geek#'}],
		'@only': ['display_name', 'user_id', 'avatar_url', 'github_id', 'reputation']		       
	    }
	},

	// StackOverflow answers associated to users
	"https://api.stackexchange.com/2.2/users/*/answers":
	
	{
	    '$':
	    {
		'@ns':{'ns:default': 'so',
		       'ns:replace': {'question_id': 'so:question'}},
		'@context': {'so': 'http://api.stackoverflow.com/1.1/vocabulary#',
			     'xsd': 'http://www.w3.org/2001/XMLSchema#',
			     'so:question': {'@type': '@id'},
			     'so:creation_date': {'@type': 'xsd:date'}},
		'@type': ['http://api.stackoverflow.com/1.1/vocabulary#Answer'],
		'@id': [{'f:valueof': 'answer_id'},
			{'f:prefix': 'http://geektalk.com/vocabulary/answer#'}],
		'@transform': {
		    'question_id': [{'f:valueof': 'question_id'},
				    {'f:prefix': 'http://geektalk.com/vocabulary/question#'}],
		    'creation_date': [{'f:valueof': 'creation_date'},
				      {'gt:fromSODate': null}]
		},
		'@only': ['answer_id', 'question_id', 'score', 'owner', 'creation_date', 'body']
	    },

	    '$.owner':
	    {
		'@ns':{'ns:default': 'so'},
		'@context': {'so': 'http://api.stackoverflow.com/1.1/vocabulary#'},
		'@id': [{'f:valueof': 'display_name'},
			{'f:prefix': 'http://geektalk.com/vocabulary/geek#'}],
		'@only': []
	    }
	},

	// StackOverflow questions
	"https://api.stackexchange.com/2.2/questions/*":

	{
	    '$':
	    {
		'@ns':{'ns:default': 'so'},
		'@context': {'so': 'http://api.stackoverflow.com/1.1/vocabulary#',
			     'xsd': 'http://www.w3.org/2001/XMLSchema#',
			     'so:question': {'@type': '@id'},
			     'so:creation_date': {'@type': 'xsd:date'}},
		'@type': ['http://api.stackoverflow.com/1.1/vocabulary#Question'],
		'@id': [{'f:valueof': 'question_id'},
			{'f:prefix': 'http://geektalk.com/vocabulary/question#'}],
		'@transform': {
		    'creation_date': [{'f:valueof': 'creation_date'},
				      {'gt:fromSODate': null}]
		},
		'@only': ['question_id', 'creation_date', 'body', 'tags', 'title']
	    }
	}
    };

    apis.hackerNews = {
	'@declare':
	{
	    'gt': 'http://antoniogarrote.com/geektalk/',
	    'gt:fromHNDate': 'function(argument, input, obj){ var elapsed = parseInt(input.split(" ")[0]) * 24* 60 * 60 * 100;\
                                                              var millisecs = (new Date()).getTime() - elapsed;\
                                                              var d = new Date(millisecs);\
                                                              var pad = function(n){ return n<10 ? \'0\'+n : n };\
                                                              return d.getUTCFullYear()+\'-\'\
                                                              + pad(d.getUTCMonth()+1)+\'-\'\
                                                              + pad(d.getUTCDate())+\'T\'\
                                                              + pad(d.getUTCHours())+\':\'\
                                                              + pad(d.getUTCMinutes())+\':\'\
                                                              + pad(d.getUTCSeconds())+\'Z\'; }'
	},

	// owner, post_id -> Undefined
	"http://api.ihackernews.com/threads/*":

	{
	    '$':
	    {
		'@ns':{
		         'ns:default': 'hn',
   		         'ns:replace': {'postId': 'hn:post',
					'postedAgo': 'hn:creation_date'}
		      },
		'@context': {'hn': 'http://api.ihackernews.com/vocabulary#',
			     'xsd': 'http://www.w3.org/2001/XMLSchema#',
			     'hn:post': {'@type': '@id'},
			     'hn:owner': {'@type': '@id'},
			     'hn:creation_date': {'@type': 'xsd:date'}},
		'@type': ['http://api.ihackernews.com/vocabulary#Answer'],
		'@id': [{'f:valueof': 'id'},
			{'f:prefix': 'http://geektalk.com/vocabulary/threadComment#'}],
		'@transform': {
		    'postId': [{'f:valueof': 'postId'},
				{'f:prefix': 'http://geektalk.com/vocabulary/post#'}],
		    'postedAgo': [{'f:valueof': 'postedAgo'},
				  {'gt:fromHNDate': null}],
		    'owner': [{'f:valueof': 'owner'},
			      {'f:prefix': 'http://geektalk.com/vocabulary/geek#'}]
		},
		'@only': ['id', 'postId', 'comment', 'postedAgo', 'points', 'owner']
	    }
	},

	"http://api.ihackernews.com/post/*":

	{
	    '$':
	    {
		'@ns':{'ns:default': 'hn'},
		'@context': {'hn': 'http://api.ihackernews.com/vocabulary#',
			     'xsd': 'http://www.w3.org/2001/XMLSchema#',
			     'hn:creation_date': {'@type': 'xsd:date'}},
		'@id': [{'f:valueof': 'id'},
			{'f:prefix': 'http://geektalk.com/vocabulary/post#'}],
		'@type': ['http://api.ihackernews.com/vocabulary#Post'],
		'@transform': {
		    'postedAgo': [{'f:valueof': 'postedAgo'},
				  {'gt:fromHNDate': null}]
		},
		"@only": ["title", "text", "postedAgo", "points", "url", "id"]
	    }
	}
    };

    apis.twitter = {
	'@declare':
	{
	    'gt': 'http://antoniogarrote.com/geektalk/',
	    'gt:fromTwitterDate': 'function(argument, input, obj){ var d = new Date(input);\
                                                                   var pad = function(n){ return n<10 ? \'0\'+n : n };\
                                                                   return d.getUTCFullYear()+\'-\'\
                                                                   + pad(d.getUTCMonth()+1)+\'-\'\
                                                                   + pad(d.getUTCDate())+\'T\'\
                                                                   + pad(d.getUTCHours())+\':\'\
                                                                   + pad(d.getUTCMinutes())+\':\'\
                                                                   + pad(d.getUTCSeconds())+\'Z\'; }'
	},

	"http://api.twitter.com/1/users/show.json":

	{
	    '$':
	    {
		'@ns':{
		    'ns:default': 'tw',
		    'ns:replace': {'screen_name': 'tw:owner'}
		},
		'@context': {
		    'tw': 'http://api.twitter.com/1/vocabulary#',
		    'gt': 'http://geektalk.com/vocabulary/',
		    'tw:owner': {'@type':'@id'}
		},
		'@transform': {
		    'screen_name': [{'f:valueof': 'login'},
				    {'f:prefix': 'http://geektalk.com/vocabulary/geek#'}],
		    'postedAgo': [{'f:valueof': 'created_at'},
				  {'gt:fromTwitterDate': null}]
		},
		'@id':[{'f:valueof': 'login'},
		       {'f:prefix': 'http://geektalk.com/vocabulary/microblogpost#'}],
		'@type': ['http://api.twitter.com/1/vocabulary#MicroblogPost'],
		'@only': ["id", "text",  "retweeted", "login", "status_id", "statusUrl", "screen_name", "created_at"]
	    }
	}
    };

})();