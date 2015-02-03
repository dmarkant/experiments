// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

var TESTING = mode == "debug";
var LOGGING = mode != "debug";

var IMAGES = [
'static/images/new_breakdown.png',
'static/images/instructions-0.png',
'static/images/instructions-1.png',
'static/images/instructions-2.png',
'static/images/instructions-3.png',
'static/images/instructions-4.png',
'static/images/instructions-interference-2.png',
'static/images/instructions-interference.png',
'static/images/nyu-logo.png',
'static/images/tips_painting.png',
'static/images/tips_painting_2.png',
'static/images/tips_sampling_1.png',
'static/images/tips_sampling_2.png',
'static/images/tips_score.png'
];
psiTurk.preloadImages(IMAGES);


var SCREENS = [
    "game.html",
    "predictiontest.html",
    "instruct.html",
    "instructions-preq.html",
    "postquestionnaire.html"
];
psiTurk.preloadPages(SCREENS);


function output(arr) {
    psiTurk.recordTrialData(arr);
    if (LOGGING) console.log(arr.join(" "));
};


/*
 *
 * Battleship specific code
 *
 */
var HSPACE_SHAPES = [ [[2,4],[4,2],[3,4],[4,3]] ];

var HSPACE_FILES = [ "10x10_fixedset_nonadj.txt",
                     "10x10_fixedset_adj.txt" ];

var HSPACE_ALL = [[],[]]; // this will be populated from HSPACE_FILE when exp.html is loaded
var HSPACE;

// Load hypotheses
(function () {
    log("loading hypotheses");
    // Load hypothesis space(s)
    for (var hi=0; hi<HSPACE_FILES.length; hi++) {
        $.ajax( {
                url:HSPACE_FILES[hi],    
                success: function(data) {
                    $.each(data.split('\n'), function() {
                        var bstr = this.split(' ').slice(0,100);
                        HSPACE_ALL[hi].push($.map(bstr, Number));
                        HSPACE_ALL[hi] = shuffle(HSPACE_ALL[hi]); // randomize the sequence
                    });
                },
                async: false });
        };
}());

// Load test items
var TEST_ITEMS_PRE, TEST_ITEMS_POST;
(function() {
    log('loading pre-test items');
    $.getJSON('testitems_pre.json', function(data) {
        TEST_ITEMS_PRE = shuffle(data);
    });
}());
(function() {
    log('loading post-test items');
    $.getJSON('testitems_post.json', function(data) {
        TEST_ITEMS_POST = shuffle(data);
    });
}());



var GB_ORDER;
var gb_index = 0; // this holds the current index within GB_ORDER

// game settings
var GAMES_PER_BLOCK = 30,
    N_BLOCKS = 1,
    BASE_PAYMENT = 1,
    INIT_BONUS = 5;
var COMPLETION_BONUS = .5;
var COMPLETION_BONUS_STR = String(COMPLETION_BONUS.toFixed(2));
var LOSS_PER_SAMPLE = .20;
var LOSS_PER_SAMPLE_STR = String(LOSS_PER_SAMPLE.toFixed(2));
var LOSS_PER_ERROR = 2
var LOSS_PER_ERROR_STR = String(LOSS_PER_ERROR.toFixed(2));
var N_OBJECTS = 3;
var SAMPLE_DELAY = 0;
var GAME_DELAY = 2000;

if (TESTING) { GAMES_PER_BLOCK = 2; };

// conditions
var INTERFERENCE = true;

// player vars
var gameindex,
    gamesplayed = 0,
    minsamples = [],
    highscore = 0,
    scores = [],
    nsamples,
    bonusgame,
    ncorrect_pretest,
    ncorrect_posttest,
    pre_post = 'pre';

// setting the stage, confirming compatibility
var stage, board, grid, scorebox, scorediv;

// Create two sequences of gameboards (one for examples, one for games) by sampling from each
// hypothesis space
var EXAMPLES,
    GAMEBOARDS;

function sampleBoards() {
    
    EXAMPLES = []; 
    GAMEBOARDS = [];

    // make the first board an interference board
    GAMEBOARDS.push(HSPACE_ALL[1].shift());

    for (var i=0; i<HSPACE_ALL.length; i++) {
        hset = HSPACE_ALL[i].sample(15);
        EXAMPLES = EXAMPLES.concat(hset);
    };
    EXAMPLES = shuffle(EXAMPLES);

    // sample indices from each hypothesis space
    hind = [];

    // non-adjacent
    hind[0] = sample_range(HSPACE_ALL[0].length, 10); 

    // adjacent
    hind[1] = sample_range(HSPACE_ALL[1].length, 20);

    // in actual gameboards, enforce mini-blocks of 3 (1 non-adjacent, 2 adjacent)
    for (var b=0; b<10; b++) {
        mb = [];
        
        // one non-adjacent
        mb.push(HSPACE_ALL[0][hind[0][b]]);

        // two adjacent
        mb.push(HSPACE_ALL[1][hind[1][b*2]]);
        mb.push(HSPACE_ALL[1][hind[1][b*2+1]]);

        mb = shuffle(mb);

        // add mini-block to full sequence
        GAMEBOARDS = GAMEBOARDS.concat(mb);
    };
};


function getBonus( samples, errors ) {
    var bonus = INIT_BONUS - (samples*LOSS_PER_SAMPLE + errors*LOSS_PER_ERROR);
    return Math.max(bonus,0.);
};


function getBonusString( samples, errors ) {
    return '$'+String(getBonus(samples, errors).toFixed(2));
};


function Gameboard() {
    /* 
     * Create an empty, non-overlapping gameboard by randomly
     * sampling from set of shapes in OBJECTS
     */
    var gb = ConstantArray2d(NCELLW, NCELLH, 0);

    // populate with random draws from set of primitives
    for (var i=0; i<N_OBJECTS; i++) {

        var obj = Math.floor(Math.random()*(OBJECTS.length));
        var w = OBJECTS[obj].length;
        var h = OBJECTS[obj][0].length;
        var x = Math.floor(Math.random()*(NCELLW-w));
        var y = Math.floor(Math.random()*(NCELLH-h));

        // first check for collision
        var legal = false;
        while (!legal) {
            var obj = Math.floor(Math.random()*(OBJECTS.length));
            var w = OBJECTS[obj].length;
            var h = OBJECTS[obj][0].length;
            var x = Math.floor(Math.random()*(NCELLW-w));
            var y = Math.floor(Math.random()*(NCELLH-h));
            
            var overlap = false;
            for (var xi=x; xi<(x+w); xi++) {
                for (var yi=y; yi<(y+h); yi++) {
                    prev = gb[xi][yi];
                    if (prev!=0) overlap = true;
                }
            }

            if (!overlap) {
                legal = true;
                
                for (var xi=x; xi<(x+w); xi++) {
                    for (var yi=y; yi<(y+h); yi++) {
                        gb[xi][yi] = i+1;
                    }
                }
            }
        }

    }
    return gb
}

function GameboardFromArray(arr) {
    /*
     * Take a 1-d list and return NCELLWxNCELLH 2d array
     */
    var gb = ConstantArray2d(NCELLW, NCELLH, 0);
    for (var i=0; i<NCELLW; i++) {
        for (var j=0; j<NCELLH; j++) {
            gb[i][j] = arr[i*NCELLW+j]
        };
    };
    return gb;
}

function GameboardFromFile() {
    /* 
     * Take a gameboard from the hypothesis space file and increment gb_index
     */
    var h = HSPACE.shift();
    //var h = HSPACE[GB_ORDER[gb_index]];
    var gb = GameboardFromArray( h );
    //gb_index += 1;
    return gb;
};


function GameboardExample() {
    var h = EXAMPLES.shift();
    var gb = GameboardFromArray( h );
    return gb;
};


function GameboardFromHSpace() {
    var h = GAMEBOARDS.shift();
    var gb = GameboardFromArray(h);
    return gb;
};


function drawTip(side, url, callback) {
    var im = new Image();
    im.onload = function() {
        c = stage.getContext("2d");    
        c.save();
        if (side=="left") {
            c.drawImage(this, 0, 30);
        } else {
            c.drawImage(this, 760, 30);
        };
        c.restore();
        if (callback != undefined) {
            callback();
        };
    };
    im.src = url;
};


function clearTips() {
    c = stage.getContext("2d");  
    c.fillStyle = BACKGROUND_COLOR; 
    c.fillRect(0,0,MARGINW-40,stage.height);
    c.fillRect(760,0,MARGINW+100,stage.height+100);    
};


function drawShapeset(loc, squaresize, margin, flip, header) {

    //var shapes = HSPACE_SHAPES[exp.hspaceind];
    var shapes = HSPACE_SHAPES[0];
    var size = squaresize;
    var marg = margin;

    if (shapes.length < 12) {
        rowsize = 2;
        marg = 15;
        if (shapes.length < 5) {
            marg0 = 50
        } else {
            marg0 = 20
        };
    } else {
        rowsize = 4; 
        marg = 10;
        marg0 = marg;
    };

    // draw the shape set
    for (var i=0; i<shapes.length; i++) {
        sh = shapes[i];
        x = (i%rowsize) * (size * 4 + marg) + marg + loc[0];
        y = (Math.floor(i/rowsize))*(size * 4 + marg) + marg0 + loc[1];

        if (flip) {
            tmp = x;
            x = y;
            y = tmp;
        };

        shapegrid = new ShapeGrid([x,y], sh[0], sh[1], size);
        shapegrid.draw();
    };

    if (header!=undefined) {
        c = stage.getContext("2d");
        c.fillStyle = 'gray';
        c.font = '20px Verdana';
        c.fillText("POSSIBLE SHAPES:", 70, 80);
    };
};


function getStage() {
    stage = document.getElementById("thestage");
    if (!stage || !stage.getContext) {
        console.log('can\'t find stage');
    } 
    stage.style.display = "block";
    stage.style.cursor = "auto";
}


function Game(index) {
    gameindex = index;
    output(["GAME", gameindex, "initializing_game"]);

    // vars to hold results of games
    var nsamples = 0;
    var score = 0;

    getStage();

    CELLW = 40;   // pixels   
    CELLH = 40;   // pixels
    STAGEWIDTH = stage.width;
    STAGEHEIGHT = stage.height;
    MARGINW = MIN_MARGIN + (STAGEWIDTH-2*MIN_MARGIN-WIDTH)/2;   // distance from edge of stage to board
    MARGINH = MIN_MARGIN + (STAGEHEIGHT-2*MIN_MARGIN-HEIGHT)/2;

    board = new GameboardFromHSpace();
    grid = new Grid(NCELLW,NCELLH);
    main = document.getElementById("main");
    donebtn = document.getElementById("btn-continue");

    // SCORE
    scorebox = document.getElementById("score");
    scorediv = document.getElementById("scorenum");
    scorediv.innerHTML = '$'+String(getBonus(0,0).toFixed(2));

    stage.clear = function() {
        c = this.getContext("2d");
        c.fillStyle = BACKGROUND_COLOR;
        c.fillRect(0,0,this.width,this.height);
    };

    stage.startSamplingPhase = function() {
        this.onclick = function(event) {
            repeat = grid.clickevent(event);
            if (!repeat) {
                nsamples += 1;
                scorediv.innerHTML = getBonusString(nsamples,0);
            }
        };
        c = stage.getContext("2d");
       
        if (gameindex==-1) {
            drawTip("left", "static/images/tips_sampling_1.png");
            drawTip("right", "static/images/tips_sampling_2.png");
        } else {
            drawShapeset([100,20], 18, 10, true, true);
        };
        scorebox.style.visibility = "visible";

        c.save();
        c.fillStyle = GRID_COLOR;
        c.shadowOffsetX=0;
        c.shadowOffsetY=0;
        c.shadowBlur = 30;
        c.shadowColor = "#000000";    
        c.fillRect(MARGINW,MARGINH,WIDTH,HEIGHT);
        c.restore();

        //draw the lines
        if (GRIDLINES) { drawGridLines(); };
        
        // DONE BUTTON
        donebtn.innerHTML = "Done searching";
        donebtn.style.visibility = "visible";
        donebtn.onclick = function(event) {
            grid.locked = true;
            return stage.startPaintingPhase();
        };

        output(["GAME", gameindex, "gameboard",board].flatten());
        output(["GAME", gameindex, "start_sampling"]);
    };

    stage.startPaintingPhase = function() {
        /*
         * Draw paint wells and change click handler
         */
        stage.onclick = function(event) {
            // if click occurs within a paintwell, toggle it
            var pos = mousePos(stage, event);
            var xoff = pos[0];
            var yoff = pos[1];
                
            for (var i=0; i<N_OBJECTS; i++) {
                if (xoff>(paintwells[i][0]) && yoff>(paintwells[i][1]) && xoff<(paintwells[i][0]+PAINTWELLSIZE) && yoff<(paintwells[i][1]+PAINTWELLSIZE)) {
                    pwtoggle = [false, false, false];
                    pwtoggle[i] = true;
                };
            };
            stage.drawpaintwells();

            // otherwise, pass the click event and the current color to the grid
            repeat = grid.paintevent(event, pwtoggle.indexOf(true)); 
        }
        grid.lock();

        // define paint well regions on the canvas
        var PAINTWELLSIZE = 50;
        var paintwells = new Array(N_OBJECTS);
        for (var i=0; i<N_OBJECTS; i++) { paintwells[i] = [MARGINW+WIDTH+40, MARGINH+i*70]; }
        var pwtoggle = new Array(true,false,false);
        var that = this;
        var right_tip_img = new Image();

        this.drawpaintwells = function() {
            c = stage.getContext("2d");
            c.save();

            if (gameindex==-1) {
                c.drawImage(right_tip_img, 760, 30);
            } else {
                
                // draw the paintwells
                c.fillStyle = BACKGROUND_COLOR;
                c.fillRect(MARGINW+WIDTH+35,MARGINH-20,MARGINW+WIDTH+70,MARGINH+65+200);
            };
            
            for (var i=0; i<N_OBJECTS; i++) {
                c.fillStyle = OBJECT_COLORS[i+1];
                c.roundRect(paintwells[i][0],paintwells[i][1],PAINTWELLSIZE,PAINTWELLSIZE,12).fill();
                c.fill();

                if (pwtoggle[i]==true) {
                    c.roundRect(paintwells[i][0],paintwells[i][1],PAINTWELLSIZE,PAINTWELLSIZE,12).fill();                
                    c.lineWidth = 5;
                    c.strokeStyle = "white";
                    c.stroke();
                }; 
            };
            c.restore();
        };

        if (gameindex==-1) {
            var pwtoggle = new Array(false,false,false);
            
            drawTip('left','static/images/tips_painting.png');
            right_tip_img.onload = function() {
                stage.drawpaintwells();
            };
            right_tip_img.src = 'static/images/tips_painting_2.png';

        } else {
            stage.drawpaintwells();   
        };

        // DONE BUTTON
        donebtn.innerHTML = "Done painting";
        donebtn.style.marginTop = "30px";
        donebtn.onclick = function(event) {

            // output the state of the painted gameboard
            output(["GAME", gameindex, "paintboard", grid.state()].flatten());
            clearTips();
            return stage.showScore();
        };

        output(["GAME", gameindex, "start_painting"]);
    };

    stage.showScore = function() {
        // disregard clicks on the gameboard
        this.onclick = function(event) { }
        
        if (gameindex==-1) {
            drawTip('left','static/images/tips_score.png');
        } else {
            minsamples.push( nsamples );
            drawShapeset([100,20], 18, 10, true, true);
        };
        
        // evalute errors 
        painterrors = grid.score();
        var bonusamount = getBonus(nsamples, painterrors);
        if (bonusamount > highscore && gameindex!=-1) { highscore = bonusamount; };
        scorediv.innerHTML = getBonusString(nsamples, painterrors);

        // show score breakdown
        drawTip('right', 'static/images/new_breakdown.png', function() {
            c = stage.getContext("2d");
            //c.fillStyle = BACKGROUND_COLOR; 
            //c.fillRect(760,0,MARGINW+100,stage.height+100);    
            //c.lineWidth = "0";
            c.font      = '30px Myriad Pro';
            xoff = 795;
            yoff = 120;
            c.fillStyle = 'gray';
            c.font = '20px Verdana';
            c.fillText('SCORE BREAKDOWN:', 780, 80);
            c.fillStyle = 'white';
            c.font = '24px Verdana';
            c.fillText(String(nsamples), xoff, yoff-3);
            c.fillText(String(LOSS_PER_SAMPLE), xoff+80, yoff-3);
            c.fillText(String((LOSS_PER_SAMPLE*nsamples).toFixed(2)), xoff+170, yoff-3);
            c.fillText(String(painterrors), xoff, yoff+65);
            c.fillText(String(LOSS_PER_ERROR.toFixed(2)), xoff+80, yoff+65);
            c.fillText(String((painterrors*LOSS_PER_ERROR).toFixed(2)), xoff+170, yoff+65);

            c.font = '24px sans-serif';
            c.fillText("$"+String(Number(INIT_BONUS).toFixed(2))+" - "+String((LOSS_PER_SAMPLE*nsamples).toFixed(2))+" - "+String((painterrors*LOSS_PER_ERROR).toFixed(2))+" = ",xoff, yoff+200);
            c.fillStyle = 'red';
            c.font = 'bold 40px sans-serif';
            c.fillText("$"+String(bonusamount.toFixed(2)), xoff+55, yoff+250); 
        });

        // DONE BUTTON
        donebtn.innerHTML = "Next game!";
        donebtn.style.marginTop = "0px";
        donebtn.onclick = function(event) {
            return exit();
        };
        
        if (gameindex!=-1) {
            scores.push(bonusamount);
        };
        output(["GAME", gameindex, "score", nsamples, painterrors, bonusamount]);
    };

    exit = function() {
        exp.proceed();
    }

    // START THINGS OFF
    stage.clear();  
    main.style.display = "None";
    
    splash = document.getElementById("splash");
    sofar = document.getElementById("sofar");

    if (gameindex!=-1) {
        var str = String(GAMES_PER_BLOCK-gameindex) + " games remaining<br />"
        if (gameindex>0) {
            str += "highest possible bonus so far: $"+String(highscore.toFixed(2));
        };
        sofar.innerHTML = str;
    };
    splash.style.display = "block";

    // START BUTTON
    donebtn.innerHTML = "Begin";
    donebtn.style.visibility = "visible";
    donebtn.onclick = function(event) {
        splash.style.display = "None";
        main.style.display = "block";        
        stage.startSamplingPhase();
    };

};


/*
 *
 * Main experiment object
 *
 */
var Experiment = function() {
    this.gamesplayed = 0;
    this.state = 0;
    this.counter = 0;
    this.block = -1;

    this.begin = function() {
        sampleBoards();
        exp.state = 0;
        exp.counter = 0;
        fcn = exp.agenda[exp.state][0];
        fcn();
    };

    this.proceed = function(state) {
        psiTurk.saveData();
        exp.counter += 1;
        
        console.log(state);

        if (state!=undefined) {
            exp.state = state;
            exp.counter = 0;
        };

        if (exp.counter == exp.agenda[exp.state][1]) {
            exp.state += 1;
            exp.counter = 0;
        }
        fcn = exp.agenda[exp.state][0];
        fcn();
    };

    this.practice = function() {
        HSPACE = HSPACE_ALL[0];
        GB_ORDER = [0];
        gb_index = 0;
        
        exp.gamesplayed += 1;

        psiTurk.showPage('game.html');
        output(["GAME", -1, "start_practice_game"]);
        g = new Game(-1);
    }

    this.predictiontest = function() {
        g = new PredictionTest();
    };

    this.startblock = function() {
        exp.block += 1;
        exp.proceed();
    };

    this.startgames = function() {
        psiTurk.finishInstructions();
        exp.proceed();
    };

    this.newgame = function() {
        exp.gamesplayed += 1;
        output([exp.block, exp.counter]);
        psiTurk.showPage('game.html');
        g = new Game(exp.counter);
    };

    this.questionnaire = function() {
        Questionnaire();
    };

    this.agenda = [[instructions1, 1], 
                   [this.predictiontest, 1],
                   [instructions4, 1], 
                   [this.practice, 1],
                   [instructionsPreQ, 1],
                   [this.startgames, 1]
                   ];

    for (var i=0; i<N_BLOCKS; i++) {
        this.agenda = this.agenda.concat( [[this.startblock, 1],
                                           [this.newgame, GAMES_PER_BLOCK]
                                           ])
    };

    this.agenda = this.agenda.concat( [[instructionsPosttest, 1],
                                       [this.predictiontest, 1],
                                       [this.questionnaire, 1]] );

};
var exp = new Experiment();


var PredictionTest = function() {
    psiTurk.showPage('predictiontest.html');
    output(["PRED_TEST", pre_post, "initializing"]);
    getStage();

    var total_correct = 0;
    var trial = 0;
    
    TEST_ITEMS = (pre_post == 'pre') ? TEST_ITEMS_PRE : TEST_ITEMS_POST;

    // select (and randomize) test items
    HSPACE = HSPACE_ALL[0];

    CELLW = 40;   // pixels   
    CELLH = 40;   // pixels
    STAGEWIDTH = stage.width;
    STAGEHEIGHT = stage.height;
    MARGINW = MIN_MARGIN + (STAGEWIDTH-2*MIN_MARGIN-WIDTH)/2;   // distance from edge of stage to board
    MARGINH = MIN_MARGIN + (STAGEHEIGHT-2*MIN_MARGIN-HEIGHT)/2;
    
    stage.clear = function() {
        c = this.getContext("2d");
        c.fillStyle = BACKGROUND_COLOR;
        c.fillRect(0,0,this.width,this.height);
    };

    var next = function() {
        stage.clear();
        stage.width = stage.width;

        drawShapeset([100,20], 18, 10, true, true);
        
        // show a game state
        testitem = TEST_ITEMS[trial];
        //board = new GameboardFromArray(testitem['board']);
        board = new GameboardFromArray(testitem['feedback']);
        grid = new Grid(NCELLW,NCELLH);

        for (var i=0; i<grid.boxes.length; i++) {
            // if want to show interference that already occurred
            grid.boxes[i].state = testitem['feedback'][i];
            
            // hide unobserved locations
            /*if (testitem['unobserved'][i]==1) {
                grid.boxes[i].state = -1;
            } else {
                grid.boxes[i].state = testitem['board'][i];
            };*/
        };
        grid.draw();
        drawGridLines();

        // highlight any desired locations
        queries = testitem['choiceset'];
        $.each(queries, function(i, q) { grid.boxes[q['loc']].highlight(q['label']);});

        switch (testitem['questiontype']) {

            case 'interference':
                var t = 'In which location do you think ' +
                        '<strong class=q1>interference is more likely</strong> to occur?<br />' +
                        '(Click on A or B to respond)';
                break;

            case 'hit':
                var t = 'Which location do you think ' +
                        'is <strong class=q2>more likely to be part of a ship</strong>?<br />' +
                        '(Click on A or B to respond)';
                break;
        };
        $('#instruction').html((trial+1)+' / '+TEST_ITEMS.length+'<br />'+t);

        output(['PRED_TEST', pre_post, trial, 'board', testitem['board']]);
        output(['PRED_TEST', pre_post, trial, 'unobserved', testitem['unobserved']]);
        output(['PRED_TEST', pre_post, trial, 'questiontype', testitem['questiontype']]);
        output(['PRED_TEST', pre_post, trial, 'option', testitem['choiceset'][0]['label'], testitem['choiceset'][0]['loc']]);
        output(['PRED_TEST', pre_post, trial, 'option', testitem['choiceset'][1]['label'], testitem['choiceset'][1]['loc']]);
        output(['PRED_TEST', pre_post, trial, 'answer', testitem['correct']]);

        // response handler: check if click is one of the 
        // query locations. If no query locations are specified,
        // accept any click within the grid
        locs = [];
        for (var i=0; i<queries.length; i++) {
            locs.push(queries[i]['loc']);
        };
        this.onclick = function(event) {
            cl = grid.clickloc(event);

            var query_ind = locs.indexOf(cl[0]*NCELLW + cl[1]);
            if (query_ind > -1) {
                this.onclick = undefined;
                label = queries[query_ind]['label'];
                output(['PRED_TEST', pre_post, trial, 'response', label]);
               
                if (testitem['correct'] == label) {
                    output(['PRED_TEST', pre_post, trial, 'correct', 'true']);
                    
                    total_correct = total_correct + 1;
                } else {
                    output(['PRED_TEST', pre_post, trial, 'correct', 'false']);
                };
                
                // proceed
                trial = trial + 1;                
                if (trial < TEST_ITEMS.length) {
                    next();
                } else {
                    finish();
                };

            };
        };
        
    };

    var finish = function() {
        var self = init_instruction(this);

        if (pre_post=='pre') {
            ncorrect_pretest = total_correct;
        } else {
            ncorrect_posttest = total_correct;   
        };

        self.add_text('All done! You answered '+String(total_correct)+' out of '+TEST_ITEMS.length+' questions ' +
                      'correctly, so $'+String((total_correct*.01).toFixed(2))+' will be added to your ' +
                      'final bonus.');

        pre_post = 'post';
        $('#btn-continue').click(function(e) { exp.proceed(); });
    };

    next();
};


/****************
* Questionnaire *
****************/

var Questionnaire = function() {

	var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

	record_responses = function() {
		output(['POSTQ', 'submit']);

		$('textarea').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
		});
		$('select').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);		
		});
	};

        finish = function() {
            psiTurk.completeHIT();
        };

	prompt_resubmit = function() {
		replaceBody(error_message);
		$("#resubmit").click(resubmit);
	};

	resubmit = function() {
		replaceBody("<h1>Trying to resubmit...</h1>");
		reprompt = setTimeout(prompt_resubmit, 10000);
		
		psiTurk.saveData({
			success: function() {
				clearInterval(reprompt); 
				finish();
			}, 
			error: prompt_resubmit}
		);
	};


        // Insert bonus
        var bonusgame = randrange(0,GAMES_PER_BLOCK*N_BLOCKS);    
        var bonusamount = scores[bonusgame];
        var pretest_bonus = ncorrect_pretest*.01;
        var posttest_bonus = ncorrect_posttest*.01;
        var completion_bonus = (Math.min.apply(Math, minsamples) > 0) ? COMPLETION_BONUS : 0;
        var totalpayment = bonusamount + pretest_bonus + posttest_bonus + completion_bonus;

        output(["BONUS", "selectedgame", bonusgame]);        
        output(["BONUS", "gamebonus", bonusamount]);        
        output(["BONUS", "pretest_bonus", pretest_bonus]);
        output(["BONUS", "posttest_bonus", posttest_bonus]);
        output(["BONUS", "completion_bonus", completion_bonus]);
        output(["BONUS", "totalpayment", totalpayment]);

	// Load the questionnaire snippet 
        var self = init_instruction(this, 'postq', 'postquestionnaire.html');
        
        self.add_text('Congratulations, you\'re done! Based on your performance your bonus is:');
        
        self.add('<table class="table"><thead><tr><th>Section</th><th>Bonus</th></tr></thead>'+
            '<tbody>'+
                '<tr><td>Test #1</td><td>'+pretest_bonus.toFixed(2)+'</td></tr>'+
                '<tr><td>All games played</td><td>'+completion_bonus.toFixed(2)+'</td></tr>'+            
                '<tr><td>Randomly selected game</td><td>'+bonusamount.toFixed(2)+'</td></tr>'+
                '<tr><td>Test #2</td><td>'+posttest_bonus.toFixed(2)+'</td></tr>'+
                '<tr style="border-top:1px solid black; font-weight:bold;"><td>TOTAL</td><td>'+totalpayment.toFixed(2)+'</td></tr>'+
            '</tbody>'+
        '</table>');

        self.add_text('You will be eligible for the bonus after you answer the following questions. Thanks again for your participation!');
        
	$("#btn-continue").click(function () {
	    record_responses();
	    psiTurk.saveData({
                success: finish, 
                error: prompt_resubmit});
	});
        
	
};


/*******************
 * Run Task
 ******************/
$(window).load( function(){
	exp.begin();
});


