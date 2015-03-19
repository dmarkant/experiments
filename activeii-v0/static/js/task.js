condition = 3;

switch (condition) {

	case 0:
		STIM_COND = 'antenna';
		SEL_COND = 'both';
		break;
	case 1:
		STIM_COND = 'antenna';
		SEL_COND = 'single';
		break;
	case 2:
		STIM_COND = 'rectangle';
		SEL_COND = 'both';
		break;
	case 3:
		STIM_COND = 'rectangle';
		SEL_COND = 'single';
		break;

}

var N_BLOCKS = 8,
	N_TRIALS_TRAINING = 16,
	TEST_BLOCK_TIME = 60000 * 5; // maximum test block duration (not implemented)

var exp,
	active_item = undefined,
	yokeddata = [],
	stimuli;

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

// Generic function for saving data
function output(arr) {
    psiTurk.recordTrialData(arr);
    if (LOGGING) console.log(arr.join(" "));
};


function clear_buttons() {
	$('#buttons').html('');
};


function cart2polar(x, y) {
	radius = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
	angle = Math.atan(y/x);
	return [radius, angle]
}

function polar2cart(radius, angle) {
	x = radius * Math.cos(angle);
	y = radius * Math.sin(angle);
	return [x, y];
}


function cart2stim(x, y) {
	a = DIMENSIONS[STIM_COND][0]['min'] + x * (DIMENSIONS[STIM_COND][0]['max'] - DIMENSIONS[STIM_COND][0]['min']);
	b = DIMENSIONS[STIM_COND][1]['min'] + y * (DIMENSIONS[STIM_COND][1]['max'] - DIMENSIONS[STIM_COND][1]['min']);
	return [a, b];
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
	self.id = 'test';
	self.stage = args['stage'];
	self.stage_h = Number(self.stage.attr("height"));
	self.stage_w = Number(self.stage.attr("width"));

	callback = args['callback'];

	// each stimulus dimension is specified
	// with continuous values from 0 to 1
	self.coords = ('coords' in args) ? args['coords'] : [Math.random(), Math.random()];
	self.init_coords = [self.coords[0], self.coords[1]];
	output(['coords', self.coords]);

	// stimulus values are converted
	// into rendered perceptual values based
	// on ranges for each dimension
	self.fvalue = cart2stim(self.coords[0], self.coords[1]);
	output(['fvalue', self.fvalue]);

	self.x = args['x'];
	self.y = args['y'];
	self.width = 400;
	self.height = 400;
	self.color = 'red';

	self.active_dim = (Math.random() < .5) ? 0 : 1;
	self.start_pos = null;

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

	self.listen_for_start = function() {

		self.draw_start_button();

		self.update_tip('Click the green dot to start');

		// record starting mouse position
		self.start_btn.on('click', function() {

			self.start_pos = d3.mouse(this);
			self.remove_start_button();
			self.selection();

		})

	}

	self.selection = function() {

		output(['selection']);

		if (SEL_COND == 'single') {
			self.update_dimension();
			self.update_tip('Press X to change active dimension; press Spacebar to learn category');
		} else {
			self.update_tip('Press Spacebar to learn category');
		};


		self.stage.on('mousemove', function() {
			pos = d3.mouse(this);

			// relative x position
			dist = [pos[0] - self.start_pos[0], pos[1] - self.start_pos[1]]
			self.update(dist);

		})

		// listen for submit
		$(window).bind('keydown', function(e) {

			if (e.keyCode == '32') {

				// submit
				self.feedback();
			}

			// if single dimension at a time, switch
			if (SEL_COND == 'single' && e.keyCode == '88') {
				self.active_dim = (self.active_dim == 0) ? 1 : 0;
				output(['active_dim', self.active_dim]);
				self.update_dimension();
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
		label = 'A';
		labelclass = 'catA';

		// remove selection handlers
		self.stage.on('mousemove', function(e) {});
		$(window).unbind('keydown');

		self.label = self.stage.append('text')
							   .attr('id', 'categorylabel')
							   .attr('x', self.x)
							   .attr('y', 100)
							   .attr('font-size', '80px')
							   .attr('text-anchor', 'middle')
							   .attr('class', labelclass)
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
		self.label.remove();
		self.obj.stim.remove();
		$(window).unbind('keydown');


		callback();
	}

	return self;
}



/*
var Item = function(pars) {
	var self = this;

	self.stage = pars['stage'];
	self.ind = pars['ind'];
	self.id = 'item-' + self.ind;
	self.row = pars['row'];
	self.col = pars['col'];
	self.width = pars['width'];
	self.height = pars['height'];
	self.x_off = pars['x_off'] | 0;
	self.x = self.width * self.row + self.x_off;
	self.y = self.height * self.col;
	self.framedelay = pars['framedelay'];
	self.duration = pars['duration'];
	self.img = pars['image'];
	self.blocking = pars['blocking'] | true;

	padding = 10;
	self.obj_x = self.x + padding;
	self.obj_y = self.y + padding;
	self.obj_w = self.width - 2 * padding;
	self.obj_h = self.height - 2 * padding;

	// state variables
	self.active = false;
	self.framed = false;


	self.disp = self.stage.append('g')
						  .attr('id', self.id);


	self.obj = self.disp.append('image')
						.attr('x', self.obj_x)
						.attr('y', self.obj_y)
						.attr('width', self.obj_w)
						.attr('height', self.obj_h)
						.attr('opacity', 0.)
						.attr('xlink:href', self.img);

	self.frame = self.disp.append('rect')
						  .attr('x', self.x + padding/2)
						  .attr('y', self.y + padding/2)
						  .attr('width', self.width - padding)
						  .attr('height', self.height - padding)
						  .attr('rx', 15)
						  .attr('ry', 15)
						  .attr('stroke-width', 5)
						  .attr('stroke', '#D8D8D8')
						  .attr('fill', 'none')
						  .attr('opacity', 0.)


	self.frame_on = function() {
		self.framed = true;
		self.frame.attr('stroke', 'red')
				  .attr('opacity', 1.);
	};

	self.frame_inactive = function() {
		self.framed = false;
		self.frame.attr('stroke', '#D8D8D8')
				  .attr('opacity', 1.);
	};

	self.frame_off = function() {
		self.framed = false;
		self.frame.attr('opacity', 0.);
	};

	self.object_on = function() {
		self.obj.attr('opacity', 1.)
	};

	self.object_off = function() {
		self.active = false;
		self.obj.attr('opacity', 0.)
	};

	self.show = function(duration, callback) {
		self.object_on();
		setTimeout(function() {
			self.object_off();
			if (callback) callback();
		}, duration);
	};

	self.study = function() {
		self.object_on();

		switch (self.duration) {

			case 'none':
				break;
			case 'selfpaced':
				break;
			default:
				setTimeout(function() {
					active_item = undefined;
					self.frame_inactive();
					self.object_off();
				}, self.duration);
				break;
		};

	};


	self.listen = function() {

		self.disp.on('click', function() {

			// if not active, then proceed with study episode
			if (!self.active && active_item==undefined) {

				self.active = true;
				if (self.blocking) active_item = self.id;

				self.frame_on();
				setTimeout(function() {
					self.study();
				}, self.framedelay);

			// otherwise only handle clicks if study
			// duration is self-paced
			} else if (self.id==active_item && self.duration=='selfpaced') {

				active_item = undefined;
				self.object_off();
				self.frame_inactive();

			};

		});

	};

	self.listen_test = function() {

		self.disp.on('click', function() {

			if (self.active) {
				self.active = false;
				self.frame_inactive();
			} else {
				self.active = true;
				self.frame_on();
			}

		});

	}


	self.unlisten = function() {
		self.disp.on('click', function() {});
	};

};
*/


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

		if (self.trial_ind == N_TRIALS_TRAINING) {
			exp.proceed();
		} else {
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



var Exit = function() {
	output('COMPLETE');
	psiTurk.saveData();
	psiTurk.completeHIT();
};


var Experiment = function() {
	var self = this;
	self.block = -1;
	self.testblock = -1;

	self.instructions = function() {
		Instructions1();
	}

	self.training = function() {
		self.block += 1;

		if (self.block == N_BLOCKS) {
			self.finish();
		} else {
			self.view = new TrainingBlock(self.block);
		}
	}

	self.finish = function() {
		Exit();
	};

	self.instructions();
};


// vi: noexpandtab tabstop=4 shiftwidth=4
