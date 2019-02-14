var PENDING = "pending";
var RESOLVED = "fulfilled";
var REJECTED = "rejected";
function Promise(excutor){
    var that = this;
    that.status = PENDING;    // 初始状态为pending
    that.value = undefined;
    that.reason = undefined;
    that.onFullfilledList = [];  // 存放onFullfilled函数的列表，多次调用then，会有多个onFullfilled函数
    that.onRejectedList = [];   // 作用同上
    function resolve(value){
        if(that.status === PENDING) {
            that.status = RESOLVED;
            that.value = value;
            that.onFullfilledList.forEach(function(fullfilled){
                fullfilled(value);
            })
        }
    }
    function reject(reason){
        if (that.status === PENDING) {
            that.status = REJECTED;
            that.reason = reason;
            that.onRejectedList.forEach(function(rejected){
                rejected(reason);
            })
        }
    }
    try{
        excutor(resolve, reject)
    }catch(err){
        reject(err)
    }
}
Promise.prototype.then = function(onFullfilled, onRejected) {
    var that = this;
    var promise = new Promise(function(resolve, reject){
        onFullfilled = typeof onFullfilled === 'function' ? onFullfilled : function(value){resolve(value)}
        onRejected = typeof onRejected === 'function' ? onRejected : function(reason){reject(reason)}
        try{
            if(that.status === RESOLVED){
                setTimeout(function() {
                    try{
                        var x = onFullfilled(that.value);  // fulfilled状态则立即执行onFullfilled函数
                        // TODO 解析函数
                        analysisPromise(promise, x, resolve, reject) //这里直接传入promise会抛异常，因为promise并没有定义
                    }catch(e){
                        reject(e);
                    }
                }, 0)
            }
            if(that.status === REJECTED){
                setTimeout(function() {
                    try{
                        var x = onRejected(that.reason); 
                        // TODO 解析函数
                        analysisPromise(promise, x, resolve, reject)
                    }catch(e){
                        reject(e);
                    }
                }, 0)
            }
            if(that.status === PENDING){
                that.onFullfilledList.push(function(){// 这里需要在onFullfilled函数之外包一层
                    setTimeout(function() {
                        try{
                            var x = onFullfilled(that.value);
                            // TODO 解析函数
                            analysisPromise(promise, x, resolve, reject)
                        }catch(e){
                            reject(e);
                        }
                    }, 0)
                });
                that.onRejectedList.push(function(){
                    setTimeout(function() {
                        try{
                            var x = onRejected(that.reason);  
                            // TODO 解析函数
                            analysisPromise(promise, x, resolve, reject)
                        }catch(e){
                            reject(e);
                        }
                    }, 0)
                });
            }
        }catch(err){
            reject(err)
        }
    })
    return promise
}
function analysisPromise(promise, x, resolve, reject){
    if(promise === x) {
        return reject(new TypeError("循环引用"));
    }
    if(x === null){
        return resolve(x)
    }
    if(typeof x !== "object" && typeof x !== 'function'){
        return resolve(x);
    }
    var called;
    try{
        var then = x.then
        if (typeof then !== "function") {
            return resolve(x);
        }
        then.call(x, function(y){
            if(called)return;
            called = true;   
            analysisPromise(promise, y, resolve, reject);
        }, function(r){
            if(called)return;
            called = true;
            reject(r)
        })
    }catch(e){
        if(called)return;
        called = true;
        reject(e);
    }
}