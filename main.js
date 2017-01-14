console.log('begin');

var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', {
    preload: preload,
    create: create,
    update: update
});

function preload() {
console.log('preload');
    game.load.image('ball', 'projectileRed.png');

}

var spriteCart;
var spriteBob;
var cursors;

// "Always two there are, a master and an apprentice."
var NNMaster = new synaptic.Architect.Perceptron(6, 10, 10, 10, 10, 10, 10, 1);

//var NNApprentice = new synaptic.Architect.LSTM(4, 25, 25, 25, 5);
console.log('beforeCreate');
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

    //var line = new Phaser.Line(spriteCart.x, spriteCart.y, spriteBob.x, spriteBob.y);
console.log('created')
}

var prevInput = [0.5, 0.5, 0.5, 0.5, 0.5, 1];

function update() {
    
    //keep the cart on a horizontal line
    spriteCart.body.setZeroVelocity();
    spriteCart.body.y = 300;

    //the scenario vector
    let input = [0, spriteCart.x / 800, spriteBob.x / 800, spriteBob.y / 600, spriteBob.body.velocity.x / 3000, spriteBob.body.velocity.y / 3000]
    
    //our one control parameter
    //use master to find out what to do.
    let velocityX = (queryNNMasterToOptimizeScore(input, NNMaster) - 0.5) * 800;
    console.log(velocityX);
    
    //manual override just in case we want to throw it a curveball
    if (cursors.left.isDown) {
        velocityX = -400;
    } else if (cursors.right.isDown) {
        velocityX = 400;
    } else if (cursors.down.isDown) {
        velocityX = 0;
    }
    
    input[0] = (velocityX / 801) + 0.5;
    
    //run master neural net on the previous input
    let output = NNMaster.activate(prevInput);
    prevInput = input;

    // master nn learns to predict what the current score will be given the previous data point.
    let score = computeScore();
    NNMaster.propagate(0.4, [score]); // (learning rate = 0.7, [target])
    
    //perform operation on the system
    spriteCart.body.moveRight(velocityX);
    
    //display some data
    //text.setText('error: ' + ((output[0] - target[0]) * 100) + '\noutput: ' + output[0] + '\ntarget: ' + target[0]);

}

function computeScore() {
    let distY = spriteCart.y - spriteBob.y;

    let pendulumScore = (distY + 150) / 300

    let totalScore = pendulumScore * (1 - (Math.abs(spriteCart.x - 400) / 400))

    return totalScore;
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
    
    return winner[1];
}