const ControllerHeight = 60;
const Rate = 2;
const DefaultVelocity = 4000;
const MinVelocity = 20;
const ShiftLength = 1;
const Duration = 1000 / 60;
const Step = 10;
const ZenCount = 50;
const ImpedeColor = [
	[0, [237, 227, 231]],
	[20, [248, 223, 114]],
	[50, [147, 181, 207]],
	[100, [81, 196, 211]],
	[150, [86, 152, 195]],
	[200, [87, 195, 194]],
	[300, [32, 137, 77]],
	[500, [212, 37, 23]],
	[800, [72, 30, 28]],
	[1000, [76, 31, 36]],
	[2000, [44, 42, 41]],
];
const BallColor = [
	[0, [226, 225, 228]],
	[3, [205, 209, 211]],
	[8, [192, 196, 195]],
];
const TagGameSaveName = 'ballcrush_save';

class Ball {
	x = 500;
	y = 0;
	r = 30;
	p = 1;
	vx = 0;
	vy = 0;
	score = 0;
	mass = 1;
	hits = 0;
	color = 'white';
	border = 'black';
	text = 'black';
	isBall = false;
	isGhost = true;
	isBlackHole = false;
	isRedNeck = false;
	isGolden = false;
	constructor (vx, vy, r=30, p=1) {
		this.vx = vx;
		this.vy = vy;
		this.r = r;
		this.p = p;
	}
	move (delta) {
		var ox = this.x, oy = this.y;
		if (this.y < -100 && this.vy < 0) this.isGhost = false;

		// 运动部分
		this.x += this.vx * delta;
		this.y += this.vy * delta;
		if (this.y > 2000 + this.r) {
			return [false, false];
		}

		// 碰撞相关
		var needRedraw = false;
		var collisions = [];

		// 墙壁
		var vect = wallCollide(this, ox, oy);
		if (!!vect[0]) {
			this.mass += 0.02;
			vect.push(null);
			collisions.push(vect);
		}

		// 与障碍物的碰撞
		var removes = [], rednecks = [], blackholes = [], killed = false, golden = false;
		impedes.forEach(imp => {
			if (imp.isBlackHole) blackholes.push(imp);
			else if (imp.isRedNeck) rednecks.push(imp);
			vect = imp.collide(this, ox, oy, delta);
			if (!vect[0] || vect[3]) return;
			this.hits ++;
			vect.push(imp);
			collisions.push(vect);
			needRedraw = true;
			needRewrite = true;
			if (imp.isBlackHole) {
				this.p -= imp.p;
				imp.score += 1;
				if (this.p <= 0) {
					this.p = 1;
					imp.score += 1;
				}
				killed = true;
				this.updateSize();
			}
			else if (imp.isGolden) {
				imp.p --;
				if (imp.p === 0) {
					removes.push(imp);
					golden = true;
				}
				score += 1;
				current += 1;
				hits += this.p;
			}
			else {
				let s = this.p;
				if (imp.p < s) {
					s = imp.p;
					imp.p = 0;
				}
				else {
					imp.p -= this.p;
				}
				score += s;
				current += s;
				if (imp.isRedNeck) {
					this.score ++;
					hits ++;
				}
				if (imp.p === 0) {
					removes.push(imp);
				}
				hits ++;
			}
		});

		if (killed) {
			return [true, needRedraw, true];
		}

		// 整合碰撞结果
		var vx = 0, vy = 0, sx = 0, sy = 0;
		if (collisions.length > 0) {
			let pow = 0;
			collisions.forEach(v => {
				var s, p, fi, imp;
				[v, s, p, fi, imp] = v;
				pow += p;
				vx += v.x * p;
				vy += v.y * p;
				sx += s.x * p;
				sy += s.y * p;
				if (fi && !!imp) {
					let dx = this.x - imp.x, dy = this.y - imp.y;
					let r1 = dx ** 2 + dy ** 2;
					let f = repel / r1;
					sx += f * dx * p;
					sy += f * dy * p;
				}
			});
			this.vx = vx / collisions.length / pow;
			this.vy = vy / collisions.length / pow;
			if (Math.abs(this.vx) <= MinVelocity && Math.abs(this.vy) <= MinVelocity) {
				let vr = (this.vx ** 2 + this.vy ** 2) ** 0.5;
				if (vr > 0 && vr < MinVelocity) {
					vr = MinVelocity / vr;
					this.vx = this.vx * vr;
					this.vy = this.vy * vr;
				}
			}
			sx /= pow;
			sy /= pow;
			this.x += sx;
			this.y += sy;
			this.isGhost = false;

			let inside = false;
			let ovx = ox - this.x;
			let ovy = oy - this.y;
			if (ovx !== 0 || ovy !== 0) {
				let oox = this.x;
				let ooy = this.y;
				let ovr = (ovx * ovx + ovy * ovy) ** 0.5;
				ovx /= ovr;
				ovy /= ovr;
				ovr = Math.ceil(ovr / ShiftLength);
				for (let i = 0; i <= ovr; i ++) {
					inside = false;
					this.x = oox + ovx * i;
					this.y = ooy + ovy * i;
					impedes.some(imp => {
						var i = imp.doesInside(this.x, this.y, this.r);
						if (i) {
							inside = true;
							return true;
						}
					});
					if (!inside) {
						break;
					}
				}
				if (inside) {
					impedes.some(imp => {
						var i = imp.doesInside(this.x, this.y, this.r);
						if (i) {
							let dx = this.x - imp.x, dy = this.y - imp.y;
							let r1 = dx ** 2 + dy ** 2;
							let f = repel / r1;
							this.vx += f * dx;
							this.vy += f * dy;
						}
					});
				}
			}
		}

		// 红脖球的斥力
		vx = 0;
		vy = 0;
		rednecks.forEach(r => {
			if (r.p <= 0) return;
			var dx = this.x - r.x;
			var dy = this.y - r.y;
			var dr = (dx ** 2 + dy ** 2) ** 0.5;
			if (dr < this.r + r.r) dr = this.r + r.r;
			dx /= dr;
			dy /= dr;
			dr = dr ** 2;
			var fx = r.max / this.p;
			if (fx > 200) fx = 200;
			fx *= r.p / r.max;
			fx = fx / dr * repel;
			if (fx > gravity) fx = gravity;
			var fy = fx * dy;
			fx = fx * dx;
			vx += fx;
			vy += fy;
		});
		blackholes.forEach(r => {
			if (r.p <= 0) return;
			var dx = r.x - this.x;
			var dy = r.y - this.y;
			var dr = (dx ** 2 + dy ** 2) ** 0.5;
			if (dr < this.r + r.r) dr = this.r + r.r;
			dx /= dr;
			dy /= dr;
			dr = dr ** 2;
			var fx = 10 * Math.sqrt(r.score + r.p + this.p);
			if (fx > 100) fx = 100;
			fx = fx / dr * attraction;
			if (fx > gravity) fx = gravity;
			var fy = fx * dy;
			fx = fx * dx;
			vx += fx;
			vy += fy;
		});

		if (!this.isGhost) {
			// 空气阻力
			var r = 1;
			if (removes.length) r = 4;
			else if (collisions.length > 0) r = 2;
			else r = 1 / (1 + (this.p - 1) / 3);
			r *= resistance;
			vx -= this.vx * r * delta;
			vy -= this.vy * r * delta;

			// 引力
			vy += gravity * this.mass * delta;
		}
		this.vx += vx;
		this.vy += vy;

		// 重力改变
		if (Math.abs(this.x - ox) + Math.abs(this.y - oy) < MinVelocity) {
			if (Math.abs(vy) < MinVelocity) {
				this.mass += 0.1;
			}
		}

		// 移除被撞碎的障碍物
		if (removes.length > 0) {
			removes.forEach(imp => {
				var i = impedes.indexOf(imp);
				if (i < 0) return;
				impedes.splice(i, 1);
				if (this.hits > 1) this.score ++;
				if (this.hits > 5) this.score ++;
				if (imp.isRedNeck) {
					this.score ++;
					hits += this.p;
				}
				else if (imp.isGolden) {
					this.score *= 2;
					hits += this.p;
				}
				else if (imp.isBlackHole) {
					this.score += imp.max;
					hits += imp.max;
				}
			});
			needRewrite = true;
		}

		// 球升级
		if (this.score > 8 * this.p ** 2 + (this.p - 1) ** 3 - 4) {
			this.score = 0;
			this.p ++;
			this.updateSize();
		}
		// 球增殖
		if (hits > 5 * (count ** 1.8) + (count / 10) ** 2 + 0.1 * (count / 20) ** 5 - 3) {
			hits -= 10 * count;
			if (hits < 0) hits = 0;
			generateBalls(true);
		}

		return [true, needRedraw, false, golden];
	}
	updateSize () {
		this.r = 28 + this.p * 2;
	}
	draw () {
		var c, b, t;
		if (this.isBlackHole) {
			c = 'black';
			b = 'white';
			t = ' ';
		}
		else {
			c = pickColor(this.p, this.isBall);
			if (this.isRedNeck) {
				b = 'red';
			}
			else if (this.isGolden) {
				b = 'green';
			}
			else {
				b = this.border;
			}
			t = this.p;
		}
		drawBall(this.x, this.y, this.r, c, b, this.text, t, this.isBall);
	}
	collide (ball, x, y, delta) {
		var [hitted, px, py, pt] = this.getHitPointOnCorner(x, y, ball.x, ball.y, this.x, this.y, this.r + ball.r);
		if (!hitted) return [null, null, 0];

		var dx = px - this.x;
		var dy = py - this.y;
		var ang = 2 * Math.atan2(dx, dy);
		var sa = Math.sin(ang), ca = Math.cos(ang);
		var velocity = {
			x: ball.vx * ca - ball.vy * sa,
			y: - ball.vy * ca - ball.vx * sa
		};
		var shift = {x: px - ball.x, y: py - ball.y};

		var fromInside = false;
		var dr = this.r + ball.r;
		dx = x - this.x, dy = y - this.y;
		if (Math.abs(dx) <= dr && Math.abs(dy) < dr) fromInside = ((dx ** 2 + dy ** 2) - dr ** 2 < 0);
		shift.x += (velocity.x - this.vx) * (1 - pt) * delta * resistance;
		shift.y += (velocity.y - this.vy) * (1 - pt) * delta * resistance;

		return [velocity, shift, 1.1 - pt, fromInside];
	}
	getHitPointOnCorner (x1, y1, x2, y2, cx, cy, r) {
		var x21 = x2 - x1, y21 = y2 - y1;
		var x10 = x1 - cx, y10 = y1 - cy;
		var R212 = x21 * x21 + y21 * y21;
		var R102 = x10 * x10 + y10 * y10;
		var V1021 = x10 * x21 + y10 * y21;

		var pt = V1021 * V1021 - (R102 - r * r) * R212;
		if (pt < 0) return [false];
		pt = Math.sqrt(pt);
		var nt =  - (V1021 - pt) / R212;
		pt = - (V1021 + pt) / R212;
		if (pt < 0) return [false];
		if (pt > 1) return [false];
		var px = x1 + pt * x21;
		var py = y1 + pt * y21;
		var fromInside = false;
		var dx = x1 - cx, dy = y1 - cy;
		if (Math.abs(dx) <= r && Math.abs(dy) < r) fromInside = ((dx ** 2 + dy ** 2) - r ** 2 < 0);
		return [true, px, py, pt, fromInside];
	}
	doesInside (x, y, r) {
		var fromInside = false;
		var dr = this.r + r, dx = x - this.x, dy = y - this.y;
		if (Math.abs(dx) <= dr && Math.abs(dy) < dr) fromInside = ((dx ** 2 + dy ** 2) - dr ** 2 < 0);

		return fromInside;
	}
}
class Poly extends Ball {
	poly = 3;
	ang = 0;
	length = 0;
	rotate = 0;
	constructor (vx, vy, r=30, p=1) {
		super(vx, vy, r, p);
		this.poly = 3 + Math.floor(Math.random() * 4);
		var range = Math.PI * 2 / this.poly;
		this.ang = (Math.random() - 0.5) * range;
		if (Math.random() < 0.15) {
			let r = Math.PI * (0.008 + Math.random() * 0.012);
			if (Math.random() < 0.5) r *= -1;
			this.rotate = r;
		}
	}
	draw () {
		var c, b, t;
		if (this.isBlackHole) {
			c = 'black';
			b = 'white';
			t = ' ';
		}
		else {
			c = pickColor(this.p, this.isBall);
			if (this.isRedNeck) {
				b = 'red';
			}
			else if (this.isGolden) {
				b = 'green';
			}
			else {
				b = this.border;
			}
			t = this.p;
		}
		drawPoly(this.x, this.y, this.r, this.poly, this.ang, c, b, this.text, t);
	}
	collide (ball, x, y, delta) {
		// 预判断
		var [hitted, px, py, pt] = this.getClosestPoint(x, y, ball.x, ball.y); // 距离中心最近的点
		var dx = px - this.x;
		var dy = py - this.y;
		var dl = ball.r + this.r;
		if (Math.abs(dx) > dl || Math.abs(dy) > dl) return [null];

		// 找出所有顶角位置
		var vertexList = [], ang = Math.PI * 2 / this.poly, half = ang / 2;
		if (this.length === 0) this.length = 2 * this.r * Math.sin(half);
		var er = this.r + ball.r / Math.cos(half);
		var extLen = 2 * er * Math.sin(half);
		for (let i = 0; i <= this.poly; i ++) {
			let a = this.ang + ang * i;
			let sa = Math.sin(a), ca = Math.cos(a);
			vertexList[i] = {
				x: this.x + er * Math.sin(a),
				y: this.y + er * Math.cos(a)
			};
			vertexList[this.poly + 2 + i] = {
				x: this.x + this.r * Math.sin(a),
				y: this.y + this.r * Math.cos(a)
			};
		}

		var velocity = {}, shift = {}, pt, fromInside = false;

		// 判断是否撞到线
		hitted = [];
		for (let i = 0; i < this.poly; i ++) {
			let v1 = vertexList[i], v2 = vertexList[i + 1];
			let p = this.getHitPointOnLine(x, y, ball.x, ball.y, v1.x, v1.y, v2.x, v2.y, extLen);
			if (p[0]) hitted.push([i, ...(p.splice(1, p.length))]);
		}
		// 如果撞到线
		if (hitted.length > 0) {
			hitted.sort((h1, h2) => Math.abs(h1[3] + 1) - Math.abs(h2[3] + 1));
			hitted = hitted[0];
			shift = {x: hitted[1] - ball.x, y: hitted[2] - ball.y};
			let a = 2 * (this.ang + half + ang * hitted[0]);
			let vx = ball.vx, vy = - ball.vy;
			let sa = Math.sin(a), ca = Math.cos(a);
			fromInside = hitted[4];
			pt = hitted[3];
			velocity.x = vx * ca + vy * sa;
			velocity.y = vy * ca - vx * sa;
			shift.x += (velocity.x - this.vx) * (1 - pt) * delta * resistance;
			shift.y += (velocity.y - this.vy) * (1 - pt) * delta * resistance;
			return [velocity, shift, 1.1 - pt, fromInside];
		}

		// 如果没撞到线，则检查是否撞到顶角
		hitted = [];
		for (let i = 0; i < this.poly; i ++) {
			let v = vertexList[this.poly + 2 + i];
			let h = this.getHitPointOnCorner(x, y, ball.x, ball.y, v.x, v.y, ball.r);
			if (h[0]) hitted.push([...h, v]);
		}
		// 如果撞到顶角
		if (hitted.length > 0) {
			hitted.sort((h1, h2) => Math.abs(h1[3] + 1) - Math.abs(h2[3] + 1));
			hitted = hitted[0];
			let vertex = hitted[5];
			let px = hitted[1];
			let py = hitted[2];
			pt = hitted[3];
			let dx = px - vertex.x;
			let dy = py - vertex.y;
			let ang = 2 * Math.atan2(dx, dy);
			let sa = Math.sin(ang), ca = Math.cos(ang);
			fromInside = hitted[4];
			velocity.x = ball.vx * ca - ball.vy * sa;
			velocity.y = - ball.vy * ca - ball.vx * sa;
			shift = {x: px - ball.x, y: py - ball.y};
			shift.x += (velocity.x - this.vx) * (1 - pt) * delta * resistance;
			shift.y += (velocity.y - this.vy) * (1 - pt) * delta * resistance;
			return [velocity, shift, 1.1 - pt, fromInside];
		}
		return [null];
	}
	getClosestPoint (x1, y1, x2, y2) {
		var dx = x2 - x1;
		var dy = y2 - y1;
		var dr2 = dx * dx + dy * dy;
		var pt = ((this.y - y1) * dy + (this.x - x1) * dx) / dr2;
		if (pt < 0) return [true, x1, y1, 0];
		if (pt > 1) return [true, x2, y2, 1];
		var px = x1 + pt * dx;
		var py = y1 + pt * dy;
		return [true, px, py, pt];
	}
	getHitPointOnLine (x1, y1, x2, y2, vx1, vy1, vx2, vy2, extLen) {
		var checker = (vx2 - vx1) * (y2 - y1) - (vy2 - vy1) * (x2 - x1);
		if (checker === 0) return [false];

		var pt = (vx2 - vx1) * (vy1 - y1) - (vy2 - vy1) * (vx1 - x1);
		pt /= checker;
		if (pt < 0 || pt > 1) return [false];

		var pr = (vy1 - y1) * (x2 - x1) - (vx1 - x1) * (y2 - y1);
		pr /= checker;
		var bra = (extLen - this.length) / 2;
		var ket = bra / extLen;
		bra = ket;
		ket = 1 - ket;
		if (pr < bra || pr > ket) return [false];

		var px = x1 + pt * (x2 - x1);
		var py = y1 + pt * (y2 - y1);

		vx1 = vx1 - this.x;
		vy1 = vy1 - this.y;
		vx2 = vx2 - this.x;
		vy2 = vy2 - this.y;
		x1 = x1 - this.x;
		y1 = y1 - this.y;
		var fromInside = false;
		var delta = (vx1 - vx2) ** 2 + (vy1 - vy2) ** 2;
		var nx1 = (vx1 * (vx1 - vx2) + vy1 * (vy1 - vy2)) / delta;
		var nx2 = (vx2 * (vx1 - vx2) + vy2 * (vy1 - vy2)) / delta;
		x2  = (x1 * (vx1 - vx2) + y1 * (vy1 - vy2)) / delta;
		if ((x2 - nx1) * (x2 - nx2) >= 0) {
			let ny = ( vx1 * vy2 - vx2 * vy1 ) / delta;
			y2  = (y1 * (vx1 - vx2) - x1 * (vy1 - vy2)) / delta;
			if (y2 > 0 && ny > 0) {
				if (y2 < ny) fromInside = true;
			}
			else if (y2 < 0 && ny < 0) {
				if (y2 > ny) fromInside = true;
			}
		}


		return [true, px, py, pt, fromInside];
	}
	doesInside (x, y, r) {
		// 预判断
		x = x - this.x;
		y = y - this.y;
		var er = r + this.r;
		// if (Math.abs(x) > er || Math.abs(y) > er) return false;

		// 对边进行处理
		var vertexList = [], ang = Math.PI * 2 / this.poly, half = ang / 2;
		er = this.r + r / Math.cos(half);
		var rate1 = r / er / 2, rate2 = 1 - rate1;
		var r2 = r ** 2;
		var rotate = this.ang;
		var lastX = er * Math.sin(rotate), lastY = er * Math.cos(rotate);
		for (let i = 0; i < this.poly; i ++) {
			rotate += ang;
			let sa = Math.sin(rotate), ca = Math.cos(rotate);
			let cx = er * Math.sin(rotate);
			let cy = er * Math.cos(rotate);

			let fromInside = false;
			// let delta = (lastX - cx) ** 2 + (lastY - cy) ** 2;
			let nx1 = (lastX * (lastX - cx) + lastY * (lastY - cy));
			let nx2 = (cx * (lastX - cx) + cy * (lastY - cy));
			let dx  = (x * (lastX - cx) + y * (lastY - cy)), dy = 0;
			let rate = (dx - nx1) / (nx2 - nx1);
			if (rate >= rate1 && rate <= rate2) {
				let ny = ( lastX * cy - cx * lastY );
				dy  = (y * (lastX - cx) - x * (lastY - cy));
				if (dy >= 0 && ny > 0) {
					if (dy < ny) fromInside = true;
				}
				else if (dy <= 0 && ny < 0) {
					if (dy > ny) fromInside = true;
				}
			}

			if (fromInside) return true;

			lastX = cx;
			lastY = cy;

			cx = this.r * Math.sin(rotate);
			cy = this.r * Math.cos(rotate);
			dx = Math.abs(x - cx);
			dy = Math.abs(y - cy);
			if (dx < r && dy < r) {
				if (dx ** 2 + dy ** 2 < r2) return true;
			}
		}
		return false;
	}
}

var score = 0, count = 0, power = 0, current = 0, hits = 0, ctx, timer, stamp = 0;
var elS, elC, elP, elT, elL;
var px = 500, py = 9;
var gravity = 9000, resistance = 0.6, repel = 400000, attraction = 100000;
var gameStatus = 0; // 0: 闲置; 1: 落球; 2: 移关中; 3: 暂停
var targetX = 0, targetY = 0, waiting = 0, needRewrite = false, needCombine = false;
var impedes = [], level = 1;
var impedeColorMap = {}, ballColorMap = {}, impedeDefaultColor = '', ballDefaultColor = '';
var balls = [], readyBalls = [], activeBalls = [];

const ModeSelector = {
	difficult: 0,
	finish: 0,
	newLine0 () {
		return ModeSelector.newLine1(false, false);
	},
	newLine1 (useBlackHole=true, useRedNecker=true) {
		var results = [];
		var total = 3 + Math.floor(Math.random() * 3.5), w = 1000;
		var disappear = (1 / 2 - 1 / total) / 2.5;
		var cL = level, cC = count, cT = current, cP = power;
		if (ModeSelector.finish === 1) {
			cL = 80;
			cC = 100;
			cP = 150;
		}
		var pMin = 1 + Math.round(((cL ** 1.05) + ((cL / 10) ** 2)) * (cT ** 0.1) + (cP ** 0.8));
		var pMax = pMin + Math.round((cL ** 0.4) + (cP ** 0.3) + (cT ** 0.1));
		var rateGoldApple = Math.sqrt((cC - 8) / cC) / 8;
		var rateBlackHole = 0;
		var rateRedNecker = 0;
		if (useBlackHole) rateBlackHole = (cL - 10) / cL / 25;
		if (useRedNecker) rateRedNecker = (cL - 5) / cL / 18;

		for (let i = 0; i < total; i ++) {
			let r = Math.round(55 + 10 * Math.random());
			let b;
			if (Math.random() < 0.35) b = new Ball(0, 0, r);
			else {
				b = new Poly(0, 0, r);
				r *= (1 + (7 - b.poly) / 10);
				b.r = r;
			}
			b.p = pMin + Math.round(Math.random() * pMax);
			if (Math.random() < rateGoldApple) {
				b.isGolden = true;
			}
			else if (Math.random() < rateBlackHole) {
				b.r = 20;
				b.p = Math.round((level / 10) ** 0.5);
				b.score = b.p;
				b.life = Math.ceil(Math.random() + Math.random() * Math.random() * 5);
				b.isBlackHole = true;
			}
			else if (Math.random() < rateRedNecker) {
				b.isRedNeck = true;
				b.max = b.p;
			}
			results.push(b);
			w -= r * 2;
		}

		var cc = total, delta = 0, l = 0 - results[0].r, ll = 0 - l;
		for (let i = 0; i < total; i ++) {
			let px = Math.round(Math.random() * (w - delta) / cc);
			let py = 1800 + Math.round(Math.random() * 100);
			let b = results[i];
			l += ll + b.r;
			ll = b.r;
			b.x = px + l + delta;
			b.y = py;
			if (Math.random() > disappear) impedes.push(b);
			delta += px;
			cc --;
		}
	},
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

	var canvas = container.querySelector('canvas');
	canvas.style.width = width + 'px';
	canvas.style.height = height + 'px';
	canvas.width = 1000;
	canvas.height = 1000 * Rate;
	canvas._width = width;
	canvas._height = height;
	ctx = canvas.getContext('2d', {alpha: false});
	draw();
};
const clearCanvas = () => {
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, 1000, 2000);
};
const drawFrame = () => {
	ctx.beginPath();
	ctx.moveTo(300, 0);
	ctx.lineTo(0, 0);
	ctx.lineTo(0, 2000);
	ctx.lineTo(1000, 2000);
	ctx.lineTo(1000, 0);
	ctx.lineTo(700, 0);
	ctx.setLineDash([]);
	ctx.strokeStyle = 'white';
	ctx.lineWidth = 5;
	ctx.stroke();
};
const drawImpedes = () => {
	impedes.forEach(i => {
		i.draw();
	});
};
const drawPlummet = (x, y) => {
	ctx.beginPath();
	ctx.moveTo(500, 0);
	ctx.lineTo(x, y);
	ctx.setLineDash([20, 10]);
	ctx.strokeStyle = 'yellow';
	ctx.lineWidth = 4;
	ctx.stroke();
};
const drawBall = (x, y, r, c, b, t, p, isBall) => {
	ctx.beginPath();
	ctx.arc(x, y, r, 0, 2 * Math.PI);
	ctx.fillStyle = c || 'white';
	ctx.fill();
	ctx.setLineDash([]);
	ctx.strokeStyle = b || 'black';
	ctx.lineWidth = 3;
	ctx.stroke();
	ctx.fillStyle = t;
	p = p + '';
	var l = p.length;
	if (isBall) {
		ctx.font = '40px Arial';
		ctx.fillText(p, x - l * 12, y + 18);
	}
	else {
		ctx.font = '60px Arial';
		ctx.fillText(p, x - l * 18, y + 20);
	}
};
const drawPoly = (x, y, r, n, a, c, b, t, p) => {
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
	ctx.fillStyle = t;
	p = p + '';
	var l = p.length;
	ctx.font = '60px Arial';
	ctx.fillText(p, x - l * 18, y + 20);
};
const draw = () => {
	clearCanvas();
	drawFrame();
};
const generateBalls = (isReady=false) => {
	var b = new Ball(0, 0);
	b.isBall = true;
	if (isReady) {
		b.isGhost = true;
		b.mass = 1;
		b.vx = targetX;
		b.vy = targetY;
		b.x = 500;
		b.y = 0;
		readyBalls.push(b);
	}
	else balls.push(b);
};
const prepareBalls = () => {
	if (gameStatus !== 0) return;
	gameStatus = 1;
	needCombine = false;
	current = 0;
	elT.innerHTML = 0;
	readyBalls.push(...(balls.splice(0, balls.length)));
	readyBalls.forEach(b => {
		b.isGhost = true;
		b.mass = 1;
		b.vx = targetX;
		b.vy = targetY;
		b.x = 500;
		b.y = 0;
		b.hits = 0;
		b.updateSize();
	});
	waiting = 0;
};
const pickColor = (power, isBall=false) => {
	var c;
	if (isBall) {
		c = ballColorMap[power];
		if (!c) c = ballDefaultColor;
	}
	else {
		c = impedeColorMap[power];
		if (!c) c = impedeDefaultColor;
	}
	return c;
};
const updateInfo = () => {
	if (!elS) elS = document.querySelector('div.controller div.info span.total');
	if (!elC) elC = document.querySelector('div.controller div.info span.count');
	if (!elP) elP = document.querySelector('div.controller div.info span.power');
	if (!elT) elT = document.querySelector('div.controller div.info span.current');
	if (!elL) elL = document.querySelector('div.controller div.info span.level');
	elS.innerHTML = score;
	elC.innerHTML = count;
	elP.innerHTML = power;
	elT.innerHTML = current;
	elL.innerHTML = level;
};
const ejectBall = (x, y) => {
	if (x === 500 && y === 0) y = 1;
	var vx = x - 500, vy = y - 0;
	var vr = (vx * vx + vy * vy) ** 0.5;
	vx = vx / vr * DefaultVelocity;
	vy = vy / vr * DefaultVelocity;
	targetX = vx;
	targetY = vy;

	prepareBalls();
};
const combineBalls = () => {
	var max = 0, remain = 0, total = 0;
	var prev = [];
	balls.forEach((b, i) => {
		if (b.p > max) max = b.p;
		else if (b.p === 1) prev.push(i);
	});
	if (prev.length === 0) return;
	total = Math.floor(prev.length / max);
	remain = prev.length - total * max;
	prev.reverse().forEach(i => balls.splice(i, 1));
	for (let i = 0; i < total; i ++) {
		let b = new Ball(0, 0);
		b.p = max;
		b.isBall = true;
		balls.push(b);
	}
	if (remain > 0) {
		let b = new Ball(0, 0);
		b.p = remain;
		b.isBall = true;
		balls.push(b);
	}

	count = balls.length;
	power = 0;
	balls.forEach(b => power += b.p);
	updateInfo();
};
const wallCollide = (ball, x, y) => {
	var result = {};
	var shift = {x: 0, y: 0};
	var fromInside = false;
	if (ball.x <= ball.r) {
		result.y = ball.vy;
		result.x = Math.abs(ball.vx);
		shift.x = ball.r - ball.x;
		if (x < ball.r) fromInside = true;
	}
	else if (ball.x >= 1000 - ball.r) {
		result.y = ball.vy;
		result.x = 0 - Math.abs(ball.vx);
		shift.x = 1000 - ball.r - ball.x;
		if (x > 1000 - ball.r) fromInside = true;
	}
	else if (!ball.isGhost && ball.y <= ball.r) {
		result.x = ball.vx;
		result.y = Math.abs(ball.vy);
		shift.y = ball.r - ball.y;
		if (y < ball.r) fromInside = true;
	}
	else return [null];
	return [result, shift, 1.1, fromInside];
};
const newLine = () => {
	var result;
	if (ModeSelector.difficult === 0) {
		result = ModeSelector.newLine0();
	}
	else if (ModeSelector.difficult === 1) {
		result = ModeSelector.newLine1();
	}
	saveStage();
	return result;
};
const nextLine = () => {
	level ++;
	impedes.forEach(imp => imp.y -= 220);
	var kills = 0;
	impedes = impedes.filter(imp => {
		if (imp.y > 0) {
			if (imp.isBlackHole) {
				imp.life --;
				if (imp.life === 0) {
					imp.isBlackHole = false;
					imp.p = Math.ceil(imp.score * ((level / 10 + 1) ** 0.2));
				}
			}
			return true;
		}
		if (ModeSelector.finish === 1) return false;
		if (!imp.isBlackHole) kills += imp.p;
		return false;
	});
	if (kills > 0) {
		let removes = [];
		balls.some((b, i) => {
			if (b.p <= kills) {
				kills -= b.p;
				b.p = 0;
				removes.push(i);
				return false;
			}
			else {
				b.p -= kills;
				b.updateSize();
				kills = 0;
			}
		});
		if (removes.length > 0) {
	 		removes.reverse().forEach(r => balls.splice(r, 1));
		}
	}
	if (ModeSelector.finish === 1) {
		let l = balls.length;
		balls.sort((ba, bb) => {
			if (ba.p === bb.p) return bb.score - ba.score;
			return bb.p - ba.p;
		});
		if (l < ZenCount) {
			for (let i = l; i < ZenCount; i ++) generateBalls();
		}
		else if (l > ZenCount) {
			balls.splice(ZenCount, l - ZenCount);
		}
	}
	count = balls.length;
	power = 0;
	balls.forEach(b => power += b.p);
	updateInfo();
	if (count === 0) {
		localStorage.removeItem(TagGameSaveName);
		let pad = document.querySelector('div.container div.area div.infoPad[name="GameEnd"]');
		pad.classList.add('shown');
		gameStatus = 3;
		if (!!timer) clearTimeout(timer);
	}
	else {
		newLine();
	}
};
const saveStage = () => {
	var stage = {
		difficult: ModeSelector.difficult,
		finish: ModeSelector.finish,
		score, current, level
	};
	stage.balls = balls.map(b => b);
	stage.impedes = impedes.map(p => p);

	localStorage.setItem(TagGameSaveName, JSON.stringify(stage));
};
const loadStage = () => {
	var stage = localStorage.getItem(TagGameSaveName);
	if (!stage) return false;
	try {
		stage = JSON.parse(stage);
	}
	catch {
		return false;
	}

	ModeSelector.difficult = stage.difficult;
	ModeSelector.finish = stage.finish;
	score = stage.score;
	current = stage.current;
	level = stage.level;

	balls.splice(0, balls.length);
	stage.balls.forEach(b => {
		var ball = new Ball(0, 0);
		for (let prop in b) {
			ball[prop] = b[prop];
		}
		balls.push(ball);
	});
	stage.impedes.forEach(i => {
		var imp;
		if (i.poly >= 0) {
			imp = new Poly(0, 0);
		}
		else {
			imp = new Ball(0, 0);
		}
		for (let prop in i) {
			imp[prop] = i[prop];
		}
		impedes.push(imp);
	});
	return true;
};
const gameStart = () => {
	impedes.splice(0, impedes.length);
	if (!loadStage()) {
		score = 0;
		current = 0;
		level = 1;
		newLine();
		if (ModeSelector.finish === 0) {
			generateBalls();
		}
		else if (ModeSelector.finish === 1) {
			for (let i = 0; i < ZenCount; i ++) generateBalls();
		}
	}

	hits = 0;
	count = balls.length;
	power = 0;
	balls.forEach(b => power += b.p);
	updateInfo();

	timer = setTimeout(mainLoop, Duration);
};
const normalLoop = delta => {
	if (stamp > 0) {
		if (readyBalls.length > 0) {
			if (waiting === 0) {
				activeBalls.push(readyBalls.splice(0, 1)[0]);
				let l = count / 30;
				waiting = Math.round(4 + 6 / (l + 1));
			}
			else {
				waiting --;
			}
		}

		let removes = [];
		let needRedraw = false;
		let zerohitted = false;
		impedes.forEach(imp => {
			if (imp.rotate === 0) return;
			needRedraw = true;
			imp.ang += imp.rotate;
			if (imp.rotate > 0 && imp.ang > Math.PI * 2) imp.ang -= Math.PI * 2;
			else if (imp.rotate < 0 && imp.ang < -Math.PI * 2) imp.ang += Math.PI * 2;
		});
		activeBalls.forEach((ball, index) => {
			var [move, redraw, killed, golden] = ball.move(delta);
			if (killed) {
				balls.push(ball);
				removes.push(index);
				if (redraw) {
					needRedraw = true;
				}
			}
			else {
				if (move) {
					ball.draw();
					if (redraw) {
						needRedraw = true;
					}
					if (golden) {
						needCombine = true;
						let b = new Ball(0, 0);
						b.isBall = true;
						b.isGhost = true;
						b.mass = 1;
						b.vx = targetX;
						b.vy = targetY;
						b.x = 500;
						b.y = 0;
						b.p = ball.p;
						readyBalls.push(b);
					}
				}
				else {
					let alive = true;
					if (ball.hits === 0) {
						zerohitted = true;
						if (ball.score === 0) {
							ball.p --;
							if (ball.p === 0) {
								alive = false;
							}
						}
						else {
							ball.score === 0;
						}
					}
					if (alive) {
						balls.push(ball);
						removes.push(index);
					}
				}
			}
		});
		removes.reverse().forEach(b => activeBalls.splice(b, 1));
		if (activeBalls.length === 0) {
			if (impedes.length === 0) {
				zerohitted = true;
				balls.forEach(b => {
					hits += b.p;
					b.score += b.p;
				});
			}
			if (zerohitted) {
				count = balls.length;
				power = 0;
				balls.forEach(b => power += b.p);
				updateInfo();
			}
			gameStatus = 2;
		}
		if (needRedraw) {
			drawImpedes();
		}
		if (needRewrite) {
			count = balls.length + readyBalls.length + activeBalls.length;
			power = 0;
			balls.forEach(b => power += b.p);
			readyBalls.forEach(b => power += b.p);
			activeBalls.forEach(b => power += b.p);
			updateInfo();
		}
	}
};
const mainLoop = () => {
	clearCanvas();
	drawPlummet(px, py);
	drawImpedes();

	var now = Date.now();
	if (stamp > 0) {
		let delta = now - stamp;
		if (ModeSelector.finish === 0) delta = Step;
		else delta *= Step / Duration;
		delta /= 1000;

		if (gameStatus === 1) {
			normalLoop(delta);
			stamp = now;
		}
		else if (gameStatus === 2) {
			if (needCombine) combineBalls();
			nextLine();
			if (gameStatus === 2) gameStatus = 0;
		}
		else {
			stamp = 0;
		}
	}
	else {
		stamp = now;
	}

	drawFrame();

	if (gameStatus !== 3) timer = setTimeout(mainLoop, Duration);
};
const init = () => {
	resize();

	document.querySelector('div.controller div.backer').addEventListener('click', () => {
		gameStatus = 3;
		if (!!timer) clearTimeout(timer);
		localStorage.removeItem(TagGameSaveName);
		balls.splice(0, balls.length);
		readyBalls.splice(0, readyBalls.length);
		activeBalls.splice(0, activeBalls.length);
		padMode.classList.add('shown');
	});

	var canvas = document.querySelector('div.container canvas');
	canvas.addEventListener('mousemove', evt => {
		var x = evt.offsetX / canvas._width * 1000;
		var y = evt.offsetY / canvas._height * 2000;
		px = x;
		py = y;
	});
	canvas.addEventListener('touchmove', evt => {
		if (evt.touches.length === 0) return;
		var touch = evt.touches[evt.touches.length - 1];
		var rect = canvas.getBoundingClientRect();

		var x = (touch.clientX - rect.x) / canvas._width * 1000;
		var y = (touch.clientY - rect.y) / canvas._height * 2000;
		px = x;
		py = y;
		evt.preventDefault();
	});
	canvas.addEventListener('click', evt => {
		var x = evt.offsetX / canvas._width * 1000;
		var y = evt.offsetY / canvas._height * 2000;
		ejectBall(x, y);
	});
	canvas.addEventListener('touchend', evt => {
		ejectBall(px, py);
		evt.preventDefault();
	});

	impedeDefaultColor = 'rgb(' + ImpedeColor[ImpedeColor.length - 1][1].join(',') + ')';
	var ci = 0, max = ImpedeColor[ImpedeColor.length - 1][0];
	for (let i = 0; i <= max; i ++) {
		let info = ImpedeColor[ci];
		let color = info[1];
		if (i === info[0]) {
			color = 'rgb(' + color.join(',') + ')';
			ci ++;
		}
		else {
			let min = ImpedeColor[ci - 1];
			let rate = (i - min[0]) / (info[0] - min[0]);
			min = min[1];
			let r = [];
			r[0] = Math.round((color[0] - min[0]) * rate + min[0]);
			r[1] = Math.round((color[1] - min[1]) * rate + min[1]);
			r[2] = Math.round((color[2] - min[2]) * rate + min[2]);
			color = 'rgb(' + r.join(',') + ')';
		}
		impedeColorMap[i] = color;
	}

	ballDefaultColor = 'rgb(' + BallColor[BallColor.length - 1][1].join(',') + ')';
	ci = 0;
	max = BallColor[BallColor.length - 1][0];
	for (let i = 0; i <= max; i ++) {
		let info = BallColor[ci];
		let color = info[1];
		if (i === info[0]) {
			color = 'rgb(' + color.join(',') + ')';
			ci ++;
		}
		else {
			let min = BallColor[ci - 1];
			let rate = (i - min[0]) / (info[0] - min[0]);
			min = min[1];
			let r = [];
			r[0] = Math.round((color[0] - min[0]) * rate + min[0]);
			r[1] = Math.round((color[1] - min[1]) * rate + min[1]);
			r[2] = Math.round((color[2] - min[2]) * rate + min[2]);
			color = 'rgb(' + r.join(',') + ')';
		}
		ballColorMap[i] = color;
	}

	var padEnd = document.querySelector('div.container div.area div.infoPad[name="GameEnd"]');
	var padMode = document.querySelector('div.container div.area div.infoPad[name="ModeSelector"]');
	padEnd.addEventListener('click', () => {
		padEnd.classList.remove('shown');
		padMode.classList.add('shown');
	});
	padMode.addEventListener('click', evt => {
		evt = evt.target;
		var mode = evt.getAttribute('mode');
		if (!mode) return;

		if (mode === 'normal') {
			ModeSelector.difficult = 0;
			ModeSelector.finish = 0;
		}
		else if (mode === 'hell') {
			ModeSelector.difficult = 1;
			ModeSelector.finish = 0;
		}
		else if (mode === 'normalZen') {
			ModeSelector.difficult = 0;
			ModeSelector.finish = 1;
		}
		else if (mode === 'hellZen') {
			ModeSelector.difficult = 1;
			ModeSelector.finish = 1;
		}
		else return;

		padEnd.classList.remove('shown');
		padMode.classList.remove('shown');
		gameStatus = 0;
		gameStart();
	});

	document.querySelector('div.infoPad[name="Updated"] button[name="update"]').addEventListener('click', () => {
		location.reload();
	});
	document.querySelector('div.infoPad[name="Updated"] button[name="cancel"]').addEventListener('click', () => {
		document.querySelector('div.infoPad[name="Updated"]').classList.remove('shown');
	});
};

window.onresize = resize;
window.addEventListener('cacheUpdated', evt => {
	document.querySelector('div.infoPad[name="Updated"]').classList.add('shown');
});

init();