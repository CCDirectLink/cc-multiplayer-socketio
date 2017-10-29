var MmoConnection = function(multiplayer, address){
	var socket = io.connect(address);
	var indentified;
	
	this.identify = function(userName){
		socket.emit('indentify', userName);
	}
	
	
	this.changeMap = function(name, marker){
		if(indentified)
			socket.emit('changeMap', {name: name, marker: marker});
	}
	
	this.updatePosition = function(position){
		if(indentified)
			socket.emit('updatePosition', position);
	}
	
	this.updateAnimation = function(face, anim){
		if(indentified)
			socket.emit('updateAnimation', {face: face, anim: anim});
	}
	
	this.spawnEnity = function(type, x, y, z, settings, showAppearEffects){
		if(indentified)
			socket.emit('spawnEnity', {type: type, x: x, y: y, z: z, settings: settings, showAppearEffects: showAppearEffects});
	}
	
	this.updateTimer = function(timer){
		if(indentified)
			socket.emit('updateAnimationTimer', timer);
	}
	
	socket.on('identified', function(result){
		indentified = !!result;
		multiplayer.onIdentified(indentified, result);
	});
	
	socket.on('changeConfig', function(name){
		(new cc.ig.events.SWITCH_PLAYER_CONFIG({name: name})).start();
	});
	
	socket.on('onPlayerChangeMap', function(data){
		multiplayer.onPlayerChangeMap(data.player, data.enters, data.position, data.map, data.marker);
	});
	
	socket.on('updatePosition', function(data){
		multiplayer.onPlayerMove(data.player, data.pos);
	});
	socket.on('updateAnimation', function(data){
		multiplayer.onPlayerAnimation(data.player, data.face, data.anim);
	});
	socket.on('updateAnimationTimer', function(data){
		multiplayer.onPlayerAnimationTimer(data.player, data.timer);
	});
}