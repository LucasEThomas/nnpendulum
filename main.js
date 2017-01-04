var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', {
    preload: preload,
    create: create,
    update: update
});

function preload() {

    game.load.image('ball', 'projectileRed.png');

}

var spriteCart;
var spriteBob;
var cursors;

var velocityX = 0;
var network = new synaptic.Architect.LSTM(4, 25, 25, 25, 5);

function create() {

    //	Enable p2 physics
    game.physics.startSystem(Phaser.Physics.P2JS);
    game.physics.p2.gravity.y = 300;

    //  Add 2 sprites which we'll join with a spring
    spriteCart = game.add.sprite(400, 300, 'ball');
    spriteBob = game.add.sprite(400, 400, 'ball');

    spriteBob.scale.setTo(5, 5);

    game.physics.p2.enable([spriteCart, spriteBob]);

    var constraint = game.physics.p2.createDistanceConstraint(spriteCart, spriteBob, 150);

    text = game.add.text(20, 20, 'move with arrow keys', {
        fill: '#ffffff'
    });

    cursors = game.input.keyboard.createCursorKeys();

    var line = new Phaser.Line(spriteCart.x, spriteCart.y, spriteBob.x, spriteBob.y);

}

var counter = 0;
var direction = 1;
var interval = 30

var prevInput = [0.5, 0.5, 0.5, 0.5, 1];

function update() {

    spriteCart.body.setZeroVelocity();
    spriteCart.body.y = 300;

    //velocityX = 0;

    if (cursors.left.isDown) {
        velocityX = -400;
    } else if (cursors.right.isDown) {
        velocityX = 400;
    }
    
    interval = ((interval + 1) % 50) + 1;
    
    counter = (counter + 1) % interval;
    
    var input = [spriteCart.x / 800, spriteBob.x / 800, spriteBob.y / 600];
    var output = network.activate(input);
    if(counter === 0){
        velocityX = 300 + Math.random() * 100;
        velocityX *= direction;
        direction *= -1;
    }
    
    spriteCart.body.moveRight(velocityX);

    // learn
    var learningRate = 0.7;
    
    let score = computeScore();
    
    var target = [...input, score];
    network.propagate(learningRate, target);
    prevInput = input;
    
    text.setText('error: ' + ((output[4] - target[4]) * 100) + '\noutput: ' + output[4] + '\ntarget: ' + target[4]);

}

function computeScore() {
    let distY = spriteCart.y - spriteBob.y;

    let pendulumScore = (distY + 150) / 300

    let totalScore = pendulumScore * (1 - (Math.abs(spriteCart.x - 400) / 400))

    return totalScore;
}

function queryNNModelForOptimalDecision(NN, dataPoints){
    let winner  = [0.0, 0]; //[ winning score, index that won ]
    
    
}