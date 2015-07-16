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

    self.add_text('Herzlich Willkommen! In dieser Studie werden Sie in die Rolle eines Landwirts '+
                  'schlüpfen, der lernt erfolgreich Pflanzen anzubauen. Ihr Ziel ist es, zu lernen ' +
                  'wie der Ernteerfolg von zwei Substanzen abhängt: 1) einer chemischen Lösung ' +
                  'und 2) einem Düngemittel.');

    self.add_text('Im Laufe der Studie haben Sie die Möglichkeit auszuprobieren, wie verschiedene '+
                  'Zusammensetzungen dieser Substanzen Einfluss auf das erfolgreiche Wachstum der '+
                  'Pflanzen haben. Jeder <span class=learning>LERN</span>-Durchgang beginnt mit einem leeren Feld (siehe unten). ' +
                  'Darunter finden Sie zwei zufällig erzeugte Startbeträge der beiden Substanzen. '+
                  'Sie können die Beträge ändern und ausprobieren, ob die von Ihnen gewählte ' +
                  'Zusammensetzung erfolgreiches Wachstum hervorbringt.');

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
        self.add_text('Wie Sie links sehen, kann jede der Substanzen maximal 40\% der Mischung ' +
                      'betragen, die auf das Feld gegeben wird. Bei jedem Versuch können Sie '+
                      'einen Betrag bis zur Höchstmenge der Substanzen eingeben. Probieren ' +
                      'Sie es aus, indem Sie die Werte der Substanzen im Beispiel oben ' +
                      'verändern und Test drücken.');

    } else if (STIM_COND == 'absolute') {
        self.add_text('Wie Sie links sehen, gibt es für die Substanzen eine Höchstmenge, die ' +
                      'auf das Feld gegeben werden kann. Bei jedem Versuch können Sie einen '+
                      'Betrag bis zur Höchstmenge der Substanzen eingeben. Probieren Sie es '+
                      'aus, indem Sie die Werte der Substanzen im Beispiel oben verändern und '+
                      'Test drücken.');
    };

    $('#test-submit').on('click', Instructions2);
};


var Instructions2 = function() {
	var self = init_instruction(this, 2);

    self.add_text('Wenn die von Ihnen gewählte Zusammensetzung zu erfolgreichem Wachstum führt, sehen Sie folgendes:');

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

    self.add_text('Wenn die Zusammensetzung dagegen zum Scheitern führt, werden Sie folgendes sehen:');

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

    self.add_text('Im Verlauf der Studie werden Sie eine Reihe von <span class=test>TEST</span>-Durchgängen spielen. Bei '+
                  'jedem <span class=test>TEST</span>-Durchgang wird Ihnen eine neue Zusammensetzung von Chemikalien und '+
                  'Düngern gezeigt. Sie werden gebeten vorherzusagen, ob die Zusammensetzung zu '+
                  'Erfolg oder Scheitern führt.');

    self.add_text('Jedes Mal wenn Sie das Ergebnis korrekt vorhersagen, erhalten Sie einen Bonus '+
                  'von 0,02 EUR. Versuchen Sie also während der <span class=learning>LERN</span>-Durchgänge so viel wie '+
                  'möglich darüber zu lernen, wie die verschiedenen Mengen der Substanzen mit '+
                  'erfolgreichem Wachstum zusammenhängen, um so Ihre Einnahmen in den '+
                  '<span class=test>TEST</span>-Durchgängen zu maximieren. ');

    add_next_instruction_button(InstructionsQuiz);
}



var InstructionsQuiz = function() {
	output(['instructions', 'preq']);
	var self = this;
	psiTurk.showPage('preq_de.html');

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
			$("#warning").html("<p>Anscheinend haben Sie einige Fragen falsch beantwortet (rot markiert). Bitte überprüfen Sie diese und drücken Sie die \"Wiederholen\"-Taste unten, um noch einmal zu den Anleitungen zu gelangen.</p>");
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

    self.add_text('Gut gemacht! Anscheinend sind Sie startklar. Sie werden jetzt ' +
                  N_BLOCKS + ' Runden spielen, wobei jede Runde mit einer Reihe von '+
                  '<span class=learning>LERN</span>-Durchgängen beginnt, gefolgt von '+
                  'einer Reihe von <span class=test>TEST</span>-Durchgängen. Nachdem '+
                  'Sie alle Runden abgeschlossen haben, sehen Sie den Bonus, den Sie '+
                  'in den <span class=test>TEST</span>-Durchgängen verdient haben.');

    self.add_text('Bitte konzentrieren Sie sich bis zum Schluss auf die Aufgabe. '+
                  'Benutzen Sie während der Studie keine Hilfsmittel (z. B. Stift '+
                  'und Papier, Bildschirmaufnahmen etc.). Falls Sie zu lange inaktiv '+
                  'sind, endet die Studie automatisch und es wird auf Auszahlung '+
                  'verzichtet. Sobald Sie angefangen haben, können Sie die Seite '+
                  'nicht mehr neu laden oder diese Anleitung ansehen.');

    self.add_text('Klicken Sie unten, um zu starten. Viel Glück!');

    add_next_instruction_button(exp.training);

};

