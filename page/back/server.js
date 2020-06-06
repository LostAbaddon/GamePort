const sendToApp = (event, data, err) => {
	chrome.runtime.sendMessage(chrome.runtime.id, {event, data, err});
};

chrome.runtime.onMessage.addListener((data, app, cb) => {
	console.log(data);
	sendToApp('Reply', 'HolyHell!!!');
});

chrome.app.runtime.onLaunched.addListener(function() {
	chrome.app.window.create('index.html', {
		id: "GamePort",
		innerBounds: {
			width: 244,
			height: 380,
			minWidth: 244,
			minHeight: 380
		}
	});
});