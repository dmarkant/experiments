// colors
var OBJECT_COLORS = [
    "#aaaaaa",
    "#3399FF", // blue    
    "#cf5a3c", // red
    "#9554a0", // purple
    "#20b44a", // green
    "#009933",
    "#FFFACD",
    "#800080"
    ];

var PAINT_COLORS = [
    "#aaaaaa",
    "#5CADFF", // blue     
    "#dc7960",
    "#b982c3",
    "#72c589", // green
    "#33AD5C",
    "#FFFACD",
    "#800080"
];

var QUERY_COLOR = "black";


// settings for grid
var BACKGROUND_COLOR = "#555555";
var GRID_COLOR = "#bbbbbb";
var GRID_LINE_COLOR = "#c7c7c7";
var GRID_LINE_COLOR_SHAPESET = GRID_LINE_COLOR;
var GRIDLINES = true;
var MIN_MARGIN = 16; 
var CELLW = 40;   // pixels   
var CELLH = 40;   // pixels
var NCELLW = 10;    // cells wide
var NCELLH = 10;    // cells tall
var WIDTH = NCELLW * CELLW;
var HEIGHT = NCELLH * CELLH;
var MARGINW, MARGINH;


/*
 * Time delay assigned to each sampling action, during which the 
 * cursor disappears (but can still move--would be tricky to fix
 * its location)
 */
function pauseSampling(stage, ms) {
    stage.style.cursor = "none";
    setTimeout( function() {
        stage.style.cursor = "auto";
    }, ms);
}


function ShapeBox (i, j, x0, y0, size) {

    this.i = i;
    this.j = j;
    this.cellw = size;
    this.cellh = size;
    this.x = x0 + this.i*this.cellw;
    this.y = y0 + this.j*this.cellh;
    this.size = size;

    this.draw = function() {
        c = stage.getContext("2d");
        c.fillStyle = "#3A3A3A";
        c.fillRect(this.x+1, this.y+1, this.size-2, this.size-2);
        return;
    };
};


function ShapeGrid (loc, ncellw, ncellh, size ) {
    this.ncellw = ncellw;
    this.ncellh = ncellh;
    this.x = loc[0];
    this.y = loc[1];
    this.size = size;

    // create elements in grid
    this.boxes = [];
    for (var i=0; i < ncellw; i++) {
        for (var j=0; j < ncellh; j++) {
            this.boxes.push( new ShapeBox(i,j,this.x,this.y,this.size) );
        }
    }
    // draw the grid
    this.draw = function() {
        for (var i=0; i<this.boxes.length; i++) {
            this.boxes[i].draw();
        }

        // draw grid lines
        c = stage.getContext("2d");
        c.save();
        c.strokeStyle = GRID_LINE_COLOR_SHAPESET;
        c.lineWidth = 2.;
        c.lineCap = "round";
        for (var i=0; i<(this.ncellw+1); i++) {
            x = this.x + this.size*i;
            y = this.y
            c.moveTo(x, y);
            c.lineTo(x, y+this.ncellh*this.size);
            c.stroke();
        };
        for (var i=0; i<(this.ncellh+1); i++) {
            x = this.x;
            y = this.y+this.size*i;
            c.moveTo(x, y);
            c.lineTo(x+this.ncellw*this.size, y);
            c.stroke();
        };
        c.restore();
    };
};



function Box (i,j) {
    var repeat = false;
    this.i = i;
    this.j = j;
    this.x = MARGINW+CELLW*i;
    this.y = MARGINH+CELLH*j;
    this.state = -1; // -1 for unclicked, otherwise state should be the board value
    this.locked = false;
    this.error = false;

    this.click = function() {
        if (this.state==-1) {
            
            var bval = board[this.i][this.j];

            /* check if this location occurs in an interference zone */
            if (INTERFERENCE && bval>0) {
                
                // get board values at adjacent locations
                var loc = []
                if (this.i>0) {
                    loc.push(board[this.i-1][this.j])
                };
                if (this.i<(NCELLW-1)) {
                    loc.push(board[this.i+1][this.j]);
                };
                if (this.j>0) {
                    loc.push(board[this.i][this.j-1]);
                };
                if (this.j<(NCELLH-1)) {
                    loc.push(board[this.i][this.j+1]);
                };

                // check whether any other shapes are adjacent
                //if (bval==3) {
                //    arr = [1, 2];
                //} else {
                //    arr = [3];
                //};
                
                var arr = range(4);
                arr.splice(bval, 1);
                arr.splice(0, 1);
                var adj = false;
                for (var i=0; i<arr.length; i++) {
                    if (loc.indexOf(arr[i])!=-1) {
                        adj = true;
                    };
                };

                /* now flip a coin to see if interference happens */
                if (adj && Math.random()<.5) {
                    var arr = range(4);
                    arr.splice(bval,1);
                    //console.log(arr);
                    newval = arr.sample(1)[0];
                    //console.log(['newval', newval]);
                    bval = newval;
                };
            };

            output(["GAME", gameindex, "sample",this.i,this.j,bval]);

            this.state = bval;
            c = stage.getContext("2d");
            c.fillStyle = OBJECT_COLORS[bval];
            c.fillRect(this.x+1, this.y+1, CELLW-2, CELLH-2);

            nsamples += 1;
            pauseSampling(stage, SAMPLE_DELAY);
            return false;
    
        } else {
            return true;
        }
        //return repeat;
    }

    // paint this box if it isn't locked
    this.paint = function(ind) {
        if (!this.locked) {
            if (this.state > 0) {
                if (this.state!=(ind+1)) {
                    this.state = (ind+1);
                } else {
                    this.state = 0;
                }
            } else {
                this.state = ind+1;
            }
            
            c = stage.getContext("2d");
            if (this.state==0) {
                c.fillStyle = GRID_COLOR;
            } else {
                c.fillStyle = PAINT_COLORS[ind+1];
            }
            c.fillRect(this.x+1, this.y+1, CELLW-2, CELLH-2);
        }
    }

    this.show = function() {
        var bval = board[this.i][this.j];
        this.state = bval;
        c = stage.getContext("2d");
        c.fillStyle = OBJECT_COLORS[board[this.i][this.j]];
        c.fillRect(this.x, this.y, CELLW, CELLH);
    };

    this.draw = function() {
        c = stage.getContext("2d");

        // HIDDEN
        if (this.state==-1) {
            c.fillStyle = GRID_COLOR;
        } else {
            c.fillStyle = OBJECT_COLORS[board[this.i][this.j]];
        }
        c.fillRect(this.x+1, this.y+1, CELLW-2, CELLH-2);

        // QUERY STATE
        if (this.state==-2) {
            c.fillStyle = GRID_COLOR;
            c.beginPath();
            c.arc(this.x+CELLW/2, this.y+CELLH/2, 10, Math.PI*2, 0, true);
            c.closePath();
            c.fill();
        }

    };

    this.highlight = function(label, color) {

        var color = color || QUERY_COLOR;

        var tl = [this.x-1, this.y-1];
        var br = [this.x + CELLW, this.y + CELLH];

        c = stage.getContext("2d");
        c.beginPath();
        c.lineWidth = "4";
        c.strokeStyle = color;
        c.moveTo(tl[0], tl[1]);
        c.lineTo(br[0], tl[1]);
        c.lineTo(br[0], br[1]);
        c.lineTo(tl[0], br[1]);
        c.lineTo(tl[0], tl[1]);
        c.stroke();

        if (label!=undefined) {
            c.font="40px Arial";
            c.fillStyle = color;
            c.fillText(label, this.x+6, this.y+CELLH-5);
        };

    };

    this.drawerrors = function() {
        c = stage.getContext("2d");
        if (this.state > 0) {
            c.fillStyle = OBJECT_COLORS[this.state];
            c.fillRect(this.x+1, this.y+1, CELLW-2, CELLH-2);
        };

        if (this.error) {
            bval = board[this.i][this.j];
            var offset = 7;

            c.lineCap = "round";
            c.beginPath();
            c.moveTo(this.x+offset,this.y+offset);
            c.lineTo(this.x+offset+CELLW-(2*offset),this.y+offset+CELLH-(2*offset));
            c.moveTo(this.x+offset,this.y+offset+CELLH-(2*offset));
            c.lineTo(this.x+offset+CELLW-(2*offset),this.y+offset);
            c.strokeStyle = OBJECT_COLORS[bval];
            c.lineWidth = 4;
            c.stroke();
        }
    }
}



function Grid (ncellw, ncellh) {
    /* 
     * Create the grid for display
     */
    this.ncellw = ncellw;
    this.ncellh = ncellh;
    this.locked = false;

    // create elements in grid
    this.boxes = [];
    for (var i=0; i < ncellw; i++) {
        for (var j=0; j < ncellh; j++) {
            this.boxes.push( new Box(i,j) );
        }
    }

    // read off the state
    this.state = function() {
        st = [];
        for (var i=0; i<this.boxes.length; i++) {
            st.push( this.boxes[i].state );
        };
        return st;
    };

    // lock the state of already sampled squares
    this.lock = function() {
        for (var i=0; i<this.boxes.length; i++) {
            if (this.boxes[i].state > -1) { this.boxes[i].locked = true; }
        }
        
    };

    this.show = function() {
        c = stage.getContext("2d");
        c.beginPath();
        for (var i=0; i<this.boxes.length; i++) {
            this.boxes[i].show(); 
        };
    };

    // draw the grid
    this.draw = function() {
        for (var i=0; i<this.boxes.length; i++) {
            this.boxes[i].draw();
        };
    };

    this.clickloc = function(event) {
        var pos = mousePos(stage, event);
        var xoff = pos[0];
        var yoff = pos[1];
        var i, j;
        if (xoff>MARGINW && yoff>MARGINH && xoff<=(STAGEWIDTH-MARGINW) && yoff<=(STAGEHEIGHT-MARGINH) && stage.style.cursor=="auto") {
            i = Math.floor((xoff-MARGINW)/CELLW);
            j = Math.floor((yoff-MARGINH)/CELLH);
        };
        return [i, j];
    };

    // handle clicks
    this.clickevent = function(event) {
        var err = true;
        var pos = mousePos(stage, event);
        var xoff = pos[0];
        var yoff = pos[1];
        var i, j;
        if (xoff>MARGINW && yoff>MARGINH && xoff<=(STAGEWIDTH-MARGINW) && yoff<=(STAGEHEIGHT-MARGINH) && stage.style.cursor=="auto") {
            i = Math.floor((xoff-MARGINW)/CELLW);
            j = Math.floor((yoff-MARGINH)/CELLH);
            err = this.boxes[i*NCELLH+j].click();
        };

        return err;
    };

    this.paintevent = function(event, ind) {
        //var xoff = event.offsetX;
        //var yoff = event.offsetY;
        var pos = mousePos(stage, event);
        var xoff = pos[0];
        var yoff = pos[1];
        
        if (xoff>MARGINW && yoff>MARGINH && xoff<=(STAGEWIDTH-MARGINW) && yoff<=(STAGEHEIGHT-MARGINH)) {
            var i = Math.floor((xoff-MARGINW)/CELLW);
            var j = Math.floor((yoff-MARGINH)/CELLH);
            err = this.boxes[i*NCELLH+j].paint(ind);
        }
    }

    // get score
    this.score = function() {
        var errors = 0;
        for (var i=0; i<this.boxes.length; i++) {
            bval = board[this.boxes[i].i][this.boxes[i].j]
            var state = this.boxes[i].state;
            if (((state==-1 && bval>0) || (state>-1 && state!=bval)) && this.boxes[i].locked==false) {
                this.boxes[i].error = true;
                //this.boxes[i].drawerrors();
                errors += 1;
            };

            // revert any inconsistent feedback to true value
            if (this.boxes[i].locked && state>-1 && state!=bval) {
                this.boxes[i].state = bval;
            };
            this.boxes[i].drawerrors();
        };
        return errors;
    };
}


function drawGridLines() {
    c = stage.getContext("2d");
    c.strokeStyle = GRID_LINE_COLOR;
    c.lineWidth = 2.;
    c.lineCap = "round";
    for (var i=0; i<(NCELLW+1); i++) {
        x = MARGINW+CELLW*i;
        c.moveTo(x, MARGINH);
        c.lineTo(x, MARGINH+CELLH*NCELLH);
        c.stroke();
    };
    for (var i=0; i<(NCELLH+1); i++) {
        y = MARGINH+CELLH*i;
        c.moveTo(MARGINW, y);
        c.lineTo(MARGINW+CELLW*NCELLW, y);
        c.stroke();
    };
    return;
};

