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

    self.add_text('Welcome! In this experiment you will play the role of a farmer ' +
                  'learning how to grow a successful crop. Your goal is to learn how ' +
                  'the success of your harvest depends on two substances: 1) a chemical ' +
                  'solution, and 2) a fertilizer.');

    self.add_text('Over the course of the experiment you will be able to test how different combinations ' +
                  'of these substances affect whether or not you have a successful crop. Each new ' +
                  '<span class=learning>learning</span> turn begins with an empty patch of soil (shown below). Listed below the patch ' +
                  'are the randomly generated starting amounts of the two substances. You can ' +
                  'then adjust the amounts of each substance and test whether ' +
                  'your chosen combination leads to a successful crop.');

    self.div.append('<div id="stage"><svg width="700" height="340" id="stagesvg"></svg>' +
                        '<div class="feature-entry"><div class="label" id="f1-label">Resource 1</div>' +
                            '<input class="feature-input" id="f1-input" autocomplete="off">' +
                            '<div class="units" id="f1-units">units</div></div>' +
                        '<div class="feature-entry"><div class="label" id="f2-label">Resource 2</div>' +
                            '<input class="feature-input" id="f2-input" autocomplete="off">' +
                            '<div class="units" id="f2-units">units</div></div>' +
                        '<button id="test-submit" type="submit" class="btn btn-default btn-lg">Test</button>' +
                    '</div>')

	self.stage = d3.select('#stagesvg');
	self.stage_h = Number(self.stage.attr("height"));
	self.stage_w = Number(self.stage.attr("width"));
    self.stim = new Stimulus({'stage': self.stage,
                              'x': self.stage_w/2,
                              'y': self.stage_h/2,
                              'coords': [.6, .2]});
    self.stim.draw('init');
    setup_features();
    $('#test-submit').css({'display': 'block', 'margin': '0 auto'});

    if (STIM_COND == 'relative') {
        self.add_text('As you can see at the left, each of the substances can make up a ' +
                      'maximum of 40\% of the mixture that is added to the soil. On each ' +
                      'trial, you can adjust the level of each substance to any amount within ' +
                      'this maximum range. Give it a try for the example above by changing the ' +
                      'values for each substance and then pressing the test button.');

    } else if (STIM_COND == 'absolute') {
        self.add_text('As you can see at the left, each of the substances have a maximum ' +
                      'amount that can be added to the soil. On each trial, you can adjust ' +
                      'the level of each substance to any amount within this maximum range. ' +
                      'Give it a try for the example above by changing the values for each ' +
                      'substance and then pressing the Test button.');
    };

    $('#test-submit').on('click', Instructions2);
};


var Instructions2 = function() {
	var self = init_instruction(this, 2);

    self.add_text('If the combination you select leads to a successful crop, you will see ' +
                  'the following:');

    self.div.append('<div id="stage" ><svg width="700" height="340" id="stagesvg1" style="border-top:none;"></svg>' +
                    '</div>')
	stage1 = d3.select('#stagesvg1');
	stage_h = Number(stage1.attr("height"));
	stage_w = Number(stage1.attr("width"));
    self.stim = new Stimulus({'stage': stage1,
                              'x': stage_w/2,
                              'y': stage_h/2,});
    self.stim.draw('success');
    self.stim.draw_feedback_label('success');

    self.add_text('If the combination instead leads to a crop failure, you will see this:');

    self.div.append('<div id="stage"><svg width="700" height="340" id="stagesvg2" style="border-top:none;"></svg>' +
                    '</div>')
	stage2 = d3.select('#stagesvg2');
    self.stim = new Stimulus({'stage': stage2,
                              'x': stage_w/2,
                              'y': stage_h/2,});
    self.stim.draw('failure');
    self.stim.draw_feedback_label('failure');

    add_next_instruction_button(Instructions3);

}


var Instructions3 = function() {
	var self = init_instruction(this, 3);

    self.add_text('At various points during the experiment, you will complete a series of <span class=test>test</span> ' +
                  'turns. On each <span class=test>test</span> turn, you will be shown a new combination of the ' +
                  'Chemical and Fertilizer substances, and be asked to predict whether that combination will lead ' +
                  'to a Success or Failure.');

    self.add_text('Your bonus at the end of the experiment will be based on how many times you correctly predict ' +
                  'the outcome, with $.01 added to your bonus for every correct prediction. Thus, you should try to ' +
                  'learn as much as you can about how different levels of the substances are related to successful crops ' +
                  'during <span class=learning>LEARNING</span> turns so as to ' +
                  'maximize your earnings from <span class=test>test</span> turns.');

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

