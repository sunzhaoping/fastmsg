class Socket{
    private conn:SockJS;
    private callbacks:Object;
    private channel:String;
    
    constructor(public url: string) {
        this.conn = new SockJS(url);
        this.callbacks = {};
        var self = this;
        this.conn.onopen = function(ev: SJSOpenEvent){self.onConnect(ev)};
        this.conn.onmessage = function(ev: SJSMessageEvent){self.onMessage(ev)};
        this.conn.onclose = function(ev: SJSCloseEvent){self.onClose(ev)};;
    }
    
    public emit(event: string , data:any = "") : void{
        var msg = ["emit", event , data];
        var packed = JSON.stringify(msg);
        this.conn.send(packed);
    }
    
    public broadcast(event: string ,data:any = "") : void{
        var msg = ["broadcast", event , data];
        var packed = JSON.stringify(msg);
        this.conn.send(packed);
    }
    
    public on(event: string , callback):void{
        this.callbacks[event] = callback;
    }

    private onConnect(ev: SJSOpenEvent){
        this.callback_emit("connect", null);
    }
    
    private callback_emit(event:string,data?:any):void {
        var callback = this.callbacks[event];
        if(callback){
            callback(data);
        }
    }
    
    private onMessage(ev: SJSMessageEvent){
        var msg = JSON.parse(ev.data );
        this.channel = msg[0];
        var event:string = msg[1];
        var data = msg[2];
        this.callback_emit(event, data);
    }
    
    private onClose(ev: SJSCloseEvent){
        this.callback_emit("close", null);
    }
    
    public close():void {
        this.conn.close();
    }
}