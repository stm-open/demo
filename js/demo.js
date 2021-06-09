var stmSimple = require('./stmSimple').stmSimple;
console.log('This is a stream simple test');

var account = '需要查询历史的地址';
var account = 'vfq4sckDNcNcyfrDQed6FBqqDfEgTgsjtJ';

//查询特定钱包地址的发送，接收记录
//
//返回结果
//  若返回结果为false,则表明查询的钱包地址尚未激活或不存在
//  res = { account: '查询的钱包地址',
//          ledger_index_max: 当前最新账本号,
//          transactions:
//           [ { hash: '交易的hash',
//               date: 交易时间,
//               timestamp: 交易时间,
//               type: '交易类型（发送，接收）',
//               account: '钱包地址',
//               counterparty: '交易相关对方钱包地址',
//               amount: 交易的金额,
//               currency: 交易的资产 }
//            ]
//       };
stmSimple.getHistory(account,function(e,res){
  console.log(res);

});

var account = '需要查询历史的地址';
var account = 'vfq4sckDNcNcyfrDQed6FBqqDfEgTgsjtJ';

//查询特定钱包地址的stm余额
//
//返回结果
//  若返回结果为false,则表明查询的钱包地址尚未激活或不存在
//  res = { account: '查询的钱包地址',
//          balance: stm余额,
//       };

stmSimple.getBalance(account,function(e,res){
  console.log(res);

});


//查询特定钱包地址在特定账本号之后的发送，接收记录
//
//  返回结果
//  若返回结果为false,则表明查询的钱包地址尚未激活或不存在
//  res = { account: '查询的钱包地址',
//          ledger_index_max: 当前最新账本号,
//          transactions:
//           [ { hash: '交易的hash',
//               date: 交易时间,
//               timestamp: 交易时间,
//               type: '交易类型（发送，接收）',
//               account: '钱包地址',
//               counterparty: '交易相关对方钱包地址',
//               amount: 交易的金额,
//              currency: 交易的资产 }
//            ]
//        };
var ledger_min = 200000;
stmSimple.getHistoryFromLedger(account,ledger_min,function(e,res){
  console.log(res);
});


//查询特定钱包地址的信任端口，只有信任端口后，端口才能向该地址发送对应资产
//
//  返回结果
//  若返回结果为false,则表明查询的钱包地址尚未激活或不存在
//  res = {
//    account: '查询的钱包地址',
//    信任的端口情况
//    trustLines:
//     [ { issuer: '信任的端口钱包地址',
//         balance: '在该端口资产的余额',
//         currency: '在该端口资产的类别',
//         limit: '在该端口信任的额度' }
//         ]
//       };
stmSimple.getTrustLines(account,function(e,res){
  console.log(res);

});



//转账
//返回结果
//{ tx:
//   { from: '转账钱包地址',
//     to: '接收钱包地址',
//     amount:
//      { value: '转账金额',
//        currency: '转账资产类别',
//        issuer: '资产的端口地址' } },
//  msg: '本次转账的结果信息',
//  engine_result: '本次转账的结果代码' }

var srcAccount ='vp9Ykz8Af9bYV6zpjxRiza2oeim8xmiu7i';
var srcSecret='sh5nwoKsXPRkwYWa3Wxb4ieYr6UK5';
var destAccount = 'v4aMXjSDu4WS6BsvUy4SfvFizMFh5HPJ65';
var src = {account:srcAccount,secret:srcSecret};
var dest = {account:destAccount,
            amount:{value:'0.715',currency:'BTC',issuer:'vp9Ykz8Af9bYV6zpjxRiza2oeim8xmiu7i'},
            memo:'test'};

var srcAccount ='发送账户的钱包地址';
var srcSecret='发送账户的钱包密钥';
var destAccount = '接收账户的钱包地址';

var src = {account:srcAccount,secret:srcSecret};
var dest = {account:destAccount,
            amount:{value:'发送的资产金额',currency:'发送资产的种类',issuer:'资产的端口地址'},
            memo:'该次发送的附言'};


stmSimple.send(src,dest,function(e,res){
  console.log(res);
});
