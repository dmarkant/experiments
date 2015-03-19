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

	self.div.append(svg_element('urn-svg', 740, 300));
	self.stage = d3.select('#urn-svg');
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

    self.add_text('You will learn how to classify shapes during a series of <span class=learning>learning</span> turns. ' +
                  'On each <span class=learning>learning</span> turn a new shape will appear, along with a green circle. ' +
                  'After you click on the green circle, you can then adjust the shape to take on whatever form you '+
                  'want to learn about.');

    if (SEL_COND == 'single') {
        self.add_text('You will be able to adjust the shape along one dimension at a time by moving the ' +
                      'mouse from left to right, and can switch between dimensions by pressing the X key.');
    } else if (SEL_COND == 'both') {
        self.add_text('You will be able to adjust the shape along both dimensions by moving the mouse in ' +
                      'different directions.');
    }

    self.add_text('After you have set the shape to a form that you want to learn about, press the ' +
                  'spacebar to find out which category it belongs to. Give it a try for the example below:');

    self.div.append(svg_element('urn-svg', 740, 400));
	self.stage = d3.select('#urn-svg');
	self.stage_h = Number(self.stage.attr("height"));
	self.stage_w = Number(self.stage.attr("width"));
    self.stim = new Stimulus({'stage': self.stage,
                              'x': self.stage_w/2,
                              'y': self.stage_h/2,
                              'coords': [.8, .4],
                              'callback': Instructions3});
    self.stim.draw();
    self.stim.listen_for_start();

}


var Instructions3 = function() {
	var self = init_instruction(this, 3);

    self.add_text('At various points during the experiment, you will complete a series of <span class=test>test</span> ' +
                  'turns. On each <span class=test>test</span> turn, a new shape will appear. Simply press A or B on the ' +
                  'keyboard based on which category you believe the shape belongs in.');


    self.add_text('Your bonus at the end of the experiment will be based on how many items you classify correctly, with ' +
                  '$.01 added for every correct classification. Thus, you should try to learn to classify items as quickly ' +
                  'as possible so that as to maximize your earnings from <span class=test>test</span> turns.');

    add_next_instruction_button(Instructions4);
}


var Instructions4 = function() {
	var self = init_instruction(this, 3);



}



var InstructionsComplete = function() {
	output(['instructions', 'ready']);
	var self = this;
	pager.showPage('instruct.html');
	self.div = $('#container-instructions');

	var t = 'Good job! Looks like you\'re ready to start playing. You will play a series of ' +
			NROUNDS + ' games. After you\'ve finished, you will see the value of all of the urns ' +
			'that you choose and your final bonus for the experiment.';
	self.div.append(instruction_text_element(t));

	var t = 'Click below to start the first game. Good luck!';
	self.div.append(instruction_text_element(t));

	self.btn = d3.select('#container-instructions').append('input')
								   .attr('value', 'Continue')
			    				   .attr('type', 'button')
								   .attr('height', 100)
								   .style('margin-bottom', '30px');

	self.btn.on('click', function() {
        exp.training_completed = true;
		exp.proceed();
	});

};


/*
var InstructionsQuiz = function() {
	output(['instructions', 'preq']);
	var self = this;
	pager.showPage('preq.html');

	var checker = function() {
		var errors = [];

		if ($('#maxtrials option:selected').val() != "1") {
			errors.push("maxtrials");
		};
		if ($('#expiration option:selected').val() != "1") {
			errors.push("expiration");
		};
		if ($('#probexpire option:selected').val() != "2") {
			errors.push("probexpire");
		};
		if ($('#whichexpire option:selected').val() != "0") {
			errors.push("whichexpire");
		};

		output(['instructions', 'preq', 'errors', errors].flatten());

		if (errors.length == 0) {
			InstructionsComplete();
		} else {
			$('#continue').hide();
			for(var i=0; i<errors.length; i++) {
				$('#'+errors[i]).css("border","2px solid red");
			};
			$("#warning").css("color","red");
			$("#warning").html("<p>Looks like you answered some questions incorrectly (highlighted in red). Please review them and click the \"Repeat\" button at the bottom to see the instructions again.</p>");
		};

	};


	$('#startover').on('click', function() {
		output('instructions', 'restart');
		Instructions1();
	});

	$('#continue').on('click', function() { checker(); });

};
*/
