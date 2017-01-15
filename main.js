console.log('begin');

var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', {
    preload: preload,
    create: create,
    update: update
});

function preload() {
console.log('preload');
    game.load.image('bob', 'assets/bob.png');
    game.load.image('cart', 'assets/cart.png');
    game.load.image('background', 'assets/background.png');
    game.load.image('ground', 'assets/ground.png');
}

var lineGraphics;
var spriteCart;
var spriteBob;
var cursors;

// "Always two there are, a master and an apprentice."
var NNMaster = new synaptic.Architect.Perceptron(6, 10, 10, 10, 10, 10,  1);

//var NNApprentice = new synaptic.Architect.LSTM(4, 25, 25, 25, 5);
console.log('beforeCreate');
function create() {
    
    let spriteBackground = game.add.sprite(0, 0, 'background');
    spriteBackground.width = 800;
    spriteBackground.height = 600;
    game.add.sprite(40, 340, 'ground').scale.setTo(0.90, 1);

    text = game.add.text(20, 20, 'filling up data queue...', {
        fill: '#22aa55',
        font: '32px monospace'
    });
    
    //	Enable p2 physics
    game.physics.startSystem(Phaser.Physics.P2JS);
    game.physics.p2.gravity.y = 300;

    //  Add 2 sprites which we'll join with a spring
    spriteCart = game.add.sprite(400, 300, 'cart');
    lineGraphics = game.add.graphics(0, 0);
    spriteBob = game.add.sprite(400, 400, 'bob');

    game.physics.p2.enable([spriteCart, spriteBob]);
    spriteBob.body.fixedRotation = true;
    spriteCart.body.fixedRotation = true;

    var constraint = game.physics.p2.createDistanceConstraint(spriteCart, spriteBob, 150);

    cursors = game.input.keyboard.createCursorKeys();

    //var line = new Phaser.Line(spriteCart.x, spriteCart.y, spriteBob.x, spriteBob.y);
    console.log('created');
}

// How far in the past do we want our nn to live?
var temporalOffset = 150;
var prevInputs = [[0,0,0,0,0,0]];
var prevScores = [0];


function update() {
    
    //keep the cart on a horizontal line
    spriteCart.body.setZeroVelocity();
    spriteCart.body.y = 300;

    //the scenario vector
    let input = [0, spriteCart.x / 800, spriteBob.x / 800, spriteBob.y / 600, spriteBob.body.velocity.x / 3000, spriteBob.body.velocity.y / 3000]
    
    //our one control parameter
    //use master to find out what to do.
    let predictedOptimumCartVelocity = (queryNNMasterToOptimizeScore(input, NNMaster) - 0.5) * 800;
    let velocityX = predictedOptimumCartVelocity;
    //manual override just in case we want to throw it a curveball
    if (cursors.left.isDown) {
        velocityX = -400;
    } else if (cursors.right.isDown) {
        velocityX = 400;
    } else if (cursors.down.isDown) {
        velocityX = 0;
    } else if (cursors.up.isDown) {
        velocityX = (Math.random() - 0.5) * 800;
    }
    
    
    prevInputs.unshift(input);

    // master nn learns to predict what the current score will be given the previous data point.
    let currentScore = computeCurrentScore();
    prevScores.unshift(currentScore);
    let aggrigateScore = computeAggregateScore();
    //console.log(aggrigateScore);
    
    //wait for the data queue to fill up before learning from it!
    if(prevInputs.length === temporalOffset){
        //run master neural net in the past, and train it to predict the average score
        let output = NNMaster.activate(prevInputs[temporalOffset - 1]);
        NNMaster.propagate(0.5, [aggrigateScore]); // (learning rate = 0.4, [target])
        prevScores.pop();
        prevInputs.pop();
        
        //display some data
        text.setText(
`predictedScore: ${output[0]}
actualScore:    ${aggrigateScore}
error:          ${Math.abs(output[0] - aggrigateScore)}
predicted best cart velocity: ${predictedOptimumCartVelocity}`
        );
    }
    
    
    //perform operation on the system
    spriteCart.body.moveRight(velocityX);
    drawAestheticPendulumLine(spriteCart.x, spriteCart.y, spriteBob.x, spriteBob.y);
}

function computeCurrentScore() {
    let distY = spriteCart.y - spriteBob.y;

    let pendulumScore = (distY + 150) / 300

    let totalScore = pendulumScore * (1 - (Math.abs(spriteCart.x - 400) / 400))

    return totalScore;
}

function computeAggregateScore() {
    let aggrigateScore = 0;
    for(let i = 0; i < prevScores.length; i++){
        aggrigateScore = aggrigateScore + prevScores[i];
    }
    return aggrigateScore / prevScores.length;
}

function queryNNMasterToOptimizeScore(dataPoints, NN){
    let winner  = [0.0, 0.0]; //[ winning score, control variable value that won ]
    
    for(let i = 0; i <= 1; i+=0.1){
        dataPoints[0] = i;
        let output = NN.activate(dataPoints);
        if(output > winner[0]){
            winner = [output, i];
        }
    }
    dataPoints[0] = winner[1];
    
    return winner[1];
}

function drawAestheticPendulumLine(startx, starty, endx, endy){
        // set a fill and line style
    lineGraphics.clear();
    lineGraphics.beginFill(0xFF3300);
    lineGraphics.lineStyle(10, 0x444444, 1);
    
    // draw a shape
    lineGraphics.moveTo(startx,starty);
    lineGraphics.lineTo(endx, endy);
    lineGraphics.endFill();
}