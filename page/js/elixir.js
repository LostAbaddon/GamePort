const ControllerHeight = 0;
const Rate = 1;
const LaunchDistance = 100;
const HalfPI = Math.PI / 2;
const SQRT3 = Math.sqrt(3);
const SIN120 = Math.sin(Math.PI / 3 * 2);
const COS120 = Math.cos(Math.PI / 3 * 2);

// 循环规则：水木火土金，一个轮回后进入灵，然后随机进入下一个循环或变成圣或魔
const ElementColor = [
	'black',
	'rgb(176, 213, 223)', // 水
	'rgb(27, 167, 132)', // 木
	'rgb(238, 63, 77)', // 火
	'rgb(140, 75, 49)', // 土
	'rgb(252, 210, 23)', // 金
	'rgb(241, 240, 237)', // 灵
	'rgb(128, 29, 174)', // 魔
];

const GameConfig = {
	size: 4,
	poly: 4,
	defaultElement: 0,
	deltaX: 0,
	deltaY: 0,
	saintCount: 0, // 允许圣的数量。第一个圣为把一切化为圣，第二个圣为转化为相邻元素。
	devilCount: 0, // 允许魔的数量。第一个魔为把一切化为魔，第二个魔在第一个的基础上增加了不会移动的特点。
	rotateAng: 0, // 旋转角度
	totalLength: 0, // 总边长
	blockLength: 0, // 块边长
	blockPoly: 4, // 块边数
	blockStepX: 0,
	blockStepY: 0,
	area: [],
	pause: false,
	task: null,
};

class Logos {
	element = 0; // 0表示没有；五行元素：金木水火土，循环变化。允许圣和魔时会在每一轮切换时随机选择是否变成其中之一。
	level = 0; // 循环阶数，影响转换为圣魔的概率。
	step = 0;
	material = '';

	currX = 0;
	currY = 0;
	posX = 0;
	posY = 0;
	blkAng = 0;
	blkLen = 0;

	constructor (element, y, x, saintCount=0, devilCount=0) {
		this.element = element;
		this.currX = x;
		this.lastX = x;
		this.currY = y;
		this.lastY = y;
		this.saintCount = saintCount;
		this.devilCount = devilCount;

		this.update();
	}
	update () {
		if (GameConfig.poly === 3) {
			this.posX = (this.currX - this.currY + GameConfig.size) * GameConfig.blockStepX + GameConfig.deltaX
				+ GameConfig.totalLength - GameConfig.totalLength / 2 * SQRT3;
			this.posY = (this.currY + 0.5) * GameConfig.blockStepY + GameConfig.deltaY
				+ GameConfig.blockLength / 4;
			if (isEven(this.currX)) {
				this.blkAng = Math.PI;
			}
			else {
				this.blkAng = 0;
				this.posY -= GameConfig.blockLength / 2;
			}
		}
		else if (GameConfig.poly === 6) {
			this.posX = (this.currX - this.currY + GameConfig.size) * GameConfig.blockStepX + GameConfig.deltaX
				- GameConfig.totalLength / 2;
			this.posY = this.currY * GameConfig.blockStepY + GameConfig.deltaY
				+ GameConfig.totalLength - GameConfig.totalLength / 2 * SQRT3 + GameConfig.blockLength;
			if (this.currY < GameConfig.size / 2) {
				if (isEven(this.currX)) {
					this.blkAng = Math.PI;
				}
				else {
					this.blkAng = 0;
					this.posY -= GameConfig.blockLength / 2;
				}
			}
			else {
				this.posX += (1 + this.currY * 2 - GameConfig.size) * GameConfig.blockStepX;
				if (!isEven(this.currX)) {
					this.blkAng = Math.PI;
				}
				else {
					this.blkAng = 0;
					this.posY -= GameConfig.blockLength / 2;
				}
			}
		}
		else if (GameConfig.blockPoly === 4) {
			this.posX = (this.currX + 0.5) * GameConfig.blockStepX + GameConfig.deltaX;
			this.posY = (this.currY + 0.5) * GameConfig.blockStepY + GameConfig.deltaY;
			this.blkAng = HalfPI / 2;
		}
	}
	draw () {
		if (this.element === 0) return;
		drawPoly(
			this.posX, this.posY,
			GameConfig.blockLength, GameConfig.blockPoly, this.blkAng,
			ElementColor[this.element], 'white',
			'black', 30, this.level
		);
	}
}

var canvas, ctx;

const pickInt = total => Math.floor(Math.random() * total);
const isEven = num => num === (num >> 1) << 1;

const drawLine = (x1, y1, x2, y2, b, w, s) => {
	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.fillStyle = '';
	ctx.setLineDash(s || []);
	ctx.strokeStyle = b || 'white';
	ctx.lineWidth = w || 1;
	ctx.stroke();
};
const drawPoly = (x, y, r, n, a, c, b, t, w, p) => {
	var ang = Math.PI * 2 / n;
	var nx, ny, mx, my;
	ctx.beginPath();
	nx = x + r * Math.sin(a);
	ny = y + r * Math.cos(a);
	ctx.moveTo(nx, ny);
	for (let i = 1; i < n; i ++) {
		mx = x + r * Math.sin(a + ang * i);
		my = y + r * Math.cos(a + ang * i);
		ctx.lineTo(mx, my);
	}
	ctx.lineTo(nx, ny);
	ctx.closePath();
	ctx.fillStyle = c || 'white';
	ctx.fill();
	ctx.setLineDash([]);
	ctx.strokeStyle = b || 'black';
	ctx.lineWidth = 3;
	ctx.stroke();

	if (!!p) {
		ctx.fillStyle = t;
		p = p + '';
		var l = p.length;
		w = w || 60;
		ctx.font = w + 'px Arial';
		ctx.fillText(p, x - l * w * 3 / 10, y + w / 3);
	}
};
const drawArea = () => {
	drawPoly(500 + GameConfig.deltaX, 500 + GameConfig.deltaY, GameConfig.totalLength, GameConfig.poly, GameConfig.rotateAng, 'black', 'white', 'black', '');

	if (GameConfig.poly === 3) {
		let bottom = 500 - GameConfig.totalLength;
		let step = GameConfig.totalLength * 1.5 / GameConfig.size;
		let half = GameConfig.totalLength / 2 * Math.sqrt(3);
		let dotStyle = [10, 10];
		for (let i = 1; i < GameConfig.size; i ++) {
			let p = bottom + i * step;
			let l = 500 - half / GameConfig.size * i;
			let r = 500 + half / GameConfig.size * i;

			let x1 = l, y1 = p, x2 = r, y2 = p;
			drawLine(x1 + GameConfig.deltaX, y1 + GameConfig.deltaY, x2 + GameConfig.deltaX, y2 + GameConfig.deltaY, 'white', 2, dotStyle);
			x1 -= 500;
			y1 -= 500;
			x2 -= 500;
			y2 -= 500;
			let rx1 = x1 * COS120 + y1 * SIN120;
			let ry1 = y1 * COS120 - x1 * SIN120;
			let rx2 = x2 * COS120 + y2 * SIN120;
			let ry2 = y2 * COS120 - x2 * SIN120;
			rx1 += 500;
			ry1 += 500;
			rx2 += 500;
			ry2 += 500;
			drawLine(rx1 + GameConfig.deltaX, ry1 + GameConfig.deltaY, rx2 + GameConfig.deltaX, ry2 + GameConfig.deltaY, 'white', 2, dotStyle);
			rx1 = x1 * COS120 - y1 * SIN120;
			ry1 = y1 * COS120 + x1 * SIN120;
			rx2 = x2 * COS120 - y2 * SIN120;
			ry2 = y2 * COS120 + x2 * SIN120;
			rx1 += 500;
			ry1 += 500;
			rx2 += 500;
			ry2 += 500;
			drawLine(rx1 + GameConfig.deltaX, ry1 + GameConfig.deltaY, rx2 + GameConfig.deltaX, ry2 + GameConfig.deltaY, 'white', 2, dotStyle);
		}
	}
	else if (GameConfig.poly === 4) {
		let areaSize = GameConfig.totalLength * Math.sqrt(2);
		let blockSize = areaSize / GameConfig.size;
		let half = areaSize / 2;
		let dotStyle = [10, 20];
		for (let i = 1; i < GameConfig.size; i ++) {
			let p = 500 - half + i * blockSize;
			drawLine(500 - half + GameConfig.deltaX, p + GameConfig.deltaY, 500 + half + GameConfig.deltaX, p + GameConfig.deltaY, 'white', 2, dotStyle);
			drawLine(p + GameConfig.deltaX, 500 - half + GameConfig.deltaY, p + GameConfig.deltaX, 500 + half + GameConfig.deltaY, 'white', 2, dotStyle);
		}
	}
	else if (GameConfig.poly === 6) {
		let size = GameConfig.size;
		let bottom = 500 - GameConfig.totalLength * SIN120;
		let step = GameConfig.totalLength * SIN120 * 2 / size;
		let half = GameConfig.totalLength;
		let dotStyle = [10, 10];
		for (let i = 1; i < size; i ++) {
			let p = bottom + i * step;
			let s = i / size;
			s = 1 - Math.abs(0.5 - s);
			let l = 500 - GameConfig.totalLength * s;
			let r = 500 + GameConfig.totalLength * s;

			let x1 = l, y1 = p, x2 = r, y2 = p;
			drawLine(x1 + GameConfig.deltaX, y1 + GameConfig.deltaY, x2 + GameConfig.deltaX, y2 + GameConfig.deltaY, 'white', 2, dotStyle);
			x1 -= 500;
			y1 -= 500;
			x2 -= 500;
			y2 -= 500;
			let rx1 = x1 * COS120 + y1 * SIN120;
			let ry1 = y1 * COS120 - x1 * SIN120;
			let rx2 = x2 * COS120 + y2 * SIN120;
			let ry2 = y2 * COS120 - x2 * SIN120;
			rx1 += 500;
			ry1 += 500;
			rx2 += 500;
			ry2 += 500;
			drawLine(rx1 + GameConfig.deltaX, ry1 + GameConfig.deltaY, rx2 + GameConfig.deltaX, ry2 + GameConfig.deltaY, 'white', 2, dotStyle);
			rx1 = x1 * COS120 - y1 * SIN120;
			ry1 = y1 * COS120 + x1 * SIN120;
			rx2 = x2 * COS120 - y2 * SIN120;
			ry2 = y2 * COS120 + x2 * SIN120;
			rx1 += 500;
			ry1 += 500;
			rx2 += 500;
			ry2 += 500;
			drawLine(rx1 + GameConfig.deltaX, ry1 + GameConfig.deltaY, rx2 + GameConfig.deltaX, ry2 + GameConfig.deltaY, 'white', 2, dotStyle);
		}
	}

	for (let i = 0; i < GameConfig.size; i ++) {
		let max = GameConfig.area[i].length;
		for (let j = 0; j < max; j ++) {
			let block = GameConfig.area[i][j];
			block.draw();
		}
	}
};

const laminarization = dir => {
	var arrays = [];
	var area = GameConfig.area;

	if (GameConfig.poly === 4) {
		// dir: 0: 左到右; 1: 右到左; 2: 上到下; 3: 下到上
		if (dir < 2) {
			for (let i = 0; i < GameConfig.size; i ++) {
				let line = [];
				for (let j = 0; j < GameConfig.size; j ++) {
					line[j] = area[i][j];
				}
				arrays[i] = line;
			}
		}
		else {
			for (let i = 0; i < GameConfig.size; i ++) {
				let line = [];
				for (let j = 0; j < GameConfig.size; j ++) {
					line[j] = area[j][i];
				}
				arrays[i] = line;
			}
		}
	}
	else if (GameConfig.poly === 3) {
		// dir: 0: 左到右; 1: 右到左; 2: 左上到右下; 3: 右下到左上; 4: 右上到左下; 5: 左下到右上
		if (dir < 2) {
			for (let i = 0; i < GameConfig.size; i ++) {
				let max = area[i].length;
				let line = [];
				for (let j = 0; j < max; j ++) {
					line[j] = area[i][j];
				}
				arrays[i] = line;
			}
		}
		else {
			let rev = dir > 3;
			for (let i = 0; i < GameConfig.size; i ++) {
				let max = i * 2 + 1;
				let x = GameConfig.size - 1 - i;
				let y = 0;
				let line = [];
				for (let j = 0; j < max; j ++) {
					line[j] = area[x][rev ? area[x].length - 1 - y : y];
					y ++;
					if (isEven(j)) x ++;
				}
				arrays[i] = line;
			}
		}
	}
	else if (GameConfig.poly === 6) {
		// dir: 0: 左到右; 1: 右到左; 2: 左上到右下; 3: 右下到左上; 4: 右上到左下; 5: 左下到右上
		if (dir < 2) {
			for (let i = 0; i < GameConfig.size; i ++) {
				let max = area[i].length;
				let line = [];
				for (let j = 0; j < max; j ++) {
					line[j] = area[i][j];
				}
				arrays[i] = line;
			}
		}
		else {
			let rev = dir > 3;
			let half = GameConfig.size / 2;
			for (let i = 0; i < GameConfig.size; i ++) {
				let max = area[i].length;
				let x, y, flip;
				x = half - i - 1;
				y = 0;
				flip = false;
				if (x < 0) {
					flip = true;
					x = 0;
					y = 2 * (i - half) + 1;
				}
				let line = [];
				for (let j = 0; j < max; j ++) {
					let array = area[x];
					if (!!array) line[j] = array[rev ? array.length - 1 - y : y];
					y ++;
					flip = !flip;
					if (flip) {
						x ++;
						if (x === half) y -= 1;
						if (x > half) y -= 2;
					}
				}
				arrays[i] = line;
			}
		}
	}

	if (!isEven(dir)) {
		arrays.reverse();
		arrays.forEach(line => line.reverse());
	}

	return arrays;
};
const dropNewElement = () => {
	var list = [];
	GameConfig.area.forEach(line => {
		line.forEach(block => {
			if (block.element === 0) list.push(block);
		});
	});
	if (list.length === 0) {
		gameOver(false);
		return;
	}
	var target = pickInt(list.length);
	target = list[target];
	target.element = GameConfig.defaultElement;
	target.level = 1;
};
const checkTask = () => {
	if (!GameConfig.task) return;

	console.log('>>>>>>>>>>>>>>>>>-----------------');
	var recipe = [], targets = [];
	GameConfig.task.recipe.forEach(t => targets.push(Object.assign({}, t)));
	GameConfig.area.forEach(list => {
		list.forEach(logo => {
			if (logo.element === 0) return;
			recipe.push({
				element: logo.element,
				level: logo.level
			});
		});
	});
	console.log(GameConfig.task);
	console.log(recipe);
};
const gameMove = dir => {
	var arrays = laminarization(dir);
	arrays.forEach(line => {
		var list = [], last = null;
		line.forEach(block => {
			if (block.element === 0) return;
			var info = {
				origin: block.element,
				element: block.element,
				level: block.level,
				step: block.step,
			};
			if (!!last) {
				if (last.origin === info.element) {
					last.level = Math.max(last.level, info.level);
					last.step ++;
					if (last.step < 5) { // 正常轮回
						if (last.element === 7) {
							last.step = 0;
						}
						else {
							last.element ++;
							if (last.element === 6) last.element = 1;
						}
					}
					else if (last.step === 5) { // 进入灵
						last.element = 6;
					}
					else {
						last.step = 0;
						last.level ++;
						let rate = last.level / (last.level + 1) / 2;
						if (Math.random() < rate) {
							last.element = 7;
						}
						else {
							last.element = GameConfig.defaultElement;
						}
					}
				}
				else {
					list.push(info);
					last = info;
				}
			}
			else {
				list.push(info);
				last = info;
			}
		});
		var len = list.length;
		if (len === 0) return;

		for (let i = 0; i < len; i ++) {
			line[i].element = list[i].element;
			line[i].level = list[i].level;
			line[i].step = list[i].step;
		}
		for (let i = len; i < line.length; i ++) {
			line[i].element = 0;
			line[i].level = 0;
			line[i].step = 0;
		}
	});

	drawArea();
	setTimeout(() => {
		GameConfig.pause = false;
		checkTask();
		dropNewElement();
		drawArea();
	}, 300);
};
const gameStart = (poly=GameConfig.poly, size=GameConfig.size, element=0, saint=0, devil=0) => {
	if (isNaN(size)) size = GameConfig.size;
	else if (size < 3) size = 3;
	else if (size > 10) size = 10;
	GameConfig.size = size;
	GameConfig.saintCount = saint;
	GameConfig.devilCount = devil;
	GameConfig.rotateAng = 0;
	GameConfig.poly = poly;
	GameConfig.blockPoly = 3;
	GameConfig.defaultElement = element;
	if (GameConfig.poly === 3) {
		GameConfig.rotateAng = Math.PI;
		GameConfig.totalLength = 500;
		GameConfig.blockLength = GameConfig.totalLength / GameConfig.size;
		GameConfig.blockStepX = GameConfig.blockLength / 2 * SQRT3;
		GameConfig.blockStepY = GameConfig.blockLength * 1.5;
		GameConfig.deltaX = 0;
		GameConfig.deltaY = 125;
	}
	else if (GameConfig.poly === 6) {
		GameConfig.size = 2 * Math.ceil(GameConfig.size / 2);
		GameConfig.rotateAng = HalfPI;
		GameConfig.totalLength = 500;
		GameConfig.blockLength = GameConfig.totalLength * 2 / GameConfig.size / SQRT3;
		GameConfig.blockStepX = GameConfig.blockLength / 2 * SQRT3;
		GameConfig.blockStepY = GameConfig.blockLength * 1.5;
		GameConfig.deltaX = 0;
		GameConfig.deltaY = 0;
	}
	else {
		GameConfig.rotateAng = Math.PI / 4;
		GameConfig.totalLength = 500 * Math.sqrt(2);
		GameConfig.blockStepX = 1000 / GameConfig.size;
		GameConfig.blockStepY = GameConfig.blockStepX;
		GameConfig.blockLength = GameConfig.totalLength / GameConfig.size;
		GameConfig.deltaX = 0;
		GameConfig.deltaY = 0;
		GameConfig.blockPoly = 4;
	}

	GameConfig.area.splice(0, GameConfig.area.length);
	for (let i = 0; i < size; i ++) {
		let max = size;
		if (GameConfig.poly === 3) {
			max = i * 2 + 1;
		}
		else if (GameConfig.poly === 6) {
			if (i < GameConfig.size / 2) max = i * 2 + 1 + GameConfig.size;
			else max = (GameConfig.size - i) * 2 + 5;
		}
		let list = [];
		for (let j = 0; j < max; j ++) {
			list[j] = new Logos(0, i, j, saint, devil);
		}
		GameConfig.area[i] = list;
	}

	dropNewElement();
	drawArea();
};
const gameOver = (success, info) => {
	console.log('>>>>', success, '::::', info);
};

const resize = () => {
	var width = document.body.clientWidth, height = document.body.clientHeight;
	height -= ControllerHeight;
	var w = height / Rate;
	if (w > width) {
		height = width * Rate;
	}
	else {
		width = w;
	}
	var h = height + ControllerHeight;

	var container = document.querySelector('div.container');
	container.style.width = width + 'px';
	container.style.height = h + 'px';

	canvas.style.width = width + 'px';
	canvas.style.height = height + 'px';
	canvas._width = width;
	canvas._height = height;
};
const init = () => {
	canvas = document.querySelector('div.container canvas');
	canvas.width = 1000;
	canvas.height = 1000 * Rate;
	ctx = canvas.getContext('2d', {alpha: false});

	var startX = 0, startY = 0, endX = 0, endY = 0, pause = false;
	const onMouseMove = () => {
		if (GameConfig.pause) return;
		GameConfig.pause = true;

		var deltaX = endX - startX;
		var deltaY = endY - startY;
		if (Math.abs(deltaX) <= LaunchDistance && Math.abs(deltaY) <= LaunchDistance) {
			GameConfig.pause = false;
			return;
		}

		var ang = Math.atan2(deltaX, deltaY) / Math.PI;
		var dir = 0;
		if (GameConfig.poly === 4) {
			if (ang >= 0.75 || ang < -0.75) dir = 2;
			else if (ang >= -0.25 && ang < 0.25) dir = 3;
			else if (ang >= -0.75 && ang < -0.25) dir = 0;
			else dir = 1;
		}
		else {
			if (ang >= 0 && ang < 0.3333) dir = 3;
			else if (ang >= -1 && ang < -0.6667) dir = 2;
			else if (ang >= -0.3333 && ang < 0) dir = 5;
			else if (ang >= 0.6667 && ang < 1) dir = 4;
			else if (ang >= -0.6667 && ang < -0.3333) dir = 0;
			else dir = 1;
		}

		gameMove(dir);
	};
	const onKeyDown = key => {
		if (GameConfig.pause) return;
		GameConfig.pause = true;

		if (key === 65) {
			gameMove(0);
		}
		else if (key === 68) {
			gameMove(1);
		}
		else if (GameConfig.poly === 4) {
			if (key === 87) {
				gameMove(2);
			}
			else if (key === 83) {
				gameMove(3);
			}
			else {
				GameConfig.pause = false;
			}
		}
		else {
			if (key === 81) {
				gameMove(2);
			}
			else if (key === 67) {
				gameMove(3);
			}
			else if (key === 69) {
				gameMove(4);
			}
			else if (key === 90) {
				gameMove(5);
			}
			else {
				GameConfig.pause = false;
			}
		}
	};
	canvas.addEventListener('mousedown', evt => {
		startX = evt.offsetX;
		startY = evt.offsetY;
	});
	canvas.addEventListener('mouseup', evt => {
		endX = evt.offsetX;
		endY = evt.offsetY;
		onMouseMove();
	});
	canvas.addEventListener('touchstart', evt => {
		if (evt.touches.length === 0) return;
		var touch = evt.touches[evt.touches.length - 1];
		startX = touch.clientX;
		startY = touch.clientY;
		evt.preventDefault();
	});
	canvas.addEventListener('touchmove', evt => {
		if (evt.touches.length === 0) return;
		var touch = evt.touches[evt.touches.length - 1];
		endX = touch.clientX;
		endY = touch.clientY;
	});
	canvas.addEventListener('touchend', evt => {
		onMouseMove();
		evt.preventDefault();
	});
	canvas.addEventListener('keydown', evt => {
		onKeyDown(evt.keyCode);
		evt.cancelable = true;
		evt.stopPropagation();
	});
	document.body.addEventListener('keydown', evt => {
		onKeyDown(evt.keyCode);
		evt.cancelable = true;
		evt.stopPropagation();
	});
	document.querySelector('div.container div.area').addEventListener('keydown', evt => {
		onKeyDown(evt.keyCode);
		evt.cancelable = true;
		evt.stopPropagation();
	});

	resize();
};

window.onresize = resize;
window.addEventListener('cacheUpdated', evt => {
	console.log('>>>>', evt);
});

init();

GameConfig.task = {
	name: '',
	recipe: [
		{
			material: 'empty',
			element:  1,
			level:    2
		},
		{
			material: 
		}
	],
	range: 2,
	effect: () => {},
};
gameStart(4, 3, pickInt(5) + 1);