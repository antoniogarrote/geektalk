(function () {

    window.client_id = GITHUB_CLIENT_ID;
    window.client_secret = GITHUB_CLIENT_SECRET;
    window.STACK_OVERFLOW_KEY = STACK_OVERFLOW_KEY;
    window.GITHUB_AUTHENTICATION_PASSWORD = GITHUB_AUTHENTICATION_PASSWORD_BTOA;
    window.github_authentication = 'client_id=' + client_id + '&client_secret=' + client_secret;

    var Utils = {stackCounter: 0};

    Utils.recur = function (c) {
        if (Utils.stackCounter === Utils.stackCounterLimit) {
            Utils.stackCounter = 0;
            setTimeout(c, 0);
        } else {
            Utils.stackCounter++;
            c();
        }
    };

    Utils.repeat = function (c, max, floop, fend, env) {
        if (arguments.length === 4) {
            env = {};
        }
        if (c < max) {
            env._i = c;
            floop(function (floop, env) {
                // avoid stack overflow
                // deadly hack
                Utils.recur(function () {
                    Utils.repeat(c + 1, max, floop, fend, env);
                });
            }, env);
        } else {
            fend(env);
        }
    };

    // A object holding the module
    var geektalk = {};
    window.geektalk = geektalk;

    var titleColors = ["#DC143C", "#00CD66", "#FFC125", "#FF9912", "#FF4500", "#7D9EC0"];
    var colors = ["#B0171F", "#DC143C", "#CD8C95", "#8B5F65", "#8B475D", "#8B8386", "#CD3278", "#8B2252", "#EE6AA7", "#DA70D6", "#8B4789", "#8B7B8B", "#8B668B", "#8B008B", "#4B0082", "#483D8B", "#0000FF", "#191970", "#3D59AB", "#4169E1", "#778899", "#1C86EE", "#4F94CD", "#607B8B", "#00C5CD", "#00868B", "#00CD66", "#008B45", "#2E8B57", "#00CD00", "#008000", "#66CD00", "#6E8B3D", "#9ACD32", "#CDCD00", "#8B8B00", "#FFA500", "#FF7F00", "#8B4500", "#FF7F24", "#FF8247", "#FF4500", "#EE5C42", "#EE2C2C", "#CD0000", "#8E388E", "#7171C6", "#388E8E"];

    // Constants
    geektalk.github_authentication_password = GITHUB_AUTHENTICATION_PASSWORD;
    geektalk.stack_overflow_key = STACK_OVERFLOW_KEY;
    geektalk.one_year_ago = (new Date().getTime()) - 365 * 24 * 60 * 60 * 1000;
    geektalk.three_years_ago = (new Date().getTime()) - 3 * 365 * 24 * 60 * 60 * 1000;
    geektalk.MAX_COLLABORATORS_RUN = 1;
    geektalk.MAX_SO_RUN = 1;

    geektalk.PROXY_ENDPOINT = "http://localhost:3000";

    // The View Model
    geektalk.viewModel = {
        // global
        appStatus: ko.observable('project-selection'),
        triplesCounter: ko.observable(0),
        callbackCounter: 0,
        uriBeingLoaded: ko.observable(''),
        jsonpRequestsConfirmations: {},
        // loading project
        projectName: ko.observable(),
        projectNameInline: ko.observable(),
        projectNameStatus: ko.observable(),
        projectContributorsFound: ko.observable(0),
        projectResourcesFound: ko.observable(0),
        // loaded project header
        currentProjectURI: ko.observable(),
        // loading collaborators
        StackOverflowSelectionCriteria: ko.observable('all'),
        StackOverflowAllQuestions: ko.observable([]),
        StackOverflowSelectedQuestions: ko.observable([]),
        HackerNewsRequests: ko.observable(0),
        currentProjectCollaboratorsPage: ko.observable(0),
        pendingCollaborators: ko.observable(),
        loadedCollaborators: 0,
        stackOverflowPagesLoaded: 0,
        processedUsers: {},
        hnUsersToLoad: [],
        twUsersToLoad: [],
        triplesInVisualization: ko.observable(0)
    };

    window.viewModel = geektalk.viewModel;


    // counter of StackOverflow users whose answers will be loaded
    geektalk.pendingStackOverflowUsers = [];

    // shows the about dialog
    geektalk.viewModel.showAbout = function () {
        jQuery('#about-modal').modal('show');
    };

    // hides the about dialog
    geektalk.viewModel.hideAbout = function () {
        jQuery('#about-modal').modal('hide');
    };

    // A message to be shown in the status bar
    geektalk.viewModel.triplesLoadedMessage = ko.dependentObservable(function () {
        return "Triples loaded: " + geektalk.viewModel.triplesCounter();
    });

    // URI loading message to be shown in the status bar
    geektalk.viewModel.uriBeingLoadedMessage = ko.dependentObservable(function () {
        var uri = geektalk.viewModel.uriBeingLoaded();
        if (uri === '') {
            return "Loading : --";
        } else {
            if (uri.length > 90) {
                return "Loading : " + uri.substring(0, 90) + "...";
            } else {
                return "Loading : " + uri;
            }
        }
    });

    geektalk.viewModel.selectSection = function (section) {
        var tabs = {
            StackOverflow: 'sotab',
            HackerNews: 'hntab',
            Twitter: 'twtab',
            People: 'pptab',
            Location: 'geotab',
            Stats: 'stats'
        };

        var sections = {
            StackOverflow: 'answers-display',
            HackerNews: 'discussions-display',
            Twitter: 'status-display',
            People: 'people-display',
            Location: 'location-display',
            Stats: 'stats-display'
        };

        var tab = tabs[section];

        jQuery(".nav-tabs li").removeClass("active");
        jQuery(".nav-tabs #" + tab).addClass("active");
        for (var k in sections) {
            if (k === section) {
                jQuery("#" + sections[k]).show();
                if (section === "Location") {
                    google.maps.event.trigger(map, 'resize');
                    //37.4419, -122.1419
                    map.setCenter(new google.maps.LatLng(40.26, 3.43));
                }
            } else {
                jQuery("#" + sections[k]).hide();
            }
        }
    };

    // generates a random color
    geektalk.viewModel.randomColor = function (selector) {
        var randomNumber = Math.floor(Math.random() * colors.length);
        return colors[randomNumber];
    };

    // generates a random color
    geektalk.viewModel.randomTitleColor = function (selector) {
        var randomNumber = Math.floor(Math.random() * titleColors.length);
        return titleColors[randomNumber];
    };

    // small module that assigns colors to tags
    (function () {
        var colorsMap = {};
        var colorsCount = 0;
        var colorsIndices = {};
        // returns a new color for a tag
        geektalk.viewModel.colorForTag = function (tag) {
            var color = colorsMap[tag];
            if (color) {
                return color;
            } else {
                if (colorsCount < colors.length) {
                    var found = false;
                    var tries = 0;
                    while (!found) {
                        color = geektalk.viewModel.randomColor();
                        if (colorsIndices[color] == null || tries === 5) {
                            colorsMap[tag] = color;
                            colorsIndices[color] = true;
                            found = true;
                        } else {
                            tries++;
                        }
                    }
                    return color;
                } else {
                    color = geektalk.viewModel.randomColor();
                    colorsMap[tag] = color;

                    return color;
                }
            }
        };

        geektalk.viewModel.selectTag = function (event) {
            var tagName = jQuery(event.currentTarget).text();
            viewModel.StackOverflowSelectionCriteria(tagName);
        };

        geektalk.viewModel.unselectTag = function () {
            viewModel.StackOverflowSelectionCriteria('all');
        };
    })();

    // handles users introducing a new Github's name
    geektalk.viewModel.loadProjectName = function () {
        if (viewModel.projectName() == '' || viewModel.projectName() == null || viewModel.projectName().indexOf("/") === -1) {
            viewModel.projectNameStatus('error');
            viewModel.projectNameInline('provide a valid Github\'s user/project name combination, e.g. rails/rails');
        } else {
            viewModel.projectNameStatus('loading');
            viewModel.projectNameInline('loading...');
            geektalk.loadProject();
        }
    };

    // Shows the frontend
    geektalk.viewModel.showFrontend = function () {
        geektalk.frontend = new rdfstore_frontend('#frontend', sko.store);
    };

    geektalk.viewModel.modifyQuestionState = function (event) {
        jQuery(event.currentTarget).parent().parent().find("span").toggle();
        jQuery(event.currentTarget).parent().parent().parent().parent().parent().parent().find(".question-body").toggle();
        jQuery(event.currentTarget).parent().parent().parent().parent().parent().find(".answer-body").toggle();
    };

    geektalk.viewModel.modifyPermanentQuestionState = function (event) {
        var id = jQuery(event.currentTarget).parent().parent().parent().parent().parent().find(".question-id-marker").val();
        var oldValue = viewModel['open' + id]();
        viewModel['open' + id](!oldValue);
    };

    // updates the triple counter
    geektalk.updateTripleCount = function (n) {
        if (typeof(n) === 'string') {
            n = parseInt(n);
        }
        var old = viewModel.triplesCounter();
        viewModel.triplesCounter(old + n);
    };

    // loads a URI using JSONP
    geektalk.loadJSONP = function (fragment, callback, callbackParameter, ignore) {
        ignore = ignore || false;
        var cbHandler = "jsonp" + viewModel.callbackCounter;
        viewModel.callbackCounter++;

        if (callbackParameter == null)
            callbackParameter = "callback";

        var uri = fragment;

        if (uri.indexOf("?") === -1) {
            uri = uri + "?" + callbackParameter + "=" + cbHandler;
        } else {
            uri = uri + "&" + callbackParameter + "=" + cbHandler;
        }

        window[cbHandler] = function (data) {
            if (viewModel.uriBeingLoaded() === uri)
                viewModel.uriBeingLoaded("");
            viewModel.jsonpRequestsConfirmations[uri] = true;
            callback(data);
        };

        setTimeout(function () {
            if (viewModel.jsonpRequestsConfirmations[uri] === true) {
                delete viewModel.jsonpRequestsConfirmations[uri];
            } else {
                console.log("(!!) JSONP error, retyring...");
                console.log(fragment);
                console.log(callbackParameter);
                delete window[cbHandler];
                if (ignore) {
                    callback(null);
                } else {
                    geektalk.loadJSONP(fragment, callback, callbackParameter, ignore);
                }
            }
        }, 15000);

        viewModel.uriBeingLoaded(uri);
        var script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', uri);
        document.getElementsByTagName('head')[0].appendChild(script);
    };

    geektalk.resolveAndLoad = function (uri, data, cb) {
        var jsonld = jsonld_macros.resolve(uri, data);
        sko.store.load('application/json', jsonld, function (success, loaded) {
            if (success) {
                geektalk.updateTripleCount(loaded);
                cb(true, jsonld);
            } else {
                cb(false, null);
            }
        });
    };


    // Loads a project from Github Projects API
    geektalk.loadProject = function () {
        var uri = "https://api.github.com/repos/" + viewModel.projectName() + "?" + github_authentication;
        geektalk.loadJSONP(uri, function (resp) {
            if (resp == null || resp.data.message === 'Not Found') {
                viewModel.projectNameStatus('error');
                viewModel.projectNameInline('provide a valid Github\'s user/project name combination, e.g. rails/rails');
                alert("User/Project '" + viewModel.projectName() + "' not found");
            } else {
                viewModel.projectNameStatus('success');
                viewModel.projectNameInline('Success!');
                jQuery("#stack-overflow-loader").show();
                jQuery("#hacker-news-loader").show();

                if (window.location.href.indexOf("#!") == -1) {
                    window.location.href = "#!" + viewModel.projectName();
                }

                var uri = "https://api.github.com/repos/" + viewModel.projectName() + "?callback=jsonp&" + github_authentication;
                geektalk.resolveAndLoad(uri, resp.data, function (success, jsonld) {
                    if (success) {
                        viewModel.appStatus('conversations-playing');
                        viewModel.currentProjectURI(jsonld['@id']);
                        // Proceed to load the collaborators;
                        geektalk.loadCollaborators();

                        // Start loading HackerNews Users
                        geektalk.loadHackerNewsUsers();

                        // Start loading Twitter Users
                        geektalk.loadTwitterUsers();

                    } else {
                        alert("Error processing Github's data (?!!)");
                    }
                });
            }
        });
    };

    geektalk.ajax = function (url, headers, callbackFunction) {
        this.bindFunction = function (caller, object) {
            return function () {
                return caller.apply(object, [object]);
            };
        };

        this.stateChange = function (object) {
            if (this.request.readyState == 4)
                this.callbackFunction(JSON.parse(this.request.responseText));
        };

        this.getRequest = function () {
            if (window.ActiveXObject)
                return new ActiveXObject('Microsoft.XMLHTTP');
            else if (window.XMLHttpRequest)
                return new XMLHttpRequest();
            return false;
        };

        this.postBody = (arguments[3] || "");

        this.callbackFunction = callbackFunction;
        this.url = url;
        this.request = this.getRequest();

        if (this.request) {
            var req = this.request;
            req.onreadystatechange = this.bindFunction(this.stateChange, this);

            if (this.postBody !== "") {
                req.open("POST", url, true);
                req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                req.setRequestHeader('Content-type', 'application/json');
            } else {
                req.open("GET", url, true);
            }
            for (var p in headers) {
                req.setRequestHeader(p, headers[p]);
            }
            req.send(this.postBody);
        }
    }


    // Loads the next page of collaborators for the current project
    geektalk.loadCollaborators = function () {
        var page = viewModel.currentProjectCollaboratorsPage();
        viewModel.currentProjectCollaboratorsPage(page + 1);
        var uri = "https://api.github.com/repos/" + viewModel.projectName() + "/stats/contributors?" + "per_page" + 100 + "&page=" + page;
        debugger;
        geektalk.ajax(uri, {"Authorization": "Basic " + geektalk.github_authentication_password}, function (resp) {
            if (resp != null) {
                viewModel.projectContributorsFound(resp.length);
                var contributors = [];
                for (var i = 0; i < resp.length; i++)
                    contributors.push(resp[i].author);
                var nextCollaborator = contributors.pop();
                viewModel.pendingCollaborators(contributors);
                geektalk.loadCollaborator(nextCollaborator);
            } else {
                alert("Error loading Github's data (??!)");
            }
            ;
        });
    };

    // Loads users from the commits information
    geektalk.loadCommitters = function () {
        var uri = "http://api.github.com/repos/" + viewModel.projectName() + "/commits/master?" + github_authentication;
        var committers = [];
        var commits, author;

        geektalk.loadJSONP(uri, function (data) {
            committers = [];
            commits = data.commits;
            for (var i = 0; i < commits.length; i++) {
                if (commits[i].author.login != null && commits[i].author.login != "") {
                    author = commits[i].author.login;
                    if (viewModel.processedUsers[author] == null) {
                        committers.push({url: "https://api.github.com/users/" + author});
                        viewModel.processedUsers[author] = true;
                    }
                }
            }

            var upto = viewModel.projectContributorsFound();
            viewModel.projectContributorsFound(committers.length + upto);
            var nextCollaborator = committers.pop();
            viewModel.pendingCollaborators(committers);
            if (nextCollaborator != null) {
                geektalk.loadCollaborator(nextCollaborator);
            } else {
                //@todo here
            }
        });


    };


    geektalk.checkIdentity = function (githubUser, stackOverflowUsers) {
        var fields = {
            blog: 'website_url',
            email: 'email_hash',
            login: 'display_name'
        };

        var bestUser = null;
        var bestScore = 0;
        for (var i = 0; i < stackOverflowUsers.length; i++) {
            var score = 0;
            for (var f in fields) {
                if (f === 'email') {
                    if (githubUser.email != null &&
                        stackOverflowUsers[i].email_hash != null &&
                        hex_md5(githubUser.email) === stackOverflowUsers[i].email_hash) {
                        return stackOverflowUsers[i];
                    }
                } else {
                    if (stackOverflowUsers[i][fields[f]] != null &&
                        githubUser[f] != null &&
                        stackOverflowUsers[i][fields[f]].split(/[\s]+/g).join("") === githubUser[f].split(/[\s]+/g).join("")) {
                        score++;
                    }
                }
            }
            if (score > bestScore)
                bestUser = stackOverflowUsers[i];
        }

        if (score > 1 || (score == 1 && stackOverflowUsers.length == 1)) {
            return bestUser;
        } else {
            return null;
        }
    };

    // process the next collaborator
    // Load collaborator from github data and tries to find an associated
    // stack overflow user using the user nick name as the identifier
    // If no user is found, the next collaborator will be loaded
    geektalk.loadCollaborator = function (collaborator) {
        // load the collaborator data from github
        var uri = collaborator.url;
        geektalk.loadJSONP(uri, function (resp) {
            if (resp != null && resp.data != null) {
                var githubUser = resp.data;
                var login = githubUser.login;
                var originalGithubUser = {
                    blog: githubUser.blog,
                    email: githubUser.email,
                    login: githubUser.login,
                    avatar_url: githubUser.avatar_url
                };
                viewModel.processedUsers[login] = true;

                // Load data from Hacker News
                viewModel.hnUsersToLoad.push(githubUser.login);
                viewModel.twUsersToLoad.push(githubUser.login);

                geektalk.resolveAndLoad("https://api.github.com/repos/*/*/collaborators?" + github_authentication, githubUser, function (success, jsonld) {

                    // look for the collborator in Stack Overflow
                    var uri = "https://api.stackexchange.com/2.2/users?key=" + geektalk.stack_overflow_key + "&site=stackoverflow&order=desc&sort=reputation&inname=" + login + "&filter=default";
                    geektalk.loadJSONP(uri, function (jsonpData) {

                            var loadPendingCollaborators = function () {
                                var pendingCollaborators = viewModel.pendingCollaborators();

                                if (pendingCollaborators.length === 0 || viewModel.loadedCollaborators == geektalk.MAX_COLLABORATORS_RUN) {
                                    jQuery("#stack-overflow-loader").hide();
                                    viewModel.loadedCollaborators = 0;
                                    geektalk.loadStackOverflowAnswers();
                                } else {
                                    var nextCollaborator = pendingCollaborators.pop();
                                    viewModel.pendingCollaborators(pendingCollaborators);
                                    geektalk.loadCollaborator(nextCollaborator);
                                }
                            };

                            var foundUser = geektalk.checkIdentity(originalGithubUser, jsonpData.items);

                            if (foundUser != null) {
                                // unify the ID
                                foundUser.github_id = "http://geektalk.com/vocabulary/geek#" + originalGithubUser.login;
                                foundUser.avatar_url = originalGithubUser.avatar_url;

                                // one more collaborator in this run
                                viewModel.loadedCollaborators++;
                                jQuery("#stack-overflow-loader .progress .bar").attr("style", "width: " + Math.floor(viewModel.loadedCollaborators / geektalk.MAX_COLLABORATORS_RUN * 100) + "%");
                                var currentSOUsers = viewModel.projectResourcesFound();
                                currentSOUsers++;
                                viewModel.projectResourcesFound(currentSOUsers);


                                geektalk.resolveAndLoad(uri, foundUser, function (success, jsonld) {
                                    geektalk.pendingStackOverflowUsers.push(jsonld["so:user_id"]);
                                    loadPendingCollaborators();
                                });
                            } else {
                                loadPendingCollaborators();
                            }
                        },
                        "jsonp");
                });
            } else {
                alert("Error loading Github's data (??!)");
            }
        });
    };

    // Load StackOverflow answers and associated questions
    // for a batch of StackOverflow authenticated github users
    geektalk.loadStackOverflowAnswers = function () {

        if (geektalk.pendingStackOverflowUsers.length > 0) {
            var ids = encodeURIComponent(geektalk.pendingStackOverflowUsers.join(";"));
            geektalk.pendingStackOverflowUsers = [];
            var fromDate = parseInt(geektalk.three_years_ago / 1000);

            var uri = "https://api.stackexchange.com/2.2/users/" + ids + "/answers?site=stackoverflow&filter=!9YdnSM68i&pagesize=20&order=desc&sort=votes&fromdate=" + fromDate + "&key=" + geektalk.stack_overflow_key;
            viewModel.stackOverflowPagesLoaded++;
            geektalk.loadJSONP(uri, function (jsonpData) {
                var questionIds = [];
                for (var i = 0; i < jsonpData.items.length; i++) {
                    questionIds.push(jsonpData.items[i].question_id);
                }

                geektalk.resolveAndLoad(uri, jsonpData.items, function (success, jsonld) {
                    if (success) {
                        uri = "https://api.stackexchange.com/2.2/questions/" + encodeURIComponent(questionIds.join(";")) + "?site=stackoverflow&filter=!9YdnSJ*_S&key=" + geektalk.stack_overflow_key;
                        geektalk.loadJSONP(uri, function (jsonpData) {
                            geektalk.resolveAndLoad(uri, jsonpData.items, function () {
                                if (viewModel.stackOverflowPagesLoaded < geektalk.MAX_SO_RUN) {
                                    var pendingCollaborators = viewModel.pendingCollaborators();
                                    if (pendingCollaborators.length === 0) {
                                        viewModel.loadedCollaborators = 0;
                                        // load another batch of collaborators
                                        geektalk.loadCommitters();
                                    } else {
                                        var nextCollaborator = pendingCollaborators.pop();
                                        viewModel.pendingCollaborators(pendingCollaborators);
                                        geektalk.loadCollaborator(nextCollaborator);
                                    }
                                } else {
                                    //console.log("*********************");
                                    //console.log("**  Reached limit  **");
                                    //console.log("*********************");
                                }
                            });
                        }, "jsonp");
                    } else {
                        alert("Error loading data from Stack Overflow");
                    }
                });
            }, "jsonp");
        } else {
            geektalk.loadCommitters();
        }
    };

    var twitterCounter = 0;
    // Tries to load a bunch of Twitter users
    geektalk.loadTwitterUsers = function () {
        var users = viewModel.twUsersToLoad;
        if (users.length > 0 && twitterCounter < 15) {
            geektalk.loadTwitterStatus(users.pop(), function () {
                twitterCounter++;
                setTimeout(geektalk.loadTwitterUsers, 500);
            });
        } else {
            setTimeout(geektalk.loadTwitterUsers, 3 * 1000);
        }
    };

    // Loads threads for this user from Hacker News
    geektalk.loadTwitterStatus = function (login, cb) {
        var uri = geektalk.PROXY_ENDPOINT + "/api.twitter.com/1.1/users/show.json?screen_name=" + login;
        geektalk.ajax(uri, {}, function (data) {
            if (data != null && data.error == null && data['status'] != null) {
                var currentResources = viewModel.projectResourcesFound();
                currentResources++;
                viewModel.projectResourcesFound(currentResources);

                data['status_id'] = data['status']['id'];
                data['statusUrl'] = 'https://twitter.com/#!' + data['screen_name'] + '/status/' + data['status']['id'];
                data['login'] = login;
                data['text'] = data['status']['text'];
                data['created_at'] = data['status']['created_at'];

                var matches = (data['text'].match(/@[\a-zA-Z0-9]+/g) || []);
                for (var i = 0; i < matches.length; i++) {
                    var match = matches[i];
                    var txt = data['text'].replace(match, "<span class='tweet-ref'>" + match + "</span>");
                }


                var userExtra = {
                    '@id': 'http://geektalk.com/vocabulary/geek#' + login,
                    'https://api.twitter.com/1.1/vocabulary#followers': data['followers_count']
                };
                sko.store.load("application/json", userExtra, function () {
                    var apiUri = "http://api.twitter.com/1/users/show.json";
                    geektalk.resolveAndLoad(apiUri, data, function () {
                        cb();
                    });
                });

            } else {
                cb();
            }
        });
        //}, "callback", true);
    };


    // Tries to load a bunch of Hacker News users
    geektalk.loadHackerNewsUsers = function () {
        var users = viewModel.hnUsersToLoad;
        if (users.length > 0) {
            geektalk.loadHackerNewsThreads(users.pop(), function () {
                setTimeout(geektalk.loadHackerNewsUsers, 5000);
            });
        } else {
            setTimeout(geektalk.loadHackerNewsUsers, 5000);
        }
    };

    // Loads threads for this user from Hacker News
    geektalk.loadHackerNewsThreads = function (login, cb) {
        return;
        var uri = "http://api.ihackernews.com/threads/" + login + "?format=jsonp";
        var currentHNRequests = viewModel.HackerNewsRequests();
        if (currentHNRequests != null) {
            if (currentHNRequests == 0) {
                currentHNRequests = currentHNRequests + 5;
            } else if (currentHNRequests > 99) {
                jQuery("#hacker-news-loader-alert").show();
                currentHNRequests = 5;
            } else {
                currentHNRequests = currentHNRequests + 5;
            }
            jQuery("#hacker-news-loader .progress .bar").attr("style", "width: " + currentHNRequests + "%");
            viewModel.HackerNewsRequests(currentHNRequests);
        }

        geektalk.loadJSONP(uri, function (jsonpData) {
            var comments = jsonpData.comments;
            if (comments.length > 0) {
                var currentHNUsers = viewModel.projectResourcesFound();
                currentHNUsers++;
                viewModel.projectResourcesFound(currentHNUsers);

                var max = (comments.length < 10) ? comments.length : 10;

                Utils.repeat(0, max, function (k, env) {
                    var floop = arguments.callee;
                    var i = env._i;
                    var comment = comments[i];
                    comment.owner = login;

                    var currentHNRequests = viewModel.HackerNewsRequests();
                    if (currentHNRequests != null) {
                        if (currentHNRequests == 0) {
                            currentHNRequests = currentHNRequests + 5;
                        } else if (currentHNRequests > 99) {
                            jQuery("#hacker-news-loader-alert").show();
                            currentHNRequests = 5;
                        } else {
                            currentHNRequests = currentHNRequests + 5;
                        }
                        jQuery("#hacker-news-loader .progress .bar").attr("style", "width: " + currentHNRequests + "%");
                        viewModel.HackerNewsRequests(currentHNRequests);
                    }

                    var uriPost = "http://api.ihackernews.com/post/" + comment.postId + "?format=jsonp";
                    setTimeout(function () {
                        geektalk.loadJSONP(uriPost, function (jsonpData) {
                            viewModel.HackerNewsRequests(null);
                            jQuery("#hacker-news-loader").hide();
                            geektalk.resolveAndLoad(uriPost, jsonpData, function (success, jsonld) {
                                viewModel['open' + comment['id']] = ko.observable(false);
                                geektalk.resolveAndLoad(uri, comment, function (success, jsonld) {
                                    k(floop, env);
                                });
                            });
                        });
                    }, 2000);
                }, function () {
                    cb();
                });
            } else {
                cb();
            }
        });
    };

    geektalk.setupQuerySelectors = function () {
        var defaultQuery = "select ?subject { ?subject a so:Answer }";
        viewModel.currentStackOverflowSelectionQuery = defaultQuery;
        sko.store.startObservingQuery(defaultQuery, function (bindingsList) {
            var acum = [];
            for (var i = 0; i < bindingsList.length; i++) {
                acum.push("<" + bindingsList[i].subject.value + ">");
            }
            //if(viewModel.StackOverflowSelectionCriteria() === "all") {
            // 	viewModel.StackOverflowSelectedQuestions(acum);
            //}
            viewModel.StackOverflowAllQuestions(acum);

        });


        viewModel.currentStackOVerflowSelectionFn = function (bindingsList) {
            var acum = [];
            for (var i = 0; i < bindingsList.length; i++) {
                acum.push("<" + bindingsList[i].subject.value + ">");
            }
            viewModel.StackOverflowSelectedQuestions(acum);
        };
        viewModel.StackoverflowFunctionselector = ko.dependentObservable(function () {
            if (viewModel.currentStackOverflowSelectionQuery !== defaultQuery) {
                sko.store.stopObservingQuery(viewModel.currentStackOverflowSelectionQuery);
            }

            if (viewModel.StackOverflowSelectionCriteria() === "all") {
                viewModel.currentStackOverflowSelectionQuery = defaultQuery;
                viewModel.StackOverflowSelectedQuestions(viewModel.StackOverflowAllQuestions());
            } else {
                viewModel.currentStackOverflowSelectionQuery = "select distinct ?subject where { ?s so:tags \"" + viewModel.StackOverflowSelectionCriteria() + "\" . ?subject so:question ?s }";
                sko.store.startObservingQuery(viewModel.currentStackOverflowSelectionQuery,
                    viewModel.currentStackOVerflowSelectionFn);

            }
        });
    };

    geektalk.initializeMap = function () {
        geocoder = new google.maps.Geocoder();
        var latlng = new google.maps.LatLng(0, 0);
        var myOptions = {
            zoom: 2,
            center: latlng,
            zoomControl: true,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        }
        map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
        geektalk.mapLocations();
    };

    geektalk.mapLocations = function () {
        var codedLocations = {};
        var codedUsers = {};
        sko.store.startObservingQuery("SELECT * WHERE { ?s gh:location ?location; foaf:depiction ?depiction }", function (bindingsList) {
            var origSize = new google.maps.Size(80, 80);
            var scaledSize = new google.maps.Size(32, 32);
            var origin = new google.maps.Point(0, 0);
            var anchor = new google.maps.Point(16, 32);
            for (var i = 0; i < bindingsList.length; i++) {
                var user = bindingsList[i];
                if (codedUsers[user.s.value] == null) {
                    codedUsers[user.s.value] = true;
                    if (user.location && user.location.value != "" && codedLocations[user.location.value] == null) {
                        geocoder.geocode({'address': user.location.value}, function (results, status) {
                            if (status == google.maps.GeocoderStatus.OK) {
                                //map.setCenter(results[0].geometry.location);
                                var marker = new google.maps.Marker({
                                    map: map,
                                    position: results[0].geometry.location,
                                    icon: new google.maps.MarkerImage(user.depiction.value, origSize, origin, anchor, scaledSize)
                                });
                            }
                        });
                    }
                }
            }
        });
    };

    geektalk.updateVisualizations = function () {
        var nextStep = [10, 50, 200, 500];
        var stepCounter = 0;
        ko.dependentObservable(function () {
            var currentValue = viewModel.triplesCounter();
            if (currentValue > nextStep[stepCounter]) {
                viewModel.triplesInVisualization(nextStep[stepCounter]);
                stepCounter++;
                geektalk.buildVisualizations();
            }
        });
    };

    geektalk.viewModel.queryVisualization = function () {
        viewModel.triplesInVisualization(viewModel.triplesCounter());
        geektalk.buildVisualizations();
    };

    geektalk.buildVisualizations = function () {
        var nodesQuery = "SELECT distinct ?node WHERE { { ?node ?m ?n . FILTER(!ISBLANK(?node)) } UNION { ?o ?p ?node . FILTER(!ISBLANK(?node)) } }";
        var queryLinksQuery = "SELECT * WHERE { ?source ?value ?target . FILTER(!ISBLANK(?source ) && !ISBLANK(?target)) }";

        jQuery("#graph-chart").empty();
        sko.store.execute(nodesQuery, function (success, nodes) {
            var nodesMap = {};
            for (var i = 0; i < nodes.length; i++) {
                nodesMap[nodes[i]['node'].value] = i;
                if (nodes[i].node.token == 'uri') {
                    nodes[i].node.group = 1;
                } else {
                    nodes[i].node.group = 2;
                }
            }

            sko.store.execute(queryLinksQuery, function (success, links) {
                for (var i = 0; i < links.length; i++) {
                    links[i]['source'] = nodesMap[links[i]['source']['value']];
                    links[i]['target'] = nodesMap[links[i]['target']['value']];
                }
                var w = 940;
                var h = 500;
                var fill = d3.scale.category10();

                var vis = d3.select("#graph-chart").append("svg:svg").
                    attr("width", w).
                    attr("height", h);

                var force = d3.layout.force()
                    .charge(-120)
                    .linkDistance(30)
                    .nodes(nodes)
                    .links(links)
                    .size([w, h])
                    .start();

                var link = vis.selectAll("link.link")
                    .data(links)
                    .enter().append("svg:line")
                    .style("stroke-width", function (d) {
                        return 1;
                    })
                    .style("stroke", "#999999")
                    .style("stroke-opacity", 0.6)
                    .attr("x1", function (d) {
                        return d.source.x;
                    })
                    .attr("y1", function (d) {
                        return d.source.y;
                    })
                    .attr("x2", function (d) {
                        return d.target.x;
                    })
                    .attr("y2", function (d) {
                        return d.target.y;
                    });

                var node = vis.selectAll("circle.node")
                    .data(nodes)
                    .enter().append("svg:circle")
                    .attr("class", "node")
                    .attr("cx", function (d) {
                        return d.x;
                    })
                    .attr("cy", function (d) {
                        return d.y;
                    })
                    .attr("r", 5)
                    .style("fill", function (d) {
                        return fill(d.node.group);
                    })
                    .call(force.drag);

                node.append("svg:title")
                    .text(function (d) {
                        return d.node.value;
                    });

                force.on("tick", function () {
                    link.attr("x1", function (d) {
                        return d.source.x;
                    })
                        .attr("y1", function (d) {
                            return d.source.y;
                        })
                        .attr("x2", function (d) {
                            return d.target.x;
                        })
                        .attr("y2", function (d) {
                            return d.target.y;
                        });

                    node.attr("cx", function (d) {
                        return d.x;
                    })
                        .attr("cy", function (d) {
                            return d.y;
                        });
                });
            });

        });

        jQuery("#tags-chart").empty();
        jQuery("#tags-tree-map").empty();
        sko.store.execute("SELECT ?tag WHERE { ?s so:tags ?tag }", function (success, bindings) {
            var tags = {};
            var tag, max;
            var data = [];
            var tagsData = [];

            for (var i = 0; i < bindings.length; i++) {
                tag = bindings[i].tag.value;
                if (tag && tag != "") {
                    if (tags[tag] == null) {
                        tags[tag] = 1;
                        length++;
                    } else {
                        tags[tag]++;
                    }
                    if (max == null || tags[tag] > max)
                        max = tags[tag];
                }
            }

            // tags bar char
            for (var tag  in tags) {
                if (tags[tag] > 1)
                    tagsData.push({name: tag, size: tags[tag]})
                data.push({name: tag, size: tags[tag]});
            }
            var chart = d3.select("#tags-chart").append("svg")
                .attr("class", "chart")
                .attr("width", 940)
                .attr("height", 20 * tagsData.length);

            var x = d3.scale.linear()
                .domain([0, max])
                .range([0, 800]);

            chart.selectAll("rect")
                .data(tagsData)
                .enter().append("rect")
                .attr("x", 140)
                .attr("y", function (d, i) {
                    return i * 20;
                })
                .attr("width", function (d) {
                    return x(d.size);
                })
                .attr("height", 20)
                .style("stroke", "white")
                .style("fill", function (d) {
                    return geektalk.viewModel.colorForTag(d.name);
                })

            chart.selectAll("text.end_label")
                .data(tagsData)
                .enter()
                .append("text")
                .attr("class", "end_label")
                .attr("x", function (d) {
                    return 140 + x(d.size)
                })
                .attr("y", function (d, i) {
                    return i * 20;
                })
                .attr("dx", -3) // padding-right
                .attr("dy", "1.05em") // vertical-align: middle
                .attr("text-anchor", "end") // text-align: right
                .style("fill", "white")
                .text(function (d) {
                    return d.name;
                });


            chart.selectAll("text.start_label")
                .data(tagsData)
                .enter()
                .append("text")
                .attr("class", "start_label")
                .attr("x", 0)
                .attr("y", function (d, i) {
                    return i * 20;
                })
                .attr("dy", "1.05em") // vertical-align: middle
                .attr("text-anchor", "start")
                .style("fill", "black")
                .text(function (d) {
                    return d.name;
                });

            // tags tree map
            var w = 940,
                h = 500;

            var cell = function () {
                this
                    .style("left", function (d) {
                        return d.x + "px";
                    })
                    .style("top", function (d) {
                        return d.y + "px";
                    })
                    .style("width", function (d) {
                        return d.dx - 1 + "px";
                    })
                    .style("height", function (d) {
                        return d.dy - 1 + "px";
                    })
                    .style("position", "absolute")
                    .style("color", "white");

            };

            var treemap = d3.layout.treemap()
                .size([w, h])
                .sticky(true)
                .value(function (d) {
                    return d.size;
                });

            var div = d3.select("#tags-tree-map").append("div")
                .style("position", "relative")
                .style("width", w + "px")
                .style("height", h + "px");

            div.data([{name: 'tags', children: data}]).selectAll("div")
                .data(treemap.nodes)
                .enter().append("div")
                .attr("class", "cell")
                .style("background", function (d) {
                    return d.children ? null : geektalk.viewModel.colorForTag(d.name)
                })
                .call(cell)
                .text(function (d) {
                    return d.children ? null : d.name;
                });
        });


        jQuery("#reputation-chart").empty();
        var query = "SELECT * WHERE { ?s gh:followers ?followers; gh:login ?login; foaf:depiction ?picture }";
        sko.store.execute(query, function (success, results) {

            var acum = [];
            for (var i = 0; i < results.length; i++) {
                var followers = parseInt(results[i].followers.value);
                var elem = {
                    className: results[i].login.value,
                    packageName: results[i].login.value,
                    picture: results[i].picture.value,
                    value: followers
                };
                acum.push(elem);
            }

            if (acum.length > 0) {
                var r = 940,
                    format = d3.format(",d"),
                    fill = d3.scale.category20c();

                var bubble = d3.layout.pack()
                    .sort(null)
                    .size([r, r]);

                var vis = d3.select("#reputation-chart").append("svg")
                    .style("background-color", "whiteSmoke")
                    .attr("width", r)
                    .attr("height",800)
                    .attr("class", "bubble");

                var bubbles = bubble.nodes({children: acum}).filter(function (d) {
                    return !d.children;
                });
                var node = vis.selectAll("g.node")
                    .data(bubbles)
                    .enter()
                    .append("g")
                    .attr("class", "node")
                    .attr("transform", function (d) {
                        return "translate(" + d.x + "," + d.y + ")";
                    });

                node.append("title")
                    .text(function (d) {
                        return d.className + ": " + format(d.value);
                    });

                node.append("circle")
                    .attr("r", function (d) {
                        return d.r;
                    })
                    .style("fill", function (d) {
                        return fill(d.className);
                    });

                node.append("text")
                    .attr("text-anchor", "middle")
                    .attr("dy", function (d) {
                        return (d.r > 40) ? "1.5em" : ".3em";
                    })
                    .style("fill", "white")
                    .text(function (d) {
                        return d.className.substring(0, d.r / 3);
                    });

                node.append("image")
                    .attr("width", function (d) {
                        return (d.r > 40) ? 32 : 0;
                    })
                    .attr("height", function (d) {
                        return (d.r > 40) ? 32 : 0;
                    })
                    .attr("x", "-16")
                    .attr("y", "-32")
                    .attr("xlink:href", function (d) {
                        return d.picture;
                    });
            }
        });
    };

    /*
     * Page goes live here
     */
    jQuery(document).ready(function () {

        rdfstore.create(function (store) {
            sko.ready(store, function () {

                // Batch loading data fires events
                sko.store.setBatchLoadEvents(true);

                // Registering remote APIs
                jsonld_macros.registerAPI(apis.github);
                jsonld_macros.registerAPI(apis.stackOverflow);
                jsonld_macros.registerAPI(apis.hackerNews);
                jsonld_macros.registerAPI(apis.twitter);

                // Registering prefixes
                store.registerDefaultProfileNamespaces();
                store.registerDefaultNamespace("gt", "http://geektalk.com/vocabulary/");
                store.registerDefaultNamespace("gh", "https://api.github.com/vocabulary#");
                store.registerDefaultNamespace("hn", "http://api.ihackernews.com/vocabulary#");
                store.registerDefaultNamespace("tw", "http://api.twitter.com/1/vocabulary#");
                store.registerDefaultNamespace("so", "http://api.stackoverflow.com/1.1/vocabulary#");

                // Queries that select which resources will be displayed
                geektalk.setupQuerySelectors();

                // Google maps
                geektalk.initializeMap();

                // update visualizations
                geektalk.updateVisualizations();

                // RDF classes
                sko.Class.define("[tw:MicroblogPost]", {
                    displayDate: function () {
                        var date = new Date(this.getProp("[tw:created_at]"));
                        var timeStr = (date.getHours() + 1) + ":" + date.getSeconds();
                        var dateStr = (date.getMonth() + 1) + "-" + date.getDate() + "-" + date.getFullYear();

                        return dateStr + " " + timeStr;
                    }
                });

                // apply bindings
                sko.applyBindings("body", viewModel, function () {
                    if (window.location.href.indexOf("#!") != -1) {
                        var projectName = window.location.href.split("#!")[1];
                        jQuery("#stack-overflow-loader").show();
                        viewModel.projectName(projectName);
                        viewModel.loadProjectName();
                    } else {
                        jQuery("#project-selection").show();
                    }
                });
            });
        });
    });


    /*
     * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
     * Digest Algorithm, as defined in RFC 1321.
     * Version 2.2 Copyright (C) Paul Johnston 1999 - 2009
     * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
     * Distributed under the BSD License
     * See http://pajhome.org.uk/crypt/md5 for more info.
     */

    /*
     * Configurable variables. You may need to tweak these to be compatible with
     * the server-side, but the defaults work in most cases.
     */
    var hexcase = 0;
    /* hex output format. 0 - lowercase; 1 - uppercase        */
    var b64pad = "";
    /* base-64 pad character. "=" for strict RFC compliance   */

    /*
     * These are the functions you'll usually want to call
     * They take string arguments and return either hex or base-64 encoded strings
     */
    function hex_md5(s) {
        return rstr2hex(rstr_md5(str2rstr_utf8(s)));
    }

    /*
     * Calculate the MD5 of a raw string
     */
    function rstr_md5(s) {
        return binl2rstr(binl_md5(rstr2binl(s), s.length * 8));
    }


    /*
     * Convert a raw string to a hex string
     */
    function rstr2hex(input) {
        try {
            hexcase
        } catch (e) {
            hexcase = 0;
        }
        var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
        var output = "";
        var x;
        for (var i = 0; i < input.length; i++) {
            x = input.charCodeAt(i);
            output += hex_tab.charAt((x >>> 4) & 0x0F)
                + hex_tab.charAt(x & 0x0F);
        }
        return output;
    }


    /*
     * Encode a string as utf-8.
     * For efficiency, this assumes the input is valid utf-16.
     */
    function str2rstr_utf8(input) {
        var output = "";
        var i = -1;
        var x, y;

        while (++i < input.length) {
            /* Decode utf-16 surrogate pairs */
            x = input.charCodeAt(i);
            y = i + 1 < input.length ? input.charCodeAt(i + 1) : 0;
            if (0xD800 <= x && x <= 0xDBFF && 0xDC00 <= y && y <= 0xDFFF) {
                x = 0x10000 + ((x & 0x03FF) << 10) + (y & 0x03FF);
                i++;
            }

            /* Encode output as utf-8 */
            if (x <= 0x7F)
                output += String.fromCharCode(x);
            else if (x <= 0x7FF)
                output += String.fromCharCode(0xC0 | ((x >>> 6 ) & 0x1F),
                    0x80 | ( x & 0x3F));
            else if (x <= 0xFFFF)
                output += String.fromCharCode(0xE0 | ((x >>> 12) & 0x0F),
                    0x80 | ((x >>> 6 ) & 0x3F),
                    0x80 | ( x & 0x3F));
            else if (x <= 0x1FFFFF)
                output += String.fromCharCode(0xF0 | ((x >>> 18) & 0x07),
                    0x80 | ((x >>> 12) & 0x3F),
                    0x80 | ((x >>> 6 ) & 0x3F),
                    0x80 | ( x & 0x3F));
        }
        return output;
    }


    /*
     * Convert a raw string to an array of little-endian words
     * Characters >255 have their high-byte silently ignored.
     */
    function rstr2binl(input) {
        var output = Array(input.length >> 2);
        var i;
        for (i = 0; i < output.length; i++)
            output[i] = 0;
        for (i = 0; i < input.length * 8; i += 8)
            output[i >> 5] |= (input.charCodeAt(i / 8) & 0xFF) << (i % 32);
        return output;
    }

    /*
     * Convert an array of little-endian words to a string
     */
    function binl2rstr(input) {
        var output = "";
        for (var i = 0; i < input.length * 32; i += 8)
            output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xFF);
        return output;
    }

    /*
     * Calculate the MD5 of an array of little-endian words, and a bit length.
     */
    function binl_md5(x, len) {
        /* append padding */
        x[len >> 5] |= 0x80 << ((len) % 32);
        x[(((len + 64) >>> 9) << 4) + 14] = len;

        var a = 1732584193;
        var b = -271733879;
        var c = -1732584194;
        var d = 271733878;

        for (var i = 0; i < x.length; i += 16) {
            var olda = a;
            var oldb = b;
            var oldc = c;
            var oldd = d;

            a = md5_ff(a, b, c, d, x[i + 0], 7, -680876936);
            d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
            c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
            b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
            a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
            d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
            c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
            b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
            a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
            d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
            c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
            b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
            a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
            d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
            c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
            b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);

            a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
            d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
            c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
            b = md5_gg(b, c, d, a, x[i + 0], 20, -373897302);
            a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
            d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
            c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
            b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
            a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
            d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
            c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
            b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
            a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
            d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
            c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
            b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);

            a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
            d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
            c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
            b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
            a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
            d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
            c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
            b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
            a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
            d = md5_hh(d, a, b, c, x[i + 0], 11, -358537222);
            c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
            b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
            a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
            d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
            c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
            b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);

            a = md5_ii(a, b, c, d, x[i + 0], 6, -198630844);
            d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
            c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
            b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
            a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
            d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
            c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
            b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
            a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
            d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
            c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
            b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
            a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
            d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
            c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
            b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);

            a = safe_add(a, olda);
            b = safe_add(b, oldb);
            c = safe_add(c, oldc);
            d = safe_add(d, oldd);
        }
        return Array(a, b, c, d);
    }

    /*
     * These functions implement the four basic operations the algorithm uses.
     */
    function md5_cmn(q, a, b, x, s, t) {
        return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
    }

    function md5_ff(a, b, c, d, x, s, t) {
        return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
    }

    function md5_gg(a, b, c, d, x, s, t) {
        return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
    }

    function md5_hh(a, b, c, d, x, s, t) {
        return md5_cmn(b ^ c ^ d, a, b, x, s, t);
    }

    function md5_ii(a, b, c, d, x, s, t) {
        return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
    }

    /*
     * Add integers, wrapping at 2^32. This uses 16-bit operations internally
     * to work around bugs in some JS interpreters.
     */
    function safe_add(x, y) {
        var lsw = (x & 0xFFFF) + (y & 0xFFFF);
        var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    }

    /*
     * Bitwise rotate a 32-bit number to the left.
     */
    function bit_rol(num, cnt) {
        return (num << cnt) | (num >>> (32 - cnt));
    }


})();