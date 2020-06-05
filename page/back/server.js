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

chrome.runtime.onMessage.addListener((...args) => {
	console.log('>>>>>>>>>>', args);
});