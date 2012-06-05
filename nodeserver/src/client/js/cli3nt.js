define(['/common/LogManager.js','/common/EventDispatcher.js', './../../common/CommonUtil.js', '/socket.io/socket.io.js'],function(LogManager, EventDispatcher, commonUtil){
    var logger,
        Client,
        CommandQueue,
        LocalCommander,
        Storage,
        ClientNode,
        ClientNode2,
        Territory;

    logger = LogManager.create("Client");

    Client = function(server){
        var socket = io.connect(server),
            connected = false,
            storage = new Storage(),
            self = this,
            commandqueue = new CommandQueue(self,storage),
            clipboard = {},
            updateStorage,
            updateUsers,
            users ={},
            shootEvent,
            handleMessage;

        /*event functions to relay information between users*/
        $.extend(this, new EventDispatcher());

        this.events = {
            "SELECTEDOBJECT_CHANGED" : "SELECTEDOBJECT_CHANGED"
        };

        /*socket functions*/
        socket.on('connect',function(msg){
            connected = true;
        });
        socket.on('reconnecting',function(msg){
            connected = false;
        });
        socket.on('serverMessage',function(msg){
            socket.emit('serverMessageAck');
            handleMessage(msg);
        });
        socket.on('clientMessageAck',function(msg){

        });
        socket.on('clientMessageNack',function(msg){

        });

        /*MGA like functions*/
        this.setAttributes = function(id,name,value){
            var data,
                attributes,
                command;

            data = storage.get(id);
            if(data){
                attributes = commonUtil.copy(data.attributes);
                attributes[name] = value;
                commandqueue.push({type:"modify",cid:"ezminek",id:id,attributes:attributes});
            }
        };
        this.setRegistry = function(id,name,value){
            var data,
                registry,
                command;

            data = storage.get(id);
            if(data){
                registry = commonUtil.copy(data.registry);
                registry[name] = value;
                commandqueue.push({type:"modify",cid:"ezminek",id:id,registry:registry});
            }
        };
        this.copyNodes = function(ids){
            clipboard = ids;
            commandqueue.push({type:"copy",ids:clipboard,cid:"tenyleg kell??"});
        };
        this.pasteNodes = function(id){
            commandqueue.push({type:"paste",id:id,cid:"commandid"});
        };
        this.deleteNode = function(id){
            commandqueue.push({type:"delete",id:id,cid:"tuti nem kell"});
        };
        this.delMoreNodes = function(ids){
            var i;
            for(i=0;i<ids.length;i++){
                self.deleteNode(ids[i]);
            }
        };
        this.createChild = function(parent,base){
            commandqueue.push({type:"createChild",baseId:base,parentId:parent,cid:"mondom nem kell"});
        };
        this.createSubType = function(parent,base){
            commandqueue.push({type:"createSubType",baseId:base,parentId:parent,cid:"mondom nem kell"});
        };
        this.makePointer = function(id,name,to){
            commandqueue.push({type:"point",id:id,to:to,name:name});
        };
        this.delPointer = function(id,name){
            commandqueue.push({type:"point",id:id,to:null,name:name});
        };
        this.makeConnection = function(parent,base,source,target){
        };

        /*UserInterface handling*/
        this.addUI = function(ui){
            var guid;
            guid = commonUtil.guid();
            users[guid] = new User(self,ui,storage);
            return guid;
        };
        this.removeUI = function(guid){
            delete users[guid];
        };
        this.updateTerritory = function(guid,patterns){
            if(users[guid]){
                users[guid].updatePatterns(patterns);
                commandqueue.push({type:"territory",cid:"nemkollll",id:guid,patterns:users[guid].getPatterns()});
            }
        };

        /*getting a node*/
        this.getNode = function(id){
            if(storage.get(id)){
                return new ClientNode(self,id,storage);
            }
            else{
                return storage.get(id);
            }
        };

        /*socket like functions*/
        this.sendMessage = function(msg){
            socket.emit('clientMessage',msg);
        };
        /*private functions*/
        shootEvent = function(type,id){
            var i,
                data;
            data = storage.get(id);
            for(i in users){
                users[i].shootEvent(id,type);
            }

            if(data && type === "modify"){
                if(data.relations.inheritorIds){
                    for(i=0;i<data.relations.inheritorIds.length;i++){
                        shootEvent(type,data.relations.inheritorIds[i]);
                    }
                }
            }
        };
        handleMessage = function(msg){
            var i;

            /*main*/
            /*if the transaction failed, there is nothing to do*/
            for(i=0;i<msg.length;i++){
                if(msg[i].type === "command"){
                    commandqueue.commandResult(msg[i].cid,msg[i].success);
                    if(msg[i].success === "false"){
                        return;
                    }
                }
            }

            /*first we shoot the unload events*/
            for(i=0;i<msg.length;i++){
                if(msg[i].type === "unload"){
                    shootEvent("unload",msg[i].id);
                }
            }
            /*then we update the storage*/
            for(i=0;i<msg.length;i++){
                if(msg[i].type !== "command"){
                    storage.set(msg[i].id,msg[i].object);
                }
            }
            /*then we update the users*/
            for(i in users){
                users[i].updateTerritory();
            }
            /*then we shoot all other events*/
            for(i=0;i<msg.length;i++){
                if(msg[i].type === "load" || msg[i].type === "update" || msg[i].type === "create" || msg[i].type === "delete"){
                    shootEvent(msg[i].type,msg[i].id);
                }
            }
        };
    };
    User = function(client,ui,storage){
        var patterns = {},
            ids=[];

        /*public functions*/
        this.getPatterns = function(){
            return patterns;
        };
        this.updatePatterns = function(newpatterns){
            patterns = newpatterns;
        };
        this.shootEvent = function(id,type){
            if(ids.indexOf(id)!== -1){
                ui.onEvent(type,id);
            }
        };
        this.updateTerritory = function(){
            var i,
                updatePattern,
                updateRule;

            updateRule = function(id,rulename,rulevalue,itemssofar){
                var i,
                    data = storage.get(id);
                
                if(data === null || data === undefined){
                    return;
                }
                
                if(commonUtil.insertIntoArray(itemssofar,id)){
                    if(rulename === "pointer"){
                        if(rulevalue.value === 0){
                            return;
                        }
                        if(data.pointers[rulevalue.name]){
                            if(data.pointers[rulevalue.name].to){
                                updateRule(data.pointers[rulevalue.name].to,rulename,{name:rulevalue.name,value:rulevalue.value-1},itemssofar);
                            }
                        }
                        return;
                    }
                    else{
                        if(rulevalue === 0){
                            return;
                        }
                        switch(rulename){
                            case "parent":
                                if(data.relations.parentId){
                                    updateRule(data.relations.parentId,rulename,rulevalue-1,itemssofar);
                                }
                                break;
                            case "children":
                                if(data.relations.childrenIds){
                                    for(i=0;i<data.relations.childrenIds.length;i++){
                                        updateRule(data.relations.childrenIds[i],rulename,rulevalue-1,itemssofar);
                                    }
                                }
                                break;
                            case "inheritor":
                                if(data.relations.inheritorIds){
                                    for(i=0;i<data.relations.inheritorIds.length;i++){
                                        updateRule(data.relations.inheritorIds[i],rulename,rulevalue-1,itemssofar);
                                    }
                                }
                                break;
                        }
                    }
                }
                else{
                    return; /*we found a loop*/
                }
            };
            updatePattern = function(id,pattern){
                var i,
                    rulechain;
                for(i in pattern){
                    rulechain = [];
                    updateRule(id,i,commonUtil.copy(pattern[i]),rulechain);
                    ids = commonUtil.mergeArrays(ids,rulechain);
                }
            };
            /*main*/
            ids = [];
            for(i in patterns){
                updatePattern(i,patterns[i]);
            }
        };
    };
    CommandQueue = function(client,storage){
        var queue = {},
            sent = {},
            timer = 10000;
            cansend = true;

        /*public functions*/
        this.push = function(command){
            if(command.type === "territory"){
                /*these can go paralelly without cid*/
                client.sendMessage({commands:[command]});
                return;
            }
            queue[command.cid] = command;
            setTimeout(function(){
                commandTimeout(command.cid);
            },timer);
            sendNextClientMessage();
        };
        this.commandResult = function(cid,success){
            /*TODO success*/
            delete sent[cid];

            if(isSentEmpty()){
                cansend = true;
                sendNextClientMessage();
            }
        };
        var isSentEmpty = function(){
            var counter = 0;
            for(var i in sent){
                counter++;
            }
            if(counter === 0){
                return true;
            }
            return false;
        };
        var sendNextClientMessage = function(){
            logger.debug("trying to send next command message to server (cansend="+cansend+",sentisempty="+isSentEmpty());
            if(cansend ===true || isSentEmpty()){
                cansend = true;
                var msg = {commands:[]};
                for(var i in queue){
                    msg.commands.push(queue[i]);
                }
                logger.debug("next command message to server "+JSON.stringify(msg));
                if(msg.commands.length>0){
                    client.sendMessage(msg);
                    cansend = false;
                    sent = queue;
                    queue = {};
                }
            }
        };
        var commandTimeout = function(cid){
            if(queue[cid] || sent[cid]){
                console.log("command timeout "+cid);
            }
            delete queue[cid];
            delete sent[cid];

            if(isSentEmpty()){
                cansend = true;
                sendNextClientMessage();
            }
        };
    };
    Storage = function(client){
        var objects = {};

        /*public functions*/
        this.get = function(id){
            logger.debug("Storage.get "+id);
            return objects[id];
        };
        this.set = function(id,object){
            logger.debug("Storage.set "+id+","+JSON.stringify(object));
            objects[id] = object;
        };
    };
    ClientNode = function(client,id,storage){
        var selfdata = storage.get(id),
            rGetAttribute,
            rGetRegistry;
        /*public funcitons*/
        this.isDeleted = function(){
            return selfdata === null;
        };
        this.getParentId = function(){
            if(selfdata){
                return selfdata.relations.parentId;
            }
            else{
                return selfdata;
            }
        };
        this.getChildrenIds = function(){
            if(selfdata){
                return selfdata.relations.childrenIds;
            }
            else{
                return selfdata;
            }
        };
        this.getBaseId = function(){
            if(selfdata){
                return selfdata.relations.baseId;
            }
            else{
                return selfdata;
            }
        };
        this.getInheritorIds = function(){
            if(selfdata){
                return selfdata.relations.inheritorIds;
            }
            else{
                return selfdata
            }
        };
        this.getAttribute = function(name){
            if(selfdata){
                return rGetAttribute(id,name);
            }
            else{
                return selfdata;
            }
        };
        this.getRegistry = function(name){
            if(selfdata){
                return rGetRegistry(id,name);
            }
            else{
                return selfdata;
            }
        };

        /*private functions*/
        rGetAttribute = function(id,name){
            var data;
            data = storage.get(id);
            if(data){
                if(data.attributes[name]){
                    return data.attributes[name];
                }
                else{
                    if(data.relations.baseId){
                        return rGetAttribute(data.relations.baseId,name);
                    }
                    else{
                        return null;
                    }
                }
            }
            else{
                return data;
            }
        };
        rGetRegistry = function(id,name){
            var data;
            data = storage.get(id);
            if(data){
                if(data.registry[name]){
                    return data.registry[name];
                }
                else{
                    if(data.relations.baseId){
                        return rGetRegistry(data.relations.baseId,name);
                    }
                    else{
                        return null;
                    }
                }
            }
            else{
                return data;
            }

        };
    };
    return Client;
});