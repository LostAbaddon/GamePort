const Entrances = [
	{
		name: '弹球冲锋',
		pic: 'ballcrush.png',
		target: 'ballcrush.html'
	},
	{
		name: '仙草纲目',
		pic: 'elixir.png',
		target: 'elixir.html'
	},
];

const isStr = str => {
	if (str instanceof String) return true;
	if ((typeof str) === 'string') return true;
	return false;
};
const newEle = (tag, cls, id) => {
	var ele = document.createElement(tag);
	if (!!cls) {
		if (isStr(cls)) cls = [cls];
		if (cls instanceof Array) {
			cls.forEach(c => ele.classList.add(c));
		}
	}
	if (!!id) {
		ele.id = id;
	}
	return ele;
};

const goto = target => {
	if (isChromeApp) {
		chrome.app.window.create(target);
	}
	else {
		location.href = target;
	}
};

const Init = () => {
	var elEntrance = document.querySelector('div.container');
	Entrances.forEach(item => {
		var ele = newEle('div', 'entrance');
		if (!!item.name) {
			let title = newEle('div', 'title');
			title.innerHTML = item.name;
			ele.appendChild(title);
		}
		if (!!item.pic) ele.style.backgroundImage = 'url(img/' + item.pic + ')';
		if (!!item.target) ele.addEventListener('click', () => goto(item.target));
		elEntrance.appendChild(ele);
	});
};

window.addEventListener('cacheUpdated', evt => {
	location.reload();
});

Init();