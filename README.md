Babel 是目前最常用的 JavaScript 编译器。能够编译 JS 代码，使得代码能够正常的在旧版本的浏览器上面运行；还能够转化 JSX 语法，使得 react 写的代码能够正常运行。

下面，按照编译原理来实现一个简单的 JS 代码编译器，实现把 ES6 代码转化成 ES5,以充分了解 Babel 运行原理。

```js
let a = 1
```
转化后
```js
var a = 1
```

# 编译原理
编译器的编译原理大多分为三个阶段: 解析、转换以及代码生成

- **解析(Parsing)**: 将原始代码转化成 **AST 抽象树**
- **转换(Transformation)**: 对 AST 抽象树进行处理，变化结构
- **代码生成(Code Generation)**: 把处理后的 AST 抽象树转化成代码

# 解析
编译前，首先要对代码进行解析，解析分为两个阶段 **词义分析(Lexical Analysis)** 和 **语法分析(Syntactic Analysis)**

## 词义分析
**词义分析**是接收原始代码进行分词，最后生成 token。

例如: <br>
`let a = 1`

词义分析后结果为:

```json
[ { "type": "Keyword",    "value": "let" },
    { "type": "Identifier", "value": "a"   },
    { "type": "Punctuator", "value": "="   },
    { "type": "Numeric",    "value": "1"   } ]
```
词法分析器函数为:
```js
// 解析代码，最后返回 tokens
function tokenizer(input) {
  // 记录当前解析到词的位置
  var current = 0
  // tokens 用来保存我们解析的 token
  var tokens = []

  // 利用循环进行解析
  while (current < input.length) {
    // 提取出当前要解析的字符
    var char = input[current]

    // 处理符号: 检查是否是符号
    var PUNCTUATOR = /[`~!@#$%^&*()_\-+=<>?:"{}|,.\/;'\\[\]·~！@#￥%……&*（）——\-+={}|《》？：“”【】、；‘’，。、]/im
    if (PUNCTUATOR.test(char)) {
      // 创建变量用于保存匹配的符号
      var punctuators = char
      // 判断是否是箭头函数的符号
      if(char === '=' && input[current+1] === '>') {
        punctuators += input[++current]
      }
      current++;
      // 最后把数据更新到 tokens 中
      tokens.push({
        type: 'Punctuator',
        value: punctuators
      })
      // 进入下一次循环
      continue
    }

    // 处理空格: 如果是空格，则直接进入下一个循环
    var WHITESPACE = /\s/
    if (WHITESPACE.test(char)) {
      current++
      continue
    }

    // 处理数字: 检查是否是数字
    var NUMBERS = /[0-9]/
    if (NUMBERS.test(char)) {
      // 创建变量用于保存匹配的数字
      var number = ''
      // // 循环遍历接下来的字符，直到下一个字符不是数字为止
      while (NUMBERS.test(char)) {
        number += char
        char = input[++current]
      }
      // 最后把数据更新到 tokens 中
      tokens.push({
        type: 'Numeric',
        value: number
      })
      // 进入下一次循环
      continue
    }

    // 处理字符: 检查是否是字符
    var LETTERS = /[a-z]/i
    if (LETTERS.test(char)) {
      var value = ''

      // 用一个循环遍历所有的字母，把它们存入 value 中。
      while (LETTERS.test(char)) {
        value += char
        char = input[++current]
      }
      // 判断当前字符串是否是关键字
      KEYWORD = /function|var|return|let|const|if|for/
      if(KEYWORD.test(value)) {
        // 标记关键字
        tokens.push({
          type: 'Keyword',
          value: value
        })
      } else {
        // 标记变量
        tokens.push({
          type: 'Identifier',
          value: value
        })
      }
      // 进入下一次循环
      continue
    }
    // 最后如果我们没有匹配上任何类型的 token，那么我们抛出一个错误。
    throw new TypeError('I dont know what this character is: ' + char)
  }
  // 词法分析器的最后我们返回 tokens 数组。
  return tokens
}
```

## 语法分析
词义分析后，接下来是语法分析, 接收词义分析的 `tokens`, 然后分析之间内部关系，最终生成**抽象语法树（Abstract Syntax Tree， 缩写为AST）**。 

例如:<br>
```json
[ { "type": "Keyword",    "value": "let" },
    { "type": "Identifier", "value": "a"   },
    { "type": "Punctuator", "value": "="   },
    { "type": "Numeric",    "value": "1"   } ]
```
语法分析后结果为:
```json
{
    "type": "Program",
    "body": [
        {
            "type": "VariableDeclaration",
            "declarations": [
                {
                    "type": "VariableDeclarator",
                    "id": {
                        "type": "Identifier",
                        "name": "a"
                    },
                    "init": {
                        "type": "Literal",
                        "value": 1,
                        "raw": "1"
                    }
                }
            ],
            "kind": "let"
        }
    ],
    "sourceType": "script"
}
```
解析函数为
```js
// 语法解析函数，接收 tokens 作为参数
function parser(tokens) {
  // 记录当前解析到词的位置
  var current = 0

  // 通过遍历来解析 token节点，定义 walk 函数
  function walk() {
    // 从当前 token 开始解析
    var token = tokens[current]
    // 获取下一个节点的 token
    var nextToken = tokens[current + 1]

    // 对于不同类型的结点，对应的处理方法也不同
    // 检查是不是数字类型
    if (token.type === 'Numeric') {
      // 如果是，current 自增。
      current++
      // 然后我们会返回一个新的 AST 结点
      return {
        type: 'Literal',
        value: Number(token.value),
        row: token.value
      }
    }

    // 检查是不是变量类型
    if (token.type === 'Identifier') {
      // 如果是，current 自增。
      current++;
      // 然后我们会返回一个新的 AST 结点
      return {
        type: 'Identifier',
        name: token.value,
      };
    }

    // 检查是不是运算符类型
    if (token.type === 'Punctuator') {
      // 如果是，current 自增。
      current++;
      // 判断运算符类型，根据类型返回新的 AST 节点
      if(/[\+\-\*/]/im.test(token.value))
        return {
          type: 'BinaryExpression',
          operator: token.value,
        }
      if(/\=/.test(token.value))
        return {
          type: 'AssignmentExpression',
          operator: token.value
        }
    }

    // 检查是不是关键字
    if ( token.type === 'Keyword') {
      var value = token.value
      // 检查是不是定义语句
      if( value === 'var' || value === 'let' || value === 'const' ) {
        current++;
        // 获取定义的变量
        var variable = walk()
        // 判断是否是赋值符号
        var equal = walk()
        var rightVar
        if(equal.operator === '=') {
          // 获取所赋予的值
          rightVar = walk()
        } else {
          // 不是赋值符号，说明只是定义变量
          rightVar = null
          current--
        }
        // 定义声明
        var declaration = {
          type: 'VariableDeclarator',
          id: variable, // 定义的变量
          init: rightVar // 赋予的值
        }
        // 定义要返回的节点
        return {
          type: 'VariableDeclaration',
          declarations: [declaration],
          kind: value,
        };
      }
    }

    // 遇到了一个类型未知的结点，就抛出一个错误。
    throw new TypeError(token.type);
  }
  // 现在，我们创建 AST，根结点是一个类型为 `Program` 的结点。
  var ast = {
    type: 'Program',
    body: [],
    sourceType: "script"
  };

  // 开始 walk 函数，把结点放入 ast.body 中。
  while (current < tokens.length) {
    ast.body.push(walk());
  }

  // 最后我们的语法分析器返回 AST 
  return ast;
}
```

# 转换
编译器的下一步就是转换。对 AST 抽象树进行处理,可以在同语言间进行转换，也可以转换成一种全新的语言(参考 JSX 转换)

转换 AST 的时候，我们可以添加、移动、替代、删除 AST抽象树里的节点。

转化前:
```js
{
    "type": "Program",
    "body": [
        {
            "type": "VariableDeclaration",
            "declarations": [
                {
                    "type": "VariableDeclarator",
                    "id": {
                        "type": "Identifier",
                        "name": "a"
                    },
                    "init": {
                        "type": "Literal",
                        "value": 1,
                        "raw": "1"
                    }
                }
            ],
            "kind": "let"
        }
    ],
    "sourceType": "script"
}
```
转化后
```js
{
    "type": "Program",
    "body": [
        {
            "type": "VariableDeclaration",
            "declarations": [
                {
                    "type": "VariableDeclarator",
                    "id": {
                        "type": "Identifier",
                        "name": "a"
                    },
                    "init": {
                        "type": "Literal",
                        "value": 1,
                        "raw": "1"
                    }
                }
            ],
            "kind": "var"
        }
    ],
    "sourceType": "script"
}
```

## 遍历器
为了修改 AST 抽象树，首先要对节点进行遍历，采用深度遍历的方法。遍历函数:
```js
// 所以我们定义一个遍历器，它有两个参数，AST 和 vistor
// visitor 定义转化函数
function traverser(ast, visitor) {

  // 遍历树中每个节点，调用 traverseNode
  function traverseArray(array, parent) {
    if(typeof array.forEach === 'function')
      array.forEach(function(child) {
        traverseNode(child, parent);
      });
  }

  // 处理 ast 节点的函数, 使用 visitor 定义的转换函数进行转换
  function traverseNode(node, parent) {
    // 首先看看 visitor 中有没有对应 type 的处理函数。
    var method = visitor[node.type]
    // 如果有，参入参数
    if (method) {
      method(node, parent)
    }

    // 下面对每一个不同类型的结点分开处理。
    switch (node.type) {

      // 从顶层的 Program 开始
      case 'Program':
        traverseArray(node.body, node)
        break
      // 如果不需要转换，则直接退出
      case 'VariableDeclaration':
      case 'VariableDeclarator':
      case 'AssignmentExpression':
      case 'Identifier':
      case 'Literal':
        break

      // 同样，如果不能识别当前的结点，那么就抛出一个错误。
      default:
        throw new TypeError(node.type)
    }
  }
  // 最后我们对 AST 调用 traverseNode，开始遍历。注意 AST 并没有父结点。
  traverseNode(ast, null)
}
```
## 转换器
转换器接用于遍历过程中转换数据，他收之前构建好的 AST树，然后把它和 visitor 传递进入我们的遍历器中 ，最后得到一个新的 AST 抽象树。

```js
// 定义我们的转换器函数，接收 AST 作为参数
function transformer(ast) {
  // 创建新的 ast 抽象树
  var newAst = {
    type: 'Program',
    body: [],
    sourceType: "script"
  }

  // 下面是个代码技巧，在父结点上定义一个属性 context（上下文），之后，就可以把结点放入他们父结点的 context 中。
  ast._context = newAst.body

  // 我们把 AST 和 visitor 函数传入遍历器
  traverser(ast, {
    // VariableDeclaration 的 kind 属性
    VariableDeclaration: function(node, parent) {
      var variableDeclaration = {
        type: 'VariableDeclaration',
        declarations: node.declarations
        kind: "let"
      };
      // 把新的 VariableDeclaration 放入到 context 中。
      parent._context.push(variableDeclaration)
    }
  })

  // 最后返回创建好的新 AST。
  return newAst
}
```
# 代码生成
最后一步就是代码生成了,这个阶段做的事情有时候会和转换（transformation）重叠，但是代码生成最主要的部分还是根据 AST 来输出代码。

代码生成器会递归地调用它自己，把 AST 中的每个结点打印到一个很大的字符串中。

```js
function codeGenerator(node) {
  // 对于不同类型的结点分开处理
  switch (node.type) {
    // 如果是 Program 结点，那么我们会遍历它的 body 属性中的每一个结点。
    case 'Program':
      return node.body.map(codeGenerator)
        .join('\n')

    // VariableDeclaration 结点
    case 'VariableDeclaration':
      return (
        node.kind + ' ' + codeGenerator(node.declarations)
      )

    // VariableDeclarator 节点
    case 'VariableDeclarator':
      return (
        codeGenerator(node.id) + ' = ' + 
        codeGenerator(node.init)
      );

    // 处理变量
    case 'Identifier':
      return node.name;

    // 处理数值
    case 'Literal':
      return node.value;

    // 如果我们不能识别这个结点，那么抛出一个错误。
    default:
      throw new TypeError(node.type);
  }
}
```

转化前:
```js
{
    "type": "Program",
    "body": [
        {
            "type": "VariableDeclaration",
            "declarations": [
                {
                    "type": "VariableDeclarator",
                    "id": {
                        "type": "Identifier",
                        "name": "a"
                    },
                    "init": {
                        "type": "Literal",
                        "value": 1,
                        "raw": "1"
                    }
                }
            ],
            "kind": "var"
        }
    ],
    "sourceType": "script"
}
```
转化后
```
var a = 1
```

经过实践，我们按照 Babel 原理实现了一个简单的 JavaScript 编译器。 现在可以接着扩展这些代码，实现自己的编译器了！！！

## 参考资料:
- [the super tiny compiler](https://github.com/jamiebuilds/the-super-tiny-compiler)
- [esprima](http://esprima.org/demo/parse.html#)
