let Inventory = function(items, socket, server, player){
    var self = {
        items, //{id:"itemId",amount:1}
		socket,
		server,
		player
    }
    self.addItem = function(id,amount){
		for(var i = 0 ; i < self.items.length; i++){
			if(self.items[i].id === id){
				self.items[i].amount += amount;
				self.refreshRender();
				return;
			}
		}
		self.items.push({id:id,amount:amount});
		self.refreshRender();
    }
    self.removeItem = function(id,amount){
		for(var i = 0 ; i < self.items.length; i++){
			if(self.items[i].id === id){
				self.items[i].amount -= amount;
				if(self.items[i].amount <= 0)
					self.items.splice(i,1);
				self.refreshRender();
				return;
			}
		}    
    }
    self.hasItem = function(id,amount){
		for(var i = 0 ; i < self.items.length; i++){
			if(self.items[i].id === id){
				return self.items[i].amount >= amount;
			}
		}  
		return false;
    }
	self.refreshRender = function(){
		//server
		if(self.server){
			self.socket.emit('updateInventory',self.items);
			return;
		}
		
		//client only
		let inventory = document.getElementById("inventory");
		inventory.innerHTML = "";
		let addButton = function(data) {
			let item = Item.list[data.id];
			let button = document.createElement('button');
			button.onclick = function() {
				self.socket.emit('useItem', item.id);
			}
			button.className = "gameBtn";
			button.innerText = item.name + " x" + data.amount + " (" + item.key + ")";
			inventory.appendChild(button);
		}
		for(var i = 0 ; i < self.items.length; i++){
			addButton(self.items[i]);
		}

	}
	if(self.server) {
		self.socket.on("useItem", function(itemId) {
			if(!self.hasItem(itemId, 1)) {
				console.log("Cheater");
				return;
			}
			let item = Item.list[itemId];
			item.event(self.player);
		});
	}


	return self;
}


let Item = function(id,name,key,event){
	var self = {
		id,
		name,
		event,
		key
	}
	Item.list[self.id] = self;
	return self;
}
Item.list = {};

Item("potion","Potion","z", function(player){
	player.hp = 10;
	player.inventory.removeItem("potion", 1);
	player.inventory.addItem("superAttack", 1);
});

Item("superAttack","Super Attack", "x", function(player){
	for(let i = 0; i < 360; i++) {
		player.shootBullet(i);
	}
	player.inventory.removeItem("superAttack", 1);
});

if(typeof module !== 'undefined' && module.exports) {
	module.exports = Inventory;
}