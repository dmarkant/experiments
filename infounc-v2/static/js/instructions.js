instruction_text_element = function(text) {
	return '<p class="instruction-body">'+text+'</p>';
};

instruction_img_element = function(src) {
    return '<div class=img-container><img src="static/images/'+src+'"></div>';
};

instruction_stage = function(w, h) {
    w = w || 700;
    h = h || 480;
    return '<canvas id="thestage" width="'+w+'px" height="'+h+'+px">' +
           'No support for canvas!' +
           '</canvas>';
};


function init_instruction(obj, id, pagename) {
    obj.id = id;
    output(['instructions', id]);

    psiTurk.showPage(pagename || 'instruct.html');	
    obj.div = $('#container-instructions');

    obj.set_header = function(t) {
        $('#instruct h2').html(t);
    };

    obj.actionprompt = $('#prompt');

	obj.add_text = function(t) {
		obj.div.append(instruction_text_element(t));
	};

    obj.add_image = function(src) {
        obj.div.append(instruction_img_element(src));
    };

    obj.add_stage = function(w, h) {
        obj.div.append(instruction_stage(w, h));
        stage = document.getElementById("thestage");
        if (!stage || !stage.getContext) console.log('can\'t find stage'); 
        stage.style.display = "block";
        stage.style.cursor = "auto";
    };

    obj.add = function(html) {
        obj.div.append(html);
    };

    return obj;
};


function instructions1() {
    var self = init_instruction(this);

    self.add_text('Imagine that you control a surveillance satellite positioned above the ' +
                  'Pacific Ocean. The grid of squares shown below represents a section ' +
                  'of the ocean, and it\'s your job to find out where ships are located within it.');

    self.add_image('instructions-0.png');
    
    self.add_text('To do so, you can "listen in" on an individual location (by clicking on a square '+
                  'within the grid) to see if any radio signals are being emitted. If nothing is ' +
                  'present in that location, it will turn gray. If there is a ship present, '+
                  'the square will turn a different color depending on what ship it belongs to.');

    self.add_text('Every grid that you see during this experiment will have three shapes hidden in ' +
                  'unknown locations: one blue, one red, and one purple. Each of those shapes will be ' +
                  'randomly chosen from the following set:');

    self.add_stage(700, 280);
    drawShapeset([20,150], 28, 20, true);

    self.add_text('Note that more than one ship in a grid can have the same dimensions, but the three ' +
                  'ships will always have different colors (blue, red, and purple).');
    
    $('#btn-continue').click(instructions3);
};


// Show examples of game boards
function instructions3() {
    var self = init_instruction(this);

    self.add_text('Here are some examples of configurations of ships that you could encounter ' +
                  '(click the button below to step through them).');

    self.add_stage();

    HSPACE = HSPACE_ALL[0];

    stage.clear = function() {
        c = this.getContext("2d");
        c.fillStyle = BACKGROUND_COLOR;
        c.fillRect(0,0,this.width,this.height);
    };

    CELLW = 40;   // pixels   
    CELLH = 40;   // pixels
    STAGEWIDTH = stage.width;
    STAGEHEIGHT = stage.height;
    MARGINW = MIN_MARGIN + (STAGEWIDTH-2*MIN_MARGIN-WIDTH)/2;   // distance from edge of stage to board
    MARGINH = MIN_MARGIN + (STAGEHEIGHT-2*MIN_MARGIN-HEIGHT)/2;

    i = 0;

    var buttonPress = function() {
        $('#btn-continue').off('click');

        var rt = (new Date().getTime()) - timestamp;
        output(["EXAMPLE", i, rt, board].flatten());

        if (i < EXAMPLES.length) {
            next();
        } else {
            instructionsInterference();
        };

    };

    var next = function() {

        stage.clear();  
        stage.width = stage.width;
        
        c = stage.getContext("2d");
        c.save();
        c.fillStyle = GRID_COLOR;
        c.shadowOffsetX=0;
        c.shadowOffsetY=0;
        c.shadowBlur = 30;
        c.shadowColor = "#000000";    
        c.fillRect(MARGINW,MARGINH,WIDTH,HEIGHT);
        c.restore();
        
        board = new GameboardExample();
        grid = new Grid(NCELLW,NCELLH);
        grid.show();
        timestamp = new Date().getTime();    
        drawGridLines();

        i = i+1;

        $('#btn-continue').click( function() {
            buttonPress();
        });
    };

    next();

};

function instructionsInterference() {
    var self = init_instruction(this);

    //self.add_text('There\'s one last thing you need to know about the ships before starting the ' +
    //              'first part of the experiment.');

    self.add_text('Whenever two ships touch, there can be "interference" in the radio signal within  ' +
                  'any square that touches a different ship. For example, in the grid below, ' +
                  'the blue ship is directly next to the purple ship, and interference could happen within ' +
                  'any square adjacent to a different ship (shown by the yellow outline).');

    self.add_image('instructions-interference.png');

    self.add_text('Interference means that the signal your satellite receives may '+
                  'not be accurate in those locations. If you click on the touching ' +
                  'squares, there\'s a <strong>50% chance that the color that shows up will ' +
                  'be wrong</strong>. For example, clicking on a location on the edge of the ' +
                  'purple shape has a 50% chance of turning it an incorrect color (gray, ' +
                  'red, or blue), and a 50% chance of turning it the true color (purple).');
                  
    self.add_text('The grid below shows the result of this interference between ' +
                  'the purple and blue ships. If you had listened in on the locations ' +
                  'within the yellow outline, you might get a similar result: while some of the ' +
                  'locations have the correct color, others are incorrect due to interference.');

    self.add_image('instructions-interference-2.png');

    self.add_text('Don\'t forget that this interference happens when any two ships are ' +
                  'touching, and only occurs in those squares that are adjacent to a ' +
                  'different ship. As seen above, when non-adjacent locations are listened to ' +
                  'they always reveal the true color of the ship hidden below.');
   
    // only do the pretest once, in case instructions are repeated
    if (pre_post == 'pre') {
        $('#btn-continue').click(instructionsPretest);
    } else {
        $('#btn-continue').click(function(e) {
            exp.proceed(2); // skip ahead to next instruction set   
        });
    };
};


function instructionsPretest() {
    var self = init_instruction(this);
    self.set_header('Instructions');

    self.add_text('Before we move on to the game, first you will be tested on what you have ' +
                  'learned so far.');

    self.add_text('On the following screens you will see a series of grids, each with ' +
                  'some locations already observed and two new locations (A and B) highlighted. '+
                  'Answer the question that appears above the grid as accurately as possible. ' +
                  '<strong>There will be 2 kinds of questions</strong>: 1) predicting which location is more likely ' +
                  'to belong to one of the ships, and 2) predicting which location is more likely ' +
                  'to produce interference if you were to click on it.');
                  
    self.add_text('There will be '+TEST_ITEMS_PRE.length+' questions. For each question you answer correctly, $.01 ' +
                  'will be added to your final bonus (for a total up to $.50).');

    self.add_text('Click below when you are ready to begin!');
    $('#btn-continue').click(function(e) {
        exp.proceed();
    });

};




function instructions4() {
    var self = init_instruction(this);

    self.add_text('You will now play a game in which you will search for the three hidden ships.');

    self.add_text('Of course, you could simply listen to every square ' +
                  'in the grid to find the ships. However, the trick to the game is to ' +
                  'figure out the location and shape of each hidden ship <strong>in the ' +
                  'smallest number of observations possible</strong>.');

    self.add_text('At the end of the experiment, one of the games you play will be ' +
                  'randomly selected and you will receive a bonus based on your performance ' +
                  'in that game. Each game starts with a potential bonus of $5.00. Every ' +
                  'square that you listen to reduces the bonus by <strong>$' +
                  LOSS_PER_SAMPLE_STR+'</strong>. Thus, you will get a higher bonus if you ' +
                  'can figure out the ships with as few squares as possible.');

    self.add_image('instructions-1.png');

    $('#btn-continue').click(instructions5);

};


function instructions5() {
    var self = init_instruction(this);

    self.add_text('After you\'ve figured out the shape and location of the ships, you then get a chance to "paint" in any remaining squares that you think are part of one of the ships.');

    self.add_text('You don\'t have to fill in the squares you think are empty (the game assumes that squares you leave blank should be "gray"). You just color in where you think the ships are. You can choose different colors by clicking on the colored buttons to the right of the grid.');

    self.add_image('instructions-3.png');

    self.add_text('Just as uncovering squares reduces your potential bonus for a game, each error that you make filling in the ships will reduce your potential bonus by <strong>$'+LOSS_PER_ERROR_STR+'</strong> for that game. For example, if you fill in a square that wasn\'t actually part of a ship, that will be counted as an error. Similarly, if you <i>don\'t</i> paint in a square that actually belongs to one of the ships, that will also count as an error.');

    $('#btn-continue').click(instructions6);
};


function instructions6() {
    var self = init_instruction(this);

    self.add_text('After you\'re done painting you will see the final bonus for the game, which depends on: (1) the number of squares you uncovered, and (2) the number of errors you make while painting.');

    self.add_image('instructions-4.png');
    
    self.add_text('Squares marked with an \'X\' indicate errors you made. Remember, in order to get the highest bonus possible, you should only uncover as many squares as you need to find out the shape and size of the hidden ships.');

    $('#btn-continue').click(instructions7);
};


function instructions7() {
    var self = init_instruction(this);

    self.add_text('You will play a total of '+GAMES_PER_BLOCK*N_BLOCKS+' games during the experiment. If you complete all <span class="var">'+GAMES_PER_BLOCK*N_BLOCKS+'</span> games (without skipping any) you will receive a bonus of $'+COMPLETION_BONUS_STR+' plus a bonus based on your performance in a randomly selected game.');
    
    self.add_text('Remember, your bonus in each game is calculated according to the following formula:');

    self.add('<p style="text-align:center;"><strong style="text-align:center;">' +
             '$5.00 - ($'+LOSS_PER_SAMPLE_STR+' x # of squares uncovered) - ($'+LOSS_PER_ERROR_STR+' x # of painting errors)</strong></p>');

    //self.add_text('For example, if in a game you uncover 15 squares and make no errors, a bonus of $2.00 would be added to your payment. Since the game will be randomly chosen at the end, you should try to get the highest possible bonus on every game you play.');

    self.add_text('Now you will play a practice game to get used to the rules and gameplay. Remember to try to get the highest bonus that you can!');
    
    $('#btn-continue').click(function(e) { exp.proceed(); });
};


function instructionsPreQ() {
    var self = init_instruction(this, 'preq', 'instructions-preq.html');

    self.add_text("Before you start playing, please answer the questions below to show that you understand the instructions you have just completed. If you wish to see the instructions again, click the \"See instructions\" button at the bottom of the page.");

    var checker = function() {
        var errors = [];
       
        if ($('#nshapes option:selected').val() != "1") { 
            errors.push("nshapes");
        };
        if ($('#penalties option:selected').val() != "1") {
            errors.push("penalties");
        };
        if ($('#dimensions option:selected').val() != "1") {
            errors.push("dimensions");
        };
        if ($('#overlap option:selected').val() != "2") {
            errors.push("overlap");
        };
        if ($('#bonus option:selected').val() != "2") {
            errors.push("bonus");
        };
        if ($('#interference option:selected').val() != "3") {
            errors.push("interference");
        };
        

        if (errors.length == 0) {
            output(["PREQ", "allcorrect"]);
            $('.question').css('display','none');
            $('#btn-startover').css('display', 'none');
            $('#btn-continue').html("Continue");
            $('#btn-continue').on('click', function() { exp.proceed(); });
            $('#container-instructions').html("<p>Great job, you answered all of the questions correctly. Click the Continue button at the bottom of the page to start playing. Good luck!</p>");
        } else {
            $('#btn-continue').css("display","none");
            for(var i=0; i<errors.length; i++) {
                output(["PREQ", "wrong", errors[i]]);
                $('#'+errors[i]).css("border","2px solid red");
            };
            $('#container-instructions').html("<p>Looks like you answered some questions incorrectly (highlighted in red). Please review them and then click the \"Start over\" button at the bottom to view the instructions again.</p>");
        };
    };

    timestamp = new Date().getTime();
    
    $('#btn-startover').on('click', function() { 
        var rt = (new Date().getTime()) - timestamp;
        output(["INSTRUCTIONS", 'preq', "startover", rt]);
        exp.begin(); 
    });
    $('#btn-continue').on('click', function() { 
        var rt = (new Date().getTime()) - timestamp;
        output(["INSTRUCTIONS", 'preq', "checkanswers", rt]);        
        checker(); 
    });
};


function instructionsPosttest() {
    var self = init_instruction(this);

    self.add_text('Great job, you\'re almost done!');

    self.add_text('For the final part of the experiment, you will answer another round ' +
                  'of questions (just like the test you completed during the instructions). ' +
                  'As before, there will be '+TEST_ITEMS_POST.length+' questions, and every correct answer will add ' +
                  'another $.01 to your final bonus.');

    $('#btn-continue').click(function(e) { exp.proceed(); });


};


