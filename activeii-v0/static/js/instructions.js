instruction_text_element = function(text) {
	return '<div class="instruction-body">'+text+'</div>';
};


svg_element = function(id, width, height) {
	return '<div class="svg-container" width="'+width+'" height="'+height+'"><svg width="'+width+'" height="'+height+'" id="'+id+'"></svg></div>'
};


function add_next_instruction_button(target) {
    $('#buttons').append('<button id=btn-continue class="btn btn-default btn-lg">Continue</button>');
    $('#btn-continue').on('click', target);
};


function init_instruction(obj, id) {
	obj.id = id;
	output(['instructions', id]);

	psiTurk.showPage('instruct.html');
	obj.div = $('#container-instructions');

	obj.add_text = function(t) {
		obj.div.append(instruction_text_element(t));
	};

	return obj;
};


var Instructions1 = function() {
	var self = init_instruction(this, 1);

    self.add_text('Welcome! In this experiment your goal is to learn to classify ' +
                  'shapes into two different categories. The shapes look like this:');

	self.div.append(svg_element('stagesvg', 740, 300));
	self.stage = d3.select('#stagesvg');
	self.stage_h = Number(self.stage.attr("height"));
	self.stage_w = Number(self.stage.attr("width"));
    self.stim = new Stimulus({'stage': self.stage,
                              'x': self.stage_w/2,
                              'y': self.stage_h/2,
                              'coords': [.6, .2]});
    self.stim.draw();


    if (STIM_COND == 'antenna') {
        self.add_text('As you can see, the shapes are dials that can vary in ' +
                      'two ways: 1) the diameter of the circle, and 2) the angle of the ' +
                      'line segment. Based on these properties, each ' +
                      'shape that you see can be classified into one of two categories ' +
                      '(A or B). Your goal is to learn which kinds of shapes belong to ' +
                      'each category.');

    } else if (STIM_COND == 'rectangle') {
        self.add_text('As you can see, the shapes are rectangles that can vary in ' +
                      'two ways: 1) width and 2) height. Based on these properties, each ' +
                      'shape that you see can be classified into one of two categories ' +
                      '(A or B). Your goal is to learn which kinds of shapes belong to ' +
                      'each category.');
    }

	add_next_instruction_button(Instructions2);
};


var Instructions2 = function() {
	var self = init_instruction(this, 2);

    var dims = (STIM_COND == 'antenna') ? 'angle and radius' : 'width and height';

    self.add_text('You will learn how to classify shapes during a series of <span class=learning>learning</span> turns. On each learning turn, you will design a new shape that you want to learn about by choosing its features. You should design new shapes that you think will help you learn to predict which shapes belong in each category.');

    self.add_text('At the start of each learning turn a randomly generated shape will appear along with a green circle. After you click the green circle, you can then adjust the shape to take whatever form you want to learn about.');

    if (SEL_COND == 'single') {
        self.add_text('You will be able to adjust the shape along one dimension at a time by moving the ' +
                      'mouse from left to right, and can switch between dimensions ('+dims+') by pressing the X key.');
    } else if (SEL_COND == 'both') {
        self.add_text('You will be able to adjust the shape along both dimensions by moving the mouse in ' +
                      'different directions.');
    }

    self.add_text('After you have adjusted the shape to a form that you want to learn about, press the ' +
                  'spacebar to find out which category it belongs to. Give it a try for the example below ' +
                  '(for now you will see "??" instead of the true category for the shape you select):');

    self.div.append(svg_element('stagesvg', 740, 600));
	self.stage = d3.select('#stagesvg');
	self.stage_h = Number(self.stage.attr("height"));
	self.stage_w = Number(self.stage.attr("width"));
    self.stim = new Stimulus({'stage': self.stage,
                              'x': self.stage_w/2,
                              'y': self.stage_h/2,
                              'coords': [.8, .4],
                              'callback': Instructions3,
                              'practice': true});
    self.stim.draw();
    self.stim.listen_for_start();

}


var Instructions3 = function() {
	var self = init_instruction(this, 3);

    self.add_text('At various points during the experiment, you will complete a series of <span class=test>test</span> ' +
                  'turns. On each <span class=test>test</span> turn, a new shape will appear. Simply press A or B on the ' +
                  'keyboard based on which category you believe the shape belongs in.');


    self.add_text('Your bonus at the end of the experiment will be based on how many shapes you classify correctly, with ' +
                  '$.01 added for every correct classification. Thus, you should try to learn about the categories as quickly ' +
                  'as possible so as to maximize your earnings from <span class=test>test</span> turns.');

    add_next_instruction_button(InstructionsQuiz);
}



var InstructionsQuiz = function() {
	output(['instructions', 'preq']);
	var self = this;
	psiTurk.showPage('preq.html');

    var checker = function() {
		var errors = [];

		if ($('#learningphase option:selected').val() != "0") {
			errors.push("learningphase");
		};
		if ($('#ncategories option:selected').val() != "1") {
			errors.push("ncategories");
		};
		if ($('#testgoal option:selected').val() != "2") {
			errors.push("testgoal");
		};
		if ($('#bonus option:selected').val() != "1") {
			errors.push("bonus");
		};

		output(['instructions', 'preq', 'nerrors', errors.length]);
		output(['instructions', 'preq', 'errors', errors]);

		if (errors.length == 0) {
			InstructionsComplete();
		} else {
			$('#btn-continue').hide();
			for(var i=0; i<errors.length; i++) {
				$('#'+errors[i]).css("border","2px solid red");
			};
			$("#warning").css("color","red");
			$("#warning").html("<p>Looks like you answered some questions incorrectly (highlighted in red). Please review them and click the \"Repeat\" button at the bottom to see the instructions again.</p>");
		};

	};


	$('#btn-startover').on('click', function() {
		output('instructions', 'restart');
		Instructions1();
	});

	$('#btn-continue').on('click', function() { checker(); });

};


var InstructionsComplete = function() {
	var self = init_instruction(this, 'complete');

    self.add_text('Good job! Looks like you are ready to begin. You will now complete ' +
                  N_BLOCKS + ' rounds, where each round begins with a series of <span class=learning>'+
                  'learning</span> turns, which are then followed by a series of <span class=test>' +
                  'test</span> turns. After you have finished all the rounds, you will see the bonus ' +
                  'you earned from the <span class=test>test</span> turns.');

    self.add_text('Please stay focused on the task until it is complete. Please do not use any external aids ' +
                  'during the experiment (e.g., pencil and paper, screenshots, etc.). If you are idle for too ' +
                  'long, the experiment will end automatically and you will forgo payment. Once you have started ' +
                  'you will be unable to reload the page or view these instructions again.');

    self.add_text('Click below to get started. Good luck!');

    add_next_instruction_button(exp.training);

};

