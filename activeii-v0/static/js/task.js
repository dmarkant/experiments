condition = 4;

RULE_COND = ['rb', 'ii'][Math.floor(condition/4)];
STIM_COND = ['antenna', 'rectangle'][Math.floor(condition/2) % 2];
SEL_COND =  ['both', 'single'][condition % 2];

RULE_COUNTER = counterbalance;

var N_BLOCKS = 8,
	N_TRIALS_TRAINING = 4,
	N_TRIALS_TEST = 4;

var exp,
	active_item = undefined,
	yokeddata = [],
	stimuli,
	outpfx = [],
	acc = [];

// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);
var LOGGING = mode != "debug";
var LOGGING = true;

psiTurk.preloadPages(['instruct.html',
					  'chooser.html',
					  'stage.html',
					  'feedback.html']);


DIMENSIONS = {'antenna': [{'name': 'radius',
						   'min': 20,
						   'max': 200},
						  {'name': 'angle',
						   'min': 40,
						   'max': 340}],
			  'rectangle': [{'name': 'width',
						     'min': 20,
						     'max': 400},
						    {'name': 'height',
						     'min': 20,
						     'max': 400}]};

DIM_MAPPING = (Math.random() < .5) ? 0 : 1;

// Generic function for saving data
function output(arr) {
	arr = outpfx.concat(arr);
    psiTurk.recordTrialData(arr);
    if (LOGGING) console.log(arr.join(" "));
};


function clear_buttons() {
	$('#buttons').html('');
};


function cart2stim(x, y) {
	if (DIM_MAPPING == 0) {
		a = DIMENSIONS[STIM_COND][0]['min'] + x * (DIMENSIONS[STIM_COND][0]['max'] - DIMENSIONS[STIM_COND][0]['min']);
		b = DIMENSIONS[STIM_COND][1]['min'] + y * (DIMENSIONS[STIM_COND][1]['max'] - DIMENSIONS[STIM_COND][1]['min']);
	} else {
		a = DIMENSIONS[STIM_COND][0]['min'] + y * (DIMENSIONS[STIM_COND][0]['max'] - DIMENSIONS[STIM_COND][0]['min']);
		b = DIMENSIONS[STIM_COND][1]['min'] + x * (DIMENSIONS[STIM_COND][1]['max'] - DIMENSIONS[STIM_COND][1]['min']);
	}
	return [a, b];
}


function classify(coord) {
	x = coord[0];
	y = coord[1];
	label = null;

	if (RULE_COND == 'rb') {
		if (RULE_COUNTER == 0) {
			if (x < .5) label = 'A';
			else label = 'B';
		} else if (RULE_COUNTER == 1) {
			if (y > .5) label = 'A';
			else label = 'B';
		} else if (RULE_COUNTER == 2) {
			if (x > .5) label = 'A';
			else label = 'B';
		} else if (RULE_COUNTER == 3) {
			if (y < .5) label = 'A';
			else label = 'B';
		}
	} else if (RULE_COND == 'ii') {
		if (RULE_COUNTER == 0) {
			if (y > x) label = 'A';
			else label = 'B';
		} else if (RULE_COUNTER == 1) {
			if (x > (1 - y)) label = 'A';
			else label = 'B';
		} else if (RULE_COUNTER == 2) {
			if (x > y) label = 'A';
			else label = 'B';
		} else if (RULE_COUNTER == 3) {
			if (x < (1-y)) label = 'A';
			else label = 'B';
		}
	}

	return label;
}



var Antenna = function(args) {
	var self = this;
	self.id = 'antenna';
	self.stage = args['stage'];
	self.x = args['x'];
	self.y = args['y'];
	self.color = 'red'

	self.draw = function(fvalue) {

		self.stim = self.stage.append('g')
							  .attr('id', self.id);


		self.circle = self.stim.append('circle')
							   .attr('cx', self.x)
							   .attr('cy', self.y)
							   .attr('r', fvalue[0])
							   .style('fill', 'none')
							   .style('stroke', self.color)
							   .style('stroke-width', 3);

		self.line = self.stim.append('svg:line')
							 .attr('x1', self.x)
							 .attr('y1', self.y)
							 .attr('x2', self.x + fvalue[0])
							 .attr('y2', self.y)
							 .attr('stroke', 'red')
							 .style('stroke-width', 3)

		self.stim.attr("transform", "rotate("+fvalue[1]+","+self.x+","+self.y+")");

	};

	self.update = function(fvalue) {

		// update display
		self.circle.attr('r', fvalue[0]);
		self.line.attr('x2', self.x + fvalue[0])
		self.stim.attr("transform", "rotate("+fvalue[1]+","+self.x+","+self.y+")");

	};

}


var Rectangle = function(args) {
	var self = this;
	self.id = 'rectangle';
	self.stage = args['stage'];
	self.x = args['x'];
	self.y = args['y'];
	self.color = 'red'

	self.draw = function(fvalue) {

		self.stim = self.stage.append('g')
							  .attr('id', self.id);


		self.rect = self.stim.append('rect')
							   .attr('x', self.x - fvalue[0]/2)
							   .attr('y', self.y - fvalue[1]/2)
							   .attr('width', fvalue[0])
							   .attr('height', fvalue[1])
							   .style('fill', 'none')
							   .style('stroke', self.color)
							   .style('stroke-width', 3)

	};

	self.update = function(fvalue) {
		self.rect.attr('x', self.x - fvalue[0]/2)
				 .attr('y', self.y - fvalue[1]/2)
				 .attr('width', fvalue[0])
				 .attr('height', fvalue[1]);
	};

}

var Stimulus = function(args) {
	var self = this;
	self.id = 'stimulus';
	self.stage = args['stage'];
	self.stage_h = Number(self.stage.attr("height"));
	self.stage_w = Number(self.stage.attr("width"));

	callback = args['callback'];

	// each stimulus dimension is specified
	// with continuous values from 0 to 1
	self.coords = ('coords' in args) ? args['coords'] : [Math.random(), Math.random()];
	self.init_coords = [self.coords[0], self.coords[1]];
	output(['init_coords', self.coords]);

	// stimulus values are converted
	// into rendered perceptual values based
	// on ranges for each dimension
	self.fvalue = cart2stim(self.coords[0], self.coords[1]);
	output(['init_fvalue', self.fvalue]);

	self.x = args['x'];
	self.y = args['y'];
	self.width = 400;
	self.height = 400;
	self.color = 'red';

	self.active_dim = (Math.random() < .5) ? 0 : 1;
	self.start_pos = null;
	self.pos = null;

	output(['active_dim', self.active_dim]);

	if (STIM_COND == 'antenna') {
		self.obj = new Antenna(args);
	} else if (STIM_COND == 'rectangle') {
		self.obj = new Rectangle(args);
	}

	self.update_dimension = function() {
		if (self.status != undefined) {
			self.status.remove();
		}

		self.status = self.stage.append('text')
							 .attr('x', self.x)
							 .attr('y', self.stage_h - 50)
							 .attr('text-anchor', 'middle')
							 .text('Active dimension: '+ DIMENSIONS[STIM_COND][self.active_dim]['name']);

	}

	self.update_tip = function(text) {
		if (self.tip != undefined) {
			self.tip.remove();
		}

		if (text != undefined) {
			self.tip = self.stage.append('text')
								 .attr('x', self.x)
								 .attr('y', self.stage_h - 20)
								 .attr('text-anchor', 'middle')
								 .style('text-decoration', 'italic')
								 .text(text);
		}
	}

	self.remove_tips = function() {
		if (self.tip != undefined) self.tip.remove();
		if (self.status != undefined) self.status.remove();
	}

	self.draw = function() {
		self.obj.draw(self.fvalue);
	};


	self.draw_start_button = function() {
		self.start_btn = self.stage.append('circle')
								  .attr('cx', self.x)
								  .attr('cy', self.y)
								  .attr('r', 15)
								  .attr('opacity', .5)
								  .attr('fill', 'green');
	}

	self.remove_start_button = function() {
		self.start_btn.on('click', function() {});
		self.start_btn.attr('opacity', 0.);
	}


	self.listen_for_classify = function() {

		var label = classify(self.coords);
		output(['classify', 'label', label]);

		self.update_tip('Which category does this shape belong to? Press A or B to respond');

		self.labelA = self.stage.append('text')
							    .attr('x', self.x - 60)
							    .attr('y', 85)
							    .attr('font-size', '80px')
							    .attr('font-family', 'Georgia')
							    .attr('text-anchor', 'middle')
								.attr('fill', '#D8D8D8')
							    .text('A');

		self.labelB = self.stage.append('text')
							    .attr('x', self.x + 60)
							    .attr('y', 85)
							    .attr('font-size', '80px')
							    .attr('font-family', 'Georgia')
							    .attr('text-anchor', 'middle')
								.attr('fill', '#D8D8D8')
							    .text('B');

		self.sep = self.stage.append('text')
							    .attr('x', self.x)
							    .attr('y', 65)
							    .attr('font-size', '30px')
							    .attr('font-family', 'Georgia')
							    .attr('text-anchor', 'middle')
								.attr('fill', '#D8D8D8')
							    .text('or');


		$(window).bind('keydown', function(e) {
			if (e.keyCode == '65' || e.keyCode == '66') {
				var resp = (e.keyCode == '65') ? 'A' : 'B';
				output(['classify', 'response', resp]);
				output(['classify', 'correct', resp==label]);
				acc.push(1 * (resp==label));

				if (resp == 'A') {
					self.labelA.attr('fill', 'black');
				} else {
					self.labelB.attr('fill', 'black');
				}

				setTimeout(function() {
					self.labelA.remove();
					self.labelB.remove();
					self.sep.remove()
					self.finish();
				}, 600);

			}
		});

	}


	self.listen_for_start = function() {

		self.draw_start_button();

		self.update_tip('Click the green dot to start');

		// record starting mouse position
		self.start_btn.on('click', function() {
			output(['clicked_start']);
			self.start_pos = d3.mouse(this);
			self.remove_start_button();
			self.selection();

		})

	}

	self.selection = function() {


		if (SEL_COND == 'single') {
			self.update_dimension();
			self.update_tip('Press X to change active dimension; press Spacebar to learn category');
		} else {
			self.update_tip('Press Spacebar to learn category');
		};


		self.stage.on('mousemove', function() {
			self.pos = d3.mouse(this);
			dist = [self.pos[0] - self.start_pos[0], self.pos[1] - self.start_pos[1]]
			self.update(dist);
		})

		$(window).bind('keydown', function(e) {

			// submit
			if (e.keyCode == '32') {
				output(['selection', 'coords', self.coords[0], self.coords[1]]);
				output(['selection', 'fvalue', self.fvalue[0], self.fvalue[1]]);

				// submit
				self.feedback();
			}

			// if single dimension at a time, switch
			if (SEL_COND == 'single' && e.keyCode == '88') {
				self.active_dim = (self.active_dim == 0) ? 1 : 0;
				output(['active_dim', self.active_dim]);
				self.update_dimension();
				self.start_pos = [self.pos[0], self.pos[1]];
				self.init_coords = [self.coords[0], self.coords[1]];
				output(['new_start_pos', self.start_pos]);
			}

		})

	}


	self.update = function(dist) {

		// take the position relative to the center and convert to
		// relative to 400 x 400 space
		if (SEL_COND == 'both') {

			rel_dist = [dist[0]/200, dist[1]/200];
			self.coords[0] = Math.max(0., Math.min(1, self.init_coords[0] + rel_dist[0]));
			self.coords[1] = Math.max(0., Math.min(1, self.init_coords[1] + rel_dist[1]));
			self.fvalue = cart2stim(self.coords[0], self.coords[1]);

		} else if (SEL_COND == 'single') {
			rel_dist = dist[0]/200;
			if (self.active_dim == 0) {
				self.coords[0] = Math.max(0., Math.min(1, self.init_coords[0] + rel_dist));
			} else {
				self.coords[1] = Math.max(0., Math.min(1, self.init_coords[1] + rel_dist));
			}
			self.fvalue = cart2stim(self.coords[0], self.coords[1]);
		}

		self.obj.update(self.fvalue);

	}


	self.feedback = function() {
		output(['feedback']);
		self.remove_tips();

		// classify stimulus
		label = classify(self.coords);

		// remove selection handlers
		self.stage.on('mousemove', function(e) {});
		$(window).unbind('keydown');

		self.label = self.stage.append('text')
							   .attr('id', 'categorylabel')
							   .attr('x', self.x)
							   .attr('y', 85)
							   .attr('font-size', '80px')
							   .attr('font-family', 'Georgia')
							   .attr('text-anchor', 'middle')
							   .text(label);

		$(window).bind('keydown', function(e) {
			if (e.keyCode == '32') {
				// submitted
				self.finish();
			}
		});

		self.update_tip('Press Spacebar to continue');

	}


	self.finish = function() {
		// remove stimulus and label
		if (self.label!=undefined) self.label.remove();
		self.obj.stim.remove();
		self.remove_tips();
		$(window).unbind('keydown');
		callback();
	}

	return self;
}


var TrainingBlock = function(block) {
	var self = this;
	self.block = block;
	psiTurk.showPage('stage.html');
	self.stage = d3.select('#stagesvg');
	self.stage_h = Number(self.stage.attr("height"));
	self.stage_w = Number(self.stage.attr("width"));
	self.x_off = (Number(self.stage.attr("width")) - self.stage_w) / 2;
	self.trial_ind = -1;

	self.trial = function() {
		self.trial_ind += 1;
		outpfx = ['training', self.block, self.trial_ind];

		if (self.trial_ind == N_TRIALS_TRAINING) {
			exp.proceed();
		} else {

			$('#aboveStage').html('<p>Round '+(self.block+1)+'/'+N_BLOCKS+'</p><p><span class=learning>learning</span></p>');

			self.stim = new Stimulus({'stage': self.stage,
									  'x': self.stage_w/2,
									  'y': self.stage_h/2,
								      'callback': self.trial});
			self.stim.draw();
			self.stim.listen_for_start();
		}
	}

	self.trial();
};


var TestBlock = function(block) {
	var self = this;
	self.block = block;
	psiTurk.showPage('stage.html');
	self.stage = d3.select('#stagesvg');
	self.stage_h = Number(self.stage.attr("height"));
	self.stage_w = Number(self.stage.attr("width"));
	self.x_off = (Number(self.stage.attr("width")) - self.stage_w) / 2;
	self.trial_ind = -1;

	self.trial = function() {
		self.trial_ind += 1;
		outpfx = ['test', self.block, self.trial_ind];

		if (self.trial_ind == N_TRIALS_TEST) {
			exp.proceed();
		} else {

			$('#aboveStage').html('<p>Round '+(self.block+1)+'/'+N_BLOCKS+'</p><p><span class=test>test</span></p>');

			self.stim = new Stimulus({'stage': self.stage,
									  'x': self.stage_w/2,
									  'y': self.stage_h/2,
								      'callback': self.trial});
			self.stim.draw();
			self.stim.listen_for_classify();
		}
	}

	self.trial();
};




var Exit = function() {
	output('COMPLETE');
	psiTurk.saveData();
	psiTurk.completeHIT();
};


var Experiment = function() {
	var self = this;
	self.block = -1;

	output(['rule_cond', RULE_COND]);
	output(['stim_cond', STIM_COND]);
	output(['sel_cond', SEL_COND]);
	output(['dim_mapping', DIM_MAPPING]);


	self.instructions = function() {
		self.proceed = self.training;
		Instructions1();
	}

	self.training = function() {
		self.block += 1;
		if (self.block == N_BLOCKS) {
			self.finish();
		} else {
			self.proceed = self.test;
			self.view = new TrainingBlock(self.block);

		}
	}

	self.test = function() {
		output(['test', self.block]);
		self.proceed = self.training;
		self.view = new TestBlock(self.block);
	}

	self.finish = function() {
		Exit();
	};

	//self.instructions();
	self.training();
};


// vi: noexpandtab tabstop=4 shiftwidth=4
