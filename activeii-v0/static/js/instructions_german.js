instruction_text_element = function(text) {
	return '<div class="instruction-body">'+text+'</div>';
};


svg_element = function(id, width, height) {
	return '<div class="svg-container" width="'+width+'" height="'+height+'"><svg width="'+width+'" height="'+height+'" id="'+id+'"></svg></div>'
};


function add_next_instruction_button(target) {
    $('#buttons').append('<button id=btn-continue class="btn btn-default btn-lg">Fortfahren</button>');
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

    self.add_text('Willkommen! In diesem Experiment lernen Sie, Formen in ' +
    				'zwei unterschiedliche Kategorien einzuordnen. ' +
                  'Die Formen sehen so aus:');

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
        self.add_text('Wie Sie sehen, sind die Formen Drehscheiben, die sich zweierlei ' +
						'unterscheiden können: 1) der Durchmesser des Kreises und ' +
        				'2) der Winkel der Zentrallinie. Ausgehend von diesen Merkmalen, kann jede Form ' +
        				'einer von zwei Kategorien zugeordnet werden (A oder B). ' +
        				'Ihr Ziel ist es, herauszufinden, welche Formtypen zu welcher Kategorie gehören.');

    } else if (STIM_COND == 'rectangle') {
        self.add_text('Wie Sie sehen, sind die Formen Rechtecke, die sich zweierlei ' +
        				'unterscheiden können: 1) Breite und ' +
        				'2) Höhe. Ausgehend von diesen Merkmalen, kann jede Form ' +
        				'einer von zwei Kategorien zugeordnet werden (A oder B). ' +
        				'Ihr Ziel ist es, herauszufinden, welche Formtypen zu welcher Kategorie gehören.');
    }

	add_next_instruction_button(Instructions2);
};


var Instructions2 = function() {
	var self = init_instruction(this, 2);

    var dims = (STIM_COND == 'antenna') ? 'angle and radius' : 'width and height';

    self.add_text('Die Zuordnung von Formen <span class=learning>lernen</span> Sie in mehreren Runden. ' +
                  'In jeder Runde erscheint eine neue Form, zusammen mit einem grünen Kreis. ' +
                  'Nachdem Sie auf den grünen Kreis geklickt haben, können Sie die Form beliebig anpassen ' +
                  'und ihr die Gestalt verleihen, über die Sie <span class=learning>lernen</span> möchten. ');

    if (SEL_COND == 'single') {
        self.add_text('Sie können die Form jeweils entlang einer Dimension anpassen indem Sie die Maus von links nach rechts ' +
                      'bewegen, und wechseln zwischen den Dimensionen ('+dims+') durch das Drücken der "X" Taste. ');
    } else if (SEL_COND == 'both') {
        self.add_text('Sie können die Form entlang beiden Dimensionen anpassen indem Sie die Maus in unterschiedliche ' +
        				'Richtungen bewegen.');
    }

    self.add_text('Nachdem Sie die Form wie gewünscht ausgerichtet haben, drücken Sie die Leertaste um herauszufinden, ' +
    				'zu welcher Kategorie sie gehört. Probieren Sie es am Beispiel unten ' +
                  '(vorerst sehen Sie "??" statt der wahren Kategorie für die ausgewählte Form):');

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

    self.add_text('An unterschiedlichen Stellen im Experiment werden Sie eine Reihe von <span class=test>test</span>-Runden durchführen. ' +
    				'In jeder <span class=test>test</span>-Runde erscheint eine neue Form. Drücken Sie einfach A oder B auf der Tastatur ' +
    				'für die Kategorie, zu der die Form Ihrer Meinung nach gehört. ');


    self.add_text('Ihr Bonus am Ende des Experiments basiert auf der Anzahl der korrekt zugeordneten Formen, es wird 0,01€ pro korrekte Zuordnung angerechnet. ' +
                  'Daher sollten Sie versuchen, so schnell wie möglich die Kategorien zu erlernen, um Ihren Gewinn aus den <span class=test>test</span>-Runden zu maximieren.');

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
			$("#warning").html("<p>Sieht so aus, als ob Sie einige Fragen falsch beantwortet haben (rot markiert). Bitte überprüfen Sie sie und drücken die \"Wiederholen\"-Taste unten um noch einmal die Instruktionen zu sehen.</p>");
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

    self.add_text('Gut gemacht! Sieht so aus, als ob Sie startklar wären. Sie werden jetzt ' +
                  N_BLOCKS + ' Blöcke abschließen, wobei jeder Block mit einer Reihe von <span class=learning>lernen</span>-Runden beginnt, ' +
                  'gefolgt von einer Reihe von <span class=test>test</span>-Runden. ' +
                  'Nachdem Sie alle Runden abgeschlossen haben, sehen Sie den Bonus, den Sie in den <span class=test>test</span>-Runden verdient haben.');

    self.add_text('Bitte bleiben Sie bis zum Schluss auf der Aufgabe fokussiert. Benutzen sie während des Experiments keine Hilfsmittel (z.B. Stift und Papier, Bildschirmaufnahmen etc.). ' +
                  'Falls Sie zu lange inaktiv sind, endet das Experiment automatisch und es wird auf Auszahlung verzichtet. Sobald Sie angefangen haben, ' +
                  'können Sie die Seite nicht mehr neu laden oder diese Instruktionen wieder ansehen. ');

    self.add_text('Klicken Sie unten um zu starten. Viel Glück! ');

    add_next_instruction_button(exp.training);

};


