var multiplayer = new function(){
	var modFolder = "mods/multiplayer/";
	var initialized = false;
	var pos = {};
	var faceX;
	var faceY;
	var anim;
	var timer = 0;
	var mmoConnection;
	var players = {};
	var buttons;
	
	this.update = function(){
		if(cc.ig.playerInstance() && initialized){
			var p = cc.ig.gameMain.getEntityPosition(cc.ig.playerInstance());
			var entity = cc.ig.playerInstance();
			var faceing = entity.face;
			var anim = simplify.getAnimation(entity);
			var animTimer = simplify.getAnimationTimer(entity);
			if(!comparePosition(p)){
				copyPosition(p, pos);
				mmoConnection.updatePosition(p);
			}
			if(!compareAnimation(faceing, anim)){
				copyAnimation(entity);
				mmoConnection.updateAnimation(faceing, anim);
			}
			
			if(animTimer !== timer){
				timer = animTimer;
				mmoConnection.updateTimer(timer);
			}
		}
	}
	
	this.onMapLoaded = function(){
		console.log("loaded: " + simplify.getActiveMapName());
		if(initialized){
			players = {};
		}
	}
	
	this.onPlayerTeleport = function(map, teleportPosition, hint){
		var marker;
		
		for(var key in teleportPosition){
			if(teleportPosition[key] && teleportPosition[key].constructor === String){
				marker = teleportPosition[key];
				break;
			}
		}
		
		mmoConnection.changeMap(map, marker);
	}
	
	this.exit = function(){
		console.log("exit");
	}
	
	this.initialize = function(config){
		//Disable focus system
		ig.system[cc.ig.varNames.systemHasFocusLost] = function(){return false;}
		
		//Intercept teleport
		cc.ig.gameMain[cc.ig.varNames.gameMainTeleport] = function(map, teleportPosition, hint){
			multiplayer.onPlayerTeleport(map, teleportPosition, hint);
			return cc.ig.gameMain.teleport.call(cc.ig.gameMain, map, teleportPosition, hint);
		}
		
		buttons = simplify.getInnerGui(cc.ig.GUI.menues[15].children[2])[cc.ig.varNames.titleScreenButtons];
		//buttons.splice(2, 2);
		//buttons[2].a.g.y = 80;
		buttons[2].ja("Connect", true);
		buttons[2].bc_original = buttons[2].bc;
		buttons[2].bc = multiplayer.onConnect;
		mmoConnection = new MmoConnection(this, config.finalAddress);
		
		cc.ig.gameMain[cc.ig.varNames.gameMainSpawnEntity] = function(type, x, y, z, settings, showAppearEffects){ return multiplayer.onEntitySpawn(type, x, y, z, settings, showAppearEffects) };
	}
	
	this.onConnect = function(){
		var name = prompt("Please enter your username:", "");
		if(!name || name === "")
			return;
		mmoConnection.identify(name);
	}
	
	this.onIdentified = function(successfull, name){
		if(successfull){
			buttons[2].bc_original();
			initialized = true;
			console.log('Indentified as ' + name);
		}else{
			console.log('Indentifying failed!');
			sc.To.yzb("This name is already taken!", r, "OK");
		}
	}
	
	this.onPlayerChangeMap = function(player, isEntering, pos, map, marker){
		if(isEntering){
			var interv = setInterval(function(){
				if(cc.ig.gameMain.entities.length > 0 && (typeof cc.ig.gameMain.getLoadingState() !== "string" || cc.ig.gameMain.getLoadingState().indexOf("LOADING MAP: ") == -1)){
					var entity = cc.ig.gameMain.spawnEntity("NPC", pos.x, pos.y, pos.z, {
						name: player,
						characterName: "main.lea",
						npcStates: [{
							condition: "",
							reactType: "FIXED_POS",
							face: "SOUTH",
							config: "normal",
							action: [],
							hidden: false,
							event: []
						}],
						"mapId": 233
					});
					players[player] = {name: player, pos: {x: pos.x, y: pos.y, z: pos.z}, entity: entity};
					console.log(players[player]);
					clearInterval(interv);
				}
			});
		}else{
			players[player] = undefined;
			
			cc.ig.gameMain.teleport(map, cc.ig.TeleportPosition.createFromJson({marker: marker}))
			mmoConnection.changeMap(map, marker);
		}
	}
	
	
	
	this.onPlayerMove = function(player, pos){
		if(players[player] && players[player].entity){
			cc.ig.gameMain.setEntityPosition(players[player].entity, pos);
			players[player].pos = pos;
		}
	}
	
	this.onPlayerAnimation = function(player, faceing, animation){
		if(players[player] && players[player].entity){
			players[player].entity.face.x = faceing.x;
			players[player].entity.face.y = faceing.y;
			players[player].entity.pk = animation;
			clearAnimation(players[player].entity);
			playAnimation(players[player].entity, animation);
		}
	}
	
	this.onPlayerAnimationTimer = function(player, timer){
		if(players[player] && players[player].entity){
			simplify.setAnimationTimer(players[player].entity, timer);
		}
	}
	
	this.onEntitySpawn = function(type, x, y, z, settings, showAppearEffects){
		var blacklist = [
			"Marker", 
			"HiddenBlock", 
			//cc.ig.entityList.Player, 
			cc.ig.entityList.Crosshair, 
			cc.ig.entityList.CrosshairDot,
			cc.ig.entityList.OffsetParticle,
			cc.ig.entityList.RhombusParticle,
			cc.ig.entityList.HiddenSkyBlock
			]
		
		if(blacklist.indexOf(type) >= 0)
			return cc.ig.gameMain.spawnEntity(type, x, y, z, settings, showAppearEffects); //Static objects that never change or objects that should never be synced
		
		if(type === cc.ig.entityList.Ball)
			console.log(settings);
		
		if(typeof type === "string") {
			console.log("onEntitySpawn: ", type);
			mmoConnection.spawnEnity(type, x, y, z, settings, showAppearEffects);
		} else {
			for(var t in cc.ig.entityList){
				if(cc.ig.entityList[t] === type){
					console.log("onEntitySpawn (type): ", t);
					//TODO: mmoConnection.spawnEnity({name: t}, x, y, z, settings, showAppearEffects);
					break;
				}
			}
		}
		
		//if(type !== "enemy" && type != cc.ig.entityList.Enemy)
			return cc.ig.gameMain.spawnEntity(type, x, y, z, settings, showAppearEffects);
		
	}
	
	function copyPosition(from, to){
		to.x = from.x;
		to.y = from.y;
		to.z = from.z;
	}
	function copyAnimation(from){
		faceX = from.face.x;
		faceY = from.face.y;
		anim = simplify.getAnimation(from);
	}
	
	function comparePosition(position){
		return pos.x === position.x && 
			pos.y === position.y &&
			pos.z === position.z
	}
	
	function compareAnimation(faceing, animation){
		return faceX === faceing.x &&
			faceY === faceing.y &&
			anim === animation;
	}
	
	function clearAnimation(entity){
		new cc.ig.events.CLEAR_ANIMATION({
			entity: entity
		}).start();
	}
	
	function playAnimation(entity, animation){
		new cc.ig.events.DO_ACTION({
			entity: entity, 
			keepState: false, 
			action: [
				{
					type: "SHOW_ANIMATION", 
					anim: animation
				},
				{
					type: "WAIT", 
					time: -1 
				}
			]
		}).start({});
	}
}