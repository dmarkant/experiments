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

	psiTurk.showPage((LANG=='en') ? 'instruct.html' : 'instruct_de.html');
	obj.div = $('#container-instructions');

	obj.add_text = function(t) {
		obj.div.append(instruction_text_element(t));
	};

	return obj;
};


var Instructions1 = function() {
	var self = init_instruction(this, 1);

    self.add_text('Willkommen! In diesem Experiment lernen Sie, Formen ' +
                  'in zwei unterschiedliche Kategorien einzuordnen. Die ' +
                  'Formen sehen so aus:');

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
        self.add_text('Wie Sie sehen, sind die Formen Drehscheiben, die sich ' +
                      'in zwei Weisen unterscheiden können: 1) der Durchmesser ' +
                      'des Kreises und 2) Stand des Zeigers. Ausgehend von diesen ' +
                      'Merkmalen kann jede Form, die Sie sehen, einer von zwei ' +
                      'Kategorien zugeordnet werden (A oder B). Ihr Ziel ist es ' +
                      'herauszufinden, welche Formtypen zu welcher Kategorie gehören.');

    } else if (STIM_COND == 'rectangle') {
        self.add_text('Wie Sie sehen, sind die Formen Rechtecke, die sich in zwei Weisen unterscheiden können: 1) Breite und 2) Höhe. Ausgehend von diesen Merkmalen kann jede Form einer von zwei Kategorien zugeordnet werden (A oder B). Ihr Ziel ist es herauszufinden, welche Formtypen zu welcher Kategorie gehören.');
    }

	add_next_instruction_button(Instructions2);
};


var Instructions2 = function() {
	var self = init_instruction(this, 2);

    //var dims = (STIM_COND == 'antenna') ? 'angle and radius' : 'width and height';
    var dims = (STIM_COND == 'antenna') ? 'angle and radius' : 'Breite and Höhe';

    self.add_text('Die Zuordnung von Formen lernen Sie in mehreren Runden. In jeder Runde werden Sie durch Ausprobieren neue Formen kreieren, über die Sie etwas lernen wollen. Sie sollten neue Formen kreieren, von denen Sie denken, dass sie Ihnen beim Erlernen der Regel zur Zuordnung der Formen helfen werden.');

    self.add_text('In jeder Runde erscheint eine neue Form, zusammen mit einem grünen Kreis. Nachdem Sie auf den grünen Kreis geklickt haben, können Sie die Form beliebig anpassen und ihr die Gestalt verleihen, über die Sie etwas lernen möchten.')

    if (SEL_COND == 'single') {
        self.add_text('Sie können die Form jeweils entlang einer Größenordnung anpassen, indem Sie die Maus von links nach rechts bewegen, und Sie können zwischen den Größenordnungen durch das Drücken der "X" Taste wechseln.');
    } else if (SEL_COND == 'both') {
        self.add_text('Sie werden nun in der Lage sein, die Form entlang beider Größenordnungen anzupassen, indem Sie die Maus in unterschiedliche Richtungen bewegen.');
    }

    self.add_text('Nachdem Sie das Gebilde zu der Form angepasst haben, über die Sie etwas lernen wollen, drücken Sie die Leertaste, um herauszufinden, zu welcher Kategorie sie gehört. Probieren Sie es am Beispiel unten (vorerst sehen Sie "??" statt der wahren Kategorie für die Form, die Sie ausgewählt haben):');

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

    self.add_text('Während des Experiments werden Sie an unterschiedlichen Stellen eine Reihe von <span class=test>Test</span>-Runden vollenden. In jeder <span class=test>Test</span>-Runde erscheint eine neue Form. Drücken Sie einfach A oder B auf der Tastatur für die Kategorie, zu der die Form Ihrer Meinung nach gehört.');

    self.add_text('Ihr Bonus am Ende des Experiments basiert auf der Anzahl der korrekt zugeordneten Formen, es werden 0,02 € pro korrekte Zuordnung angerechnet. Daher sollten Sie versuchen, so schnell wie möglich die Kategorien zu erlernen, um Ihren Gewinn aus den <span class=test>Test</span>-Runden zu maximieren.');

    add_next_instruction_button(InstructionsQuiz);
}



var InstructionsQuiz = function() {
	output(['instructions', 'preq']);
	var self = this;
	psiTurk.showPage((LANG=='en') ? 'preq.html' : 'preq_de.html');

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
			$("#warning").html("<p>Es sieht so aus, als ob Sie einige Fragen falsch beantwortet hätten (rot markiert). Bitte überprüfen Sie diese und drücken Sie dann die \"Wiederholen\"-Taste unten, um noch einmal die Anleitungen zu sehen.</p>");
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

    self.add_text('Gut gemacht! Es sieht so aus, als ob Sie ' +
                  'startklar wären. Sie werden jetzt '+N_BLOCKS+
                  ' Blöcke abschließen, wobei jeder Block mit '+
                  'einer Reihe von <span class=learning>Lern</span>-Runden beginnt, gefolgt '+
                  'von einer Reihe von <span class=test>Test</span>-Runden. Nachdem Sie '+
                  'alle Runden abgeschlossen haben, sehen Sie den '+
                  'Bonus, den Sie in den <span class=test>Test</span>-Runden verdient haben.');

    self.add_text('Bitte konzentrieren Sie sich bis zum Schluss auf die Aufgabe, bis sie abgeschlossen ist. Benutzen sie während des Experiments keine Hilfsmittel (z.B. Stift und Papier, Bildschirmaufnahmen etc.). Falls Sie zu lange inaktiv sind, endet das Experiment automatisch und es wird auf Auszahlung verzichtet. Sobald Sie angefangen haben, können Sie die Seite nicht mehr neu laden oder diese Anleitung wieder ansehen.');

    self.add_text('Klicken Sie unten, um zu starten. Viel Glück!');

    add_next_instruction_button(exp.training);

};


