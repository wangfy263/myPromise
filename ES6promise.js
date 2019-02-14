class Promise {
  constructor(executor) {
    this.status = 'pending'; // 初始状态为pending
    this.value = undefined;
    this.reason = undefined;
    this.onFullfilledList = []; // 存放onFullfilled函数的列表，多次调用then，会有多个onFullfilled函数
    this.onRejectedList = []; // 作用同上
    const resolve = value => {
      if (this.status === 'pending') {
        this.status = 'fulfilled';
        this.value = value;
        for (let fullfilled of this.onFullfilledList){
          fullfilled();
        }
      }
    }
    const reject = reason => {
      if (this.status === 'pending') {
        this.status = 'rejected';
        this.reason = reason;
        for (let rejected of this.onRejectedList){
          rejected();
        }
      }
    }
    try {
      executor(resolve, reject)
    } catch (err) {
      reject(err) 
    }
  }
  then(onFullfilled, onRejected) {
    const promise = new Promise((resolve, reject) => {
      onFullfilled = typeof onFullfilled === 'function' ? onFullfilled : value => resolve(value);
      onRejected = typeof onRejected === 'function' ? onRejected : reason => reject(reason);
      try {
        if (this.status === 'fulfilled') {
          setTimeout(() => {
            try {
              let x = onFullfilled(this.value); // fulfilled状态则立即执行onFullfilled函数
              // TODO 解析函数
              analysisPromise(promise, x, resolve, reject) //这里直接传入promise会抛异常，因为promise并没有定义
            } catch (e) {
              reject(e);
            }
          }, 0);
        }
        if (this.status === 'rejected') {
          setTimeout(() => {
            try {
              let x = onRejected(this.reason);
              // TODO 解析函数
              analysisPromise(promise, x, resolve, reject)
            } catch (e) {
              reject(e);
            }
          }, 0)
        }
        if (this.status === 'pending') {
          this.onFullfilledList.push(() => { // 这里需要在onFullfilled函数之外包一层
            setTimeout(() => {
              try {
                let x = onFullfilled(this.value);
                // TODO 解析函数
                analysisPromise(promise, x, resolve, reject)
              } catch (e) {
                reject(e);
              }
            }, 0)
          });
          this.onRejectedList.push(() => {
            setTimeout(() => {
              try {
                let x = onRejected(this.reason);
                // TODO 解析函数
                analysisPromise(promise, x, resolve, reject)
              } catch (e) {
                reject(e);
              }
            }, 0)
          });
        }
      } catch (err) {
        reject(err)
      }
    })
    return promise
  }
}
function analysisPromise(promise, x, resolve, reject) {
  if (promise === x) {
    return reject(new TypeError("循环引用"));
  }
  if (x === null) {
    return resolve(x)
  }
  if (typeof x !== "object" && typeof x !== 'function') {
    return resolve(x);
  }
  let called;
  try {
    let then = x.then
    if (typeof then !== "function") {
      return resolve(x);
    }
    then.call(x, y => {
      if (called) return;
      called = true;
      analysisPromise(promise, y, resolve, reject);
    }, r => {
      if (called) return;
      called = true;
      reject(r)
    })
  } catch (e) {
    if (called) return;
    called = true;
    reject(e);
  }
}

Promise.defer = Promise.deferred = function () {
    let dfd = {}
    dfd.promise = new Promise((resolve, reject) => {
        dfd.resolve = resolve;
        dfd.reject = reject;
    });
    return dfd;
}
module.exports = Promise;