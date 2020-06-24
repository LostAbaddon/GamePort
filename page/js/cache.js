const EmitCacheUpdatedEvent = (target, data) => {
	data = data || {
		type: 'ApplicationCache',
		event: 'cacheUpdated',
		url: location.href,
		timestamp: Date.now(),
		lastCache: Date.now(),
	}
	var evt = new Event('cacheUpdated');
	evt.target = target;
	evt.data = data;
	window.dispatchEvent(evt);
};

(async () => {
	if (isLocalApp || isChromeApp) return;

	var logInfo = [];
	var showLog = (...info) => {
		return;
		logInfo.push(...info);
		var uiLog = document.querySelector('#logger');
		if (!!uiLog) uiLog.innerHTML = logInfo.join('<br>');
	};
	window.addEventListener('load', () => {
		showLog(
			'Application Cache: ' + (!!window.applicationCache ? 'YES' : 'no'),
			'Service Worker: ' + (!!navigator.serviceWorker ? 'YES' : 'no')
		);
		if (!!window.applicationCache) {
			showLog('Application Cache Status: ' + applicationCache.status);
		}
	});

	if (!navigator.serviceWorker) {
		if (!!window.applicationCache) {
			try {
				applicationCache.update();
			} catch {}
			if (applicationCache.status === applicationCache.UPDATEREADY) {
				applicationCache.swapCache();
				setTimeout(() => {
					EmitCacheUpdatedEvent(applicationCache);
				}, 1000);
			}
			applicationCache.addEventListener('updateready', evt => {
				applicationCache.swapCache();
				setTimeout(() => {
					EmitCacheUpdatedEvent(applicationCache);
				}, 1000);
			});
		}
		return;
	}

	const channel = new BroadcastChannel('service-messages');
	channel.addEventListener('message', msg => {
		if (msg.data.event === 'cacheUpdated') {
			msg.data.type = 'ServiceWorker';
			EmitCacheUpdatedEvent(channel, msg.data);
		}
	});

	if (!!window.caches) {
		caches.keys().then(keys => {
			if (keys.length === 0) {
				showLog('>>>> No Cache <<<<');
			}
			keys.forEach(key => {
				caches.open(key).then(caches => {
					var info = ['>>>> ' + key + ' <<<<'];
					caches.keys()
						.then(cacheList => {
							cacheList.forEach(cache => {
								info.push(cache.url);
							});
						})
						.finally(() => {
							console.log(info.join('\n'));

							showLog(
								'===================',
								info.join('<br>'),
								'-------------------'
							);
						});
				});
			});
		});
	}

	try {
		let sws = await navigator.serviceWorker.getRegistrations();
		showLog('Service Worker: ' + sws.length);
		for (let sw of sws) {
			if (!!sw.waiting) {
				console.log('有等待中的新版本 Service Worker');
				await sw.unregister();
			}
		}
	}
	catch (err) {
		console.error('获取已安装 Service 出错：', err);
		showLog('Get Service Worker Failed: ' + err.message);
	}

	try {
		let reg = await navigator.serviceWorker.register('/service.js');
		showLog('Has Service Worker: ' + (!!reg ? 'YES' : 'no'));
	}
	catch (err) {
		console.error('安装本地 Service 出错：', err);
		showLog('Register Service Worker Failed: ' + err.message);
	}

	channel.postMessage({
		event: 'initialized',
		page: location.pathname
	});
}) ();