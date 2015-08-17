/* stimulus setup */
DIMENSIONS = {'absolute': [{'name': 'chemical A',
							'min': 0,
						    'max': 10,
						    'units': 'liters'},
						   {'name': 'fertilizer B',
						    'min': 0,
						    'max': 50,
						    'units': 'kg'}],
			  'relative': [{'name': 'chemical A',
							'min': 0,
						    'max': 40,
						    'units': '%'},
						   {'name': 'fertilizer B',
						    'min': 0,
						    'max': 40,
						    'units': '%'}]};

/* conditions, counterbalancing */
RULE_COND = ['rb', 'ii'][Math.floor(condition/2)];
STIM_COND = ['relative', 'absolute'][condition % 2];
RULE_COUNTER = counterbalance;

// mapping of stimulus dimensions to features
DIM_MAPPING = (Math.random() < .5) ? 0 : 1;

// randomize order that features appear
FINDEX = (Math.random() < .5) ? [0, 1] : [1, 0];

// randomize offset of rule from center
OFFSET = (Math.random() < .5) ? 1 : -1;

// randomize which dimension has the larger range
if (STIM_COND=='absolute') {
	if (Math.random() < .5) {
		DIMENSIONS['absolute'][0]['max'] = 50;
		DIMENSIONS['absolute'][1]['max'] = 10;
	}
}

// test set depends on condition and offset
var r = RULE_COND == 'rb' ? '1D' : '2D';
var l = OFFSET < 0 ? 'A' : 'B';
testset_file = 'static/testsets_'+r+'_'+RULE_COUNTER+'_'+l+'.csv';

/* settings */
var LANG = 'de', // 'en' | 'de'
	N_BLOCKS = 8,
	N_TRIALS_TRAINING = 16,
	N_TRIALS_TEST = 32,
	BONUS_PER_CORRECT = .02,
	exp,
	active_item = undefined,
	outpfx = [],
	acc = [],
	acc_by_block = [],
	total_correct,
	total_bonus,
	testitems = [],
	ids = uniqueId.split(':');

// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);
//var LOGGING = mode != "debug";
var LOGGING = true;

psiTurk.preloadPages(['instruct.html',
					  'instruct_de.html',
					  'preq.html',
					  'preq_de.html',
					  'stage.html',
					  'feedback.html',
					  'feedback_de.html',
					  'summary.html']);


var IMAGES = ['static/images/farm_plots_empty.png',
			  'static/images/farm_plots_success.png',
			  'static/images/farm_plots_failure.png'];
psiTurk.preloadImages(IMAGES);



// Generic function for saving data
function output(arr) {
	arr = outpfx.concat(arr);
    psiTurk.recordTrialData(arr);
    if (LOGGING) console.log(arr.join(" "));
};



// load test items
function load_test_sets() {

	path = testset_file;
    output('loading test sets from: '+testset_file);
    var results = [];
	$.ajax({url: path,
			success: function(data) {
				$.each(data.split('\n'), function() {
					var row = this.split(',');
					if (row[0]!="") {
						var arr = row.slice(1, row.length);
						arr = _.map(arr, function(x) { return Number(x); });

						// reshape
						var newArr = [];
						while(arr.length) newArr.push(arr.splice(0,2));

						// shuffle order of items within each block
						newArr = shuffle(newArr);

						results.push(newArr);
					};
				});
			},
            error: function() {
                output('failed to load option sets!');
            },
			async: false
	});

	// shuffle entire set
	results = shuffle(results);
    return results;
};


function clear_buttons() {
	$('#buttons').html('');
};


function cart2stim(x, y) {
	/* Convert coordinates to stimulus dimensions */
	if (DIM_MAPPING == 0) {
		a = DIMENSIONS[STIM_COND][0]['min'] + x * (DIMENSIONS[STIM_COND][0]['max'] - DIMENSIONS[STIM_COND][0]['min']);
		b = DIMENSIONS[STIM_COND][1]['min'] + y * (DIMENSIONS[STIM_COND][1]['max'] - DIMENSIONS[STIM_COND][1]['min']);
	} else {
		a = DIMENSIONS[STIM_COND][0]['min'] + y * (DIMENSIONS[STIM_COND][0]['max'] - DIMENSIONS[STIM_COND][0]['min']);
		b = DIMENSIONS[STIM_COND][1]['min'] + x * (DIMENSIONS[STIM_COND][1]['max'] - DIMENSIONS[STIM_COND][1]['min']);
	}
	return [a, b];
}


function stim2cart(a, b) {
	/* Convert stimulus dimensions to [0,1] normalized
	 * coordinates */
	var dim = DIMENSIONS[STIM_COND];

	if (DIM_MAPPING == 0) {
		// a -> x; b -> y
		x = (a - dim[0]['min']) / (dim[0]['max'] - dim[0]['min']);
		y = (b - dim[1]['min']) / (dim[1]['max'] - dim[1]['min']);
	} else {
		// a -> y; b -> x
		y = (a - dim[0]['min']) / (dim[0]['max'] - dim[0]['min']);
		x = (b - dim[1]['min']) / (dim[1]['max'] - dim[1]['min']);
	}
	return [x, y];
}


var OFFSET_1D = .1;
var OFFSET_2D = .1056;

function classify(coord) {
	x = coord[0];
	y = coord[1];
	label = null;

	if (RULE_COND == 'rb') {
		if (RULE_COUNTER == 0) {
			if (x < (.5 + OFFSET_1D * OFFSET)) label = 'success';
			else label = 'failure';
		} else if (RULE_COUNTER == 1) {
			if (y > (.5 + OFFSET_1D * OFFSET)) label = 'success';
			else label = 'failure';
		} else if (RULE_COUNTER == 2) {
			if (x > (.5 + OFFSET_1D * OFFSET)) label = 'success';
			else label = 'failure';
		} else if (RULE_COUNTER == 3) {
			if (y < (.5 + OFFSET_1D * OFFSET)) label = 'success';
			else label = 'failure';
		}
	} else if (RULE_COND == 'ii') {
		if (RULE_COUNTER == 0) {
			if (y > (x + OFFSET_2D * OFFSET)) label = 'success';
			else label = 'failure';
		} else if (RULE_COUNTER == 1) {
			if ((x + OFFSET_2D * OFFSET) > (1 - y)) label = 'success';
			else label = 'failure';
		} else if (RULE_COUNTER == 2) {
			if ((x + OFFSET_2D * OFFSET) > y) label = 'success';
			else label = 'failure';
		} else if (RULE_COUNTER == 3) {
			if ((x + OFFSET_2D * OFFSET) < (1-y)) label = 'success';
			else label = 'failure';
		}
	}

	return label;
}



var Stimulus = function(args) {
	var self = this;
	self.id = 'stimulus';
	self.stage = args['stage'];
	self.stage_h = Number(self.stage.attr("height"));
	self.stage_w = Number(self.stage.attr("width"));
	self.img_w = 400;
	self.img_h = 272;

	self.submit_btn = $('#test-submit');

	callback = args['callback'];

	// each stimulus dimension is specified
	// with continuous values from 0 to 1
	self.coords = ('coords' in args) ? args['coords'] : [Math.random(), Math.random()];
	self.init_coords = [self.coords[0], self.coords[1]];
	output(['init_coords', self.coords[0], self.coords[1]]);

	// stimulus values are converted
	// into feature values based
	// on ranges for each dimension
	self.fvalue = cart2stim(self.coords[0], self.coords[1]);
	output(['init_fvalue', self.fvalue[0], self.fvalue[1]]);

	self.x = args['x'] - self.img_w / 2;
	self.y = args['y'] - self.img_h / 2 - 20;
	self.width = 400;
	self.height = 400;

	// mapping of input elements to the right feature
	self.feature_inputs = FINDEX[0]==0 ? [$('#f1-input'), $('#f2-input')] : [$('#f2-input'), $('#f1-input')]
	self.feature_inputs[0].val(self.fvalue[0].toFixed(2));
	self.feature_inputs[1].val(self.fvalue[1].toFixed(2));


	// draw the starting image
	self.draw = function(state) {

		if (state=='init') {
			var img = IMAGES[0];
		} else if (state=='failure') {
			var img = IMAGES[2];
		} else if (state=='success') {
			var img = IMAGES[1];
		}

		output(['draw', img]);

		self.disp = self.stage.append('g')
							  .attr('id', 'img');

		self.obj = self.disp.append('image')
							.attr('x', self.x)
							.attr('y', self.y)
							.attr('width', self.img_w)
							.attr('height', self.img_h)
							.attr('opacity', 1.)
							.attr('xlink:href', img);

	};


	self.update_tip = function(text, col) {
		var color = col || 'black';

		if (self.tip != undefined) {
			self.tip.remove();
		}

		if (text != undefined) {
			self.tip = self.stage.append('text')
								 .attr('x', self.stage_w/2)
								 .attr('y', self.stage_h - 20)
								 .attr('text-anchor', 'middle')
								 .style('text-decoration', 'italic')
								 .attr('fill', color)
								 .text(text);
		}
	}

	self.remove_tips = function() {
		if (self.tip != undefined) self.tip.remove();
		if (self.status != undefined) self.status.remove();
	}

	self.remove = function() {
		self.obj.remove();
		self.obj = undefined;
	};


	self.listen_for_selection = function() {
		self.submit_btn = $('#test-submit');

		self.submit_btn.on('click', function(e) {

			// get feature values
			output(['selection', 'input', self.feature_inputs[0].val(), self.feature_inputs[1].val()]);

			// validate the input
			var valid = [false, false];
			_.each(self.feature_inputs, function(entry, i) {

				var value = Number(entry.val());
				var dim = DIMENSIONS[STIM_COND][i];
				if ($.isNumeric(entry.val()) && (value >= dim['min'] && value <= dim['max'])) {
					valid[i] = true;
				}
			});


			// if valid, then make input uneditable and
			// generate feedback
			if (valid[0] && valid[1]) {
				self.fvalue = [Number(self.feature_inputs[0].val()), Number(self.feature_inputs[1].val())];
				output(['selection', 'fvalue', self.fvalue[0], self.fvalue[1]]);
				_.each(self.feature_inputs,
					   function(i, x) {i.attr('readOnly', true);}
				);
				self.feedback();
			} else {
				// provide feedback that supplied values
				// were outside range
				output(['selection', 'invalid_selection']);
				self.update_tip('One of the amounts is outside the possible range or is not a number, please try again:', 'red');
			};
		});
		self.submit_btn.css('display', 'inline-block');
		self.update_tip((LANG=='en') ?
						'Adjust the amounts and click Test to see the result:' :
					    'Verändern Sie die Beträge und drücken "Test", um das Ergebnis zu sehen:');

	};


	self.feedback = function() {
		self.submit_btn.css('display', 'none');

		// convert to coordinates
		self.coords = stim2cart(self.fvalue[0], self.fvalue[1]);
		var label = classify(self.coords);
		output(['selection', 'coords', self.coords[0], self.coords[1]]);
		output(['feedback', self.coords[0], self.coords[1], label]);

		self.draw(label);
		self.draw_feedback_label(label);

		$(window).bind('keydown', function(e) {
			if (e.keyCode == '32') {
				// submitted
				output(['continue']);
				self.finish();
			}
		});

		self.update_tip((LANG=='en') ? 'Press Spacebar to continue' : 'Drücken Sie die Leertaste, um fortzufahren.');

	};

	self.draw_feedback_label = function(label) {
		var txt = label=='success' ? 'Success!' : 'Failure';
		self.label = self.stage.append('text')
							   .attr('id', 'categorylabel')
							   .attr('x', self.stage_w/2)
							   .attr('y', 180)
							   .attr('font-size', '45px')
							   .attr('font-family', 'Bree Serif')
							   .attr('text-anchor', 'middle')
							   .attr('fill', 'white')
							   .text(txt);
	}


	self.listen_for_classify = function() {
		_.each(self.feature_inputs,
			   function(i, x) {i.attr('readOnly', true);}
		);

		self.predict_success_btn = $('#predict-success');
		self.predict_failure_btn = $('#predict-failure');

		self.update_tip((LANG=='en') ?
						'What do you predict will be the outcome if this combination is used?' :
					    'Welches Ergebnis sagen Sie voraus, wenn diese Zusammensetzung genutzt wird?');

		self.predict_success_btn.css('display', 'inline-block');
		self.predict_failure_btn.css('display', 'inline-block');

		self.predict_success_btn.on('click', function(e) {
			self.classify_response('success');
		});
		self.predict_failure_btn.on('click', function(e) {
			self.classify_response('failure');
		})

	};


	self.classify_response = function(resp) {
		self.predict_success_btn.css('display', 'none');
		self.predict_failure_btn.css('display', 'none');

		var label = classify(self.coords);
		output(['classify', 'label', label]);
		output(['classify', 'response', resp]);
		output(['classify', 'correct', resp==label]);
		acc.push(1 * (resp==label));

		setTimeout(function() {
			self.finish();
		}, 300);

	};


	self.finish = function() {
		$(window).unbind('keydown');
		if (self.label!=undefined) self.label.remove();
		self.obj.remove();
		self.remove_tips();
		callback();
	}

	return self;
}


var TrainingBlock = function(block) {
	var self = this;
	self.block = block;

	self.trial_ind = -1;

	self.trial = function() {
		self.trial_ind += 1;
		outpfx = ['training', self.block, self.trial_ind];

		if (self.trial_ind == N_TRIALS_TRAINING) {
			exp.proceed();
		} else {
			psiTurk.showPage('stage.html');
			self.stage = d3.select('#stagesvg');
			self.stage_h = Number(self.stage.attr("height"));
			self.stage_w = Number(self.stage.attr("width"));
			self.x_off = (Number(self.stage.attr("width")) - self.stage_w) / 2;

			// setup displav, with counterbalancing of order
			setup_features();

			$('#aboveStage').html((LANG=='en') ?
								  '<p>Round '+(self.block+1)+'/'+N_BLOCKS+'</p><p><span class=learning>learning</span></p>' :
								  '<p>Block '+(self.block+1)+'/'+N_BLOCKS+'</p><p><span class=learning>lernen</span></p>');

			setTimeout(function() {
				self.stim = new Stimulus({'stage': self.stage,
										  'x': self.stage_w/2,
										  'y': self.stage_h/2,
										  'callback': self.trial});
				self.stim.draw('init');
				self.stim.listen_for_selection();
			}, 500);
		}
	}

	self.trial();
};


function setup_features() {
	// setup displav, with counterbalancing of order
	var f1m = FINDEX[0];
	var dim = DIMENSIONS[STIM_COND][f1m];
	$('#f1-label').html(dim['name'] + '<br /><span class=frange>'+dim['min']+' - '+dim['max']+' '+dim['units']+'</span>');
	$('#f1-units').html(dim['units']);

	var f2m = FINDEX[1];
	var dim = DIMENSIONS[STIM_COND][f2m];
	$('#f2-label').html(dim['name'] + '<br /><span class=frange>'+dim['min']+' - '+dim['max']+' '+dim['units']+'</span>');
	$('#f2-units').html(dim['units']);
}


var TestBlock = function(block) {
var self = this;
self.block = block;
self.trial_ind = -1;

self.testitems = testitems[block];

	self.trial = function() {
		self.trial_ind += 1;
		outpfx = ['test', self.block, self.trial_ind];

		if (self.trial_ind == N_TRIALS_TEST) {
			self.feedback();
		} else {

			psiTurk.showPage('stage.html');
			self.stage = d3.select('#stagesvg');
			self.stage_h = Number(self.stage.attr("height"));
			self.stage_w = Number(self.stage.attr("width"));

			// setup displav, with counterbalancing of order
			setup_features();

			$('#aboveStage').html((LANG=='en') ?
								  '<p>Round '+(self.block+1)+'/'+N_BLOCKS+'</p><p><span class=test>test</span></p>' :
								  '<p>Block '+(self.block+1)+'/'+N_BLOCKS+'</p><p><span class=test>test</span></p>' );

			setTimeout(function() {
				self.stim = new Stimulus({'stage': self.stage,
										  'x': self.stage_w/2,
										  'y': self.stage_h/2,
										  'callback': self.trial,
										  'coords': self.testitems[self.trial_ind]});

				self.stim.draw('init');
				self.stim.listen_for_classify();
			}, 500);

		}
	}

	self.feedback = function() {
		outpfx = ['test', self.block, 'feedback'];
		ind = self.block * N_TRIALS_TEST;
		block_ncorrect = acc.slice(ind, (ind + N_TRIALS_TEST)).sum();
		output(['ncorrect', block_ncorrect]);

		$('.feature-entry').css('display', 'none');
		self.stim.remove();

		t1 = (LANG=='en') ? 'On this round you correctly predicted the outcome' : 'In dieser Runde haben Sie die Ergebnisse für';
		t2 = (LANG=='en') ? block_ncorrect+' out of '+N_TRIALS_TEST : block_ncorrect+' von '+N_TRIALS_TEST;
		t3 = (LANG=='en') ? 'times' : 'Durchgängen richtig vorhergesagt.';


		t1 = self.stage.append('text')
							    .attr('x', self.stage_w/2)
							    .attr('y', self.stage_h/2-20)
							    .attr('font-size', '20px')
							    .attr('font-family', 'Georgia')
							    .attr('text-anchor', 'middle')
								.attr('fill', 'black')
							    .text(t1);
		t2 = self.stage.append('text')
							    .attr('x', self.stage_w/2)
							    .attr('y', self.stage_h/2 + 20)
							    .attr('font-size', '30px')
							    .attr('font-family', 'Georgia')
							    .attr('text-anchor', 'middle')
								.attr('fill', 'black')
							    .text(t2)
		t3 = self.stage.append('text')
							    .attr('x', self.stage_w/2)
							    .attr('y', self.stage_h/2 + 60)
							    .attr('font-size', '20px')
							    .attr('font-family', 'Georgia')
							    .attr('text-anchor', 'middle')
								.attr('fill', 'black')
							    .text(t3);


		$(window).bind('keydown', function(e) {
			if (e.keyCode == '32') {
				// submitted
				output(['continue']);
				self.finish();
			}
		});

		self.stim.update_tip((LANG=='en') ? 'Press Spacebar to continue' : 'Drücken Sie die Leertaste um fortzufahren');

	}

	self.finish = function() {
		$(window).unbind('keydown');
		//$(window).bind('keydown', function(e) {});
		exp.proceed();
	}

	self.trial();
};


var Feedback = function() {
	$('#main').html('');
	var self = this;
	psiTurk.showPage((LANG=='en') ? 'feedback.html' : 'feedback_de.html');
	self.div = $('#container-instructions');
	outpfx = ['feedback'];

	// calculate final bonus
	total_correct = acc.reduce(function(a, b){return a+b;})
	total_bonus = (total_correct * BONUS_PER_CORRECT).toFixed(2) + '€';
	output(['total_correct', total_correct]);
	output(['total_bonus', total_bonus]);

	var t = (LANG=='en') ?
			'All done! You correctly predicted the outcome for '+total_correct+' out of '+(N_BLOCKS * N_TRIALS_TEST) +
		    ' combinations during the test turns, which means that you have earned a bonus of '+total_bonus+'.' :
			'Fertig! Sie haben die Ergebnisse für '+total_correct+' von '+(N_BLOCKS * N_TRIALS_TEST)+
			' Zusammensetzungen während der Testdurchgänge richtig vorhergesagt. Das bedeutet, '+
			'Sie haben einen Bonus von  '+total_bonus+' EUR verdient.';
	self.div.append(instruction_text_element(t));

	var t = (LANG=='en') ?
			'You will be eligible to receive the bonus after you\'ve answered the following questions:' :
			'Sie bekommen den Bonus ausgezahlt, nachdem Sie folgende Fragen beantwortet haben:';
	self.div.append(instruction_text_element(t));

	var error_message = '<h1>Oops!</h1><p>Something went wrong submitting your results. '+
					    'Press the button to resubmit.</p><button id=resubmit>Resubmit</button>';

	record_responses = function() {

		psiTurk.recordTrialData(['postquestionnaire', 'submit']);

		$('textarea').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
		});
		$('select').each( function(i, val) {
			psiTurk.recordUnstructuredData(this.id, this.value);
		});

		if (ids[1] === 'lab') {
			Summary();
		} else {
			Exit();
		}
	};

	$("#btn-submit").click(function() {
		record_responses();
	});

};


var Summary = function() {
	var self = this;
	outpfx = [];
	output('COMPLETE');
	psiTurk.saveData();

	psiTurk.showPage('summary.html');
	$('#partid').html(ids[0]);
	$('#bonus').html(total_bonus);

	notify();

	// mark completion
	$.ajax({url: '/worker_complete?uniqueId=' + uniqueId,
		    async: false,
			success: function(data) {
				console.log('worker_complete:', data);
			}
			})
};


function notify() {
	console.log('notifying');

	$.ajax({url: '/notify?uniqueId=' + uniqueId,
		    async: false,
			success: function(data) {
				console.log('notified');
			}
			})
}


var Exit = function() {
	output('COMPLETE');
	psiTurk.saveData();
	psiTurk.completeHIT();
};


var Experiment = function() {
	var self = this;
	self.block = -1;

	output(['uniqueId', uniqueId]);
	output(['condition', condition]);
	output(['counterbalance', counterbalance]);
	output(['rule_cond', RULE_COND]);
	output(['stim_cond', STIM_COND]);
	output(['dim_mapping', DIM_MAPPING]);
	output(['feature_order', FINDEX]);
	output(['rule_offset', OFFSET]);

	self.instructions = function() {
		self.proceed = self.training;
		Instructions1();
	}

	self.training = function() {
		psiTurk.saveData();
		self.block += 1;
		if (self.block == N_BLOCKS) {
			self.finish();
		} else {
			self.proceed = self.test;
			self.view = new TrainingBlock(self.block);

		}
	}

	self.test = function() {
		psiTurk.saveData();
		output(['test', self.block]);
		self.proceed = self.training;
		self.view = new TestBlock(self.block);
	}

	self.finish = function() {
		Feedback();
	};

	// load and randomize test items
	testitems = load_test_sets();

	self.instructions();
};


// vi: noexpandtab tabstop=4 shiftwidth=4
