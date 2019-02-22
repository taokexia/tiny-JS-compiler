var compile = require('./src/compiler')
// 测试
var str = `
    let a = 1
    let b = 2
`

var newStr = compile.compiler(str)
console.log(newStr)