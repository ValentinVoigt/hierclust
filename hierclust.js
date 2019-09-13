var clusters = [];
var highlight;

const settingsRect = [0, 0, 200, 200];

class Cluster  {
	
	constructor(points, color, idx) {
		this.points = points;
		this.color = color;
		this.idx = idx;

		this._center = null;
	}
	
	draw() {
		noStroke();
		fill(this.color);
		for (let point of this.points) {
			circle(point.x, point.y, 8);
		}
	}
	
	getCenter() {
		if (!this._center) {
			let x = this.points.reduce((l, p) => l+p.x, 0) / this.points.length;
			let y = this.points.reduce((l, p) => l+p.y, 0) / this.points.length;
			this._center = createVector(x, y);
		}
		return this._center;
	}
	
	getDistance(cluster) {
		let dx = this.getCenter().x - cluster.getCenter().x;
		let dy = this.getCenter().y - cluster.getCenter().y;
		return Math.sqrt(dx**2 + dy**2);
	}

	merge(cluster) {
		this.points = this.points.concat(cluster.points);
		this._center = null;
	}
	
	getSize() {
		let diffs = this.points.map((p) => p5.Vector.sub(this.getCenter(), p));
		return diffs.reduce((max, cur) => cur.mag() > max ? cur.mag() : max, 0);
	}

}

function getNthColor(n) {
	var colors = [[0, 0], [1, 3], [2, 3], [1, 6], [3, 6], [5, 6]];
	let base = colors[n % colors.length];
	let h = (base[0] == 0) ? 0 : base[0] / base[1];
	let s = 1 - Math.tanh(n / colors.length / 2);
	return color(h, s, 1);
}

function getTwoNearestClusters() {
	let result = null;
	let minDstance = Infinity;

	for (let cluster1 of clusters) {
		for (let cluster2 of clusters) {
			if (cluster1 === cluster2)
				continue;
			let thisDistance = cluster1.getDistance(cluster2);
			if (thisDistance < minDstance) {
				result = [cluster1, cluster2];
				minDstance = thisDistance;
			}
		}
	}
	
	return result;
}

function onStepClick() {
	if (clusters.length < 2)
		return;
	
	let [cluster1, cluster2] = getTwoNearestClusters();
	
	// Always merge the higher cluster index into a lower one
	// --> leads to nicer colors at the end
	if (cluster2.idx < cluster1.idx) {
		[cluster1, cluster2] = [cluster2, cluster1];
	}
	
	cluster1.merge(cluster2);
	clusters = clusters.filter((c) => c !== cluster2);
	highlight = cluster1;
}

function onSolveClick() {
	while (clusters.length > 3) {
		onStepClick();
	}
}

function getNextFreeIdx() {
	let idx = 0;
	for (let cluster of clusters) {
		if (cluster.idx != idx)
			break;
		idx++;
	}
	return idx;
}

function mouseClicked() {
	if (mouseX >= settingsRect[0] && mouseX <= settingsRect[2]
		&& mouseY >= settingsRect[1] && mouseY <= settingsRect[3]) 
		return false;

	let point = createVector(mouseX, mouseY);
	let idx = getNextFreeIdx();
	clusters.push(new Cluster([point], getNthColor(idx), idx));
	return false;
}

function loadDemo(n) {
	reset();

	let centers = [
		createVector(width / 2, height / 3),
		createVector(width / 3, 2 * height / 3),
		createVector(2 * width / 3, 2 * height / 3),
	];

	let centersIdx = 0;
	for (let center of centers) {
		for (let i = 0; i < n; i++) {
			let angle = TWO_PI * Math.random();
			let length = randomGaussian(0, 100);
			let point = p5.Vector.add(center, p5.Vector.fromAngle(angle, length));
			clusters.push(new Cluster([point], getNthColor(centersIdx + i), centersIdx + i));
		}
		centersIdx++;
	}
}

function reset() {
	clusters = [];
	highlight = null;
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	rectMode(CORNERS);
	colorMode(HSB, 1);
	
	let buttonReset = createButton('Reset');
	buttonReset.position(20, 20);
	buttonReset.mousePressed(reset);
	
	let buttonDemoSmall = createButton('Load small demo');
	buttonDemoSmall.position(20, 60);
	buttonDemoSmall.mousePressed(() => loadDemo(5));
	
	let buttonDemoLarge = createButton('Load large demo');
	buttonDemoLarge.position(20, 90);
	buttonDemoLarge.mousePressed(() => loadDemo(25));
	
	let buttonStep = createButton('Merge two nearest');
	buttonStep.position(20, 130);
	buttonStep.mousePressed(onStepClick);
	
	let buttonSolve = createButton('Merge until c=3');
	buttonSolve.position(20, 160);
	buttonSolve.mousePressed(onSolveClick);
}

function draw() {
	background(42/255);

	stroke(0);
	fill(84/255);
	rect.apply(this, settingsRect);

	for (let cluster of clusters) {
		cluster.draw();
	}
	
	if (highlight) {
		stroke(1, 0, 1);
		noFill();
		let center = highlight.getCenter();
		circle(center.x, center.y, 2 * highlight.getSize() + 10);
	}
}
