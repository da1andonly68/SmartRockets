var rocket;
var population;
var lifeSpan = 400;
var lifeP;
var count = 0;
var target;
var maxForce = 0.1;

const obstacle = {
    rx: 100,
    ry: 150,
    rw: 200,
    rh: 10,
}


function setup(){
    createCanvas(400, 300);
    population = new Population();
    lifeP = createP();
    target = createVector(width/2, 50);
}

function draw(){
    background(0);
    population.run();
    lifeP.html(count);
    count++;
    if(count === lifeSpan){
        population.evaluate();
        population.selection();
        count = 0;
    }
    fill(255);
    rect(100, 150, 200, 10);
    ellipse(target.x, target.y, 16, 16)
}

function Population(){
    this.rockets = [];
    this.popSize = 25;
    this.matingPool = [];
    for(var i = 0; i < this.popSize; i++){
        this.rockets[i] = new Rocket();
    }
    this.run = () =>{
        for(var i = 0; i < this.popSize; i++){
            this.rockets[i].update();
            this.rockets[i].show();
        }
    }
    this.evaluate = () => {
        var maxFit = 0;
        for(var i = 0; i < this.popSize; i++){
            this.rockets[i].calculateFitness();
            if(this.rockets[i].fitness > maxFit){
                maxFit = this.rockets[i].fitness;
            }
        }
        console.log("Maximum Fitness: " + maxFit);
        //Normalize fitness values
        for(var i = 0; i < this.popSize; i++){
            this.rockets[i].fitness /= maxFit;        
        }


        this.matingPool = [];
        for(var i = 0; i < this.popSize; i++){
            var n = this.rockets[i].fitness * 100;
            for(var j = 0; j < n; j++){
                this.matingPool.push(this.rockets[i]);
            }
        }
    }
    
    this.selection = () =>{
        var newRockets = [];
        for(var i = 0; i < this.rockets.length; i++){
            var parentA = random(this.matingPool).dna;
            var parentB = random(this.matingPool).dna;
            var child = parentA.crossOver(parentB);
            child.mutation();
            newRockets[i] = new Rocket(child);
        }
        this.rockets = newRockets;
    }
}

function DNA(genes){
    if(genes){
        this.genes = genes;
    }else{
        //Make random DNA
        this.genes = [];
        for(var i = 0; i < lifeSpan; i++){
            this.genes[i] = p5.Vector.random2D();
            this.genes[i].setMag(maxForce);
        }
    }

    this.crossOver = (partner) => {
        var newGenes = [];
        var mid = floor(random(this.genes.length));
        for(var i = 0; i < this.genes.length; i++){
            if(i > mid){
                newGenes[i] = this.genes[i];
            }else{
                newGenes[i] = partner.genes[i];
            }
        }
        return new DNA(newGenes);
    }

    this.mutation = () => {
        for(var i = 0; i < this.genes.length; i++){
            if(random(1) < 0.01){
                this.genes[i] = p5.Vector.random2D();
                this.genes[i].setMag(maxForce);
            }
        }
    }
}


function Rocket(dna){
    this.pos = createVector(width/2, height);
    this.vel = createVector();
    this.acc = createVector();
    if(dna){
        this.dna = dna;
    }else{
        this.dna = new DNA();
    }
    this.fitness = 0;
    this.completed = false;
    this.travelTime = lifeSpan;
    this.crashed = false;
    this.pastObstacle = false;

    this.applyForce = (force) => {
        this.acc.add(force);
    }

    this.update = () => {
        if(this.pos.x > obstacle.rx && this.pos.x < obstacle.rx + obstacle.rw && this.pos.y > obstacle.ry && this.pos.y < obstacle.ry + obstacle.rh){
            this.crashed = true;
        }
        if(this.pos.y < obstacle.rh + obstacle.ry && !this.crashed){
            this.pastObstacle = true;
        }
        if(this.pos.x > width || this.pos.x < 0){
            this.crashed = true;
        }
        if(this.pos.y > height || this.pos.y < 0){
            this.crashed = true;
        }
        var d = dist(this.pos.x, this.pos.y, target.x, target.y);
        if(d < 10){
            if(this.completed === false){
                this.travelTime -= count;
            }
            this.completed = true;
            this.pos = target.copy();
        }else{
            if(this.crashed === false){
                this.applyForce(this.dna.genes[count]);
                this.count++;
                this.vel.add(this.acc);
                this.pos.add(this.vel);
                this.acc.mult(0);
            }
        }
    }

    this.show = () =>{
        push();
        noStroke();
        fill(255, 150);//White and translucent
        translate(this.pos.x, this.pos.y);
        rotate(this.vel.heading());//rotate to vector angle
        rect(0, 0, 25, 5);
        pop();
    }

    this.calculateFitness = () => {
        var d = dist(this.pos.x, this.pos.y, target.x, target.y);
        this.fitness = map(d, 0, width, width, 0);
        if(this.completed){
            this.fitness *= 2;
            this.fitness += (lifeSpan / this.travelTime) * 10; 
            if(this.fitness >= 800){
                console.log(this.fitness);
                console.log(this.travelTime);
            }
        }
        if(this.crashed){
            this.fitness /= 10;
        }
        if(this.pastObstacle){
            this.fitness += 100;
        }
    }
}